import { useLang, LANGS } from '../i18n.jsx';

export default function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="inline-flex rounded-lg border border-brand-line p-0.5" role="group" aria-label={t('footer.language')}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`h-9 min-w-[44px] rounded-md px-3 text-sm font-semibold uppercase transition-colors ${
            lang === code ? 'bg-brand text-white' : 'text-mute hover:text-brand'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
