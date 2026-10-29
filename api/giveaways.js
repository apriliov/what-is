import { randomInt } from 'node:crypto';
import { clip, getSession, guard, newId, send } from './_lib/http.js';
import { cmd, getJson, hasStore, pipeline, setJson } from './_lib/redis.js';

const KEY = 'nd:giveaways';
const MAX_ITEMS = 10;
const entriesKey = (id) => `nd:ga:${id}:entries`;

// Picks `n` distinct items using a cryptographically secure shuffle.
function pick(list, n) {
  const a = [...list];
  const out = [];
  for (let i = 0; i < n && a.length; i += 1) {
    out.push(a.splice(randomInt(a.length), 1)[0]);
  }
  return out;
}

async function list(req, res) {
  const session = getSession(req);
  const isAdmin = Boolean(session?.isAdmin);
  const items = await getJson(KEY, []);
  const cmds = items.flatMap((g) => [
    ['HLEN', entriesKey(g.id)],
    ['HEXISTS', entriesKey(g.id), session?.id || '0'],
  ]);
  const r = cmds.length ? await pipeline(cmds) : [];
  const out = items.map((g, i) => ({
    ...g,
    // Discord IDs of winners are only for admins (so they can DM the winner).
    winners: (g.winners || []).map((w) => (isAdmin ? w : { name: w.name, avatar: w.avatar })),
    entries: r[i * 2],
    joined: Boolean(session) && r[i * 2 + 1] === 1,
  }));
  return send(res, 200, { items: out });
}

export default async function handler(req, res) {
  if (!hasStore()) return send(res, 503, { error: 'not_configured' });
  try {
    if (req.method === 'GET') return await list(req, res);
    if (req.method !== 'POST') return send(res, 405, { error: 'bad_request' });

    const action = req.body?.action;

    if (action === 'join') {
      const s = guard(req, res);
      if (!s) return undefined;
      const items = await getJson(KEY, []);
      const g = items.find((x) => x.id === req.body.id);
      if (!g) return send(res, 404, { error: 'not_found' });
      if (g.status !== 'open') return send(res, 409, { error: 'closed' });
      await cmd('HSETNX', entriesKey(g.id), s.id, JSON.stringify({ name: s.name, avatar: s.avatar }));
      return send(res, 200, { ok: true });
    }

    // Everything below is admin only.
    const s = guard(req, res, { admin: true });
    if (!s) return undefined;

    if (action === 'create') {
      const title = clip(req.body.title, 80);
      const prize = clip(req.body.prize, 120);
      const winnersCount = Math.min(20, Math.max(1, Number.parseInt(req.body.winnersCount, 10) || 1));
      if (!title || !prize) return send(res, 400, { error: 'bad_request' });
      const items = await getJson(KEY, []);
      const g = { id: newId(), title, prize, winnersCount, status: 'open', createdAt: Date.now(), winners: [] };
      const next = [g, ...items];
      // Drop the oldest ones (and their entries) beyond the cap.
      const dropped = next.slice(MAX_ITEMS);
      await setJson(KEY, next.slice(0, MAX_ITEMS));
      if (dropped.length) await pipeline(dropped.map((d) => ['DEL', entriesKey(d.id)]));
      return send(res, 201, { item: g });
    }

    if (action === 'draw') {
      const items = await getJson(KEY, []);
      const g = items.find((x) => x.id === req.body.id);
      if (!g) return send(res, 404, { error: 'not_found' });
      if (g.status !== 'open') return send(res, 409, { error: 'closed' });
      const flat = (await cmd('HGETALL', entriesKey(g.id))) || [];
      const people = [];
      for (let i = 0; i < flat.length; i += 2) {
        try {
          people.push({ id: flat[i], ...JSON.parse(flat[i + 1]) });
        } catch {
          // skip a broken entry
        }
      }
      if (!people.length) return send(res, 400, { error: 'no_entries' });
      g.winners = pick(people, g.winnersCount);
      g.status = 'ended';
      g.endedAt = Date.now();
      await setJson(KEY, items);
      return send(res, 200, { item: g });
    }

    if (action === 'delete') {
      const items = await getJson(KEY, []);
      await setJson(KEY, items.filter((x) => x.id !== req.body.id));
      await cmd('DEL', entriesKey(String(req.body.id)));
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'bad_request' });
  } catch {
    return send(res, 500, { error: 'server_error' });
  }
}
