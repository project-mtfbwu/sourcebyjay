'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';

export async function assignVendorPlanAction(input: {
  supplierId: string;
  planId: string;
  status: 'active' | 'comped';
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false, error: 'Staff access required.' };
  }
  if (!hasStaffRole(staff?.role, 'manager')) {
    return { ok: false, error: 'Manager+ required.' };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from('vendor_subscriptions')
    .select('id, plan_id')
    .eq('supplier_id', input.supplierId)
    .in('status', ['active', 'comped'])
    .maybeSingle();

  if (current) {
    await supabase
      .from('vendor_subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', current.id as string);
  }

  // Clear any seller pending request when ops assigns directly
  await supabase
    .from('vendor_subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('supplier_id', input.supplierId)
    .eq('status', 'pending');

  const { error } = await supabase.from('vendor_subscriptions').insert({
    supplier_id: input.supplierId,
    plan_id: input.planId,
    status: input.status,
    granted_by_staff_id: user.id,
    notes: input.notes?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from('vendor_subscription_events').insert({
    supplier_id: input.supplierId,
    from_plan_id: (current?.plan_id as string) ?? null,
    to_plan_id: input.planId,
    event_type: input.status === 'comped' ? 'comp_grant' : 'ops_assign',
    actor_user_id: user.id,
  });

  revalidatePath(`/vendors/${input.supplierId}/subscription`);
  revalidatePath(`/vendors/${input.supplierId}`);
  return { ok: true };
}

export async function approvePendingPlanAction(
  supplierId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false, error: 'Staff access required.' };
  }
  if (!hasStaffRole(staff?.role, 'manager')) {
    return { ok: false, error: 'Manager+ required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('approve_vendor_plan_request', {
    p_supplier_id: supplierId,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) return { ok: false, error: payload?.error ?? 'Approve failed' };

  revalidatePath(`/vendors/${supplierId}/subscription`);
  revalidatePath(`/vendors/${supplierId}`);
  return { ok: true };
}

export async function updateListingPlanAction(input: {
  id: string;
  priceInrCentsAnnual: number;
  maxListings: number | null;
  rankBoostBps: number;
  rfqLeadsPerWeek: number;
  guaranteeEligible: boolean;
  active: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false, error: 'Staff access required.' };
  }
  if (!hasStaffRole(staff?.role, 'admin')) {
    return { ok: false, error: 'Admin+ required to edit plan prices.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('listing_plans')
    .update({
      price_inr_cents_annual: input.priceInrCentsAnnual,
      max_listings: input.maxListings,
      rank_boost_bps: input.rankBoostBps,
      rfq_leads_per_week: input.rfqLeadsPerWeek,
      guarantee_eligible: input.guaranteeEligible,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/plans');
  return { ok: true };
}
