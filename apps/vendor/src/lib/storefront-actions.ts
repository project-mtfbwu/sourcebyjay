'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { normalizeStorefrontPayload, type StorefrontDraftPayload } from '@sourcebyjay/types';

type ActionResult = { error?: string; ok?: boolean; versionId?: string };

async function requireSupplier() {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' as const };
  return { user, supplier };
}

export async function saveStorefrontDraftAction(input: {
  versionId?: string | null;
  payload: StorefrontDraftPayload;
  versionLabel?: string;
}): Promise<ActionResult> {
  const ctx = await requireSupplier();
  if ('error' in ctx) return ctx;

  const { user, supplier } = ctx;
  const supabase = await createClient();

  if (input.versionId) {
    const { data: existing } = await supabase
      .from('supplier_storefront_versions')
      .select('id, status, supplier_id')
      .eq('id', input.versionId)
      .maybeSingle();

    if (!existing || existing.supplier_id !== supplier.id) {
      return { error: 'Version not found.' };
    }
    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return { error: 'Only draft or rejected versions can be edited.' };
    }

    const { error } = await supabase
      .from('supplier_storefront_versions')
      .update({
        payload: input.payload,
        version_label: input.versionLabel?.trim() || null,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.versionId);

    if (error) return { error: error.message };
    revalidatePath('/storefront');
    return { ok: true, versionId: input.versionId };
  }

  const { data: versionNumber, error: rpcError } = await supabase.rpc('next_storefront_version_number', {
    p_supplier_id: supplier.id,
  });
  if (rpcError) return { error: rpcError.message };

  const { data: inserted, error } = await supabase
    .from('supplier_storefront_versions')
    .insert({
      supplier_id: supplier.id,
      version_number: Number(versionNumber),
      version_label: input.versionLabel?.trim() || `Version ${versionNumber}`,
      status: 'draft',
      payload: input.payload,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/storefront');
  return { ok: true, versionId: inserted.id as string };
}

export async function submitStorefrontForReviewAction(versionId: string): Promise<ActionResult> {
  const ctx = await requireSupplier();
  if ('error' in ctx) return ctx;

  const { supplier } = ctx;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('supplier_storefront_versions')
    .select('id, status, supplier_id, payload')
    .eq('id', versionId)
    .maybeSingle();

  if (!row || row.supplier_id !== supplier.id) return { error: 'Version not found.' };
  if (row.status !== 'draft' && row.status !== 'rejected') {
    return { error: 'Only drafts can be submitted for review.' };
  }

  const payload = normalizeStorefrontPayload(row.payload);
  if (!payload) return { error: 'Invalid draft payload.' };
  if (!payload.mainProducts.trim() && !payload.mainProductCategoryIds.length) {
    return { error: 'Select at least one main product category before submit.' };
  }

  const { error } = await supabase
    .from('supplier_storefront_versions')
    .update({
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
      review_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', versionId);

  if (error) return { error: error.message };
  revalidatePath('/storefront');
  return { ok: true, versionId };
}

/** Ensures the seller always has a draft or rejected version to edit. */
export async function ensureStorefrontEditableDraftAction(): Promise<ActionResult & { created?: boolean }> {
  const ctx = await requireSupplier();
  if ('error' in ctx) return ctx;

  const { user, supplier } = ctx;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('supplier_storefront_versions')
    .select('id, status')
    .eq('supplier_id', supplier.id)
    .in('status', ['draft', 'rejected'])
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, versionId: existing.id as string, created: false };
  }

  return { ...(await createStorefrontVersionAction()), created: true };
}

export async function createStorefrontVersionAction(): Promise<ActionResult> {
  const ctx = await requireSupplier();
  if ('error' in ctx) return ctx;

  const { user, supplier } = ctx;
  const supabase = await createClient();

  const { data: live } = await supabase
    .from('suppliers')
    .select('banner_url, logo_url, description, main_products, storefront_featured_product_ids')
    .eq('id', supplier.id)
    .single();

  if (!live) return { error: 'Supplier not found.' };

  const payload = normalizeStorefrontPayload({
    bannerUrl: live.banner_url ?? '',
    logoUrl: live.logo_url ?? '',
    description: live.description ?? '',
    mainProducts: live.main_products ?? '',
    mainProductCategoryIds: [],
    featuredProductIds: live.storefront_featured_product_ids ?? [],
  });
  if (!payload) return { error: 'Could not build version payload.' };

  const { data: versionNumber, error: rpcError } = await supabase.rpc('next_storefront_version_number', {
    p_supplier_id: supplier.id,
  });
  if (rpcError) return { error: rpcError.message };

  const { data: inserted, error } = await supabase
    .from('supplier_storefront_versions')
    .insert({
      supplier_id: supplier.id,
      version_number: Number(versionNumber),
      version_label: `Version ${versionNumber}`,
      status: 'draft',
      payload,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/storefront');
  return { ok: true, versionId: inserted.id as string };
}
