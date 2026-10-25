import { useLang } from '../i18n.jsx';
import { NOTES } from '../notes';
import NoteForm from '../components/NoteForm';

// Tone for each note. "white" has no tape, like a plain sheet.
const TONES = ['sky', 'lilac', 'mint', 'white', 'blue'];
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

        <div className="note-tray">
          <div className="note-tray-inner">
            <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {NOTES.map((note, i) => {
                const tone = TONES[i % TONES.length];
                return (
                  <li key={`${i}-${note.text.slice(0, 12)}`} className={`note note-${tone}`}>
                    {tone !== 'white' && <span className="note-tape" aria-hidden="true" />}
                    <p className="note-text">{note.text}</p>
                    <p className="note-name">&mdash; {note.name || t('notes.anon')}</p>
                  </li>
                );
              })}
              {Array.from({ length: empty }, (_, i) => (
                <li key={`empty-${i}`} className="note-empty" aria-hidden="true" />
              ))}
            </ul>
          </div>
        </div>

        <NoteForm />
      </div>
    </section>
  );
}
