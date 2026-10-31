import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { HomeLink, Link, usePath, isChatPath } from '../router.jsx';
import LangSwitch from './LangSwitch';
import AccountMenu from './AccountMenu';
import { useScrollSpy } from '../hooks';
import { SUPPORT_URL, STUDIO_NAME } from '../config';

// `to` = separate page, otherwise a section of the home page.
const LINKS = [
  { id: 'about' },
  { id: 'projects' },
  { id: 'recruitment', to: '/recruitment', isNew: true },
  // Desktop nav is already full at 1024px (Indonesian labels are long), so Chat joins it from 1280px up.
  // Below that it is in the mobile menu and the footer.
  { id: 'chat', to: '/chat', xlOnly: true },
  { id: 'giveaway' },
  { id: 'notes' },
  { id: 'location' },
  { id: 'faq' },
];

// Sections the scroll spy follows (module level so the array stays the same between renders).
const SPY_IDS = ['about', 'projects', 'giveaway', 'notes', 'location', 'faq', 'team'];

function NavItem({ link, className, onNavigate, activeId }) {
  const { t } = useLang();
  const path = usePath();
  const label = (
    <>
      {t(`nav.${link.id}`)}
      {link.isNew && <sup className="ml-1 text-[10px] font-extrabold tracking-wide text-brand">{t('nav.new')}</sup>}
    </>
  );

  if (link.to) {
    const active = link.to === '/chat' ? isChatPath(path) : path === link.to;
    return (
      <Link
        to={link.to}
        onClick={onNavigate}
        data-nav={link.id}
        aria-current={active ? 'page' : undefined}
        className={`${className} ${active ? '!text-brand' : ''}`}
      >
        {label}
      </Link>
    );
  }
  return (
    <HomeLink
      hash={link.id}
      onClick={onNavigate}
      data-nav={link.id}
      aria-current={activeId === link.id ? 'location' : undefined}
      className={`${className} ${activeId === link.id ? '!text-brand' : ''}`}
    >
      {label}
    </HomeLink>
  );
}

export default function Navbar() {
  const { t, lang } = useLang();
  const path = usePath();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Shadow once the page is scrolled; the scroll spy only counts after the hero.
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setPastHero(window.scrollY > 240);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const spy = useScrollSpy(SPY_IDS, path);
  let activeId = '';
  if (path === '/recruitment') activeId = 'recruitment';
  else if (isChatPath(path)) activeId = 'chat';
  else if (pastHero) activeId = spy;

  // Sliding underline under the active menu item (desktop).
  const navRef = useRef(null);
  const [bar, setBar] = useState({ left: 0, width: 0, show: false });
  useLayoutEffect(() => {
    const place = () => {
      const el = navRef.current && activeId
        ? navRef.current.querySelector(`[data-nav="${activeId}"]`)
        : null;
      if (!el || el.offsetWidth === 0) {
        setBar((b) => (b.show ? { ...b, show: false } : b));
        return;
      }
      setBar({ left: el.offsetLeft + 12, width: el.offsetWidth - 24, show: true });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [activeId, lang]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-brand-line bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_10px_30px_-20px_rgba(15,26,48,0.45)]' : ''
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4 xl:max-w-6xl">
        <HomeLink hash="top" className="flex shrink-0 items-center gap-3" onClick={close}>
          <img src="/studio-64.webp" alt="" width="40" height="40" className="h-10 w-10 rounded-lg object-cover" />
          <span className="whitespace-nowrap text-base font-bold text-ink lg:text-sm xl:text-base">{STUDIO_NAME}</span>
        </HomeLink>

        <nav ref={navRef} className="relative hidden items-center gap-0.5 self-stretch lg:flex xl:gap-1" aria-label={t('nav.label')}>
          {LINKS.map((link) => (
            <NavItem
              key={link.id}
              link={link}
              activeId={activeId}
              className={`whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-mute hover:text-brand xl:px-3 ${
                link.xlOnly ? 'hidden xl:block' : ''
              }`}
            />
          ))}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-brand transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: bar.width, transform: `translateX(${bar.left}px)`, opacity: bar.show ? 1 : 0 }}
          />
          <AccountMenu />
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary ml-1 h-10 whitespace-nowrap xl:ml-2">
            <FaDiscord size={16} /> {t('nav.join')}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t('nav.close') : t('nav.menu')}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-line lg:hidden"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open && (
        <>
        {/* Dim backdrop under the header; tapping it closes the menu */}
        <div className="fixed inset-x-0 bottom-0 top-16 bg-ink/25 lg:hidden" onClick={close} aria-hidden="true" />
        {/* Menu floats over the page instead of pushing the content down */}
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-t border-brand-line bg-white shadow-[0_18px_30px_-20px_rgba(15,26,48,0.45)] lg:hidden"
        >
          <nav className="wrap flex flex-col py-2" aria-label={t('nav.label')}>
            {LINKS.map((link) => (
              <NavItem
                key={link.id}
                link={link}
                activeId={activeId}
                onNavigate={close}
                className="border-b border-brand-line/70 py-3.5 text-base font-medium text-ink"
              />
            ))}
            <AccountMenu inline onNavigate={close} />
            <div className="flex items-center justify-between gap-3 py-4">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <FaDiscord size={16} /> {t('nav.join')}
              </a>
              <LangSwitch />
            </div>
          </nav>
        </div>
        </>
      )}
    </header>
  );
}
