import { FaDiscord } from 'react-icons/fa';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { useNow, formatWib } from '../hooks';
import { SUPPORT_URL, STUDIO_NAME, LOCATION_CITY, LOCATION_REGION, LOCATION_TZ } from '../config';

const BOTS = [
  { name: 'Namaiki', logo: '/logo-64.webp' },
  { name: 'President', logo: '/president-64.webp' },
];

// Own component so only the clock re-renders, not the whole hero.
function Clock() {
  const now = useNow(15000);
  return <span className="tabular-nums">{formatWib(now)}</span>;
}

const lift = 'transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none';

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
        <div className="relative -mt-20 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6">
          {/* Main tile */}
          <div className={`relative col-span-2 overflow-hidden rounded-[2rem] border border-brand-line bg-white p-6 shadow-sm sm:p-8 md:col-span-4 md:row-span-2 ${lift}`}>
            <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand/10 blur-2xl" aria-hidden="true" />
            <p className="relative inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" /> {t('intro.role')}
            </p>
            <h2 className="relative mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{STUDIO_NAME}</h2>
            <p className="relative mt-3 max-w-md text-base leading-relaxed text-mute">{t('intro.desc')}</p>
            <div className="relative mt-6 grid grid-cols-2 gap-3 sm:flex">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <FaDiscord size={16} /> Discord
              </a>
              <a href="#projects" className="btn btn-outline">{t('intro.projects')}</a>
            </div>
          </div>

          {/* Logo tile, leaf shape */}
          <div className={`relative col-span-1 aspect-square overflow-hidden rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-brand-line bg-brand-soft md:col-span-2 md:aspect-auto md:row-span-2 ${lift}`}>
            <img
              src="/studio-256.webp"
              alt=""
              width="256"
              height="256"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Bot count, circle */}
          <div className={`col-span-1 flex aspect-square flex-col items-center justify-center rounded-full bg-brand p-3 text-center text-white ${lift}`}>
            <p className="text-5xl font-extrabold leading-none">{BOTS.length}</p>
            <p className="mt-1.5 max-w-[7rem] text-xs font-bold uppercase leading-tight tracking-wider text-white/85">{t('intro.bots')}</p>
          </div>

          {/* Location and live time */}
          <div className={`col-span-2 flex flex-col justify-between gap-3 rounded-3xl border border-brand-line bg-brand-soft p-5 md:col-span-2 ${lift}`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand">
                <FiMapPin size={15} aria-hidden="true" />
              </span>
              {LOCATION_CITY}, {LOCATION_REGION}
            </p>
            <p className="text-4xl font-extrabold text-brand">
              <Clock /> <span className="text-sm font-bold text-mute">{LOCATION_TZ}</span>
            </p>
          </div>

          {/* Bots, pill */}
          <a
            href="#projects"
            className={`col-span-2 flex items-center gap-3 rounded-full border border-brand-line bg-white p-2.5 pr-5 shadow-sm md:col-span-3 ${lift}`}
          >
            <span className="flex shrink-0 items-center">
              {BOTS.map((b, i) => (
                <img
                  key={b.name}
                  src={b.logo}
                  alt=""
                  width="48"
                  height="48"
                  className={`h-12 w-12 rounded-full border-2 border-white object-cover ${i ? '-ml-3' : ''}`}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-bold text-ink">{BOTS.map((b) => b.name).join(' • ')}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <FiArrowRight size={16} aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
