import { randomBytes } from 'node:crypto';
import { baseUrl, loginReady, setCookie } from '../_lib/http.js';

export default function handler(req, res) {
  if (!loginReady()) {
    res.status(503).send('Discord login is not configured.');
    return;
  }
  const state = randomBytes(16).toString('hex');
  setCookie(res, 'nd_state', state, { maxAge: 600 });
  const redirect = process.env.DISCORD_REDIRECT_URI || `${baseUrl(req)}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    scope: 'identify',
    redirect_uri: redirect,
    state,
    prompt: 'none', // skip the consent screen when the user already approved once
  });
  res.redirect(302, `https://discord.com/oauth2/authorize?${params}`);
}
