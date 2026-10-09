'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when the Supabase public env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client. Returns null when env vars are missing so the
 * storefront can safely fall back to bundled static data.
 */
export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, anonKey!);
}
