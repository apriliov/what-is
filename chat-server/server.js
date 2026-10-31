// Realtime chat server: rooms live only in RAM. No database, no files, no history.
// Each room is named by 1-6 digits and holds at most 2 connections.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8787;
// Comma separated list, e.g. "https://dev.namaiki.xyz,https://namaiki.xyz". Empty = allow any origin.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
// Set TRUST_PROXY=1 when running behind Render/Railway/nginx so the real client IP is read from X-Forwarded-For.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

const MAX_USERS = 2;
const MAX_LEN = 250;
const ROOM_RE = /^\d{1,6}$/;
const MAX_CONN_PER_IP = 20;
const RATE_WINDOW_MS = 5000;
const RATE_MAX_MSGS = 15; // per socket per window
const HEARTBEAT_MS = 25000;

/** @type {Map<string, Set<import('ws').WebSocket>>} */
const rooms = new Map();
/** @type {Map<string, number>} */
const perIp = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

const wss = new WebSocketServer({
  server,
  maxPayload: 4096,
  verifyClient: ({ origin }, done) => {
    if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) return done(false, 403, 'Origin not allowed');
    return done(true);
  },
});

const send = (ws, data) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
};

const clientIp = (req) => {
  if (TRUST_PROXY) {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

function leave(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  const set = rooms.get(room);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    rooms.delete(room); // nothing left in RAM for this room
    return;
  }
  for (const other of set) send(other, { type: 'peer_left', count: set.size });
}

function join(ws, room) {
  if (ws.room) return;
  if (typeof room !== 'string' || !ROOM_RE.test(room)) {
    send(ws, { type: 'error', code: 'bad_room' });
    return;
  }
  let set = rooms.get(room);
  if (!set) {
    set = new Set();
    rooms.set(room, set);
  }
  if (set.size >= MAX_USERS) {
    send(ws, { type: 'full' });
    ws.close(4001, 'room full');
    return;
  }
  set.add(ws);
  ws.room = room;
  send(ws, { type: 'joined', id: ws.id, count: set.size });
  for (const other of set) if (other !== ws) send(other, { type: 'peer_joined', count: set.size });
}

function relay(ws, text) {
  const set = ws.room && rooms.get(ws.room);
  if (!set) return;
  if (set.size < MAX_USERS) {
    send(ws, { type: 'error', code: 'alone' });
    return;
  }
  if (typeof text !== 'string') return;
  const clean = text.trim();
  if (!clean || clean.length > MAX_LEN) {
    send(ws, { type: 'error', code: 'bad_text' });
    return;
  }
  const payload = { type: 'msg', from: ws.id, text: clean, ts: Date.now() };
  for (const member of set) send(member, payload);
}

wss.on('connection', (ws, req) => {
  const ip = clientIp(req);
  const n = (perIp.get(ip) || 0) + 1;
  if (n > MAX_CONN_PER_IP) {
    ws.close(4002, 'too many connections');
    return;
  }
  perIp.set(ip, n);

  ws.id = randomUUID().slice(0, 8);
  ws.room = null;
  ws.alive = true;
  ws.hits = [];

  ws.on('pong', () => { ws.alive = true; });

  ws.on('message', (raw) => {
    const now = Date.now();
    ws.hits = ws.hits.filter((t) => now - t < RATE_WINDOW_MS);
    if (ws.hits.push(now) > RATE_MAX_MSGS) {
      send(ws, { type: 'error', code: 'rate' });
      return;
    }
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'join') join(ws, msg.room);
    else if (msg.type === 'msg') relay(ws, msg.text);
  });

  ws.on('close', () => {
    leave(ws);
    const left = (perIp.get(ip) || 1) - 1;
    if (left <= 0) perIp.delete(ip);
    else perIp.set(ip, left);
  });
  ws.on('error', () => {}); // 'close' follows and cleans up
});

// Drop connections that vanished without a close frame (phone lost signal, laptop slept).
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    ws.ping();
  }
}, HEARTBEAT_MS);
wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`chat server listening on :${PORT}`);
  if (!ALLOWED_ORIGINS.length) console.log('warning: ALLOWED_ORIGINS is empty, any website can connect');
});

const shutdown = () => {
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
