'use server';

import { createSupabaseClient } from '@/supabase-clients/server';
import { redirect } from 'next/navigation';

export async function getLoggedInUserId(): Promise<string> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    redirect('/login');
  }
  return data.claims.sub;
}
