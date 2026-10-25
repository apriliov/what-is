import { FaDiscord } from 'react-icons/fa';
import { useLang } from '../i18n.jsx';
import { SUPPORT_URL, STUDIO_NAME } from '../config';

export default function Hero() {
  const { t } = useLang();
  return (
    <section id="top">
      <div className="bg-brand pb-28 pt-14 text-center text-white sm:pb-32 sm:pt-20">
        <div className="wrap">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white/75">{t('hero.label')}</p>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">{t('hero.title')}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{t('hero.subtitle')}</p>
        </div>
      </div>

      <div className="wrap">
        <div className="card relative -mt-20 overflow-hidden shadow-sm">
          <div className="h-24 bg-brand-soft sm:h-28" />
          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <img
              src="/studio-256.webp"
              alt=""
              width="96"
              height="96"
              className="-mt-12 h-24 w-24 rounded-full border-4 border-white object-cover"
            />
            <h2 className="mt-3 text-2xl font-bold text-ink">{STUDIO_NAME}</h2>
            <p className="mt-1 text-sm font-bold text-brand">{t('intro.role')}</p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-mute">{t('intro.desc')}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <FaDiscord size={16} /> Discord
              </a>
              <a href="#projects" className="btn btn-outline">{t('intro.projects')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
