import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'nd_session';
const SESSION_DAYS = 14;

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => createHmac('sha256', process.env.SESSION_SECRET || '').update(data).digest('base64url');

export const loginReady = () =>
  Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.SESSION_SECRET);

export const adminIds = () =>
  new Set((process.env.ADMIN_DISCORD_IDS || '').split(/[\s,]+/).filter(Boolean));

export function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function setCookie(res, name, value, { maxAge, clear = false } = {}) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  const age = clear ? 0 : maxAge;
  const header = `${name}=${clear ? '' : encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, header) : header);
}

export function createSession(res, user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const payload = b64(JSON.stringify({ id: user.id, name: user.name, avatar: user.avatar, exp }));
  setCookie(res, COOKIE, `${payload}.${sign(payload)}`, { maxAge: SESSION_DAYS * 86400 });
}

export function clearSession(res) {
  setCookie(res, COOKIE, '', { clear: true });
}

// Returns { id, name, avatar, isAdmin } or null.
export function getSession(req) {
  if (!process.env.SESSION_SECRET) return null;
  const raw = parseCookies(req)[COOKIE];
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.id || data.exp < Date.now() / 1000) return null;
    // Admin status is checked against the env list on every request, so removing an ID takes effect at once.
    return { id: data.id, name: data.name, avatar: data.avatar, isAdmin: adminIds().has(data.id) };
  } catch {
    return null;
  }
}

export const send = (res, status, body) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
};

// Blocks cross-site POST/DELETE even if a browser ignores SameSite.
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function baseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return `${proto}://${req.headers.host}`;
}

// Standard guard for write endpoints. Returns the session, or null after sending an error.
export function guard(req, res, { admin = false } = {}) {
  if (!sameOrigin(req)) {
    send(res, 403, { error: 'forbidden' });
    return null;
  }
  const session = getSession(req);
  if (!session) {
    send(res, 401, { error: 'unauthorized' });
    return null;
  }
  if (admin && !session.isAdmin) {
    send(res, 403, { error: 'forbidden' });
    return null;
  }
  return session;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const clip = (v, max) => String(v ?? '').trim().slice(0, max);
