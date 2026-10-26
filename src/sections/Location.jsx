import { FiMapPin, FiExternalLink } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import WeatherCard from '../components/WeatherCard';
import { useNow, formatWib, formatWibDate } from '../hooks';
import {
  LOCATION_CITY, LOCATION_COUNTRY, LOCATION_TZ,
  LOCATION_UTC_OFFSET, MAPS_URL,
} from '../config';

export default function Location() {
  const { t, lang } = useLang();
  const now = useNow(1000);

  const visitorOffset = -now.getTimezoneOffset() / 60;
  const diff = LOCATION_UTC_OFFSET - visitorOffset;
  const n = Math.abs(diff);
  const nLabel = Number.isInteger(n) ? String(n) : n.toFixed(1);
  let diffText = t('location.same');
  if (n >= 0.01) diffText = t(diff > 0 ? 'location.ahead' : 'location.behind').replace('{n}', nLabel);

  const facts = [
    { label: t('location.city'), value: LOCATION_CITY },
    { label: t('location.region'), value: t('location.regionName') },
    { label: t('location.country'), value: LOCATION_COUNTRY },
    { label: t('location.timezone'), value: LOCATION_TZ },
  ];

  return (
    <section id="location" className="section">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('location.label')}</p>
          <h2 className="heading">{t('location.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-mute">{t('location.desc')}</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          <div className="card batik-corner p-6">
            <p className="mb-2 text-sm font-medium text-mute">{t('location.clock')}</p>
            <p className="text-5xl font-extrabold tabular-nums text-brand" aria-label={`${formatWib(now)} WIB`}>
              {formatWib(now, { seconds: true })}
            </p>
            <p className="mt-3 text-base capitalize text-ink">{formatWibDate(now, lang)}</p>
            <p className="mt-1 text-sm text-mute">{diffText}</p>
          </div>

          <div className="card p-6">
            <dl className="divide-y divide-brand-line">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                  <dt className="text-sm text-mute">{f.label}</dt>
                  <dd className="text-base font-semibold text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-4 w-full">
              <FiMapPin size={15} /> {t('location.map')} <FiExternalLink size={13} />
            </a>
          </div>

          <WeatherCard />
        </div>
      </div>
    </section>
  );
}
