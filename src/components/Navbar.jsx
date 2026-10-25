import { useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import LangSwitch from './LangSwitch';
import { SUPPORT_URL, STUDIO_NAME } from '../config';

const LINKS = ['about', 'projects', 'location', 'faq'];

export default function Navbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-line bg-white">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/logo-64.webp" alt="" width="40" height="40" className="h-10 w-10 rounded-lg object-cover" />
          <span className="text-base font-bold text-ink">{STUDIO_NAME}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((id) => (
            <a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-mute hover:text-brand">
              {t(`nav.${id}`)}
            </a>
          ))}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary ml-2 h-10">
            <FaDiscord size={16} /> {t('nav.join')}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t('nav.close') : t('nav.menu')}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-line md:hidden"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-brand-line bg-white md:hidden">
          <nav className="wrap flex flex-col py-2" aria-label="Mobile">
            {LINKS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className="border-b border-brand-line/70 py-3.5 text-base font-medium text-ink"
              >
                {t(`nav.${id}`)}
              </a>
            ))}
            <div className="flex items-center justify-between gap-3 py-4">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <FaDiscord size={16} /> {t('nav.join')}
              </a>
              <LangSwitch />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
