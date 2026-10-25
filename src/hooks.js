import { useEffect, useState } from 'react';
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
export function useScrollSpy(ids) {
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
  }, [ids]);
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

export function formatWibDate(date, lang) {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
    timeZone: LOCATION_IANA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
