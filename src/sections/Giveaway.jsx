import { useCallback, useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiAward, FiCheck, FiClock, FiGift, FiMessageCircle } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';

// "2d 03:14:09" (days only when there are any). Same in every language.
export function formatLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${d ? `${d}d ` : ''}${h}:${m}:${s}`;
}

function useNowTick(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

// Up to 3 newest entrants as half-overlapping avatars, then the total.
export function Participants({ recent, total }) {
  const { t } = useLang();
  const shown = (recent || []).slice(0, 3);
  return (
    <div className="flex items-center gap-3">
      {shown.length > 0 && (
        <div className="flex" aria-hidden="true">
          {shown.map((p, i) => (
            <img
              key={`${p.name}-${i}`}
              src={p.avatar}
              alt=""
              title={p.name}
              width="32"
              height="32"
              className={`h-8 w-8 rounded-full bg-brand-soft ring-2 ring-white ${i > 0 ? '-ml-4' : ''}`}
              style={{ zIndex: shown.length - i }}
            />
          ))}
        </div>
      )}
      <span className="text-sm text-mute">
        {total > 0 ? <><b className="text-ink">{total}</b> {t('giveaway.entries')}</> : t('giveaway.noEntries')}
      </span>
    </div>
  );
}

export function Winners({ winners, isAdmin }) {
  const { t } = useLang();
  if (!winners.length) return <p className="mt-3 text-sm text-mute">{t('giveaway.noWinners')}</p>;
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {winners.map((w, i) => (
        <li key={`${w.name}-${i}`} className="flex flex-col gap-2 rounded-xl border border-brand-line bg-brand-soft p-3">
          <div className="flex items-center gap-3">
            <img src={w.avatar} alt="" width="40" height="40" className="h-10 w-10 rounded-full bg-white" />
            <span className="truncate text-sm font-semibold text-ink">{w.name}</span>
          </div>
          {isAdmin && w.id && (
            <a
              href={`https://discord.com/users/${w.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline h-9 bg-white text-xs"
            >
              <FiMessageCircle size={14} /> {t('giveaway.dm')}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function GiveawayCard({ g, onJoin, busy, revealed, onReveal }) {
  const { t } = useLang();
  const { loginReady, user, isAdmin, login } = useAuth();
  const open = g.status === 'open';
  const now = useNowTick(open && Boolean(g.endsAt));
  const left = g.endsAt ? g.endsAt - now : null;
  const timeUp = open && left !== null && left <= 0;

  return (
    <li className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-extrabold text-ink">{g.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-mute">
            <FiGift size={16} className="shrink-0 text-brand" />
            <span className="break-words">{t('giveaway.prize')}: <b className="text-ink">{g.prize}</b></span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${open ? 'bg-brand text-white' : 'bg-brand-soft text-mute'}`}>
          {open ? t('giveaway.open') : t('giveaway.ended')}
        </span>
      </div>

      {open && left !== null && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm text-ink" role="timer">
          <FiClock size={16} className="shrink-0 text-brand" />
          {timeUp ? t('giveaway.timeUp') : (
            <>{t('giveaway.endsIn')} <b className="font-mono tabular-nums text-brand">{formatLeft(left)}</b></>
          )}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Participants recent={g.recent} total={g.entries} />
        <span className="text-sm text-mute">{g.winnersCount} {t('giveaway.winnersCount')}</span>
      </div>

      {open && !timeUp && (
        <div className="mt-4">
          {user ? (
            <button
              type="button"
              disabled={g.joined || busy}
              onClick={() => onJoin(g.id)}
              className="btn btn-primary w-full disabled:opacity-70 sm:w-auto"
            >
              {g.joined ? <><FiCheck size={16} /> {t('giveaway.joined')}</> : busy ? t('giveaway.joining') : t('giveaway.join')}
            </button>
          ) : loginReady ? (
            <button type="button" onClick={login} className="btn btn-primary w-full sm:w-auto">
              <FaDiscord size={16} /> {t('giveaway.loginToJoin')}
            </button>
          ) : null}
        </div>
      )}

      {!open && (
        <div className="mt-4">
          {revealed ? (
            <>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand">
                <FiAward size={16} /> {t('giveaway.winners')}
              </p>
              <Winners winners={g.winners} isAdmin={isAdmin} />
            </>
          ) : (
            <button type="button" onClick={onReveal} className="btn btn-primary w-full sm:w-auto">
              <FiAward size={16} /> {t('giveaway.reveal')}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Giveaway() {
  const { t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState(null); // null = loading
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({});

  const load = useCallback(async () => {
    try {
      const d = await api('/api/giveaways');
      setItems(d.items || []);
    } catch {
      setItems((cur) => cur || []);
    }
  }, []);

  // Reload when the visitor logs in or out, so "joined" is correct.
  useEffect(() => { load(); }, [load, user?.id]);

  // When a timer runs out, reload: the server draws the winners the first time it is asked after the end time.
  useEffect(() => {
    if (!items) return undefined;
    const ends = items.filter((g) => g.status === 'open' && g.endsAt).map((g) => g.endsAt);
    if (!ends.length) return undefined;
    const delay = Math.min(Math.max(Math.min(...ends) - Date.now() + 1000, 1500), 1e9);
    const id = setTimeout(load, delay);
    return () => clearTimeout(id);
  }, [items, load]);

  const join = async (id) => {
    setBusy(id);
    setError('');
    try {
      await api('/api/giveaways', { method: 'POST', body: { action: 'join', id } });
    } catch (e) {
      setError(t(`apiError.${e.code}`));
    }
    setBusy('');
    load();
  };

  return (
    <section id="giveaway" className="section border-t border-brand-line">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('giveaway.label')}</p>
          <h2 className="heading">{t('giveaway.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-mute">{t('giveaway.desc')}</p>
        </div>

        {items && items.length === 0 && (
          <p className="card mx-auto max-w-xl p-6 text-center text-base text-mute">{t('giveaway.empty')}</p>
        )}

        {items && items.length > 0 && (
          <ul className="mx-auto flex max-w-2xl flex-col gap-4">
            {items.map((g) => (
              <GiveawayCard
                key={g.id}
                g={g}
                busy={busy === g.id}
                onJoin={join}
                revealed={Boolean(revealed[g.id])}
                onReveal={() => setRevealed((r) => ({ ...r, [g.id]: true }))}
              />
            ))}
          </ul>
        )}

        {error && <p role="alert" className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
