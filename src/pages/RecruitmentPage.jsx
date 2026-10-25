import { useLang } from '../i18n.jsx';
import Recruitment from '../sections/Recruitment';

export default function RecruitmentPage() {
  const { t } = useLang();
  return (
    <>
      <section id="top" className="bg-brand pb-16 pt-14 text-center text-white sm:pb-20 sm:pt-20">
        <div className="wrap">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white/75">{t('recruit.title')}</p>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">{t('recruit.label')}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{t('recruit.desc')}</p>
          <a href="#roles" className="btn mt-7 bg-white text-brand hover:bg-brand-soft">{t('recruit.rolesTitle')}</a>
        </div>
      </section>
      <Recruitment />
    </>
  );
}
