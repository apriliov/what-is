import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiArrowLeft, FiCheck, FiClock, FiCopy, FiDatabase, FiEye, FiEyeOff, FiImage, FiLock, FiRefreshCw, FiSend, FiShield, FiWifiOff, FiX, FiZap,
} from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { Link, navigate, usePath } from '../router.jsx';
import LangSwitch from '../components/LangSwitch';
import { getSupabase } from '../chatClient.js';
import {
  b64ToBytes, bytesToB64, clearRoomSecret, cryptoSupported, decryptBytes, deriveRoomKey, encryptBytes,
  getRoomSecret, makeAad, setRoomSecret,
} from '../chatCrypto.js';

/* ------------------------------------------------------------------ *
 * Realtime chat, 2 people per room, on Supabase Realtime (Broadcast + Presence).
 *   /chat          -> lobby (enter a number)
 *   /chat/:idroom  -> the room
 * No tables and no SQL: messages are never stored, they only pass through Supabase
 * and live in this component's state. A room exists only while someone is connected.
 * Messages and photos are encrypted in the browser with the room password (chatCrypto.js).
 * ------------------------------------------------------------------ */

const MAX_LEN = 250; // characters per message
const MAX_BUBBLES = 50; // bubbles kept on screen
const ROOM_RE = /^\d{1,6}$/;

// Auto cleanup: an unused room disconnects by itself so no connection (or memory) is kept alive.
const IDLE_MS = 10 * 60 * 1000; // no activity at all
const HIDDEN_MS = 3 * 60 * 1000; // tab in the background
const FAIL_MS = 25 * 1000; // connection could not be (re)established

// Spam protection, sending side
const SEND_MIN_GAP = 500; // ms between two messages
const SEND_BURST = 5; // at most 5 messages per window
const SEND_WINDOW = 10 * 1000;
const DUP_WINDOW = 4 * 1000; // identical text within this time is blocked
// Spam protection, receiving side (a modified client cannot flood the partner)
const RECV_BURST = 8;
const RECV_STRIKES = 10; // dropped messages before the partner is muted
const MUTE_MS = 60 * 1000;

// Remove control and bidi-override characters, keep normal text and line breaks.
const clean = (v) =>
  String(v)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

// Photos: shrunk and re-encoded as JPEG in the sender's browser (this also drops GPS/EXIF data),
// then sent as base64 over Broadcast. Nothing is uploaded or stored anywhere.
const PHOTO_PREFIX = 'data:image/jpeg;base64,';
const MAX_IMG_B64 = 170000; // base64 characters per photo. Broadcast payload limit on the free plan is 256 KB
const IMG_MAX_SIDE = 1024; // px, longest side
const IMG_MAX_FILE = 25 * 1024 * 1024; // refuse to even decode files bigger than this
const MAX_IMAGES = 6; // photos kept in memory, older ones turn into a placeholder
const IMG_SEND_GAP = 10 * 1000; // one photo per 10 s
const IMG_RECV_GAP = 5 * 1000; // receiving side is a little more lenient (clock jitter)
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

// Encryption (see chatCrypto.js): size limits for what arrives, and the IV length in base64
const MAX_CT_TEXT = 2000; // base64 characters of one encrypted text message
const IV_B64_LEN = 16; // 12 random bytes
const textEnc = new TextEncoder();
const textDec = new TextDecoder();

// Only a plain JPEG of sane size is accepted from the other side. PNG, SVG, GIF and the rest are dropped.
const validPhoto = (b64) =>
  typeof b64 === 'string' &&
  b64.length > 100 &&
  b64.length <= MAX_IMG_B64 &&
  b64.startsWith('/9j/') && // JPEG signature (FF D8 FF)
  B64_RE.test(b64);

// Add a bubble, keep at most MAX_BUBBLES bubbles and MAX_IMAGES photos in memory.
const addMsg = (prev, msg) => {
  const next = [...prev.slice(-(MAX_BUBBLES - 1)), msg];
  let seen = 0;
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (next[i].src) {
      seen += 1;
      if (seen > MAX_IMAGES) next[i] = { ...next[i], src: null };
    }
  }
  return next;
};

// Decode, shrink and re-encode a photo. Returns the base64 part of a JPEG (no data: prefix).
async function preparePhoto(file) {
  let bitmap = null;
  if (typeof createImageBitmap === 'function') {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        bitmap = null;
      }
    }
  }
  let img = null;
  if (!bitmap) {
    const url = URL.createObjectURL(file);
    try {
      img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const source = bitmap || img;
  const w0 = bitmap ? bitmap.width : img.naturalWidth;
  const h0 = bitmap ? bitmap.height : img.naturalHeight;
  if (!w0 || !h0) throw new Error('bad_image');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let scale = Math.min(1, IMG_MAX_SIDE / Math.max(w0, h0));
  try {
    for (let round = 0; round < 6; round += 1) {
      canvas.width = Math.max(1, Math.round(w0 * scale));
      canvas.height = Math.max(1, Math.round(h0 * scale));
      ctx.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const q of [0.8, 0.65, 0.5, 0.4]) {
        const data = canvas.toDataURL('image/jpeg', q);
        if (data.startsWith(PHOTO_PREFIX) && data.length - PHOTO_PREFIX.length <= MAX_IMG_B64) {
          return data.slice(PHOTO_PREFIX.length);
        }
      }
      scale *= 0.75;
    }
  } finally {
    if (bitmap && bitmap.close) bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
  throw new Error('too_big');
}

const TEXT = {
  en: {
    home: {
      badge: 'Private chat',
      title: 'Chat in real time. Leave no trace.',
      subtitle:
        'Pick a number, share it with one person and start talking. Nothing is saved, not in a database and not on the server.',
      features: [
        {
          title: 'No login, no database',
          desc: 'Nobody signs up and nothing is stored. Messages and photos only pass through memory, and a refresh erases the whole conversation.',
        },
        {
          title: 'Fast',
          desc: 'Messages travel over a live WebSocket connection and arrive the moment they are sent.',
        },
        {
          title: 'Secure',
          desc: 'Only 2 people fit in a room and the connection is encrypted (WSS).',
        },
      ],
      formTitle: 'Start a chat',
      label: 'Room number (1 to 6 digits)',
      placeholder: '123456',
      hint: 'No room yet? Type any number and it is created for you. Share the same number with your friend.',
      button: 'Create or Join Room',
      errEmpty: 'Enter a number with 1 to 6 digits.',
      pwLabel: 'Room password (optional)',
      pwPlaceholder: 'Same password for both of you',
      pwHint: 'Messages and photos are encrypted on your device with this password. Share it separately, it is never put in the link.',
      pwShow: 'Show password',
      pwHide: 'Hide password',
      illustration: 'Two phones exchanging chat messages',
    },
    room: {
      leave: 'Leave room',
      roomLabel: 'Room',
      copyLink: 'Copy link',
      copied: 'Copied',
      connecting: 'Connecting...',
      waiting: 'Waiting for your partner',
      waitingHint: 'Share the room link to start chatting',
      waitingShort: 'Waiting for partner...',
      joined: 'Your partner joined!',
      left: 'Your partner disconnected',
      full: 'Room is full (Maximum 2 people)',
      fullHint: 'Two people are already chatting in room {room}. Try a different number.',
      lost: 'Connection lost',
      lostHint: 'Could not reach the chat service.',
      idle: 'Room closed due to inactivity',
      idleHint: 'To free up resources, rooms disconnect after a while with no activity. Nothing was saved.',
      notConfigured: 'Chat is not set up yet',
      notConfiguredHint: 'The site owner still needs to add the Supabase keys (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).',
      muted: 'Your partner was muted for 1 minute (too many messages).',
      attachPhoto: 'Send a photo',
      photoPreview: 'Send this photo?',
      photoStrip: 'Location data (EXIF) is removed. Nothing is saved.',
      photoSend: 'Send photo',
      photoCancel: 'Cancel',
      photoError: 'Could not read that photo. Try a JPG, PNG or WebP image.',
      photoBig: 'That photo is too large (max 25 MB).',
      photoRate: 'Wait a few seconds before sending another photo.',
      photoTap: 'Tap to view',
      photoGone: 'Photo removed to save memory',
      photoAlt: 'Photo',
      blockPhotos: 'Block incoming photos',
      unblockPhotos: 'Allow incoming photos',
      photosBlocked: 'Incoming photos blocked',
      photosAllowed: 'Incoming photos allowed',
      privacyLine: 'No login · Chats are never saved to a database',
      e2e: 'Encrypted',
      e2eTitle: 'End-to-end encrypted with your room password',
      noE2e: 'No password',
      noE2eTitle: 'No password: anyone who knows the room number could read this chat',
      askTitle: 'Room password',
      askHint: 'Enter the password you agreed on with your friend. Leave it empty if this room has no password.',
      askLabel: 'Password',
      askJoin: 'Join room',
      mismatch: 'Different password',
      mismatchHint: 'Your partner uses another password, so messages cannot be read. Change yours to match.',
      changePw: 'Change password',
      pillMismatch: 'Different password',
      noCrypto: 'Encryption is not available',
      noCryptoHint: 'Open this page over HTTPS in an up-to-date browser to use the chat.',
      reconnect: 'Reconnect',
      invalid: 'Invalid room number',
      invalidHint: 'A room number has 1 to 6 digits, for example 123456.',
      other: 'Choose another room',
      placeholder: 'Type a message...',
      send: 'Send',
      you: 'You',
      partner: 'Partner',
      emptyTitle: 'No messages yet',
      empty: 'Nothing is saved, so a refresh clears the chat. The room closes after 10 minutes of inactivity.',
      limitNote: 'You reached 50 messages. Older ones are removed from the screen automatically.',
      restart: 'Restart chat',
      rate: 'Slow down a little.',
      pillConnecting: 'Connecting',
      pillWaiting: 'Waiting',
      pillActive: 'Connected',
      pillOffline: 'Offline',
      chars: 'characters',
      messages: 'Messages',
    },
  },
  id: {
    home: {
      badge: 'Chat privat',
      title: 'Ngobrol real-time. Tanpa jejak.',
      subtitle:
        'Pilih satu angka, bagikan ke satu orang, lalu mulai ngobrol. Tidak ada yang disimpan, baik di database maupun di server.',
      features: [
        {
          title: 'Tanpa login, tanpa database',
          desc: 'Tidak perlu daftar dan tidak ada yang disimpan. Pesan dan foto hanya lewat di memori, refresh halaman menghapus seluruh obrolan.',
        },
        {
          title: 'Cepat',
          desc: 'Pesan dikirim lewat koneksi WebSocket langsung dan sampai begitu dikirim.',
        },
        {
          title: 'Aman',
          desc: 'Satu room hanya muat 2 orang dan koneksinya terenkripsi (WSS).',
        },
      ],
      formTitle: 'Mulai ngobrol',
      label: 'Nomor room (1 sampai 6 digit)',
      placeholder: '123456',
      hint: 'Belum punya room? Ketik angka apa saja, room dibuat otomatis. Bagikan angka yang sama ke temanmu.',
      button: 'Create or Join Room',
      errEmpty: 'Masukkan angka 1 sampai 6 digit.',
      pwLabel: 'Password room (opsional)',
      pwPlaceholder: 'Password yang sama untuk kalian berdua',
      pwHint: 'Pesan dan foto dienkripsi di perangkatmu memakai password ini. Bagikan terpisah, password tidak dimasukkan ke link.',
      pwShow: 'Tampilkan password',
      pwHide: 'Sembunyikan password',
      illustration: 'Dua ponsel saling berkirim pesan',
    },
    room: {
      leave: 'Keluar room',
      roomLabel: 'Room',
      copyLink: 'Salin link',
      copied: 'Tersalin',
      connecting: 'Menghubungkan...',
      waiting: 'Menunggu teman bergabung',
      waitingHint: 'Bagikan link room ke temanmu',
      waitingShort: 'Menunggu teman...',
      joined: 'Teman bergabung!',
      left: 'Teman terputus',
      full: 'Room penuh (Maksimal 2 orang)',
      fullHint: 'Sudah ada 2 orang yang mengobrol di room {room}. Coba angka lain.',
      lost: 'Koneksi terputus',
      lostHint: 'Tidak bisa terhubung ke layanan chat.',
      idle: 'Room ditutup karena tidak aktif',
      idleHint: 'Supaya hemat sumber daya, room otomatis terputus setelah lama tidak ada aktivitas. Tidak ada yang disimpan.',
      notConfigured: 'Chat belum disiapkan',
      notConfiguredHint: 'Pemilik situs perlu mengisi kunci Supabase (VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY).',
      muted: 'Teman dibisukan 1 menit (terlalu banyak pesan).',
      attachPhoto: 'Kirim foto',
      photoPreview: 'Kirim foto ini?',
      photoStrip: 'Data lokasi (EXIF) dihapus. Tidak ada yang disimpan.',
      photoSend: 'Kirim foto',
      photoCancel: 'Batal',
      photoError: 'Foto tidak bisa dibaca. Coba gambar JPG, PNG, atau WebP.',
      photoBig: 'Foto terlalu besar (maksimal 25 MB).',
      photoRate: 'Tunggu beberapa detik sebelum mengirim foto lagi.',
      photoTap: 'Ketuk untuk lihat',
      photoGone: 'Foto dihapus untuk menghemat memori',
      photoAlt: 'Foto',
      blockPhotos: 'Blokir foto masuk',
      unblockPhotos: 'Izinkan foto masuk',
      photosBlocked: 'Foto masuk diblokir',
      photosAllowed: 'Foto masuk diizinkan',
      privacyLine: 'Tanpa login · Chat tidak disimpan di database',
      e2e: 'Terenkripsi',
      e2eTitle: 'Terenkripsi ujung ke ujung dengan password room',
      noE2e: 'Tanpa password',
      noE2eTitle: 'Tanpa password: siapa pun yang tahu nomor room bisa membaca chat ini',
      askTitle: 'Password room',
      askHint: 'Masukkan password yang kalian sepakati. Kosongkan kalau room ini tidak memakai password.',
      askLabel: 'Password',
      askJoin: 'Masuk room',
      mismatch: 'Password berbeda',
      mismatchHint: 'Temanmu memakai password lain, jadi pesan tidak bisa terbaca. Samakan password kamu.',
      changePw: 'Ganti password',
      pillMismatch: 'Password berbeda',
      noCrypto: 'Enkripsi tidak tersedia',
      noCryptoHint: 'Buka halaman ini lewat HTTPS dengan browser yang terbaru untuk memakai chat.',
      reconnect: 'Hubungkan lagi',
      invalid: 'Nomor room tidak valid',
      invalidHint: 'Nomor room terdiri dari 1 sampai 6 digit angka, contoh 123456.',
      other: 'Pilih room lain',
      placeholder: 'Ketik pesan...',
      send: 'Kirim',
      you: 'Kamu',
      partner: 'Teman',
      emptyTitle: 'Belum ada pesan',
      empty: 'Tidak ada yang disimpan, jadi refresh menghapus obrolan. Room tutup otomatis setelah 10 menit tidak aktif.',
      limitNote: 'Kamu sudah mencapai 50 pesan. Pesan lama otomatis dihapus dari layar.',
      restart: 'Restart chat',
      rate: 'Pelan-pelan dulu.',
      pillConnecting: 'Menghubungkan',
      pillWaiting: 'Menunggu',
      pillActive: 'Terhubung',
      pillOffline: 'Offline',
      chars: 'karakter',
      messages: 'Pesan',
    },
  },
};

const COL = 'mx-auto w-full max-w-2xl px-4';

/* ------------------------------ Lobby ------------------------------ */

function Illustration({ label }) {
  // Original illustration. To use your own artwork instead, replace this component with
  // <img src="/chat-hero.webp" alt={label} className="mx-auto w-full max-w-md" />
  return (
    <svg viewBox="0 0 440 320" role="img" aria-label={label} className="mx-auto h-auto w-full max-w-md">
      <circle cx="220" cy="165" r="150" fill="#fff" fillOpacity=".08" />
      <circle cx="220" cy="165" r="105" fill="#fff" fillOpacity=".1" />
      {/* left phone */}
      <rect x="34" y="70" width="152" height="212" rx="24" fill="#fff" />
      <rect x="34" y="70" width="152" height="34" rx="24" fill="#eef4ff" />
      <rect x="34" y="88" width="152" height="16" fill="#eef4ff" />
      <circle cx="56" cy="87" r="8" fill="#9db8ea" />
      <rect x="72" y="83" width="50" height="8" rx="4" fill="#9db8ea" />
      <rect x="50" y="118" width="92" height="28" rx="14" fill="#dce6f7" />
      <rect x="76" y="154" width="94" height="28" rx="14" fill="#1f5fd6" />
      <rect x="50" y="190" width="66" height="28" rx="14" fill="#dce6f7" />
      <rect x="48" y="244" width="124" height="22" rx="11" fill="#eef4ff" />
      {/* right phone */}
      <rect x="254" y="38" width="152" height="212" rx="24" fill="#fff" />
      <rect x="254" y="38" width="152" height="34" rx="24" fill="#eef4ff" />
      <rect x="254" y="56" width="152" height="16" fill="#eef4ff" />
      <circle cx="276" cy="55" r="8" fill="#9db8ea" />
      <rect x="292" y="51" width="50" height="8" rx="4" fill="#9db8ea" />
      <rect x="290" y="86" width="100" height="28" rx="14" fill="#1f5fd6" />
      <rect x="270" y="122" width="88" height="28" rx="14" fill="#dce6f7" />
      <rect x="302" y="158" width="88" height="28" rx="14" fill="#1f5fd6" />
      <rect x="268" y="212" width="124" height="22" rx="11" fill="#eef4ff" />
      {/* live link between the phones */}
      <path d="M186 168 H254" stroke="#fff" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
      <circle cx="220" cy="168" r="22" fill="#fff" />
      <path d="M224 154 L211 171 H219 L216 183 L229 166 H221 Z" fill="#1f5fd6" />
    </svg>
  );
}

function Lobby({ T }) {
  const L = T.home;
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const inputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (!ROOM_RE.test(value)) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    setRoomSecret(value, password.trim()); // kept in memory only, never put in the URL
    navigate(`/chat/${value}`);
  };

  const icons = [FiDatabase, FiZap, FiShield];

  return (
    <>
      <section id="top" className="relative overflow-hidden bg-brand pb-28 pt-12 text-white sm:pb-32 sm:pt-16">
        <span className="batik-hero batik-hero-tr" aria-hidden="true" />
        <span className="batik-hero batik-hero-bl" aria-hidden="true" />
        <div className="wrap relative grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white/75">{L.badge}</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{L.title}</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">{L.subtitle}</p>
          </div>
          <Illustration label={L.illustration} />
        </div>
      </section>

      <section className="relative z-10 -mt-16 px-5 sm:-mt-20">
        {/* plain div styles instead of ".card": the site's scroll-reveal fade would delay the main call to action */}
        <form
          onSubmit={submit}
          noValidate
          className="relative isolate batik-corner mx-auto w-full max-w-md rounded-3xl border border-brand-line bg-white px-6 py-7 shadow-[0_24px_50px_-28px_rgba(15,26,48,0.55)] sm:px-8"
        >
          <h2 className="text-xl font-extrabold text-ink">{L.formTitle}</h2>
          <label htmlFor="room-id" className="mt-4 block text-sm font-semibold text-ink">{L.label}</label>
          <input
            id="room-id"
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError(false);
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="off"
            placeholder={L.placeholder}
            aria-invalid={error}
            aria-describedby="room-hint"
            className={`mt-2 h-14 w-full rounded-xl border bg-brand-soft px-4 text-center text-2xl font-bold tracking-[0.35em] text-ink placeholder:text-mute/40 focus:bg-white ${
              error ? 'border-red-500' : 'border-brand-line focus:border-brand'
            }`}
          />
          <p id="room-hint" className={`mt-2 text-sm ${error ? 'font-medium text-red-600' : 'text-mute'}`} role={error ? 'alert' : undefined}>
            {error ? L.errEmpty : L.hint}
          </p>
          <label htmlFor="room-pw" className="mt-5 block text-sm font-semibold text-ink">{L.pwLabel}</label>
          <div className="relative mt-2">
            <input
              id="room-pw"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 64))}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={L.pwPlaceholder}
              aria-describedby="pw-hint"
              className="h-12 w-full rounded-xl border border-brand-line bg-brand-soft pl-4 pr-12 text-base text-ink placeholder:text-mute/50 focus:border-brand focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? L.pwHide : L.pwShow}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-mute hover:text-brand"
            >
              {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <p id="pw-hint" className="mt-2 text-sm text-mute">{L.pwHint}</p>
          <button type="submit" className="btn btn-primary mt-5 h-12 w-full text-base">
            {L.button}
          </button>
        </form>
      </section>

      <section className="section pt-14 sm:pt-16">
        <div className="wrap grid gap-5 md:grid-cols-3">
          {L.features.map((f, i) => {
            const Icon = icons[i];
            return (
              <div key={f.title} className="card px-6 py-7 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(15,26,48,0.5)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ------------------------------ Room ------------------------------- */

// Centered message card used for "room full", "invalid room" and "connection lost".
function Notice({ icon: Icon, title, hint, children, tone = 'warn' }) {
  return (
    <div className="flex h-full items-center justify-center px-5">
      <div role="alert" className="w-full max-w-md rounded-3xl border border-brand-line bg-white px-6 py-9 text-center shadow-[0_24px_60px_-30px_rgba(15,26,48,0.5)]">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-8 ${tone === 'warn' ? 'bg-red-50 text-red-600 ring-red-50/60' : 'bg-brand-soft text-brand ring-brand-soft/60'}`}>
          <Icon size={26} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">{hint}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
      </div>
    </div>
  );
}

const PILL = {
  connecting: { key: 'pillConnecting', dot: 'bg-amber-400' },
  waiting: { key: 'pillWaiting', dot: 'bg-amber-400' },
  left: { key: 'pillWaiting', dot: 'bg-amber-400' },
  active: { key: 'pillActive', dot: 'bg-emerald-500' },
  closed: { key: 'pillOffline', dot: 'bg-red-500' },
  idle: { key: 'pillOffline', dot: 'bg-red-500' },
  config: { key: 'pillOffline', dot: 'bg-red-500' },
  nocrypto: { key: 'pillOffline', dot: 'bg-red-500' },
  ask: { key: 'pillWaiting', dot: 'bg-amber-400' },
  mismatch: { key: 'pillMismatch', dot: 'bg-amber-400' },
};

function Room({ room, T, lang }) {
  const R = T.room;
  // ask | connecting | waiting | active | left | mismatch | full | closed | idle | config | nocrypto
  // The password is kept in memory only. Without one yet (opened by link), ask first.
  const [secret, setSecret] = useState(() => getRoomSecret(room));
  const [pwDraft, setPwDraft] = useState('');
  const [status, setStatus] = useState(() => (getRoomSecret(room) === null ? 'ask' : 'connecting'));
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const [draft, setDraft] = useState('');
  const [attempt, setAttempt] = useState(0); // bump to reconnect by hand
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(null); // base64 of the photo waiting for confirmation
  const [busy, setBusy] = useState(false); // preparing a photo
  const [blocked, setBlocked] = useState(false); // incoming photos blocked

  const channelRef = useRef(null);
  const blockRef = useRef(false);
  const keyRef = useRef(null); // AES key, only while connected
  const sendN = useRef(0); // message counter, bound into every encrypted message
  const sendChain = useRef(Promise.resolve()); // keeps encrypted messages in order
  const fileRef = useRef(null);
  const myId = useRef(null);
  const peerRef = useRef(null);
  const lastActive = useRef(Date.now());
  const sendLog = useRef({ times: [], last: 0, text: '', lastImg: 0 });
  const seq = useRef(0);
  const toastTimer = useRef(null);
  const copyTimer = useRef(null);
  const listRef = useRef(null);
  const boxRef = useRef(null);
  const stickRef = useRef(true);

  const notify = useCallback((key, kind) => {
    setToast({ key, kind, n: ++seq.current });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const touch = useCallback(() => {
    lastActive.current = Date.now();
  }, []);

  useEffect(() => () => clearRoomSecret(room), [room]);

  // One Supabase Realtime channel per room. Presence decides who is inside (max 2).
  // Cleanup removes the channel, so leaving the page frees the seat and the connection.
  useEffect(() => {
    if (secret === null) return undefined; // waiting for the password prompt
    let alive = true;
    let sb = null;
    let channel = null;
    let retryTimer = null;
    let failTimer = null;
    let fullTries = 0;
    let wasActive = false;
    let hiddenSince = 0;
    // incoming spam counters
    let recvTimes = [];
    let strikes = 0;
    let mutedUntil = 0;
    let lastImgAt = 0;
    let derived = null;
    let myKc = null;
    let recvChain = Promise.resolve();
    const lastN = { id: null, n: 0 };

    const me = newId();
    myId.current = me;
    peerRef.current = null;
    lastActive.current = Date.now();
    sendN.current = 0;

    const teardown = () => {
      clearTimeout(failTimer);
      failTimer = null;
      wasActive = false;
      peerRef.current = null;
      keyRef.current = null;
      const ch = channel;
      channel = null;
      channelRef.current = null;
      if (ch && sb) {
        try {
          Promise.resolve(sb.removeChannel(ch)).catch(() => {});
        } catch {
          // already gone
        }
      }
    };

    const goIdle = () => {
      teardown();
      setMessages([]);
      setPending(null);
      setStatus('idle');
    };

    const onConnLost = (ch) => {
      if (!alive || channel !== ch) return;
      wasActive = false;
      peerRef.current = null;
      setStatus('connecting');
      if (!failTimer) {
        failTimer = setTimeout(() => {
          failTimer = null;
          if (!alive) return;
          teardown();
          setStatus('closed');
        }, FAIL_MS);
      }
    };

    const strike = (now) => {
      strikes += 1;
      if (strikes >= RECV_STRIKES) {
        strikes = 0;
        mutedUntil = now + MUTE_MS;
        notify('muted', 'warn');
      }
    };

    const enqueue = (fn) => {
      recvChain = recvChain.then(fn).catch(() => {});
    };

    // Cheap checks first, so no decryption work is spent on junk.
    const accept = (payload, maxCt) =>
      !!payload &&
      typeof payload === 'object' &&
      typeof payload.from === 'string' &&
      payload.from === peerRef.current && // only the other member of this room
      typeof payload.iv === 'string' &&
      payload.iv.length === IV_B64_LEN &&
      typeof payload.ct === 'string' &&
      payload.ct.length >= 24 &&
      payload.ct.length <= maxCt &&
      Number.isSafeInteger(payload.n) &&
      payload.n >= 1;

    // Decrypts one message. Returns null for a wrong key, a changed message or a replay.
    const open = async (payload, kind) => {
      const key = keyRef.current;
      if (!key) return null;
      if (lastN.id !== payload.from) {
        lastN.id = payload.from;
        lastN.n = 0;
      }
      if (payload.n <= lastN.n) return null; // replayed or out of order
      try {
        const bytes = await decryptBytes(key, makeAad(room, payload.from, kind, payload.n), payload.iv, payload.ct);
        lastN.n = payload.n;
        return bytes;
      } catch {
        return null;
      }
    };

    const onIncoming = (payload) => {
      const now = Date.now();
      if (!accept(payload, MAX_CT_TEXT) || now < mutedUntil) return;
      recvTimes = recvTimes.filter((t) => now - t < SEND_WINDOW);
      if (recvTimes.length >= RECV_BURST) {
        strike(now);
        return;
      }
      recvTimes.push(now);
      enqueue(async () => {
        const bytes = await open(payload, 'm');
        if (!bytes) {
          strike(Date.now());
          return;
        }
        const text = clean(textDec.decode(bytes));
        if (!text || text.length > MAX_LEN) return;
        const at = Date.now();
        lastActive.current = at;
        // Only the newest MAX_BUBBLES bubbles stay in memory and on screen.
        setMessages((prev) => addMsg(prev, { id: ++seq.current, mine: false, text, ts: at }));
      });
    };

    const onIncomingPhoto = (payload) => {
      const now = Date.now();
      if (blockRef.current) return; // blocked photos are dropped before any decryption
      if (!accept(payload, MAX_IMG_B64 + 200) || now < mutedUntil) return;
      recvTimes = recvTimes.filter((t) => now - t < SEND_WINDOW);
      if (recvTimes.length >= RECV_BURST || now - lastImgAt < IMG_RECV_GAP) {
        strike(now);
        return;
      }
      lastImgAt = now;
      recvTimes.push(now);
      enqueue(async () => {
        const bytes = await open(payload, 'i');
        if (!bytes) {
          strike(Date.now());
          return;
        }
        const b64 = bytesToB64(bytes);
        if (!validPhoto(b64)) return; // must be a plain JPEG of sane size
        const at = Date.now();
        lastActive.current = at;
        setMessages((prev) => addMsg(prev, { id: ++seq.current, mine: false, img: true, src: PHOTO_PREFIX + b64, ts: at }));
      });
    };

    const connect = async () => {
      setStatus('connecting');
      try {
        sb = await getSupabase();
      } catch {
        if (alive) setStatus('closed');
        return;
      }
      if (!alive) return;
      if (!sb) {
        setStatus('config');
        return;
      }
      if (!derived) {
        if (!cryptoSupported()) {
          setStatus('nocrypto');
          return;
        }
        try {
          derived = await deriveRoomKey(room, secret);
        } catch {
          if (alive) setStatus('nocrypto');
          return;
        }
        if (!alive) return;
      }
      keyRef.current = derived.key;
      myKc = derived.kc;

      const joinedAt = Date.now();
      const ch = sb.channel(`chat:${room}`, {
        config: { broadcast: { self: false, ack: false }, presence: { key: me } },
      });
      channel = ch;
      channelRef.current = ch;

      ch.on('presence', { event: 'sync' }, () => {
        if (!alive || channel !== ch) return;
        const state = ch.presenceState();
        if (!state[me]) return; // our own entry has not arrived yet
        // The two earliest members own the room. Anyone else is "full".
        const top = Object.entries(state)
          .map(([key, metas]) => ({ key, at: Number(metas && metas[0] && metas[0].at) || 0 }))
          .sort((x, y) => x.at - y.at || (x.key < y.key ? -1 : 1))
          .slice(0, 2)
          .map((m) => m.key);

        if (!top.includes(me)) {
          // After a refresh the old entry may still be closing. Retry briefly before giving up.
          teardown();
          if (fullTries < 2) {
            fullTries += 1;
            retryTimer = setTimeout(connect, 1200);
          } else {
            setStatus('full');
          }
          return;
        }

        fullTries = 0;
        const peer = top.find((k) => k !== me) || null;
        const peerKc = peer && state[peer] && state[peer][0] ? state[peer][0].kc : null;
        if (peer && peerKc !== myKc) {
          // the other person typed a different password: nothing could be read, so say so
          peerRef.current = null;
          wasActive = false;
          setStatus('mismatch');
          return;
        }
        peerRef.current = peer;
        if (peer) {
          if (!wasActive) notify('joined', 'ok');
          wasActive = true;
          setStatus('active');
        } else if (wasActive) {
          wasActive = false;
          setStatus('left');
          notify('left', 'warn');
        } else {
          setStatus((st) => (st === 'left' ? st : 'waiting'));
        }
      });

      ch.on('broadcast', { event: 'msg' }, ({ payload }) => onIncoming(payload));
      ch.on('broadcast', { event: 'img' }, ({ payload }) => onIncomingPhoto(payload));

      ch.subscribe((s) => {
        if (!alive || channel !== ch) return;
        if (s === 'SUBSCRIBED') {
          clearTimeout(failTimer);
          failTimer = null;
          Promise.resolve(ch.track({ at: joinedAt, kc: myKc })).catch(() => onConnLost(ch));
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          onConnLost(ch);
        }
      });
    };

    const idleTimer = setInterval(() => {
      if (!channel) return;
      const now = Date.now();
      if (now - lastActive.current > IDLE_MS || (hiddenSince && now - hiddenSince > HIDDEN_MS)) goIdle();
    }, 15000);

    const onVisibility = () => {
      if (document.hidden) {
        hiddenSince = Date.now();
        return;
      }
      if (hiddenSince && channel && Date.now() - hiddenSince > HIDDEN_MS) goIdle();
      else lastActive.current = Date.now();
      hiddenSince = 0;
    };
    const onHide = () => teardown();
    const onShow = (e) => {
      if (e.persisted) setAttempt((a) => a + 1); // restored from the back/forward cache
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    connect();

    return () => {
      alive = false;
      clearTimeout(retryTimer);
      clearInterval(idleTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
      teardown();
    };
  }, [room, attempt, notify, secret]);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(copyTimer.current);
    },
    []
  );

  // Keep the view at the bottom unless the reader scrolled up to look at older bubbles.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (stickRef.current || (last && last.mine)) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // Grow the textarea with its content (max ~5 lines).
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const h = el.scrollHeight + 2; // + border
    el.style.height = `${Math.min(h, 120)}px`;
    el.style.overflowY = h > 120 ? 'auto' : 'hidden'; // no scrollbar popping in and out
  }, [draft]);

  const active = status === 'active';

  useEffect(() => {
    if (active) boxRef.current?.focus();
  }, [active]);

  const send = () => {
    const text = clean(draft);
    const ch = channelRef.current;
    if (!active || !text || text.length > MAX_LEN || !ch || !keyRef.current) return;
    const now = Date.now();
    const log = sendLog.current;
    log.times = log.times.filter((t) => now - t < SEND_WINDOW);
    if (
      now - log.last < SEND_MIN_GAP ||
      log.times.length >= SEND_BURST ||
      (text === log.text && now - log.last < DUP_WINDOW)
    ) {
      notify('rate', 'warn');
      return;
    }
    log.last = now;
    log.text = text;
    log.times.push(now);
    touch();
    setDraft('');
    setMessages((prev) => addMsg(prev, { id: ++seq.current, mine: true, text, ts: now }));
    const n = (sendN.current += 1);
    const key = keyRef.current;
    const from = myId.current;
    sendChain.current = sendChain.current
      .then(async () => {
        const { iv, ct } = await encryptBytes(key, makeAad(room, from, 'm', n), textEnc.encode(text));
        await ch.send({ type: 'broadcast', event: 'msg', payload: { from, n, iv, ct } });
      })
      .catch(() => {});
  };

  const joinWithPassword = (e) => {
    e.preventDefault();
    const pw = pwDraft.trim();
    setRoomSecret(room, pw);
    setPwDraft('');
    setStatus('connecting');
    setSecret(pw);
  };

  const changeSecret = () => {
    clearRoomSecret(room);
    setMessages([]);
    setPending(null);
    setPwDraft('');
    setStatus('ask');
    setSecret(null);
  };

  const stickBottom = () => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  };

  const onPick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file || !active || busy) return;
    touch();
    if (file.type && !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      notify('photoError', 'warn');
      return;
    }
    if (file.size > IMG_MAX_FILE) {
      notify('photoBig', 'warn');
      return;
    }
    setBusy(true);
    try {
      setPending(await preparePhoto(file));
    } catch {
      notify('photoError', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const sendPhoto = () => {
    const ch = channelRef.current;
    if (!pending || !active || !ch || !keyRef.current) return;
    const now = Date.now();
    const log = sendLog.current;
    log.times = log.times.filter((t) => now - t < SEND_WINDOW);
    if (now - log.lastImg < IMG_SEND_GAP || log.times.length >= SEND_BURST) {
      notify('photoRate', 'warn');
      return;
    }
    log.lastImg = now;
    log.last = now;
    log.times.push(now);
    touch();
    const b64 = pending;
    setPending(null);
    setMessages((prev) => addMsg(prev, { id: ++seq.current, mine: true, img: true, src: PHOTO_PREFIX + b64, ts: now }));
    const n = (sendN.current += 1);
    const key = keyRef.current;
    const from = myId.current;
    sendChain.current = sendChain.current
      .then(async () => {
        const { iv, ct } = await encryptBytes(key, makeAad(room, from, 'i', n), b64ToBytes(b64));
        await ch.send({ type: 'broadcast', event: 'img', payload: { from, n, iv, ct } });
      })
      .catch(() => {});
  };

  const reveal = (id) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, shown: true } : m)));
  const dropPhoto = (id) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, src: null } : m)));

  const toggleBlock = () => {
    const next = !blocked;
    blockRef.current = next;
    setBlocked(next);
    if (next) setMessages((prev) => prev.map((m) => (m.img && !m.mine ? { ...m, src: null } : m)));
    notify(next ? 'photosBlocked' : 'photosAllowed', next ? 'warn' : 'ok');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: nothing to do
    }
  };

  const time = (ts) =>
    new Date(ts).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  if (status === 'full') {
    return (
      <Notice icon={FiAlertTriangle} title={R.full} hint={R.fullHint.replace('{room}', room)}>
        <Link to="/chat" className="btn btn-primary">{R.other}</Link>
      </Notice>
    );
  }

  const pill = PILL[status];
  const locked = !active;
  const full = messages.length >= MAX_BUBBLES;

  let banner = null;
  if (status === 'connecting') banner = { text: R.connecting };
  else if (status === 'waiting') banner = { title: R.waiting, text: R.waitingHint };
  else if (status === 'left') banner = { title: R.left, text: R.waitingHint };
  else if (status === 'mismatch') {
    banner = { title: R.mismatch, text: R.mismatchHint, action: { label: R.changePw, onClick: changeSecret } };
  }

  return (
    <div
      onPointerDownCapture={touch}
      onKeyDownCapture={touch}
      className="flex h-[calc(100dvh-65px)] flex-col bg-gradient-to-b from-brand-soft to-white"
    >
      {/* header: two rows so nothing can overlap on a phone */}
      <div className="border-b border-brand-line bg-white shadow-[0_1px_0_rgba(15,26,48,0.02)]">
        <div className={`${COL} flex items-center gap-3 pt-3`}>
          <Link
            to="/chat"
            aria-label={R.leave}
            title={R.leave}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-line text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold leading-tight text-ink">
              {R.roomLabel} <span className="tracking-[0.18em] text-brand">{room}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-mute">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${pill.dot} ${
                  pill.dot.includes('amber') ? 'animate-pulse motion-reduce:animate-none' : ''
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{R[pill.key]}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={toggleBlock}
            aria-pressed={blocked}
            aria-label={blocked ? R.unblockPhotos : R.blockPhotos}
            title={blocked ? R.unblockPhotos : R.blockPhotos}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              blocked ? 'border-red-300 bg-red-50 text-red-600' : 'border-brand-line text-ink hover:border-brand hover:text-brand'
            }`}
          >
            {blocked ? <FiEyeOff size={16} /> : <FiImage size={16} />}
          </button>
          <button
            type="button"
            onClick={copyLink}
            aria-label={R.copyLink}
            title={R.copyLink}
            className={`flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
              copied ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-brand-line text-ink hover:border-brand hover:text-brand'
            }`}
          >
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            <span className="hidden sm:inline">{copied ? R.copied : R.copyLink}</span>
          </button>
        </div>
        <div className={`${COL} flex items-center justify-between gap-3 pb-3 pt-2.5`}>
          {secret !== null ? (
            <span
              title={secret ? R.e2eTitle : R.noE2eTitle}
              className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                secret ? 'bg-brand-soft text-brand' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <FiLock size={12} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{secret ? R.e2e : R.noE2e}</span>
            </span>
          ) : (
            <span />
          )}
          <div className="shrink-0 [&_button]:h-8 [&_button]:min-w-[40px] [&_button]:px-2.5 [&_button]:text-xs">
            <LangSwitch />
          </div>
        </div>
      </div>

      {/* messages */}
      <div className="relative min-h-0 flex-1">
        {toast && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
            <p
              key={toast.n}
              role="status"
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${
                toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-ink'
              }`}
            >
              {R[toast.key]}
            </p>
          </div>
        )}

        {status === 'ask' ? (
          <div className="flex h-full items-center justify-center px-5">
            <form
              onSubmit={joinWithPassword}
              className="w-full max-w-md rounded-2xl border border-brand-line bg-white px-6 py-8 shadow-[0_24px_50px_-30px_rgba(15,26,48,0.5)]"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                <FiLock size={26} aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-center text-xl font-extrabold text-ink">{R.askTitle}</h1>
              <p className="mt-2 text-center text-sm leading-relaxed text-mute">{R.askHint}</p>
              <label htmlFor="room-pw-ask" className="sr-only">{R.askLabel}</label>
              <input
                id="room-pw-ask"
                type="password"
                value={pwDraft}
                onChange={(e) => setPwDraft(e.target.value.slice(0, 64))}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={R.askLabel}
                className="mt-5 h-12 w-full rounded-xl border border-brand-line bg-brand-soft px-4 text-base text-ink placeholder:text-mute/50 focus:border-brand focus:bg-white"
              />
              <button type="submit" className="btn btn-primary mt-4 h-12 w-full text-base">{R.askJoin}</button>
            </form>
          </div>
        ) : status === 'nocrypto' ? (
          <Notice icon={FiAlertTriangle} title={R.noCrypto} hint={R.noCryptoHint}>
            <Link to="/chat" className="btn btn-outline">{R.other}</Link>
          </Notice>
        ) : status === 'config' ? (
          <Notice icon={FiAlertTriangle} title={R.notConfigured} hint={R.notConfiguredHint}>
            <Link to="/chat" className="btn btn-outline">{R.other}</Link>
          </Notice>
        ) : status === 'idle' ? (
          <Notice icon={FiClock} title={R.idle} hint={R.idleHint} tone="info">
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-primary">
              <FiRefreshCw size={16} /> {R.reconnect}
            </button>
            <Link to="/chat" className="btn btn-outline">{R.other}</Link>
          </Notice>
        ) : status === 'closed' ? (
          <Notice icon={FiWifiOff} title={R.lost} hint={R.lostHint}>
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-primary">
              <FiRefreshCw size={16} /> {R.reconnect}
            </button>
            <Link to="/chat" className="btn btn-outline">{R.other}</Link>
          </Notice>
        ) : (
          <div ref={listRef} onScroll={onScroll} className="h-full overflow-y-auto">
            <div
              role="log"
              aria-live="polite"
              aria-label={R.messages}
              className={`${COL} flex min-h-full flex-col justify-end gap-2 py-4`}
            >
              {messages.length === 0 && (
                <div className="mx-auto my-auto max-w-xs py-10 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-brand-line">
                    <FiShield size={24} aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-base font-bold text-ink">{R.emptyTitle}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{R.empty}</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] shadow-sm ${m.img ? 'p-1.5' : 'px-4 py-2.5'} text-[15px] leading-snug [overflow-wrap:anywhere] sm:max-w-[75%] ${
                      m.mine
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md border border-brand-line bg-white text-ink'
                    }`}
                  >
                    {m.img ? (
                      m.src ? (
                        m.mine || m.shown ? (
                          <img
                            src={m.src}
                            alt={R.photoAlt}
                            draggable={false}
                            onLoad={stickBottom}
                            onError={() => dropPhoto(m.id)}
                            className="block max-h-64 w-auto max-w-full rounded-xl"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => reveal(m.id)}
                            aria-label={R.photoTap}
                            className="relative block overflow-hidden rounded-xl"
                          >
                            <img
                              src={m.src}
                              alt=""
                              aria-hidden="true"
                              draggable={false}
                              onLoad={stickBottom}
                              onError={() => dropPhoto(m.id)}
                              className="block max-h-64 w-auto max-w-full scale-110 blur-2xl"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30 px-3 text-center text-sm font-semibold text-white">
                              {R.photoTap}
                            </span>
                          </button>
                        )
                      ) : (
                        <span className="block px-2.5 py-1.5 text-sm italic opacity-80">{R.photoGone}</span>
                      )
                    ) : (
                      m.text
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-mute">
                    {m.mine ? R.you : R.partner} · {time(m.ts)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="border-t border-brand-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(15,26,48,0.35)]">
        <div className={`${COL} py-3`}>
          {full && (
            <div className="mb-3 flex flex-col items-start justify-between gap-2 rounded-xl border border-brand-line bg-brand-soft px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-sm text-ink">{R.limitNote}</p>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  stickRef.current = true;
                  boxRef.current?.focus();
                }}
                className="btn btn-primary h-9 shrink-0 px-4"
              >
                <FiRefreshCw size={15} /> {R.restart}
              </button>
            </div>
          )}

          {banner && (
            <div role="status" className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              <span className="min-w-0">
                {banner.title && <strong className="block font-bold">{banner.title}</strong>}
                <span className={banner.title ? 'block text-xs leading-snug text-amber-700' : ''}>{banner.text}</span>
              </span>
              {banner.action && (
                <button type="button" onClick={banner.action.onClick} className="btn btn-outline ml-auto h-8 shrink-0 px-3 text-sm">
                  {banner.action.label}
                </button>
              )}
            </div>
          )}

          {pending && (
            <div className="mb-3 rounded-xl border border-brand-line bg-brand-soft p-3">
              <p className="text-sm font-semibold text-ink">{R.photoPreview}</p>
              <img
                src={PHOTO_PREFIX + pending}
                alt={R.photoAlt}
                className="mt-2 block max-h-48 w-auto max-w-full rounded-lg"
              />
              <p className="mt-2 text-xs text-mute">{R.photoStrip}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={sendPhoto} disabled={locked} className="btn btn-primary h-9 px-4 disabled:opacity-50">
                  <FiSend size={15} /> {R.photoSend}
                </button>
                <button type="button" onClick={() => setPending(null)} className="btn btn-outline h-9 px-4">
                  <FiX size={15} /> {R.photoCancel}
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPick}
              tabIndex={-1}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              disabled={locked || busy || !!pending}
              aria-label={R.attachPhoto}
              title={R.attachPhoto}
              className="btn btn-outline h-11 w-11 shrink-0 rounded-full px-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <FiRefreshCw size={18} className="animate-spin motion-reduce:animate-none" /> : <FiImage size={18} />}
            </button>
            <div className="min-w-0 flex-1">
              <label htmlFor="chat-input" className="sr-only">{R.placeholder}</label>
              <textarea
                id="chat-input"
                ref={boxRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={locked}
                maxLength={MAX_LEN}
                enterKeyHint="send"
                autoComplete="off"
                placeholder={locked ? R.waitingShort : R.placeholder}
                className="block max-h-[120px] min-h-[44px] w-full resize-none overflow-y-hidden rounded-3xl border border-brand-line bg-brand-soft px-4 py-2.5 text-base leading-snug text-ink placeholder:text-mute/70 focus:border-brand focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={locked || !draft.trim()}
              aria-label={R.send}
              title={R.send}
              className="btn btn-primary h-11 w-11 shrink-0 rounded-full px-0 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand"
            >
              <FiSend size={18} />
            </button>
          </form>
          <div className="mt-1.5 flex h-4 items-center justify-between gap-3 text-[11px] text-mute">
            <span className="flex min-w-0 items-center gap-1">
              <FiLock size={11} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{R.privacyLine}</span>
            </span>
            <span
              className={`min-w-[3.5rem] shrink-0 text-right tabular-nums ${draft.length >= MAX_LEN ? 'font-bold text-red-600' : ''}`}
              aria-live="off"
            >
              {draft.length > 0 ? `${draft.length}/${MAX_LEN}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Entry ------------------------------ */

export default function Chat() {
  const { lang } = useLang();
  const T = TEXT[lang] || TEXT.en;
  const segment = usePath().split('/')[2]; // '/chat/123456' -> '123456'

  if (segment === undefined) return <Lobby T={T} />;

  let room = segment;
  try {
    room = decodeURIComponent(segment);
  } catch {
    // malformed escape: it will fail the digit check below
  }

  if (!ROOM_RE.test(room)) {
    return (
      <div className="h-[calc(100dvh-65px)]">
        <Notice icon={FiAlertTriangle} title={T.room.invalid} hint={T.room.invalidHint}>
          <Link to="/chat" className="btn btn-primary">{T.room.other}</Link>
        </Notice>
      </div>
    );
  }
  // key = room, so moving between rooms always starts with a clean slate
  return <Room key={room} room={room} T={T} lang={lang} />;
}
