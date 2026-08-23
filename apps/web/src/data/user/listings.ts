'use server';

import { authActionClient } from '@/lib/safe-action';
import type { Json } from '@/lib/database.types';
import { createSupabaseClient } from '@/supabase-clients/server';
import type { ListingInput, ListingStatus, Product } from '@/types/marketplace';
import type { Table } from '@/types';
import { mapDbProduct, slugify } from '@/utils/marketplace-mappers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getMySupplier } from './profile';

const priceTierSchema = z.object({
  minQty: z.number().int().positive(),
  price: z.number().positive(),
});

const attributeSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().min(1).max(200),
});

const variantSchema = z.object({
  name: z.string().min(1).max(80),
  options: z.array(z.string().min(1)).min(1),
});

export const listingInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  moq: z.number().int().positive(),
  maxOrderQty: z.number().int().positive().optional().nullable(),
  unit: z.string().min(1).max(30).default('piece'),
  imageUrl: z.string().url(),
  images: z.array(z.string().url()).optional(),
  specs: z.record(z.string(), z.string()).optional(),
  priceTiers: z.array(priceTierSchema).optional(),
  leadTimeDays: z.number().int().min(0).max(365).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  shippingInfo: z.record(z.string(), z.string()).optional(),
  attributes: z.array(attributeSchema).optional(),
  variants: z.array(variantSchema).optional(),
  sampleAvailable: z.boolean().optional(),
  customizationAvailable: z.boolean().optional(),
  isLocal: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

function toDbPayload(input: ListingInput, slug: string, supplierId: string) {
  return {
    slug,
    title: input.title,
    description: input.description,
    category_id: input.categoryId,
    price: input.price,
    currency: input.currency ?? 'USD',
    moq: input.moq,
    max_order_qty: input.maxOrderQty ?? null,
    unit: input.unit ?? 'piece',
    image_url: input.imageUrl,
    images: input.images ?? [input.imageUrl],
    specs: input.specs ?? {},
    price_tiers: (input.priceTiers ?? null) as unknown as Json,
    lead_time_days: input.leadTimeDays ?? null,
    payment_terms: input.paymentTerms ?? null,
    shipping_info: input.shippingInfo ?? {},
    attributes: (input.attributes ?? []) as unknown as Json,
    variants: (input.variants ?? []) as unknown as Json,
    sample_available: input.sampleAvailable ?? false,
    customization_available: input.customizationAvailable ?? false,
    is_local: input.isLocal ?? false,
    status: input.status ?? 'draft',
    supplier_id: supplierId,
  };
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createSupabaseClient>>, base: string) {
  let slug = base;
  let i = 0;
  while (i < 20) {
    const { data } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function getMyListings(userId: string): Promise<Product[]> {
  const supplier = await getMySupplier(userId);
  if (!supplier) return [];

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplier.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapDbProduct(row as Table<'products'>));
}

export async function getMyListingById(userId: string, listingId: string): Promise<Product | null> {
  const supplier = await getMySupplier(userId);
  if (!supplier) return null;

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', listingId)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbProduct(data as Table<'products'>);
}

export const createListingAction = authActionClient
  .schema(listingInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supplier = await getMySupplier(ctx.userId);
    if (!supplier) {
      throw new Error('You must register as a seller before creating listings.');
    }

    const supabase = await createSupabaseClient();
    const baseSlug = slugify(parsedInput.title);
    const slug = await uniqueSlug(supabase, baseSlug);

    const { data, error } = await supabase
      .from('products')
      .insert(toDbPayload(parsedInput, slug, supplier.id))
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/listings');
    revalidatePath('/');
    revalidatePath('/search');
    return { id: data.id, slug: data.slug };
  });

export const updateListingAction = authActionClient
  .schema(listingInputSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supplier = await getMySupplier(ctx.userId);
    if (!supplier) throw new Error('Seller account required.');

    const supabase = await createSupabaseClient();
    const { id, ...input } = parsedInput;

    const { data: existing } = await supabase
      .from('products')
      .select('slug')
      .eq('id', id)
      .eq('supplier_id', supplier.id)
      .single();

    if (!existing) throw new Error('Listing not found.');

    const { error } = await supabase
      .from('products')
      .update(toDbPayload(input, existing.slug, supplier.id))
      .eq('id', id)
      .eq('supplier_id', supplier.id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/listings');
    revalidatePath(`/products/${existing.slug}`);
    revalidatePath('/search');
    return { success: true };
  });

export const updateListingStatusAction = authActionClient
  .schema(z.object({ id: z.string().uuid(), status: z.enum(['draft', 'published', 'archived']) }))
  .action(async ({ parsedInput, ctx }) => {
    const supplier = await getMySupplier(ctx.userId);
    if (!supplier) throw new Error('Seller account required.');

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('products')
      .update({ status: parsedInput.status as ListingStatus })
      .eq('id', parsedInput.id)
      .eq('supplier_id', supplier.id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/listings');
    revalidatePath('/search');
    revalidatePath('/');
    return { success: true };
  });

export const deleteListingAction = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supplier = await getMySupplier(ctx.userId);
    if (!supplier) throw new Error('Seller account required.');

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', parsedInput.id)
      .eq('supplier_id', supplier.id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/listings');
    revalidatePath('/search');
    return { success: true };
  });
