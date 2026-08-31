'use server';

import { authActionClient } from '@/lib/safe-action';
import {
  isValidGstin,
  isValidPan,
  isValidPincode,
  normalizeGstin,
  normalizePan,
} from '@sourcebyjay/types';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type BuyerBusinessProfile = {
  id: string;
  label: string;
  companyName: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  isDefault: boolean;
};

function mapRow(row: Record<string, unknown>): BuyerBusinessProfile {
  return {
    id: row.id as string,
    label: row.label as string,
    companyName: (row.company_name as string) ?? null,
    gstin: (row.gstin as string) ?? null,
    pan: (row.pan as string) ?? null,
    addressLine1: (row.address_line1 as string) ?? null,
    addressLine2: (row.address_line2 as string) ?? null,
    city: (row.city as string) ?? null,
    state: (row.state as string) ?? null,
    pincode: (row.pincode as string) ?? null,
    country: (row.country as string) ?? 'India',
    isDefault: Boolean(row.is_default),
  };
}

export async function listBuyerBusinessProfiles(userId: string): Promise<BuyerBusinessProfile[]> {
  const supabase = await createSupabaseClient();
  const { data } = await supabase
    .from('buyer_business_profiles')
    .select('*')
    .eq('buyer_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

const profileSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(80),
  companyName: z.string().max(200).optional(),
  gstin: z.string().max(20).optional(),
  pan: z.string().max(12).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pincode: z.string().max(10).optional(),
  country: z.string().max(80).optional(),
  isDefault: z.boolean().optional(),
});

export const saveBuyerBusinessProfileAction = authActionClient
  .schema(profileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const gstin = parsedInput.gstin?.trim();
    const pan = parsedInput.pan?.trim();
    const pincode = parsedInput.pincode?.trim();
    if (gstin && !isValidGstin(gstin)) throw new Error('Invalid GSTIN format.');
    if (pan && !isValidPan(pan)) throw new Error('Invalid PAN format.');
    if (pincode && !isValidPincode(pincode)) throw new Error('PIN code must be 6 digits.');

    const supabase = await createSupabaseClient();
    const payload = {
      label: parsedInput.label,
      company_name: parsedInput.companyName || null,
      gstin: gstin ? normalizeGstin(gstin) : null,
      pan: pan ? normalizePan(pan) : null,
      address_line1: parsedInput.addressLine1 || null,
      address_line2: parsedInput.addressLine2 || null,
      city: parsedInput.city || null,
      state: parsedInput.state || null,
      pincode: pincode || null,
      country: parsedInput.country || 'India',
      is_default: parsedInput.isDefault ?? false,
    };

    if (parsedInput.isDefault) {
      await supabase
        .from('buyer_business_profiles')
        .update({ is_default: false })
        .eq('buyer_id', ctx.userId);
    }

    if (parsedInput.id) {
      const { data, error } = await supabase
        .from('buyer_business_profiles')
        .update(payload)
        .eq('id', parsedInput.id)
        .eq('buyer_id', ctx.userId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      revalidatePath('/account/business');
      return mapRow(data as Record<string, unknown>);
    }

    const { data, error } = await supabase
      .from('buyer_business_profiles')
      .insert({ ...payload, buyer_id: ctx.userId })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    revalidatePath('/account/business');
    return mapRow(data as Record<string, unknown>);
  });

export const deleteBuyerBusinessProfileAction = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('buyer_business_profiles')
      .delete()
      .eq('id', parsedInput.id)
      .eq('buyer_id', ctx.userId);
    if (error) throw new Error(error.message);
    revalidatePath('/account/business');
    return { ok: true };
  });
