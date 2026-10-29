import { useCallback, useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiAward, FiCheck, FiGift, FiUsers } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';

function Winners({ winners }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {winners.map((w, i) => (
        <li key={`${w.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-brand-line bg-brand-soft px-3 py-2">
          <img src={w.avatar} alt="" width="36" height="36" className="h-9 w-9 rounded-full bg-white" />
          <span className="truncate text-sm font-semibold text-ink">{w.name}</span>
        </li>
      ))}
    </ul>
  );
}

function GiveawayCard({ g, onJoin, busy, revealed, onReveal }) {
  const { t } = useLang();
  const { loginReady, user, login } = useAuth();
  const open = g.status === 'open';

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

      <p className="mt-3 flex items-center gap-2 text-sm text-mute">
        <FiUsers size={16} className="shrink-0" /> {g.entries} {t('giveaway.entries')}
        <span aria-hidden="true">&middot;</span> {g.winnersCount} {t('giveaway.winnersCount')}
      </p>

      {open && (
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
              <Winners winners={g.winners} />
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
