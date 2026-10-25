import { FiTerminal, FiCode, FiPenTool, FiShield, FiChevronRight, FiCheck, FiMail } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { ROLES } from '../recruitment';
import { RECRUIT_EMAIL } from '../config';

const ICONS = {
  botDev: FiTerminal,
  webDev: FiCode,
  designer: FiPenTool,
  moderator: FiShield,
};

function RoleCard({ role }) {
  const { t } = useLang();
  const copy = t(`recruit.roles.${role.key}`);
  const Icon = ICONS[role.key] || FiCode;
  const { open } = role;

  const mailto = `mailto:${RECRUIT_EMAIL}?subject=${encodeURIComponent(`${t('recruit.mailSubject')}: ${copy.title}`)}&body=${encodeURIComponent(t('recruit.mailBody'))}`;

  return (
    <article className={`card flex flex-col p-6 sm:p-7 ${open ? '' : 'bg-slate-50'}`}>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
            open ? 'border-brand-line bg-brand-soft text-brand' : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider ${
            open ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {open ? t('recruit.open') : t('recruit.closed')}
        </span>
        <span className="rounded-full border border-brand-line bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
          {copy.team}
        </span>
      </div>

      <h3 className={`text-xl font-bold ${open ? 'text-ink' : 'text-slate-600'}`}>{copy.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-mute">{copy.desc}</p>

      <h4 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-slate-600">{t('recruit.dutiesTitle')}</h4>
      <ul className="flex flex-col gap-2.5">
        {copy.duties.map((d) => (
          <li key={d} className="flex items-start gap-2.5 text-sm leading-relaxed text-mute">
            <FiChevronRight size={16} className={`mt-0.5 shrink-0 ${open ? 'text-brand' : 'text-slate-400'}`} aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>

      <h4 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-slate-600">{t('recruit.qualsTitle')}</h4>
      <ul className="mb-7 flex flex-col gap-2.5">
        {copy.quals.map((q) => (
          <li key={q} className="flex items-start gap-2.5 text-sm leading-relaxed text-mute">
            <FiCheck size={16} className={`mt-0.5 shrink-0 ${open ? 'text-green-600' : 'text-slate-400'}`} aria-hidden="true" />
            {q}
          </li>
        ))}
      </ul>

      {open ? (
        <a href={mailto} className="btn btn-primary mt-auto w-full">
          <FiMail size={16} /> {t('recruit.apply')}
        </a>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="btn mt-auto w-full cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-500"
        >
          {t('recruit.closedBtn')}
        </button>
      )}
    </article>
  );
}

export default function Recruitment() {
  const { t } = useLang();
  const steps = t('recruit.steps');
  const allClosed = ROLES.every((r) => !r.open);

  return (
    <section id="recruitment" className="section">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('recruit.label')}</p>
          <h2 className="heading">{t('recruit.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-mute">{t('recruit.desc')}</p>
        </div>

        <h3 className="mb-5 text-center text-lg font-bold text-ink">{t('recruit.stepsTitle')}</h3>
        <ol className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <li key={step.title} className="card bg-brand-soft/60 p-5">
              <p className="text-2xl font-extrabold text-brand">{String(i + 1).padStart(2, '0')}</p>
              <h4 className="mt-2 text-base font-bold text-ink">{step.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{step.desc}</p>
            </li>
          ))}
        </ol>

        <h3 className="mb-5 text-center text-lg font-bold text-ink">{t('recruit.rolesTitle')}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {ROLES.map((role) => (
            <RoleCard key={role.key} role={role} />
          ))}
        </div>

        {allClosed && <p className="mt-6 text-center text-sm text-mute">{t('recruit.closedNote')}</p>}
      </div>
    </section>
  );
}
