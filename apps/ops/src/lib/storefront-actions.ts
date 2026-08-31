'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { normalizeStorefrontPayload } from '@sourcebyjay/types';

async function requireManager() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { error: 'Staff access required.' as const };
  }
  if (!hasStaffRole(staff?.role, 'manager')) {
    return { error: 'Manager+ required to approve storefronts.' as const };
  }
  return { user, staff };
}

export async function approveStorefrontVersionAction(
  versionId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireManager();
  if ('error' in ctx) return ctx;

  const { user } = ctx;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('supplier_storefront_versions')
    .select('id, supplier_id, status, payload')
    .eq('id', versionId)
    .maybeSingle();

  if (!row || row.status !== 'pending_review') {
    return { error: 'Pending version not found.' };
  }

  const payload = normalizeStorefrontPayload(row.payload);
  if (!payload) return { error: 'Invalid version payload.' };

  const now = new Date().toISOString();

  const { error: supplierError } = await supabase
    .from('suppliers')
    .update({
      banner_url: payload.bannerUrl.trim() || null,
      logo_url: payload.logoUrl.trim() || null,
      description: payload.description.trim() || payload.mainProducts.trim(),
      main_products: payload.mainProducts.trim(),
      storefront_featured_product_ids: payload.featuredProductIds,
      updated_at: now,
    })
    .eq('id', row.supplier_id);

  if (supplierError) return { error: supplierError.message };

  await supabase
    .from('supplier_storefront_versions')
    .update({ status: 'superseded', updated_at: now })
    .eq('supplier_id', row.supplier_id)
    .eq('status', 'published');

  const { error: versionError } = await supabase
    .from('supplier_storefront_versions')
    .update({
      status: 'published',
      reviewed_by: user.id,
      reviewed_at: now,
      published_at: now,
      updated_at: now,
    })
    .eq('id', versionId);

  if (versionError) return { error: versionError.message };

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'storefront_version_approved',
    entity_type: 'supplier_storefront_version',
    entity_id: versionId,
    metadata: { supplier_id: row.supplier_id },
  });

  revalidatePath('/storefront-queue');
  revalidatePath(`/vendors/${row.supplier_id}`);
  return { ok: true };
}

export async function rejectStorefrontVersionAction(
  versionId: string,
  notes: string,
): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireManager();
  if ('error' in ctx) return ctx;

  const { user } = ctx;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('supplier_storefront_versions')
    .select('id, supplier_id, status')
    .eq('id', versionId)
    .maybeSingle();

  if (!row || row.status !== 'pending_review') {
    return { error: 'Pending version not found.' };
  }

  const trimmed = notes.trim();
  if (trimmed.length < 3) return { error: 'Add a short reason for the seller.' };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('supplier_storefront_versions')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: now,
      review_notes: trimmed,
      updated_at: now,
    })
    .eq('id', versionId);

  if (error) return { error: error.message };

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'storefront_version_rejected',
    entity_type: 'supplier_storefront_version',
    entity_id: versionId,
    metadata: { supplier_id: row.supplier_id, notes: trimmed },
  });

  revalidatePath('/storefront-queue');
  return { ok: true };
}
