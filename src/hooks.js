import { useEffect, useLayoutEffect, useState } from 'react';
import { LOCATION_IANA_TZ } from './config';

// Re-renders every `intervalMs` with the current Date (live clocks).
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Returns the id of the section currently in the middle of the viewport.
export function useScrollSpy(ids, dep) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids, dep]);
  return active;
}

// Formats a Date in Majalengka time (WIB).
export function formatWib(date, { seconds = false } = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LOCATION_IANA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  }).format(date);
}

export function formatWibDate(date, lang, { year = false } = {}) {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
    timeZone: LOCATION_IANA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(year ? { year: 'numeric' } : {}),
  }).format(date);
}

// Fade/slide-in on scroll for cards and section headings. Elements are tagged here
// (before paint) so no markup has to change. Skipped for reduced motion.
export function useReveal(dep) {
  useLayoutEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const els = Array.from(document.querySelectorAll('main .card, main .mb-10.text-center, main .note-tray'));
    document.documentElement.classList.add('reveal-ready');
    els.forEach((el) => {
      el.classList.add('reveal');
      const i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--reveal-delay', `${Math.min(i, 4) * 70}ms`);
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [dep]);
}
