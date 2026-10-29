import { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { api, formatDateTime } from '../api';
import { useLang } from '../i18n.jsx';

const NEVER_KEY = 'nd-ann-never'; // id of the announcement the visitor never wants to see again (this browser)
const SESSION_KEY = 'nd-ann-session'; // id closed with "Close": hidden until the tab is closed

const read = (store, key) => {
  try { return store.getItem(key); } catch { return null; }
};
const write = (store, key, value) => {
  try { store.setItem(key, value); } catch { /* storage blocked, popup may come back */ }
};

// Shows the newest announcement once per visit, until the visitor picks "don't show again".
// A newer announcement has a new id, so it shows up again.
export default function AnnouncementPopup() {
  const { t, lang } = useLang();
  const [item, setItem] = useState(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    let alive = true;
    api('/api/announcements')
      .then((d) => {
        const latest = d.items && d.items[0];
        if (!alive || !latest) return;
        if (read(localStorage, NEVER_KEY) === latest.id || read(sessionStorage, SESSION_KEY) === latest.id) return;
        setItem(latest);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const close = () => {
    if (item) write(sessionStorage, SESSION_KEY, item.id);
    setItem(null);
  };
  const never = () => {
    if (item) write(localStorage, NEVER_KEY, item.id);
    setItem(null);
  };

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-title"
        onClick={(e) => e.stopPropagation()}
        className="card batik-corner w-full max-w-md p-6 shadow-[0_24px_60px_-24px_rgba(15,26,48,0.6)] sm:p-7"
      >
        <h2 id="ann-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand">
          <FiBell size={18} /> {t('announce.title')}
        </h2>
        <p className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-line break-words text-base leading-relaxed text-ink">{item.text}</p>
        <p className="mt-3 text-sm text-mute">{formatDateTime(item.createdAt, lang)}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button ref={closeBtn} type="button" onClick={close} className="btn btn-primary sm:flex-1">{t('announce.close')}</button>
          <button type="button" onClick={never} className="btn btn-outline sm:flex-1">{t('announce.never')}</button>
        </div>
      </div>
    </div>
  );
}
