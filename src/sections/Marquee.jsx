import { useLang } from '../i18n.jsx';

function Row({ items, className, textClass }) {
  // Two identical halves so the loop (translateX -50%) has no gap.
  const half = [...items, ...items];
  return (
    <div className="overflow-hidden py-3">
      <div className={`flex w-max items-center ${className}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {half.map((text, i) => (
              <span key={`${copy}-${i}`} className={`flex items-center whitespace-nowrap text-lg font-semibold ${textClass}`}>
                {text}
                <span className="mx-6 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  const { t } = useLang();
  return (
    <div className="marquee mt-16 border-y border-brand-line bg-white" aria-label={t('marquee.row1').join(', ')}>
      <Row items={t('marquee.row1')} className="marquee-left" textClass="text-ink" />
      <div className="border-t border-brand-line" />
      <Row items={t('marquee.row2')} className="marquee-right" textClass="text-brand" />
    </div>
  );
}
