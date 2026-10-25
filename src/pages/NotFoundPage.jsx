import { useLang } from '../i18n.jsx';
import { Link, HomeLink } from '../router.jsx';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <section id="top" className="section flex min-h-[60vh] items-center">
      <div className="wrap">
        <div className="card batik-corner mx-auto max-w-xl px-6 py-12 text-center sm:px-10 sm:py-16">
          <p className="text-7xl font-extrabold leading-none tracking-tight text-brand sm:text-8xl">404</p>
          <h1 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">{t('notFound.title')}</h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-mute">{t('notFound.desc')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn btn-primary w-full sm:w-auto">{t('notFound.home')}</Link>
            <HomeLink hash="projects" className="btn btn-outline w-full sm:w-auto">{t('nav.projects')}</HomeLink>
            <Link to="/recruitment" className="btn btn-outline w-full sm:w-auto">{t('nav.recruitment')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
