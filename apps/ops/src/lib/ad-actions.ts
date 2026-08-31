'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { hasStaffRole } from '@sourcebyjay/auth';

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireManager() {
  const { staff } = await getOpsSession();
  if (!hasStaffRole(staff?.role ?? null, 'manager')) {
    return { error: 'Manager+ required' } as const;
  }
  return { staff } as const;
}

export async function opsGrantAdCreditAction(input: {
  supplierId: string;
  amountInr: number;
  note?: string;
}): Promise<ActionResult> {
  const gate = await requireManager();
  if ('error' in gate) return { ok: false, error: gate.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('ops_grant_ad_credit', {
    p_supplier_id: input.supplierId,
    p_amount_inr_cents: Math.round(input.amountInr * 100),
    p_note: input.note ?? 'Ops promotional ad credit',
  });

  if (error) return { ok: false, error: error.message };
  const result = data as { ok?: boolean; error?: string };
  if (!result?.ok) return { ok: false, error: result.error ?? 'Grant failed' };

  revalidatePath('/advertising');
  return { ok: true };
}

export async function opsPauseAdCampaignAction(campaignId: string): Promise<ActionResult> {
  const gate = await requireManager();
  if ('error' in gate) return { ok: false, error: gate.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('ad_campaigns')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', campaignId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/advertising');
  return { ok: true };
}
