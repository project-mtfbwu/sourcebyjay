'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export async function opsSignInAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false as const, error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Login failed' };

  const { data: staff } = await supabase
    .from('staff_members')
    .select('user_id, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff) {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error: 'This account is not on the ops staff roster (staff_members).',
    };
  }

  return { ok: true as const };
}

export async function opsSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login');
}

export async function moderateGalleryAction(
  table: 'supplier_gallery' | 'supplier_media_assets',
  rowId: string,
  status: 'approved' | 'rejected' | 'flagged' | 'archived' | 'pending',
  staffNote?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  const { data: staff } = await supabase
    .from('staff_members')
    .select('role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff || !['manager', 'admin', 'super_admin'].includes(staff.role as string)) {
    return { ok: false, error: 'Manager+ staff required.' };
  }

  const { data: row, error: fetchError } = await supabase
    .from(table)
    .select('id, supplier_id')
    .eq('id', rowId)
    .maybeSingle();

  if (fetchError || !row) return { ok: false, error: fetchError?.message ?? 'Not found.' };

  const payload: Record<string, unknown> = {
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (staffNote) payload.staff_note = staffNote;

  const { error } = await supabase.from(table).update(payload).eq('id', rowId);

  if (error) return { ok: false, error: error.message };

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: `${table}.${status}`,
    entity_type: table,
    entity_id: rowId,
    metadata: { status, supplier_id: row.supplier_id, staff_note: staffNote ?? null },
  });

  revalidatePath(`/vendors/${row.supplier_id}/gallery`);
  revalidatePath('/storefront-queue');
  return { ok: true };
}

/** @deprecated use moderateGalleryAction */
export async function reviewGalleryAction(
  galleryId: string,
  status: 'approved' | 'rejected',
): Promise<{ ok: true } | { ok: false; error: string }> {
  return moderateGalleryAction('supplier_gallery', galleryId, status);
}
