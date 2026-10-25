import { useLang } from '../i18n.jsx';
import { NOTES } from '../notes';
import NoteForm from '../components/NoteForm';

const TONES = ['sky', 'lilac', 'mint', 'white', 'blue'];
const MAX_NOTES = 6;

export default function Notes() {
  const { t } = useLang();
  const shown = NOTES.slice(0, MAX_NOTES);
  const empty = MAX_NOTES - shown.length;

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
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3">
              {shown.map((note, i) => (
                <li key={`${i}-${note.text.slice(0, 12)}`} className={`note note-${TONES[i % TONES.length]}`}>
                  <span className="note-tape" aria-hidden="true" />
                  <p className="note-text">{note.text}</p>
                  <p className="note-name">&mdash; {note.name || t('notes.anon')}</p>
                </li>
              ))}
              {Array.from({ length: empty }, (_, i) => (
                <li key={`empty-${i}`} className="note-empty" aria-hidden="true">-</li>
              ))}
            </ul>
          </div>
        </div>

        <NoteForm />
      </div>
    </section>
  );
}
