'use client';

import { createBrowserClient } from '@supabase/ssr';
import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        name: PORTAL_AUTH_COOKIE.vendor,
        path: '/',
        sameSite: 'lax',
      },
    },
  );
}
