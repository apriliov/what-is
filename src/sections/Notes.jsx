import { useLang } from '../i18n.jsx';
import { NOTES } from '../notes';
import NoteForm from '../components/NoteForm';

const COLORS = ['bg-blue-100', 'bg-white', 'bg-sky-100', 'bg-indigo-100', 'bg-cyan-100', 'bg-blue-50'];
const MIN_SLOTS = 6;

export default function Notes() {
  const { t } = useLang();
  const empty = Math.max(0, MIN_SLOTS - NOTES.length);

  return (
    <section id="notes" className="section border-t border-brand-line bg-brand-soft">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('notes.label')}</p>
          <h2 className="heading">{t('notes.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-mute">{t('notes.desc')}</p>
        </div>

        <div className="rounded-3xl border border-brand-line bg-white p-4 sm:p-6">
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {NOTES.map((note, i) => (
              <li
                key={`${i}-${note.text.slice(0, 12)}`}
                className={`relative flex min-h-[9.5rem] flex-col rounded-lg border border-brand-line px-4 pb-3 pt-6 ${COLORS[i % COLORS.length]}`}
              >
                <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rounded-sm bg-brand/15" aria-hidden="true" />
                <p className="break-words text-base leading-snug text-ink">{note.text}</p>
                <p className="mt-auto pt-3 text-sm font-medium text-mute">&mdash; {note.name || t('notes.anon')}</p>
              </li>
            ))}
            {Array.from({ length: empty }, (_, i) => (
              <li
                key={`empty-${i}`}
                className="flex min-h-[9.5rem] items-center justify-center rounded-lg border border-dashed border-brand-line bg-brand-soft/50 text-sm text-mute/70"
                aria-hidden="true"
              >
                {t('notes.empty')}
              </li>
            ))}
          </ul>
        </div>

        <NoteForm />
      </div>
    </section>
  );
}
