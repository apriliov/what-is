import { useEffect, useLayoutEffect, useState } from 'react';
import { LOCATION_LAT, LOCATION_LON, LOCATION_IANA_TZ } from './config';

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

// Live weather for Majalengka from Open-Meteo (free, no API key). Cached for 15 minutes.
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${LOCATION_LAT}&longitude=${LOCATION_LON}` +
  '&current=temperature_2m,weather_code,is_day' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  `&timezone=${encodeURIComponent(LOCATION_IANA_TZ)}&forecast_days=4`;
const WEATHER_TTL = 15 * 60 * 1000;
let weatherCache = { at: 0, data: null };

function parseWeather(json) {
  const cur = json.current;
  const d = json.daily;
  if (!cur || !d || !Array.isArray(d.time)) throw new Error('bad weather response');
  return {
    temp: cur.temperature_2m,
    code: cur.weather_code,
    isDay: cur.is_day === 1,
    days: d.time.map((date, i) => ({
      date,
      code: d.weather_code[i],
      hi: d.temperature_2m_max[i],
      lo: d.temperature_2m_min[i],
      rain: d.precipitation_probability_max[i],
    })),
  };
}

export function useWeather() {
  const [state, setState] = useState(() =>
    weatherCache.data && Date.now() - weatherCache.at < WEATHER_TTL
      ? { status: 'ok', data: weatherCache.data }
      : { status: 'loading', data: null }
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(WEATHER_URL, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const data = parseWeather(await res.json());
        weatherCache = { at: Date.now(), data };
        if (alive) setState({ status: 'ok', data });
      } catch (err) {
        if (!alive || err.name === 'AbortError') return;
        // Keep showing older data if we have it, otherwise show the error state.
        setState((s) => (s.data ? s : { status: 'error', data: null }));
      }
    };

    if (!(weatherCache.data && Date.now() - weatherCache.at < WEATHER_TTL)) load();
    const timer = setInterval(load, WEATHER_TTL);
    return () => {
      alive = false;
      ctrl.abort();
      clearInterval(timer);
    };
  }, []);

  return state;
}
