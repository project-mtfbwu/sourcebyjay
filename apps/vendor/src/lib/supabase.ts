import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Vendor server client — isolated cookie `sb-sbj-seller-auth` (not buyer/ops). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        name: PORTAL_AUTH_COOKIE.vendor,
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
