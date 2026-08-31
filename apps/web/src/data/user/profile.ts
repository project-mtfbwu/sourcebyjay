'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import type { Profile, UserRole } from '@/types/marketplace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
    gstin: (row.gstin as string) ?? null,
    industry: (row.industry as string) ?? null,
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
  phone: z.string().min(8).max(40).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  gstin: z.string().max(20).optional(),
  industry: z.string().max(120).optional(),
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
        gstin: parsedInput.gstin || null,
        industry: parsedInput.industry || null,
        avatar_url: parsedInput.avatarUrl || null,
      })
      .eq('id', ctx.userId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/profile');
    revalidatePath('/account/profile');
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
  .action(async () => {
    throw new Error(
      'Buyer and seller accounts are separate. Create a seller account at the seller portal (/signup).',
    );
  });

export async function getMySupplier(userId: string) {
  const supabase = await createSupabaseClient();
  const { data } = await supabase.from('suppliers').select('*').eq('owner_id', userId).maybeSingle();
  return data;
}

export type BuyerInquiry = {
  id: string;
  message: string;
  quantity: number | null;
  contactEmail: string;
  createdAt: string;
  productId: string | null;
  supplierId: string | null;
};

export async function getMyInquiries(userId: string): Promise<BuyerInquiry[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('inquiries')
    .select('id, message, quantity, contact_email, created_at, product_id, supplier_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    message: row.message,
    quantity: row.quantity,
    contactEmail: row.contact_email,
    createdAt: row.created_at,
    productId: row.product_id,
    supplierId: row.supplier_id,
  }));
}
