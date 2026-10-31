import { FiCalendar, FiClock } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { useNow, formatWib, formatWibDate } from '../hooks';
import { TEAM } from '../team';
import { ROLES } from '../recruitment';

// Own component so only the date and clock re-render every tick.
function DateTime() {
  const { lang } = useLang();
  const now = useNow(15000);
  return (
    <div className="col-span-2 flex flex-col gap-3 rounded-3xl border border-brand-line bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7">
      <p className="flex min-w-0 items-center gap-3 text-sm font-semibold text-ink sm:text-base">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand">
          <FiCalendar size={16} aria-hidden="true" />
        </span>
        <span className="min-w-0 leading-snug">{formatWibDate(now, lang, { year: true })}</span>
      </p>
      <p className="flex shrink-0 items-baseline gap-2 text-4xl font-extrabold text-brand sm:items-center">
        <FiClock size={20} className="hidden text-mute sm:block" aria-hidden="true" />
        <span className="tabular-nums">{formatWib(now)}</span>
        <span className="text-xs font-bold text-mute sm:text-sm">{lang === 'id' ? 'WIB' : 'UTC+7'}</span>
      </p>
    </div>
  );
}

const lift = 'transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(15,26,48,0.5)] motion-reduce:transition-none motion-reduce:hover:transform-none';

// Overlaps the blue hero band, same idea as the tiles on the home page.
export default function RecruitStats() {
  const { t } = useLang();
  const openRoles = ROLES.filter((r) => r.open).length;
  return (
    <div className="wrap">
      <div className="relative mx-auto -mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:-mt-20 sm:gap-4">
        <div className={`flex flex-col items-center justify-center rounded-[2.5rem] border border-brand-line bg-white px-4 py-7 text-center shadow-lg shadow-ink/10 sm:py-9 ${lift}`}>
          <p className="text-5xl font-extrabold leading-none text-brand sm:text-6xl">{TEAM.length}</p>
          <p className="mt-2 text-xs font-bold uppercase leading-tight tracking-wider text-mute">{t('recruit.statsTeam')}</p>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-brand-line bg-white px-4 py-7 text-center shadow-lg shadow-ink/10 sm:py-9 ${lift}`}>
          <p className="text-5xl font-extrabold leading-none text-brand sm:text-6xl">{openRoles}</p>
          <p className="mt-2 text-xs font-bold uppercase leading-tight tracking-wider text-mute">{t('recruit.statsOpen')}</p>
        </div>
        <DateTime />
      </div>
    </div>
  );
}
