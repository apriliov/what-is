import { useLang } from '../i18n.jsx';
import LangSwitch from './LangSwitch';
import {
  SUPPORT_URL, SUPPORT_EMAIL, STUDIO_NAME, COPYRIGHT_YEAR, OWNER_NAME, OWNER_URL,
  NAMAIKI_URL, NAMAIKI_PRIVACY_URL, NAMAIKI_TERMS_URL, PRESIDENT_URL,
} from '../config';

function Column({ title, links }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-mute hover:text-brand"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { t } = useLang();

  const pages = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.projects'), href: '#projects' },
    { label: t('nav.notes'), href: '#notes' },
    { label: t('nav.location'), href: '#location' },
    { label: t('nav.faq'), href: '#faq' },
  ];
  const bots = [
    { label: 'Namaiki', href: NAMAIKI_URL, external: true },
    { label: 'President', href: PRESIDENT_URL, external: true },
  ];
  const more = [
    { label: t('footer.support'), href: SUPPORT_URL, external: true },
    { label: t('footer.privacy'), href: NAMAIKI_PRIVACY_URL, external: true },
    { label: t('footer.terms'), href: NAMAIKI_TERMS_URL, external: true },
  ];

  return (
    <footer className="border-t border-brand-line bg-brand-soft">
      <div className="wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <a href="#top" className="mb-3 inline-flex items-center gap-3">
              <img src="/studio-64.webp" alt="" width="36" height="36" loading="lazy" className="h-9 w-9 rounded-lg object-cover" />
              <span className="text-base font-bold text-ink">{STUDIO_NAME}</span>
            </a>
            <p className="mb-3 max-w-xs text-sm text-mute">{t('footer.about')}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-brand hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <Column title={t('footer.pages')} links={pages} />
            <Column title={t('footer.bots')} links={bots} />
            <Column title={t('footer.more')} links={more} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-brand-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-mute">
            &copy; {COPYRIGHT_YEAR}{' '}
            <a href={OWNER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:text-brand">
              {OWNER_NAME}
            </a>
            . {t('footer.rights')}
          </p>
          <LangSwitch />
        </div>
      </div>
    </footer>
  );
}
