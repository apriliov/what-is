import { useEffect, useState } from 'react';

// Tiny client-side router (no extra dependency). Pages: "/" and "/recruitment".
const EVENT = 'nd-navigate';

const clean = (p) => p.replace(/\/+$/, '') || '/';
// Some hosts serve the app at /index.html, treat that as the home page.
const currentPath = () => {
  const p = clean(window.location.pathname);
  return p === '/index.html' ? '/' : p;
};

export const KNOWN_PATHS = ['/', '/recruitment'];
export const isKnownPath = (p) => KNOWN_PATHS.includes(p);

export function navigate(to) {
  const url = new URL(to, window.location.origin);
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(EVENT));
}

export function usePath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const sync = () => setPath(currentPath());
    window.addEventListener('popstate', sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);
  return path;
}

// Scroll without the page-wide smooth animation (used after changing page).
export function jumpTo(el) {
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';
  if (el) el.scrollIntoView();
  else window.scrollTo(0, 0);
  root.style.scrollBehavior = '';
}

// Internal link: changes page without a full reload.
export function Link({ to, onClick, ...props }) {
  const handle = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...props} />;
}

// Link to a section of the home page. Works from any page.
export function HomeLink({ hash, onClick, ...props }) {
  const path = usePath();
  if (path === '/') return <a href={`#${hash}`} onClick={onClick} {...props} />;
  return <Link to={`/#${hash}`} onClick={onClick} {...props} />;
}
