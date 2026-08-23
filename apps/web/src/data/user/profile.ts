'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import type { Profile, UserRole } from '@/types/marketplace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@/utils/marketplace-mappers';

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: (row.full_name as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    role: row.role as UserRole,
    companyName: (row.company_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    country: (row.country as string) ?? null,
    city: (row.city as string) ?? null,
    bio: (row.bio as string) ?? null,
  };
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

export async function ensureProfile(userId: string, email: string): Promise<Profile> {
  const existing = await getMyProfile(userId);
  if (existing) return existing;

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, email })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const updateProfileAction = authActionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: parsedInput.fullName,
        company_name: parsedInput.companyName,
        phone: parsedInput.phone,
        country: parsedInput.country,
        city: parsedInput.city,
        bio: parsedInput.bio,
        avatar_url: parsedInput.avatarUrl || null,
      })
      .eq('id', ctx.userId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/profile');
    return mapProfile(data);
  });

const becomeSellerSchema = z.object({
  companyName: z.string().min(2).max(200),
  country: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  mainProducts: z.string().min(2).max(500),
  description: z.string().min(10).max(3000),
  yearsInBusiness: z.number().int().min(0).max(100).default(1),
});

export const becomeSellerAction = authActionClient
  .schema(becomeSellerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();

    const slugBase = slugify(parsedInput.companyName);
    const slug = `${slugBase}-${ctx.userId.slice(0, 8)}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'seller',
        company_name: parsedInput.companyName,
        country: parsedInput.country,
        city: parsedInput.city,
      })
      .eq('id', ctx.userId);

    if (profileError) throw new Error(profileError.message);

    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_id', ctx.userId)
      .maybeSingle();

    if (existing) {
      revalidatePath('/dashboard/profile');
      revalidatePath('/dashboard/listings');
      return { supplierId: existing.id };
    }

    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        slug,
        name: parsedInput.companyName,
        owner_id: ctx.userId,
        country: parsedInput.country,
        city: parsedInput.city,
        main_products: parsedInput.mainProducts,
        description: parsedInput.description,
        years_in_business: parsedInput.yearsInBusiness,
        verified: false,
      })
      .select('id')
      .single();

    if (supplierError) throw new Error(supplierError.message);

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/listings');
    return { supplierId: supplier.id };
  });

export async function getMySupplier(userId: string) {
  const supabase = await createSupabaseClient();
  const { data } = await supabase.from('suppliers').select('*').eq('owner_id', userId).maybeSingle();
  return data;
}
