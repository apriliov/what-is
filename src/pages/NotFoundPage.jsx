import { useLang } from '../i18n.jsx';
import { Link } from '../router.jsx';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <section id="top" className="relative flex min-h-[60vh] items-center overflow-hidden bg-brand py-20 text-center text-white">
      <span className="batik-hero batik-hero-tr" aria-hidden="true" />
      <span className="batik-hero batik-hero-bl" aria-hidden="true" />
      <div className="wrap relative">
        <p className="text-7xl font-extrabold tracking-tight text-white/90 sm:text-8xl">404</p>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{t('notFound.title')}</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">{t('notFound.desc')}</p>
        <Link to="/" className="btn mt-8 bg-white text-brand hover:bg-brand-soft">{t('notFound.home')}</Link>
      </div>
    </section>
  );
}
