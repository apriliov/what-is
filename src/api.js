// Small fetch wrapper for the /api functions. Throws an Error with `.code` (see apiError.* in i18n).
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // not JSON (for example `vite dev` without the API running)
  }
  if (!data) throw Object.assign(new Error('bad_response'), { code: 'server_error' });
  if (!res.ok) throw Object.assign(new Error(data.error || String(res.status)), { code: data.error || 'server_error' });
  return data;
}

export function formatDateTime(ts, lang) {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ts));
}
