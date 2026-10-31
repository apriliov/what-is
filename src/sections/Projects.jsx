import { FaDiscord, FaCheck } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import {
  NAMAIKI_URL, NAMAIKI_INVITE_URL, PRESIDENT_URL, PRESIDENT_INVITE_URL,
} from '../config';

const PROJECTS = [
  { key: 'namaiki', name: 'Namaiki', logo: '/logo-256.webp', site: NAMAIKI_URL, invite: NAMAIKI_INVITE_URL },
  { key: 'president', name: 'President', logo: '/president-256.webp', site: PRESIDENT_URL, invite: PRESIDENT_INVITE_URL },
];

export default function Projects() {
  const { t } = useLang();
  return (
    <section id="projects" className="section border-y border-brand-line bg-brand-soft">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('projects.label')}</p>
          <h2 className="heading">{t('projects.title')}</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p) => {
            const copy = t(`projects.${p.key}`);
            return (
              <article key={p.key} className="card card-lift batik-corner flex flex-col p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-4">
                  <img src={p.logo} alt="" width="64" height="64" loading="lazy" className="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <h3 className="text-xl font-bold text-ink">{p.name}</h3>
                    <p className="text-sm font-semibold text-brand">{copy.tag}</p>
                  </div>
                </div>
                <p className="mb-5 text-base leading-relaxed text-mute">{copy.desc}</p>
                <ul className="mb-6 grid gap-2 sm:grid-cols-2">
                  {copy.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                      <FaCheck size={11} className="shrink-0 text-brand" /> {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <a href={p.invite} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <FaDiscord size={16} /> {t('projects.invite')}
                  </a>
                  <a href={p.site} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    {t('projects.visit')} <FiExternalLink size={14} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
