import { useEffect, useRef, useState } from "react";

/* ---------- Ikon (inline SVG, tanpa dependency) ---------- */
const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {d}
  </svg>
);

const ArrowLeft = () => <Icon d={<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>} />;
const CopyIcon = () => <Icon d={<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} />;
const CheckIcon = () => <Icon d={<path d="m5 12 5 5L20 7" />} />;
const ImageIcon = () => <Icon d={<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-4.5-4.5L8 19" /></>} />;
const SendIcon = () => <Icon d={<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>} />;
const LockIcon = () => <Icon className="h-3.5 w-3.5" d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />;
const AlertIcon = () => <Icon className="h-8 w-8" d={<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>} />;

/* ---------- Teks dua bahasa ---------- */
const T = {
  id: {
    room: "Room",
    waiting: "Menunggu teman",
    online: "Terhubung",
    encrypted: "Terenkripsi",
    copy: "Salin kode",
    copied: "Tersalin",
    image: "Kirim gambar",
    emptyTitle: "Belum ada pesan",
    emptyDesc: "Chat tidak disimpan. Room tutup otomatis setelah 10 menit tidak aktif.",
    banner: "Menunggu teman bergabung",
    bannerHint: "Bagikan kode room ke temanmu",
    placeholderWaiting: "Menunggu teman...",
    placeholder: "Tulis pesan",
    footer: "Tanpa login, tanpa database",
    send: "Kirim",
    back: "Kembali",
  },
  en: {
    room: "Room",
    waiting: "Waiting for peer",
    online: "Connected",
    encrypted: "Encrypted",
    copy: "Copy code",
    copied: "Copied",
    image: "Send image",
    emptyTitle: "No messages yet",
    emptyDesc: "Chats are never stored. The room closes after 10 minutes of inactivity.",
    banner: "Waiting for someone to join",
    bannerHint: "Share the room code with a friend",
    placeholderWaiting: "Waiting for peer...",
    placeholder: "Type a message",
    footer: "No login, no database",
    send: "Send",
    back: "Back",
  },
};

/**
 * Props:
 *  roomCode   string   contoh "555555"
 *  connected  boolean  true kalau user 2 sudah masuk
 *  messages   [{ id, from: "me" | "peer", text?, image?, time? }]
 *  lang       "id" | "en"
 *  onLangChange(lang)
 *  onSend(text)
 *  onPickImage(file)
 *  onBack()
 */
export default function Chat({
  roomCode = "555555",
  connected = false,
  messages = [],
  lang = "id",
  onLangChange = () => {},
  onSend = () => {},
  onPickImage = () => {},
  onBack = () => {},
}) {
  const t = T[lang] || T.id;
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard tidak tersedia */
    }
  };

  const submit = () => {
    const v = text.trim();
    if (!v || !connected) return;
    onSend(v);
    setText("");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      {/* Header: dua baris, tidak ada elemen yang saling menimpa */}
      <header className="shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-3 pt-3">
          <button
            onClick={onBack}
            aria-label={t.back}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition active:scale-95 hover:bg-slate-50"
          >
            <ArrowLeft />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-slate-500">{t.room}</span>
              <span className="truncate font-mono text-lg font-bold tracking-widest text-blue-600">
                {roomCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "animate-pulse bg-amber-400"
                }`}
              />
              <span className={connected ? "text-emerald-600" : "text-amber-600"}>
                {connected ? t.online : t.waiting}
              </span>
            </div>
          </div>

          <button
            onClick={copyCode}
            aria-label={t.copy}
            title={copied ? t.copied : t.copy}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
              copied
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-3 pb-3 pt-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <LockIcon />
            {t.encrypted}
          </span>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            {["en", "id"].map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                className={`rounded-[10px] px-3 py-1 uppercase transition ${
                  lang === l
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Area pesan */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-2 px-4 py-4">
          {messages.length === 0 ? (
            <div className="m-auto max-w-xs text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <LockIcon />
              </div>
              <p className="text-base font-semibold text-slate-800">{t.emptyTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{t.emptyDesc}</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.from === "me";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                      mine
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt=""
                        className="mb-1 max-h-64 w-full rounded-xl object-cover"
                      />
                    )}
                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                    {m.time && (
                      <span
                        className={`mt-0.5 block text-right text-[10px] ${
                          mine ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {m.time}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </main>

      {/* Footer input */}
      <footer className="shrink-0 border-t border-slate-200 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl px-3 pt-3">
          {!connected && (
            <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-amber-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-amber-900">{t.banner}</p>
                <p className="truncate text-xs text-amber-700">{t.bannerHint}</p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickImage(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!connected}
              aria-label={t.image}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition active:scale-95 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImageIcon />
            </button>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
              disabled={!connected}
              placeholder={connected ? t.placeholder : t.placeholderWaiting}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              onClick={submit}
              disabled={!connected || !text.trim()}
              aria-label={t.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition active:scale-95 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <SendIcon />
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 pb-1 pt-2 text-[11px] text-slate-400">
            <LockIcon />
            {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Tampilan "Room penuh" ---------- */
export function RoomFull({ roomCode = "555555", onPickAnother = () => {} }) {
  return (
    <div className="flex min-h-[100dvh] items-start justify-center bg-gradient-to-b from-blue-50 to-white px-4 pt-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertIcon />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Room penuh</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Room{" "}
          <span className="font-mono font-semibold tracking-widest text-slate-800">
            {roomCode}
          </span>{" "}
          sudah berisi 2 orang. Coba kode lain.
        </p>
        <button
          onClick={onPickAnother}
          className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-blue-700"
        >
          Pilih room lain
        </button>
      </div>
    </div>
  );
}
