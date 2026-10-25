import { FaDiscord } from 'react-icons/fa';
import { useLang } from '../i18n.jsx';
import LangSwitch from './LangSwitch';
import { SUPPORT_URL, COPYRIGHT_YEAR, OWNER_NAME, OWNER_URL } from '../config';

// Slim bar pinned to the bottom of the screen; it stays in view while scrolling.
export default function StickyBar() {
  const { t } = useLang();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white">
      <div className="wrap flex h-14 items-center justify-between gap-3">
        <p className="text-sm text-mute">
          &copy; {COPYRIGHT_YEAR}{' '}
          <a href={OWNER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:text-brand">
            {OWNER_NAME}
          </a>
          <span className="hidden sm:inline">. {t('footer.rights')}</span>
        </p>
        <div className="flex items-center gap-2">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('nav.join')}
            className="btn btn-primary h-10 px-3 sm:px-4"
          >
            <FaDiscord size={16} />
            <span className="hidden sm:inline">{t('nav.join')}</span>
          </a>
          <LangSwitch />
        </div>
      </div>
    </div>
  );
}
