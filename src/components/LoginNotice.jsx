import { useEffect } from 'react';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';

// Small message after a failed or cancelled Discord login. Hides itself after a few seconds.
export default function LoginNotice() {
  const { t } = useLang();
  const { loginNotice, clearNotice } = useAuth();

  useEffect(() => {
    if (!loginNotice) return undefined;
    const id = setTimeout(clearNotice, 6000);
    return () => clearTimeout(id);
  }, [loginNotice, clearNotice]);

  if (!loginNotice) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-sm rounded-xl border border-brand-line bg-white px-4 py-3 text-center text-sm text-ink shadow-lg">
      {loginNotice === 'cancelled' ? t('auth.cancelled') : t('auth.failed')}
    </div>
  );
}
