'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyProfile } from '@/data/user/profile';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function requireAdmin(userId: string) {
  const profile = await getMyProfile(userId);
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

export async function getUnverifiedSuppliers() {
  const userId = await getLoggedInUserId();
  await requireAdmin(userId);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('verified', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllSuppliersAdmin() {
  const userId = await getLoggedInUserId();
  await requireAdmin(userId);

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const verifySupplierAction = authActionClient
  .schema(z.object({ supplierId: z.string().uuid(), verified: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await requireAdmin(ctx.userId);

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('suppliers')
      .update({ verified: parsedInput.verified })
      .eq('id', parsedInput.supplierId);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/admin');
    revalidatePath('/search');
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
    revalidatePath('/dashboard/admin');
    return { success: true };
  });
