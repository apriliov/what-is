import { useEffect, useRef, useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the old method
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Email link with a small button that copies the address.
export default function CopyEmail({ email, className = '' }) {
  const { t } = useLang();
  const [state, setState] = useState('idle'); // idle | copied | failed
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(email);
    setState(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <a href={`mailto:${email}`} className="text-sm font-medium text-brand hover:underline">{email}</a>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`${t('common.copy')} ${email}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-line bg-white text-mute transition-colors hover:border-brand hover:text-brand"
      >
        {state === 'copied' ? <FiCheck size={14} className="text-green-600" aria-hidden="true" /> : <FiCopy size={14} aria-hidden="true" />}
      </button>
      <span role="status" aria-live="polite" className={`text-xs font-semibold ${state === 'failed' ? 'text-red-600' : 'text-green-600'}`}>
        {state === 'copied' && t('common.copied')}
        {state === 'failed' && t('common.copyFailed')}
      </span>
    </span>
  );
}
