'use server';

import { createSupabaseAnonServerClient } from '@/supabase-clients/anon/createSupabaseAnonServerClient';

export async function recordAdImpressionAction(
  creativeId: string,
  placement: string,
  searchQuery?: string,
) {
  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) return;
  await supabase.rpc('record_ad_impression', {
    p_creative_id: creativeId,
    p_placement: placement,
    p_search_query: searchQuery,
  });
}

export async function recordAdClickAction(
  creativeId: string,
  impressionId: string | null,
  placement: string,
) {
  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) return;
  const { data } = await supabase.rpc('record_ad_click', {
    p_creative_id: creativeId,
    p_impression_id: impressionId ?? undefined,
    p_placement: placement,
  });
  return data as { ok?: boolean; impression_id?: string } | null;
}
