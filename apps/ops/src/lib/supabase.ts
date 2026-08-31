import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Ops server client — cookie name MUST stay `sb-sbj-ops-auth`.
 * On localhost, cookies are shared across ports; unique names keep
 * buyer (:3000) / seller (:3001) / ops (:3002) sessions from overwriting each other.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        name: PORTAL_AUTH_COOKIE.ops,
        path: '/',
        sameSite: 'lax',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component — ignore */
          }
        },
      },
    },
  );
}
