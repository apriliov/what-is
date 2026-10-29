import { baseUrl, createSession, loginReady, parseCookies, setCookie } from '../_lib/http.js';

const fail = (res, why) => res.redirect(302, `/?login=${why}`);

function avatarUrl(u) {
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`;
  const idx = Number((BigInt(u.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export default async function handler(req, res) {
  if (!loginReady()) return fail(res, 'failed');
  const { code, state, error } = req.query;
  const saved = parseCookies(req).nd_state;
  setCookie(res, 'nd_state', '', { clear: true });

  if (error) return fail(res, 'cancelled');
  if (!code || !state || !saved || state !== saved) return fail(res, 'failed');

  try {
    const redirect = process.env.DISCORD_REDIRECT_URI || `${baseUrl(req)}/api/auth/callback`;
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirect,
      }),
    });
    if (!tokenRes.ok) return fail(res, 'failed');
    const { access_token: token } = await tokenRes.json();

    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return fail(res, 'failed');
    const me = await meRes.json();

    createSession(res, { id: me.id, name: me.global_name || me.username, avatar: avatarUrl(me) });
    res.redirect(302, '/');
  } catch {
    fail(res, 'failed');
  }
}
