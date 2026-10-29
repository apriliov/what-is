import { useCallback, useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiAward, FiBell, FiGift, FiTrash2 } from 'react-icons/fi';
import { Winners } from '../sections/Giveaway';
import { api, formatDateTime } from '../api';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { Link } from '../router.jsx';

const MAX_TEXT = 600;
const defaultEnd = () => {
  const d = new Date(Date.now() + 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const field = 'w-full rounded-xl border border-brand-line bg-brand-soft/60 px-4 text-base text-ink placeholder:text-mute/70 focus:border-brand focus:outline-none';

function Announcements() {
  const { t, lang } = useLang();
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState({ bad: false, text: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api('/api/announcements').then((d) => setItems(d.items || [])).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const post = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api('/api/announcements', { method: 'POST', body: { text } });
      setText('');
      setMsg({ bad: false, text: t('admin.posted') });
      load();
    } catch (err) {
      setMsg({ bad: true, text: t(`apiError.${err.code}`) });
    }
    setBusy(false);
  };

  const remove = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await api(`/api/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMsg({ bad: true, text: t(`apiError.${err.code}`) });
    }
  };

  return (
    <div className="card p-6 sm:p-7">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand"><FiBell size={18} /> {t('admin.annTitle')}</h2>
      <form onSubmit={post} className="mt-5">
        <label htmlFor="ann-text" className="mb-2 block text-sm font-semibold text-ink">{t('admin.annLabel')}</label>
        <textarea id="ann-text" rows={4} maxLength={MAX_TEXT} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('admin.annPlaceholder')} className={`${field} resize-y py-3`} />
        <p className="mt-1.5 text-right text-sm text-mute">{MAX_TEXT - text.length} {t('notes.left')}</p>
        <button type="submit" disabled={busy || !text.trim()} className="btn btn-primary mt-3 disabled:opacity-60">{busy ? t('admin.posting') : t('admin.post')}</button>
        <p className={`mt-3 text-sm ${msg.bad ? 'text-red-600' : 'text-mute'}`} role="status">{msg.text || t('admin.annHint')}</p>
      </form>

      <ul className="mt-5 flex flex-col gap-3">
        {items.length === 0 && <li className="text-sm text-mute">{t('admin.noAnn')}</li>}
        {items.map((a, i) => (
          <li key={a.id} className="rounded-xl border border-brand-line p-4">
            <p className="whitespace-pre-line break-words text-sm text-ink">{a.text}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-mute">
                {formatDateTime(a.createdAt, lang)} &middot; {a.author}{i === 0 ? ` · ${t('admin.live')}` : ''}
              </span>
              <button type="button" onClick={() => remove(a.id)} aria-label={t('admin.delete')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-line text-mute hover:border-red-400 hover:text-red-600">
                <FiTrash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Giveaways() {
  const { t, lang } = useLang();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', prize: '', winnersCount: 1, endsAt: defaultEnd() });
  const [msg, setMsg] = useState({ bad: false, text: '' });
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api('/api/giveaways').then((d) => setItems(d.items || [])).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const act = async (action, payload, okText) => {
    setBusy(action + (payload.id || ''));
    try {
      await api('/api/giveaways', { method: 'POST', body: { action, ...payload } });
      setMsg({ bad: false, text: okText || '' });
      await load();
      return true;
    } catch (err) {
      setMsg({ bad: true, text: t(`apiError.${err.code}`) });
      return false;
    } finally {
      setBusy('');
    }
  };

  const create = async (e) => {
    e.preventDefault();
    const endsAt = new Date(form.endsAt).getTime();
    if (await act('create', { ...form, endsAt }, t('admin.gaCreated'))) {
      setForm({ title: '', prize: '', winnersCount: 1, endsAt: defaultEnd() });
    }
  };

  const draw = (g) => {
    if (window.confirm(t('admin.confirmDraw'))) act('draw', { id: g.id }, t('admin.gaDrawn'));
  };
  const remove = (g) => {
    if (window.confirm(t('admin.confirmDelete'))) act('delete', { id: g.id });
  };

  return (
    <div className="card p-6 sm:p-7">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand"><FiGift size={18} /> {t('admin.gaTitle')}</h2>

      <form onSubmit={create} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_7rem]">
        <div>
          <label htmlFor="ga-title" className="mb-2 block text-sm font-semibold text-ink">{t('admin.gaName')}</label>
          <input id="ga-title" maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${field} h-12`} />
        </div>
        <div>
          <label htmlFor="ga-prize" className="mb-2 block text-sm font-semibold text-ink">{t('admin.gaPrize')}</label>
          <input id="ga-prize" maxLength={120} value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} className={`${field} h-12`} />
        </div>
        <div>
          <label htmlFor="ga-win" className="mb-2 block text-sm font-semibold text-ink">{t('admin.gaWinners')}</label>
          <input id="ga-win" type="number" min={1} max={20} value={form.winnersCount} onChange={(e) => setForm({ ...form, winnersCount: e.target.value })} className={`${field} h-12`} />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="ga-end" className="mb-2 block text-sm font-semibold text-ink">{t('admin.gaEnds')}</label>
          <input id="ga-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={`${field} h-12 sm:w-auto`} />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" disabled={busy === 'create' || !form.title.trim() || !form.prize.trim() || !form.endsAt} className="btn btn-primary disabled:opacity-60">{t('admin.gaCreate')}</button>
          <p className={`mt-3 text-sm ${msg.bad ? 'text-red-600' : 'text-mute'}`} role="status">{msg.text}</p>
        </div>
      </form>

      <ul className="mt-5 flex flex-col gap-3">
        {items.length === 0 && <li className="text-sm text-mute">{t('giveaway.empty')}</li>}
        {items.map((g) => (
          <li key={g.id} className="rounded-xl border border-brand-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words font-bold text-ink">{g.title}</p>
                <p className="break-words text-sm text-mute">{g.prize} &middot; {g.entries} {t('giveaway.entries')} &middot; {g.winnersCount} {t('giveaway.winnersCount')}</p>
                <p className="text-xs text-mute">{t('admin.gaEndsAt')}: {g.endsAt ? formatDateTime(g.endsAt, lang) : '-'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${g.status === 'open' ? 'bg-brand text-white' : 'bg-brand-soft text-mute'}`}>
                {g.status === 'open' ? t('giveaway.open') : t('giveaway.ended')}
              </span>
            </div>

            {g.status === 'ended' && <Winners winners={g.winners} isAdmin />}

            <div className="mt-3 flex gap-2">
              {g.status === 'open' && (
                <button type="button" onClick={() => draw(g)} disabled={busy === `draw${g.id}`} className="btn btn-primary h-10 disabled:opacity-60">
                  <FiAward size={16} /> {busy === `draw${g.id}` ? t('admin.drawing') : t('admin.draw')}
                </button>
              )}
              <button type="button" onClick={() => remove(g)} className="btn btn-outline h-10"><FiTrash2 size={16} /> {t('admin.delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminPage() {
  const { t } = useLang();
  const { status, user, isAdmin, loginReady, login } = useAuth();

  return (
    <section id="top" className="section">
      <div className="wrap max-w-3xl">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('admin.title')}</h1>

        {status === 'loading' && <p className="mt-6 text-mute">{t('admin.loading')}</p>}

        {status === 'ready' && !isAdmin && (
          <div className="card mt-8 p-6 text-center sm:p-8">
            <h2 className="text-xl font-extrabold text-ink">{t('admin.forbidden')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-base text-mute">{user ? t('admin.forbiddenDesc') : t('admin.loginDesc')}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {!user && loginReady && (
                <button type="button" onClick={login} className="btn btn-primary w-full sm:w-auto"><FaDiscord size={16} /> {t('auth.loginLong')}</button>
              )}
              <Link to="/" className="btn btn-outline w-full sm:w-auto">{t('notFound.home')}</Link>
            </div>
          </div>
        )}

        {status === 'ready' && isAdmin && (
          <div className="mt-8 flex flex-col gap-6">
            <Announcements />
            <Giveaways />
          </div>
        )}
      </div>
    </section>
  );
}
