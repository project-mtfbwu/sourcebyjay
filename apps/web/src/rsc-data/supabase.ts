import { createSupabaseClient } from '@/supabase-clients/server';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';

function loginRedirect() {
  redirect('/login');
}

async function requireRequestTime() {
  // Supabase auth-js checks session expiry with Date.now().
  // Next.js 16 cacheComponents forbids that during prerender.
  await connection();
}

// Only meant to be used in protected pages
// This makes an extra call to the server to verify the user is still logged in
// Use sparingly
export const getCachedLoggedInVerifiedSupabaseUser = cache(async () => {
  await requireRequestTime();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    loginRedirect();
  }
  return { user: data.user as User };
});

// Only meant to be used in protected pages
export const getCachedLoggedInSupabaseUser = cache(async () => {
  await requireRequestTime();
  const supabase = await createSupabaseClient();
  // Prefer getUser() — getSession() is cookie-trusting and trips Date.now() expiry checks.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    loginRedirect();
  }
  return data.user as User;
});

export const getCachedLoggedInUserClaims = cache(async () => {
  await requireRequestTime();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return null;
  }
  return data.claims;
});

export const getCachedIsUserLoggedIn = cache(async () => {
  const claims = await getCachedLoggedInUserClaims();
  return claims?.sub != null;
});

export const getCachedLoggedInUserId = cache(async () => {
  const claims = await getCachedLoggedInUserClaims();
  if (!claims?.sub) {
    loginRedirect();
  }
  return claims!.sub;
});
