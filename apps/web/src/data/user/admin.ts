'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyProfile } from '@/data/user/profile';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { VerificationTier } from '@/types/marketplace';
import type { Json } from '@/lib/database.types';
import { legacyVerifiedFromTier } from '@/utils/verification';
import { getPendingGalleryItems, getAllGalleryItems } from '@/data/mock/gallery';

async function requireAdmin(userId: string) {
  const profile = await getMyProfile(userId);
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    metadata: (entry.metadata ?? {}) as Json,
  });

  if (error) {
    console.warn('audit_logs insert skipped:', error.message);
  }
}

export async function getAllSuppliersAdmin() {
  const userId = await getLoggedInUserId();
  await requireAdmin(userId);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPendingGalleryAdmin(): Promise<
  Array<{
    id: string;
    image_url: string;
    media_type: string;
    caption?: string | null;
    status: string;
    suppliers?: { name: string; slug: string } | null;
  }>
> {
  const userId = await getLoggedInUserId();
  await requireAdmin(userId);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('supplier_gallery')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    const pending = getPendingGalleryItems();
    const suppliers = await getAllSuppliersAdmin();
    return pending.map((item) => ({
      id: item.id,
      image_url: item.imageUrl,
      media_type: item.mediaType,
      caption: item.caption,
      status: item.status,
      suppliers: suppliers.find((s) => s.id === item.supplierId) ?? { name: 'Unknown', slug: '' },
    }));
  }

  const suppliers = await getAllSuppliersAdmin();
  return data.map((item) => ({
    id: item.id,
    image_url: item.image_url,
    media_type: item.media_type,
    caption: item.caption,
    status: item.status,
    suppliers: suppliers.find((s) => s.id === item.supplier_id) ?? { name: 'Unknown', slug: '' },
  }));
}

export async function getAllGalleryAdmin() {
  const userId = await getLoggedInUserId();
  await requireAdmin(userId);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('supplier_gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    const items = getAllGalleryItems();
    const suppliers = await getAllSuppliersAdmin();
    return items.map((item) => ({
      ...item,
      media_type: item.mediaType,
      image_url: item.imageUrl,
      supplier_id: item.supplierId,
      suppliers: suppliers.find((s) => s.id === item.supplierId) ?? { name: 'Unknown', slug: '' },
    }));
  }

  const suppliers = await getAllSuppliersAdmin();
  return data.map((item) => ({
    ...item,
    suppliers: suppliers.find((s) => s.id === item.supplier_id) ?? { name: 'Unknown', slug: '' },
  }));
}

const tierSchema = z.enum(['none', 'basic', 'verified', 'gold', 'assessed']);

export const setVerificationTierAction = authActionClient
  .schema(z.object({ supplierId: z.string().uuid(), tier: tierSchema }))
  .action(async ({ parsedInput, ctx }) => {
    await requireAdmin(ctx.userId);

    const supabase = await createSupabaseClient();
    const tier = parsedInput.tier as VerificationTier;
    const verified = legacyVerifiedFromTier(tier);

    const { error } = await supabase
      .from('suppliers')
      .update({ verification_tier: tier, verified })
      .eq('id', parsedInput.supplierId);

    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      actorId: ctx.userId,
      action: 'supplier.set_verification_tier',
      entityType: 'supplier',
      entityId: parsedInput.supplierId,
      metadata: { tier },
    });

    revalidatePath('/dashboard/admin/suppliers');
    revalidatePath('/search');
    revalidatePath('/suppliers');
    return { success: true };
  });

export const verifySupplierAction = authActionClient
  .schema(z.object({ supplierId: z.string().uuid(), verified: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await requireAdmin(ctx.userId);

    const supabase = await createSupabaseClient();
    const tier: VerificationTier = parsedInput.verified ? 'verified' : 'none';

    const { error } = await supabase
      .from('suppliers')
      .update({ verified: parsedInput.verified, verification_tier: tier })
      .eq('id', parsedInput.supplierId);

    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      actorId: ctx.userId,
      action: parsedInput.verified ? 'supplier.verify' : 'supplier.revoke',
      entityType: 'supplier',
      entityId: parsedInput.supplierId,
      metadata: { tier },
    });

    revalidatePath('/dashboard/admin/suppliers');
    revalidatePath('/search');
    return { success: true };
  });

export const reviewGalleryAction = authActionClient
  .schema(
    z.object({
      galleryId: z.string().uuid(),
      status: z.enum(['approved', 'rejected']),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    await requireAdmin(ctx.userId);

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('supplier_gallery')
      .update({
        status: parsedInput.status,
        reviewed_by: ctx.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.galleryId);

    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      actorId: ctx.userId,
      action: `supplier_gallery.${parsedInput.status}`,
      entityType: 'supplier_gallery',
      entityId: parsedInput.galleryId,
      metadata: { status: parsedInput.status },
    });

    revalidatePath('/dashboard/admin/suppliers');
    revalidatePath('/suppliers');
    return { success: true };
  });

export const promoteToAdminAction = authActionClient
  .schema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput, ctx }) => {
    await requireAdmin(ctx.userId);

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', parsedInput.email);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/admin/suppliers');
    return { success: true };
  });
