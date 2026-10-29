// Tiny Upstash Redis client over REST (no SDK needed).
// Works with Upstash directly or with the Vercel Marketplace integration (KV_REST_API_*).
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const hasStore = () => Boolean(URL_ && TOKEN);

// Runs several commands in one HTTP round trip. Each command is an array: ['HGET', key, field].
export async function pipeline(commands) {
  if (!hasStore()) throw new Error('store_not_configured');
  const res = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`store_${res.status}`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

export async function cmd(...args) {
  const [result] = await pipeline([args]);
  return result;
}

export async function getJson(key, fallback) {
  const raw = await cmd('GET', key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const setJson = (key, value) => cmd('SET', key, JSON.stringify(value));
