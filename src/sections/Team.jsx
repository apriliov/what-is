import { useState } from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { useLang } from '../i18n.jsx';
import { TEAM } from '../team';

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Avatar({ member }) {
  const [failed, setFailed] = useState(false);
  const base = '-mt-12 h-24 w-24 rounded-full border-4 border-white';

  if (failed) {
    return (
      <div className={`${base} flex items-center justify-center bg-brand-soft text-2xl font-extrabold text-brand`} aria-hidden="true">
        {initials(member.name)}
      </div>
    );
  }
  return (
    <img
      src={member.image}
      alt={member.name}
      width="96"
      height="96"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${base} bg-white object-cover`}
    />
  );
}

export default function Team() {
  const { t } = useLang();

  return (
    <section id="team" className="section border-t border-brand-line">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('team.label')}</p>
          <h2 className="heading">{t('team.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-mute">{t('team.desc')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {TEAM.map((m) => {
            const copy = t(`team.members.${m.key}`);
            return (
              <article key={m.key} className="card flex flex-col overflow-hidden">
                <div className="batik-banner h-24 bg-brand-soft sm:h-28" aria-hidden="true" />
                <div className="flex flex-1 flex-col px-5 pb-6 sm:px-7 sm:pb-7">
                  <Avatar member={m} />
                  <h3 className="mt-3 text-2xl font-bold text-ink">{m.name}</h3>
                  <p className="mt-1 text-sm font-bold text-brand">{copy.role}</p>
                  <p className="mt-3 text-base leading-relaxed text-mute">{copy.desc}</p>
                  <div className={`mt-auto grid gap-3 pt-5 ${m.github ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <a href={m.discord} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                      <FaDiscord size={16} /> Discord
                    </a>
                    {m.github && (
                      <a href={m.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                        <FaGithub size={16} /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
