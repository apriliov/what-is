import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiArrowLeft, FiCheck, FiCopy, FiDatabase, FiRefreshCw, FiSend, FiShield, FiWifiOff, FiZap,
} from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { Link, navigate, usePath } from '../router.jsx';
import LangSwitch from '../components/LangSwitch';

/* ------------------------------------------------------------------ *
 * Realtime chat, 2 people per room. Rooms are named by 1-6 digits:
 *   /chat          -> lobby (enter a number)
 *   /chat/:idroom  -> the room
 * Nothing is stored. Messages only live in this component's state and
 * disappear on refresh. The server (chat-server/) keeps rooms in RAM only.
 * ------------------------------------------------------------------ */

const MAX_LEN = 250; // characters per message
const MAX_BUBBLES = 50; // bubbles kept on screen
const ROOM_RE = /^\d{1,6}$/;

// In production set VITE_CHAT_WS_URL (e.g. wss://chat.example.com). In dev, Vite proxies /chat-ws to localhost:8787.
const chatUrl = () =>
  import.meta.env.VITE_CHAT_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/chat-ws`;

const TEXT = {
  en: {
    home: {
      badge: 'Private chat',
      title: 'Chat in real time. Leave no trace.',
      subtitle:
        'Pick a number, share it with one person and start talking. Nothing is saved, not in a database and not on the server.',
      features: [
        {
          title: 'No database',
          desc: 'Messages only pass through memory. Refresh the page and the whole conversation is gone for good.',
        },
        {
          title: 'Fast',
          desc: 'Messages travel over a live WebSocket connection and arrive the moment they are sent.',
        },
        {
          title: 'Secure',
          desc: 'Only 2 people fit in a room, the connection is encrypted (WSS) and no account is needed.',
        },
      ],
      formTitle: 'Start a chat',
      label: 'Room number (1 to 6 digits)',
      placeholder: '123456',
      hint: 'No room yet? Type any number and it is created for you. Share the same number with your friend.',
      button: 'Create or Join Room',
      errEmpty: 'Enter a number with 1 to 6 digits.',
      illustration: 'Two phones exchanging chat messages',
    },
    room: {
      leave: 'Leave room',
      roomLabel: 'Room',
      copyLink: 'Copy link',
      copied: 'Copied',
      connecting: 'Connecting...',
      waking: 'The server is waking up, please wait a moment...',
      waiting: 'Waiting for your partner to join...',
      joined: 'Your partner joined!',
      left: 'Your partner disconnected',
      full: 'Room is full (Maximum 2 people)',
      fullHint: 'Two people are already chatting in room {room}. Try a different number.',
      lost: 'Connection lost',
      lostHint: 'Could not reach the chat server.',
      reconnect: 'Reconnect',
      invalid: 'Invalid room number',
      invalidHint: 'A room number has 1 to 6 digits, for example 123456.',
      other: 'Choose another room',
      placeholder: 'Type a message...',
      send: 'Send',
      you: 'You',
      partner: 'Partner',
      empty: 'No messages yet. Nothing is saved, so a refresh clears everything.',
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
          title: 'Tanpa Database',
          desc: 'Pesan hanya lewat di memori. Refresh halaman dan seluruh obrolan hilang permanen.',
        },
        {
          title: 'Cepat',
          desc: 'Pesan dikirim lewat koneksi WebSocket langsung dan sampai begitu dikirim.',
        },
        {
          title: 'Aman',
          desc: 'Satu room hanya muat 2 orang, koneksinya terenkripsi (WSS) dan tidak perlu akun.',
        },
      ],
      formTitle: 'Mulai ngobrol',
      label: 'Nomor room (1 sampai 6 digit)',
      placeholder: '123456',
      hint: 'Belum punya room? Ketik angka apa saja, room dibuat otomatis. Bagikan angka yang sama ke temanmu.',
      button: 'Create or Join Room',
      errEmpty: 'Masukkan angka 1 sampai 6 digit.',
      illustration: 'Dua ponsel saling berkirim pesan',
    },
    room: {
      leave: 'Keluar room',
      roomLabel: 'Room',
      copyLink: 'Salin link',
      copied: 'Tersalin',
      connecting: 'Menghubungkan...',
      waking: 'Server sedang bangun, tunggu sebentar...',
      waiting: 'Menunggu lawan bicara bergabung...',
      joined: 'Lawan bicara bergabung!',
      left: 'Lawan bicara terputus',
      full: 'Room penuh (Maksimal 2 orang)',
      fullHint: 'Sudah ada 2 orang yang mengobrol di room {room}. Coba angka lain.',
      lost: 'Koneksi terputus',
      lostHint: 'Tidak bisa terhubung ke server chat.',
      reconnect: 'Hubungkan lagi',
      invalid: 'Nomor room tidak valid',
      invalidHint: 'Nomor room terdiri dari 1 sampai 6 digit angka, contoh 123456.',
      other: 'Pilih room lain',
      placeholder: 'Ketik pesan...',
      send: 'Kirim',
      you: 'Kamu',
      partner: 'Lawan',
      empty: 'Belum ada pesan. Tidak ada yang disimpan, jadi refresh akan menghapus semuanya.',
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
  const inputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (!ROOM_RE.test(value)) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
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
          className="relative isolate batik-corner mx-auto w-full max-w-md rounded-2xl border border-brand-line bg-white px-6 py-7 shadow-[0_24px_50px_-28px_rgba(15,26,48,0.55)] sm:px-8"
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
              <div key={f.title} className="card px-6 py-7">
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
      <div role="alert" className="w-full max-w-md rounded-2xl border border-brand-line bg-white px-6 py-9 text-center shadow-[0_24px_50px_-30px_rgba(15,26,48,0.5)]">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${tone === 'warn' ? 'bg-red-50 text-red-600' : 'bg-brand-soft text-brand'}`}>
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
};

function Room({ room, T, lang }) {
  const R = T.room;
  // connecting | waiting | active | left | full | closed
  const [status, setStatus] = useState('connecting');
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const [draft, setDraft] = useState('');
  const [attempt, setAttempt] = useState(0); // bump to reconnect by hand
  const [copied, setCopied] = useState(false);
  const [waking, setWaking] = useState(false); // connecting for a while: free hosts sleep and need ~1 minute to wake

  const wsRef = useRef(null);
  const myId = useRef(null);
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

  // One WebSocket per room. Cleanup closes it, so leaving the page frees the seat for someone else.
  useEffect(() => {
    let ws = null;
    let timer = null;
    let drops = 0; // consecutive failed connections
    let fullTries = 0;
    let finalFull = false;
    let wakeTimer = null;
    const armWake = () => {
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(() => setWaking(true), 5000);
    };

    const connect = () => {
      setStatus('connecting');
      let gotFull = false;
      ws = new WebSocket(chatUrl());
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room }));

      ws.onmessage = (ev) => {
        let m;
        try {
          m = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (m.type) {
          case 'joined':
            clearTimeout(wakeTimer);
            setWaking(false);
            drops = 0;
            fullTries = 0;
            myId.current = m.id;
            if (m.count >= 2) {
              setStatus('active');
              notify('joined', 'ok');
            } else {
              setStatus('waiting');
            }
            break;
          case 'peer_joined':
            setStatus('active');
            notify('joined', 'ok');
            break;
          case 'peer_left':
            setStatus('left');
            notify('left', 'warn');
            break;
          case 'msg':
            // Only the newest MAX_BUBBLES bubbles stay in memory and on screen.
            setMessages((prev) => [
              ...prev.slice(-(MAX_BUBBLES - 1)),
              { id: ++seq.current, mine: m.from === myId.current, text: m.text, ts: m.ts },
            ]);
            break;
          case 'full':
            // After a refresh the old connection may still be closing on the server. Retry briefly before giving up.
            gotFull = true;
            if (fullTries < 2) fullTries += 1;
            else {
              finalFull = true;
              setStatus('full');
            }
            break;
          case 'error':
            if (m.code === 'rate') notify('rate', 'warn');
            break;
          default:
        }
      };

      ws.onclose = () => {
        if (finalFull) return;
        if (gotFull) {
          timer = setTimeout(connect, 900);
          return;
        }
        // Dropped or never connected: lock the input, retry with backoff, then offer a manual button.
        // About a minute of retries (1s, 2s, 4s, then every 8s) so a sleeping server has time to wake up.
        if (drops < 10) {
          setStatus('connecting');
          if (drops === 0) armWake();
          timer = setTimeout(connect, Math.min(1000 * 2 ** drops, 8000));
          drops += 1;
        } else {
          clearTimeout(wakeTimer);
          setWaking(false);
          setStatus('closed');
        }
      };
    };

    const onHide = () => ws && ws.close();
    window.addEventListener('pagehide', onHide);
    armWake();
    connect();

    return () => {
      window.removeEventListener('pagehide', onHide);
      clearTimeout(timer);
      clearTimeout(wakeTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [room, attempt, notify]);

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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const active = status === 'active';

  useEffect(() => {
    if (active) boxRef.current?.focus();
  }, [active]);

  const send = () => {
    const text = draft.trim();
    const ws = wsRef.current;
    if (!active || !text || text.length > MAX_LEN || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'msg', text }));
    setDraft('');
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
  if (status === 'connecting') banner = { text: waking ? R.waking : R.connecting };
  else if (status === 'waiting') banner = { text: R.waiting };
  else if (status === 'left') banner = { title: R.left, text: R.waiting };

  return (
    <div className="flex h-[calc(100dvh-65px)] flex-col bg-brand-soft/70">
      {/* header */}
      <div className="border-b border-brand-line bg-white">
        <div className={`${COL} flex h-14 items-center gap-2`}>
          <Link
            to="/chat"
            aria-label={R.leave}
            title={R.leave}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-line text-ink hover:border-brand hover:text-brand"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">
              {R.roomLabel} <span className="tracking-widest text-brand">{room}</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-mute">
              <span className={`h-2 w-2 rounded-full ${pill.dot}`} aria-hidden="true" />
              {R[pill.key]}
            </p>
          </div>
          <button
            type="button"
            onClick={copyLink}
            aria-label={R.copyLink}
            title={R.copyLink}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-brand-line px-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            <span className="hidden sm:inline">{copied ? R.copied : R.copyLink}</span>
          </button>
          <LangSwitch />
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

        {status === 'closed' ? (
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
                <p className="mx-auto my-auto max-w-xs py-10 text-center text-sm leading-relaxed text-mute">{R.empty}</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-snug [overflow-wrap:anywhere] sm:max-w-[75%] ${
                      m.mine
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md border border-brand-line bg-white text-ink'
                    }`}
                  >
                    {m.text}
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
      <div className="border-t border-brand-line bg-white pb-[env(safe-area-inset-bottom)]">
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
            <div role="status" className="mb-3 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              <span>
                {banner.title && <strong className="block font-bold">{banner.title}</strong>}
                {banner.text}
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
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
                placeholder={locked ? R.waiting : R.placeholder}
                className="block max-h-[120px] min-h-[44px] w-full resize-none rounded-xl border border-brand-line bg-brand-soft px-4 py-2.5 text-[15px] leading-snug text-ink placeholder:text-mute/70 focus:border-brand focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
              {draft.length > 0 && (
                <p className={`mt-1 px-1 text-right text-[11px] ${draft.length >= MAX_LEN ? 'font-bold text-red-600' : 'text-mute'}`}>
                  {draft.length}/{MAX_LEN} {R.chars}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={locked || !draft.trim()}
              aria-label={R.send}
              title={R.send}
              className="btn btn-primary h-11 w-11 shrink-0 px-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand"
            >
              <FiSend size={18} />
            </button>
          </form>
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
