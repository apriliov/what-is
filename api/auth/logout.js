import { clearSession, send, sameOrigin } from '../_lib/http.js';

export default function handler(req, res) {
  if (req.method !== 'POST' || !sameOrigin(req)) return send(res, 405, { error: 'bad_request' });
  clearSession(res);
  send(res, 200, { ok: true });
}
