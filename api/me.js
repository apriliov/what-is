import { getSession, loginReady, send } from './_lib/http.js';
import { hasStore } from './_lib/redis.js';

export default function handler(req, res) {
  const s = getSession(req);
  send(res, 200, {
    loginReady: loginReady(),
    storeReady: hasStore(),
    user: s ? { id: s.id, name: s.name, avatar: s.avatar } : null,
    isAdmin: Boolean(s && s.isAdmin),
  });
}
