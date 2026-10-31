// Starts the server on a random port and checks the room rules. Run: npm test
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import WebSocket from 'ws';

const PORT = 18000 + Math.floor(Math.random() * 1000);
const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(500);

function client() {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const inbox = [];
  ws.on('message', (d) => inbox.push(JSON.parse(d.toString())));
  ws.opened = new Promise((r) => ws.on('open', r));
  ws.inbox = inbox;
  ws.say = (o) => ws.send(JSON.stringify(o));
  return ws;
}
const types = (c) => c.inbox.map((m) => m.type);

try {
  const a = client(); const b = client(); const c = client();
  await Promise.all([a.opened, b.opened, c.opened]);

  a.say({ type: 'join', room: '123456' });
  await wait(100);
  assert.deepEqual(types(a), ['joined']);
  assert.equal(a.inbox[0].count, 1);

  a.say({ type: 'msg', text: 'alone' });
  await wait(100);
  assert.equal(a.inbox.at(-1).code, 'alone', 'cannot send while alone');

  b.say({ type: 'join', room: '123456' });
  await wait(100);
  assert.equal(b.inbox[0].count, 2);
  assert.equal(a.inbox.at(-1).type, 'peer_joined');

  c.say({ type: 'join', room: '123456' });
  await wait(100);
  assert.deepEqual(types(c), ['full'], 'third user is rejected');

  a.say({ type: 'msg', text: 'hello' });
  await wait(100);
  assert.equal(a.inbox.at(-1).text, 'hello');
  assert.equal(b.inbox.at(-1).text, 'hello');
  assert.equal(b.inbox.at(-1).from, a.inbox[0].id);

  a.say({ type: 'msg', text: 'x'.repeat(251) });
  await wait(100);
  assert.equal(a.inbox.at(-1).code, 'bad_text', '251 chars rejected');
  a.say({ type: 'msg', text: 'x'.repeat(250) });
  await wait(100);
  assert.equal(b.inbox.at(-1).text.length, 250, '250 chars accepted');

  const d = client(); await d.opened;
  d.say({ type: 'join', room: '1234567' });
  d.say({ type: 'join', room: 'abc' });
  await wait(100);
  assert.deepEqual(d.inbox.map((m) => m.code), ['bad_room', 'bad_room'], 'only 1-6 digits');

  b.close();
  await wait(150);
  assert.equal(a.inbox.at(-1).type, 'peer_left');
  assert.equal(a.inbox.at(-1).count, 1);

  const e = client(); await e.opened;
  e.say({ type: 'join', room: '123456' });
  await wait(100);
  assert.equal(e.inbox[0].count, 2, 'freed seat can be taken again');

  console.log('all server tests passed');
} catch (err) {
  console.error('TEST FAILED:', err.message);
  process.exitCode = 1;
} finally {
  srv.kill();
}
