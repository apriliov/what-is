import { useState } from 'react';
import { FiEdit2, FiSend } from 'react-icons/fi';
import { useLang } from '../i18n.jsx';
import { NOTES_ENDPOINT, NOTES_ACCESS_KEY, NOTES_MAX_LENGTH, SUPPORT_EMAIL } from '../config';

export default function NoteForm() {
  const { t } = useLang();
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [trap, setTrap] = useState(''); // honeypot, real visitors never fill this
  const [status, setStatus] = useState('idle'); // idle | sending | sent | mail | error | short

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 3) {
      setStatus('short');
      return;
    }
    if (trap) {
      setStatus('sent');
      return;
    }
    const from = name.trim();

    if (!NOTES_ENDPOINT) {
      const subject = encodeURIComponent('Catatan untuk dinding Namaiki Development');
      const body = encodeURIComponent(`${text}\n\n- ${from || t('notes.anon')}`);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus('mail');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(NOTES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(NOTES_ACCESS_KEY ? { access_key: NOTES_ACCESS_KEY, subject: 'Catatan baru untuk dinding' } : {}),
          message: text,
          name: from || t('notes.anon'),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setMessage('');
      setName('');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  const feedback = { sent: t('notes.sent'), mail: t('notes.mail'), error: t('notes.error'), short: t('notes.tooShort') }[status];
  const bad = status === 'error' || status === 'short';

  return (
    <form onSubmit={onSubmit} className="card mx-auto mt-8 max-w-xl p-6 sm:p-7" noValidate>
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand">
        <FiEdit2 size={18} /> {t('notes.formTitle')}
      </h3>

      <label htmlFor="note-message" className="mb-2 block text-sm font-semibold text-ink">{t('notes.msgLabel')}</label>
      <textarea
        id="note-message"
        rows={4}
        maxLength={NOTES_MAX_LENGTH}
        value={message}
        onChange={(e) => { setMessage(e.target.value); if (status !== 'idle') setStatus('idle'); }}
        placeholder={t('notes.msgPlaceholder')}
        className="w-full resize-y rounded-xl border border-brand-line bg-brand-soft/60 px-4 py-3 text-base text-ink placeholder:text-mute/70 focus:border-brand focus:outline-none"
      />
      <p className="mt-1.5 text-right text-sm text-mute">{NOTES_MAX_LENGTH - message.length} {t('notes.left')}</p>

      <label htmlFor="note-name" className="mb-2 mt-3 block text-sm font-semibold text-ink">{t('notes.nameLabel')}</label>
      <input
        id="note-name"
        type="text"
        maxLength={24}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('notes.namePlaceholder')}
        className="h-12 w-full rounded-xl border border-brand-line bg-brand-soft/60 px-4 text-base text-ink placeholder:text-mute/70 focus:border-brand focus:outline-none"
      />

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <button type="submit" disabled={status === 'sending'} className="btn btn-primary mt-5 disabled:opacity-60">
        <FiSend size={16} /> {status === 'sending' ? t('notes.sending') : t('notes.send')}
      </button>

      <p className={`mt-4 text-sm ${bad ? 'text-red-600' : 'text-mute'}`} role="status">
        {feedback || t('notes.hint')}
      </p>
    </form>
  );
}
