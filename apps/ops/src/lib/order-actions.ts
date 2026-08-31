'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal } from '@sourcebyjay/auth';

export async function fakeMarkOrderPaidAction(orderId: string) {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false as const, error: 'Staff access required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('fake_mark_order_paid', {
    p_order_id: orderId,
    p_accept_guarantee_terms: true,
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return { ok: false as const, error: payload?.error ?? 'Could not mark paid' };
  }
  revalidatePath('/orders');
  return { ok: true as const };
}

export async function opsUpdateOrderStatusAction(orderId: string, toStatus: string) {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false as const, error: 'Staff access required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_note: 'Ops status update',
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return { ok: false as const, error: payload?.error ?? 'Could not update status' };
  }
  revalidatePath('/orders');
  return { ok: true as const };
}

export async function opsReleaseEscrowAction(orderId: string) {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false as const, error: 'Staff access required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('release_escrow_to_seller', {
    p_order_id: orderId,
    p_note: 'Ops released escrow to seller (fake)',
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return { ok: false as const, error: payload?.error ?? 'Could not release escrow' };
  }
  revalidatePath('/orders');
  return { ok: true as const };
}

export async function opsReturnEscrowAction(orderId: string) {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false as const, error: 'Staff access required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('return_escrow_to_buyer', {
    p_order_id: orderId,
    p_note: 'Ops returned escrow to buyer (fake)',
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return { ok: false as const, error: payload?.error ?? 'Could not return escrow' };
  }
  revalidatePath('/orders');
  return { ok: true as const };
}
