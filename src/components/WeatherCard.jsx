import {
  FiSun, FiMoon, FiCloud, FiCloudDrizzle, FiCloudRain, FiCloudLightning, FiCloudSnow, FiDroplet,
} from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { useWeather } from '../hooks';
import { LOCATION_IANA_TZ } from '../config';

// WMO weather codes (used by Open-Meteo) grouped into a few kinds we have text and icons for.
function kindOf(code) {
  if (code === 0) return 'clear';
  if (code === 1) return 'mostlyClear';
  if (code === 2) return 'partly';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'overcast';
}

function iconOf(kind, isDay = true) {
  switch (kind) {
    case 'clear':
    case 'mostlyClear':
      return isDay ? FiSun : FiMoon;
    case 'drizzle': return FiCloudDrizzle;
    case 'rain': return FiCloudRain;
    case 'snow': return FiCloudSnow;
    case 'storm': return FiCloudLightning;
    default: return FiCloud;
  }
}

const deg = (n) => `${Math.round(n)}°`;

export default function WeatherCard() {
  const { t, lang } = useLang();
  const { status, data } = useWeather();

  const dayLabel = (date, i) => {
    if (i === 0) return t('weather.today');
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
      timeZone: LOCATION_IANA_TZ,
      weekday: 'short',
    }).format(new Date(`${date}T12:00:00+07:00`));
  };

  let body;
  if (status === 'loading') {
    body = (
      <div className="animate-pulse" role="status">
        <span className="sr-only">{t('weather.loading')}</span>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-soft" />
          <div className="space-y-2">
            <div className="h-9 w-28 rounded-lg bg-brand-soft" />
            <div className="h-4 w-20 rounded bg-brand-soft" />
          </div>
        </div>
        <div className="mt-6 h-20 rounded-xl bg-brand-soft" />
      </div>
    );
  } else if (status === 'error' || !data) {
    body = <p className="text-sm text-mute">{t('weather.error')}</p>;
  } else {
    const kind = kindOf(data.code);
    const Icon = iconOf(kind, data.isDay);
    const today = data.days[0];
    body = (
      <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon size={32} aria-hidden="true" />
            </span>
            <div>
              <p className="text-5xl font-extrabold leading-none tabular-nums text-brand">{Math.round(data.temp)}°C</p>
              <p className="mt-2 text-base text-ink">{t(`weather.kinds.${kind}`)}</p>
            </div>
          </div>
          {today && (
            <dl className="grid grid-cols-2 gap-x-8 text-sm sm:text-right">
              <div>
                <dt className="text-mute">{t('weather.highLow')}</dt>
                <dd className="mt-0.5 text-lg font-bold text-ink">{deg(today.hi)} / {deg(today.lo)}</dd>
              </div>
              <div>
                <dt className="text-mute">{t('weather.rain')}</dt>
                <dd className="mt-0.5 text-lg font-bold text-ink">{today.rain ?? 0}%</dd>
              </div>
            </dl>
          )}
        </div>

        <ul className="mt-6 grid grid-cols-4 gap-2 border-t border-brand-line pt-5">
          {data.days.map((d, i) => {
            const DayIcon = iconOf(kindOf(d.code));
            return (
              <li key={d.date} className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-xs font-bold uppercase tracking-wide text-mute">{dayLabel(d.date, i)}</span>
                <DayIcon size={22} className="text-brand" aria-hidden="true" />
                <span className="text-sm font-bold leading-tight text-ink">
                  {deg(d.hi)}
                  <span className="block font-medium text-mute sm:inline">
                    <span className="hidden sm:inline"> / </span>{deg(d.lo)}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-mute">
                  <FiDroplet size={11} aria-hidden="true" /> {d.rain ?? 0}%
                </span>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className="card card-lift p-6 md:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-mute">{t('weather.title')}</p>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap text-xs text-mute hover:text-brand"
        >
          {t('weather.source')}
        </a>
      </div>
      {body}
    </div>
  );
}
