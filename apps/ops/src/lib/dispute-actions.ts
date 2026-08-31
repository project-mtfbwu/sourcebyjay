'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';

export async function resolveDisputeAction(formData: FormData): Promise<void> {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) return;
  if (!hasStaffRole(staff?.role, 'manager')) return;

  const disputeId = String(formData.get('disputeId') ?? '');
  const resolution = String(formData.get('resolution') ?? '');
  const note = String(formData.get('note') ?? '');
  const refundRaw = String(formData.get('refundCents') ?? '');
  const refundCents = refundRaw ? Number(refundRaw) : null;

  const supabase = await createClient();
  await supabase.rpc('resolve_dispute', {
    p_dispute_id: disputeId,
    p_resolution: resolution,
    p_refund_amount_cents: Number.isFinite(refundCents) ? refundCents : null,
    p_note: note || null,
  });
  revalidatePath('/disputes');
}

export async function opsAddDisputeMessageAction(formData: FormData): Promise<void> {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) return;

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

export async function setGuaranteeOverrideAction(formData: FormData): Promise<void> {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) return;
  if (!hasStaffRole(staff?.role, 'manager')) return;

  const supplierId = String(formData.get('supplierId') ?? '');
  const overrideRaw = String(formData.get('override') ?? '');
  const override = overrideRaw === 'true' ? true : overrideRaw === 'false' ? false : null;
  if (override === null) return;

  const supabase = await createClient();
  await supabase.rpc('set_supplier_guarantee_override', {
    p_supplier_id: supplierId,
    p_override: override,
  });
  revalidatePath(`/vendors/${supplierId}`);
  revalidatePath('/disputes');
}
