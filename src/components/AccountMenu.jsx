import { useEffect, useRef, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiLogOut, FiShield } from 'react-icons/fi';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { Link } from '../router.jsx';

// Login button / avatar menu. `inline` = flat layout for the mobile menu.
export default function AccountMenu({ inline = false, onNavigate }) {
  const { t } = useLang();
  const { loginReady, user, isAdmin, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!loginReady) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        title={t('auth.loginLong')}
        className={inline ? 'btn btn-outline w-full' : 'btn btn-outline ml-1 h-10 whitespace-nowrap px-3 xl:px-4'}
      >
        <FaDiscord size={16} />
        <span className={inline ? '' : 'hidden xl:inline'}>{t('auth.login')}</span>
        {!inline && <span className="sr-only xl:hidden">{t('auth.login')}</span>}
      </button>
    );
  }

  const go = () => { setOpen(false); if (onNavigate) onNavigate(); };

  if (inline) {
    return (
      <div className="flex flex-col gap-2 border-b border-brand-line/70 py-3.5">
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt="" width="36" height="36" className="h-9 w-9 rounded-full bg-brand-soft" />
          <span className="truncate text-base font-semibold text-ink">{user.name}</span>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" onClick={go} className="btn btn-outline flex-1"><FiShield size={16} /> {t('auth.admin')}</Link>
          )}
          <button type="button" onClick={() => { go(); logout(); }} className="btn btn-outline flex-1">
            <FiLogOut size={16} /> {t('auth.logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={box} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t('auth.account')}: ${user.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-brand-soft hover:border-brand"
      >
        <img src={user.avatar} alt="" width="32" height="32" className="h-8 w-8 rounded-full" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-brand-line bg-white p-2 shadow-[0_18px_30px_-20px_rgba(15,26,48,0.45)]">
          <p className="truncate px-3 py-2 text-sm font-semibold text-ink">{user.name}</p>
          {isAdmin && (
            <Link to="/admin" role="menuitem" onClick={go} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-soft">
              <FiShield size={16} /> {t('auth.admin')}
            </Link>
          )}
          <button type="button" role="menuitem" onClick={() => { go(); logout(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-brand-soft">
            <FiLogOut size={16} /> {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
