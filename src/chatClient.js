// Supabase client used ONLY for Realtime (Broadcast + Presence) by /chat.
// No tables, no SQL, nothing is written to the database.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the public anon / publishable key, never service_role).
let clientPromise = null;

export function getSupabase() {
  if (clientPromise) return clientPromise;
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    clientPromise = Promise.resolve(null);
    return clientPromise;
  }
  clientPromise = import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(url, key, {
        // no login, so nothing is stored in localStorage
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    )
    .catch((err) => {
      clientPromise = null; // allow a retry (for example after a failed chunk download)
      throw err;
    });
  return clientPromise;
}
