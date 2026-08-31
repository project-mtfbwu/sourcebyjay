'use client';

import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';
import { createBrowserClient } from '@supabase/ssr';

/** Browser Supabase client — writes the buyer auth cookie so login survives new tabs. */
export function createClient(): ReturnType<typeof createBrowserClient> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        name: PORTAL_AUTH_COOKIE.web,
        path: '/',
        sameSite: 'lax',
      },
    },
  );
}
