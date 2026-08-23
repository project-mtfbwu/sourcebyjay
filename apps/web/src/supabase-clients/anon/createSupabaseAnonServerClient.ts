import type { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // no-op — anonymous client must not read/write session cookies
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
