import { clip, guard, newId, send } from './_lib/http.js';
import { getJson, hasStore, setJson } from './_lib/redis.js';

const KEY = 'nd:announcements';
const MAX_ITEMS = 20;
const MAX_TEXT = 600;

export default async function handler(req, res) {
  if (!hasStore()) return send(res, 503, { error: 'not_configured' });
  try {
    if (req.method === 'GET') {
      const items = await getJson(KEY, []);
      // Same for every visitor, so the CDN may cache it briefly.
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ items });
    }

    if (req.method === 'POST') {
      const s = guard(req, res, { admin: true });
      if (!s) return undefined;
      const text = clip(req.body?.text, MAX_TEXT);
      if (text.length < 1) return send(res, 400, { error: 'bad_request' });
      const items = await getJson(KEY, []);
      const item = { id: newId(), text, createdAt: Date.now(), author: s.name };
      await setJson(KEY, [item, ...items].slice(0, MAX_ITEMS));
      return send(res, 201, { item });
    }

    if (req.method === 'DELETE') {
      const s = guard(req, res, { admin: true });
      if (!s) return undefined;
      const id = clip(req.query.id, 40);
      const items = await getJson(KEY, []);
      await setJson(KEY, items.filter((i) => i.id !== id));
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'bad_request' });
  } catch {
    return send(res, 500, { error: 'server_error' });
  }
}
