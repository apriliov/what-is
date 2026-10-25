import { useState } from 'react';
import {
  FiTerminal, FiCode, FiPenTool, FiShield, FiCheck, FiMail,
  FiSend, FiEye, FiInbox, FiClock, FiAward,
} from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { useLang } from '../i18n.jsx';
import { ROLES } from '../recruitment';
import CopyEmail from '../components/CopyEmail';
import { RECRUIT_EMAIL, SUPPORT_URL } from '../config';

const ROLE_ICONS = {
  botDev: FiTerminal,
  webDev: FiCode,
  designer: FiPenTool,
  moderator: FiShield,
};

const STEP_ICONS = [FiSend, FiEye, FiInbox, FiClock, FiAward];

// How the selection works: a connected path instead of numbered cards.
function Journey() {
  const { t } = useLang();
  const steps = t('recruit.steps');
  return (
    <div className="mb-20">
      <div className="mb-10 text-center">
        <p className="label mb-2">{t('recruit.stepsLabel')}</p>
        <h2 className="heading">{t('recruit.stepsTitle')}</h2>
      </div>
      <ol className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-5 sm:gap-3">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i] || FiCheck;
          return (
            <li key={step.title} className="relative flex gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-6 left-[1.1rem] top-10 z-0 w-px bg-brand-line sm:bottom-auto sm:left-1/2 sm:top-[1.1rem] sm:h-px sm:w-[calc(100%+0.75rem)]"
                />
              )}
              <span className="relative z-10 flex h-[2.2rem] w-[2.2rem] shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white text-brand">
                <Icon size={15} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mute">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RoleTab({ role, selected, onSelect, onKeyDown }) {
  const { t } = useLang();
  const copy = t(`recruit.roles.${role.key}`);
  const Icon = ROLE_ICONS[role.key] || FiCode;
  return (
    <button
      type="button"
      role="tab"
      id={`role-tab-${role.key}`}
      aria-selected={selected}
      aria-controls="role-panel"
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`flex min-w-[14rem] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors lg:w-full lg:min-w-0 ${
        selected ? 'border-brand bg-brand-soft' : 'border-brand-line bg-white hover:border-brand/50'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          selected ? 'bg-white text-brand' : 'bg-brand-soft text-brand'
        }`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{copy.title}</span>
        <span className="block truncate text-xs text-mute">{copy.team}</span>
      </span>
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${role.open ? 'bg-green-500' : 'bg-slate-300'}`}
        title={role.open ? t('recruit.open') : t('recruit.closed')}
      >
        <span className="sr-only">{role.open ? t('recruit.open') : t('recruit.closed')}</span>
      </span>
    </button>
  );
}

function RolePanel({ role }) {
  const { t } = useLang();
  const copy = t(`recruit.roles.${role.key}`);
  const Icon = ROLE_ICONS[role.key] || FiCode;
  const { open } = role;
  const mailto = `mailto:${RECRUIT_EMAIL}?subject=${encodeURIComponent(`${t('recruit.mailSubject')}: ${copy.title}`)}&body=${encodeURIComponent(t('recruit.mailBody'))}`;

  return (
    <div
      id="role-panel"
      role="tabpanel"
      aria-labelledby={`role-tab-${role.key}`}
      tabIndex={0}
      className={`card panel-in min-w-0 p-6 sm:p-8 ${open ? 'batik-corner' : ''}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon size={26} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-2xl font-extrabold leading-tight text-ink">{copy.title}</h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-mute">{copy.team}</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${open ? 'text-green-700' : 'text-slate-500'}`}>
              <span className={`h-2 w-2 rounded-full ${open ? 'bg-green-500' : 'bg-slate-400'}`} aria-hidden="true" />
              {open ? t('recruit.statusOpen') : t('recruit.statusClosed')}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-5 text-base leading-relaxed text-mute">{copy.desc}</p>

      <div className="mt-7 grid gap-7 sm:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-bold text-ink">{t('recruit.dutiesTitle')}</h4>
          <ul className="flex flex-col gap-2.5">
            {copy.duties.map((d) => (
              <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-mute">
                <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-brand" aria-hidden="true" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-ink">{t('recruit.qualsTitle')}</h4>
          <ul className="flex flex-col gap-2.5">
            {copy.quals.map((q) => (
              <li key={q} className="flex items-start gap-2.5 text-sm leading-relaxed text-mute">
                <FiCheck size={16} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {open ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={mailto} className="btn btn-primary">
            <FiMail size={16} /> {t('recruit.apply')}
          </a>
          <p className="text-sm text-mute">{t('recruit.applyHint')}</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-line bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-mute">{t('recruit.closedPanel')}</p>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            <FaDiscord size={16} /> {t('nav.join')}
          </a>
        </div>
      )}
    </div>
  );
}

export default function Recruitment() {
  const { t } = useLang();
  const firstOpen = ROLES.find((r) => r.open) || ROLES[0];
  const [activeKey, setActiveKey] = useState(firstOpen.key);
  const active = ROLES.find((r) => r.key === activeKey) || firstOpen;
  const anyOpen = ROLES.some((r) => r.open);

  // Arrow keys move between tabs, like a native tab list.
  const onKeyDown = (e, index) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = ROLES[(index + step + ROLES.length) % ROLES.length];
    setActiveKey(next.key);
    requestAnimationFrame(() => {
      const el = document.getElementById(`role-tab-${next.key}`);
      if (el) el.focus();
    });
  };

  return (
    <section id="recruitment" className="section">
      <div className="wrap">
        <Journey />

        <div id="roles" className="mb-10 text-center">
          <p className="label mb-2">{t('recruit.rolesLabel')}</p>
          <h2 className="heading">{t('recruit.rolesTitle')}</h2>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div
            role="tablist"
            aria-label={t('recruit.rolesTitle')}
            aria-orientation="vertical"
            className="-mx-5 flex min-w-0 gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {ROLES.map((role, i) => (
              <RoleTab
                key={role.key}
                role={role}
                selected={role.key === active.key}
                onSelect={() => setActiveKey(role.key)}
                onKeyDown={(e) => onKeyDown(e, i)}
              />
            ))}
          </div>
          <RolePanel key={active.key} role={active} />
        </div>

        {anyOpen && (
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center text-sm text-mute">
            {t('recruit.emailNote')} <CopyEmail email={RECRUIT_EMAIL} />
          </p>
        )}
      </div>
    </section>
  );
}
