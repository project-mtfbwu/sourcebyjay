'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { canAccessPortal } from '@sourcebyjay/auth';

export async function addVendorDisputeMessageAction(formData: FormData): Promise<void> {
  const { user, profile, supplier } = await getSessionProfile();
  if (!user || !canAccessPortal('vendor', profile?.role ?? null) || !supplier?.id) return;

  const disputeId = String(formData.get('disputeId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;

  const supabase = await createClient();
  await supabase.rpc('add_dispute_message', {
    p_dispute_id: disputeId,
    p_body: body,
  });
  revalidatePath('/disputes');
}
