import { FaDiscord } from 'react-icons/fa';
import { FiMonitor, FiMessageCircle } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';

const ICONS = [FaDiscord, FiMonitor, FiMessageCircle];

export default function About() {
  const { t } = useLang();
  const items = t('about.items');
  return (
    <section id="about" className="section">
      <div className="wrap">
        <div className="mb-10 text-center">
          <p className="label mb-2">{t('about.label')}</p>
          <h2 className="heading">{t('about.title')}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item.title} className="card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon size={20} />
                </span>
                <h3 className="mb-2 text-lg font-bold text-ink">{item.title}</h3>
                <p className="text-base leading-relaxed text-mute">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
