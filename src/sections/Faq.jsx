import { FiChevronDown } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';

export default function Faq() {
  const { t } = useLang();
  const items = t('faq.items');

  return (
    <section id="faq" className="section border-t border-brand-line bg-brand-soft">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('faq.label')}</p>
          <h2 className="heading">{t('faq.title')}</h2>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {items.map((item, i) => (
            <details key={item.q} open={i === 0} className="card group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <FiChevronDown size={20} className="shrink-0 text-brand transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-base leading-relaxed text-mute">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
