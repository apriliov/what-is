// End-to-end encryption for /chat. Everything here runs in the browser (Web Crypto).
// The room password never leaves the device: it is not sent anywhere and not stored.
// Key  = PBKDF2-SHA256(password, per-room salt) -> AES-256-GCM.
// Each message gets a fresh random IV, and its counter, sender and kind are bound to it (AAD),
// so a captured message cannot be edited, replayed or passed off as something else.

const enc = new TextEncoder();
const ITERATIONS = 150000;

export const cryptoSupported = () =>
  typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.getRandomValues === 'function';

export function bytesToB64(bytes) {
  let bin = '';
  const STEP = 0x8000;
  for (let i = 0; i < bytes.length; i += STEP) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
  return btoa(bin);
}

export function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

// Returns { key, kc }. kc is a short fingerprint of the key. It is shared through Presence
// only so the two people can tell right away that their passwords differ.
export async function deriveRoomKey(room, password) {
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(`pw:${String(password).trim().normalize('NFKC')}`),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`namaiki-chat:v1:${room}`), iterations: ITERATIONS },
      material,
      512
    )
  );
  const key = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const kc = Array.from(bits.slice(32, 40), (b) => b.toString(16).padStart(2, '0')).join('');
  return { key, kc };
}

export const makeAad = (room, from, kind, n) => `${room}|${from}|${kind}|${n}`;

export async function encryptBytes(key, aad, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, bytes)
  );
  return { iv: bytesToB64(iv), ct: bytesToB64(ct) };
}

// Throws when the key is wrong or anything was changed.
export async function decryptBytes(key, aad, ivB64, ctB64) {
  const iv = b64ToBytes(ivB64);
  if (iv.length !== 12) throw new Error('bad_iv');
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, b64ToBytes(ctB64))
  );
}

// Passwords live only in memory (a refresh forgets them) and are never put in the URL.
const secrets = new Map();
export const setRoomSecret = (room, password) => secrets.set(room, String(password));
export const getRoomSecret = (room) => (secrets.has(room) ? secrets.get(room) : null);
export const clearRoomSecret = (room) => secrets.delete(room);
