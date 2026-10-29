import { randomInt } from 'node:crypto';
import { clip, getSession, guard, newId, send } from './_lib/http.js';
import { cmd, getJson, hasStore, pipeline, setJson } from './_lib/redis.js';

const KEY = 'nd:giveaways';
const MAX_ITEMS = 10;
const MAX_DAYS = 60;
const entriesKey = (id) => `nd:ga:${id}:entries`; // hash: discordId -> {name, avatar}
const recentKey = (id) => `nd:ga:${id}:recent`; // list: the 3 newest entrants
const lockKey = (id) => `nd:ga:${id}:lock`;

// Picks `n` distinct items using a cryptographically secure shuffle.
function pick(list, n) {
  const a = [...list];
  const out = [];
  for (let i = 0; i < n && a.length; i += 1) {
    out.push(a.splice(randomInt(a.length), 1)[0]);
  }
  return out;
}

const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Draws the winners of one giveaway. A short lock stops two requests from drawing at the same time.
async function drawOne(id, { allowEmpty = false } = {}) {
  const got = await cmd('SET', lockKey(id), '1', 'NX', 'EX', '30');
  if (got !== 'OK') return { error: 'closed' };
  try {
    const items = await getJson(KEY, []);
    const g = items.find((x) => x.id === id);
    if (!g) return { error: 'not_found' };
    if (g.status !== 'open') return { error: 'closed' };

    const flat = (await cmd('HGETALL', entriesKey(id))) || [];
    const people = [];
    for (let i = 0; i < flat.length; i += 2) {
      const data = parse(flat[i + 1]);
      if (data) people.push({ id: flat[i], ...data });
    }
    if (!people.length && !allowEmpty) return { error: 'no_entries' };

    g.winners = pick(people, g.winnersCount);
    g.status = 'ended';
    g.endedAt = Date.now();
    await setJson(KEY, items);
    return { item: g };
  } finally {
    await cmd('DEL', lockKey(id));
  }
}

// Giveaways whose end time has passed are drawn automatically the first time anyone loads the list.
async function settleExpired() {
  const items = await getJson(KEY, []);
  const now = Date.now();
  const due = items.filter((g) => g.status === 'open' && g.endsAt && g.endsAt <= now);
  if (!due.length) return items;
  for (const g of due) await drawOne(g.id, { allowEmpty: true });
  return getJson(KEY, []);
}

async function list(req, res) {
  const session = getSession(req);
  const isAdmin = Boolean(session?.isAdmin);
  const items = await settleExpired();
  const cmds = items.flatMap((g) => [
    ['HLEN', entriesKey(g.id)],
    ['HEXISTS', entriesKey(g.id), session?.id || '0'],
    ['LRANGE', recentKey(g.id), 0, 2],
  ]);
  const r = cmds.length ? await pipeline(cmds) : [];
  const out = items.map((g, i) => ({
    ...g,
    // Discord IDs of winners are only for admins (used for the DM link).
    winners: (g.winners || []).map((w) => (isAdmin ? w : { name: w.name, avatar: w.avatar })),
    entries: r[i * 3],
    joined: Boolean(session) && r[i * 3 + 1] === 1,
    recent: (r[i * 3 + 2] || []).map(parse).filter(Boolean),
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
      if (g.status !== 'open' || (g.endsAt && g.endsAt <= Date.now())) return send(res, 409, { error: 'closed' });
      const who = JSON.stringify({ name: s.name, avatar: s.avatar });
      const added = await cmd('HSETNX', entriesKey(g.id), s.id, who);
      if (added === 1) {
        await pipeline([['LPUSH', recentKey(g.id), who], ['LTRIM', recentKey(g.id), 0, 2]]);
      }
      return send(res, 200, { ok: true });
    }

    // Everything below is admin only.
    const s = guard(req, res, { admin: true });
    if (!s) return undefined;

    if (action === 'create') {
      const title = clip(req.body.title, 80);
      const prize = clip(req.body.prize, 120);
      const winnersCount = Math.min(20, Math.max(1, Number.parseInt(req.body.winnersCount, 10) || 1));
      const endsAt = Number(req.body.endsAt);
      const now = Date.now();
      if (!title || !prize) return send(res, 400, { error: 'bad_request' });
      if (!Number.isFinite(endsAt) || endsAt <= now + 30000 || endsAt > now + MAX_DAYS * 86400000) {
        return send(res, 400, { error: 'bad_end_time' });
      }
      const items = await getJson(KEY, []);
      const g = { id: newId(), title, prize, winnersCount, status: 'open', createdAt: now, endsAt, winners: [] };
      const next = [g, ...items];
      // Drop the oldest ones (and their entries) beyond the cap.
      const dropped = next.slice(MAX_ITEMS);
      await setJson(KEY, next.slice(0, MAX_ITEMS));
      if (dropped.length) await pipeline(dropped.flatMap((d) => [['DEL', entriesKey(d.id)], ['DEL', recentKey(d.id)]]));
      return send(res, 201, { item: g });
    }

    if (action === 'draw') {
      const r = await drawOne(String(req.body.id));
      if (r.error) return send(res, r.error === 'not_found' ? 404 : r.error === 'no_entries' ? 400 : 409, { error: r.error });
      return send(res, 200, { item: r.item });
    }

    if (action === 'delete') {
      const id = String(req.body.id);
      const items = await getJson(KEY, []);
      await setJson(KEY, items.filter((x) => x.id !== id));
      await pipeline([['DEL', entriesKey(id)], ['DEL', recentKey(id)]]);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'bad_request' });
  } catch {
    return send(res, 500, { error: 'server_error' });
  }
}
