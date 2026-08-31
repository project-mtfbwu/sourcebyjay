'use server';

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export type SellerSignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  otpCode: string;
  companyName: string;
  country: string;
  state?: string;
  city: string;
  gstin: string;
  mainProducts: string;
  description?: string;
};

export async function requestSellerPhoneOtp(phone: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('request_phone_otp', {
    p_phone: phone.trim(),
    p_purpose: 'seller_signup',
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; dev_code?: string; error?: string };
  if (!payload?.ok) return { ok: false as const, error: payload?.error ?? 'OTP failed' };
  return { ok: true as const, devCode: payload.dev_code ?? null };
}

export async function sellerSignUpAction(input: SellerSignUpInput) {
  const supabase = await createClient();

  const { data: verifyRaw, error: verifyError } = await supabase.rpc('verify_phone_otp', {
    p_phone: input.phone.trim(),
    p_purpose: 'seller_signup',
    p_code: input.otpCode.trim(),
  });
  if (verifyError) return { ok: false as const, error: verifyError.message };
  const verify = verifyRaw as { ok?: boolean; error?: string };
  if (!verify?.ok) {
    return { ok: false as const, error: verify?.error ?? 'Phone OTP failed' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        account_type: 'seller',
        full_name: input.fullName,
        phone: input.phone,
        company_name: input.companyName,
        country: input.country,
        city: input.city,
        state: input.state,
        gstin: input.gstin,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return {
        ok: false as const,
        error:
          'This email is already used. Seller accounts are separate — use a different email, or log in if you already have a seller account.',
      };
    }
    return { ok: false as const, error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return {
      ok: false as const,
      error: 'Account created but session missing. Check email confirmation, then log in.',
    };
  }

  await supabase
    .from('profiles')
    .update({
      phone: input.phone,
      phone_verified_at: new Date().toISOString(),
      company_name: input.companyName,
      country: input.country,
      city: input.city,
      gstin: input.gstin,
      full_name: input.fullName,
    })
    .eq('id', userId);

  const slug = `${slugify(input.companyName)}-${userId.slice(0, 8)}`;
  const { data: existing } = await supabase
    .from('suppliers')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!existing) {
    const { error: supplierError } = await supabase.from('suppliers').insert({
      slug,
      name: input.companyName,
      owner_id: userId,
      country: input.country,
      state: input.state?.trim() || null,
      city: input.city,
      main_products: input.mainProducts,
      description: input.description?.trim() || `${input.companyName} — ${input.mainProducts}`,
      years_in_business: 0,
      verified: false,
    });

    if (supplierError) {
      return { ok: false as const, error: supplierError.message };
    }
  }

  revalidatePath('/');
  return { ok: true as const };
}

export async function sellerSignInAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false as const, error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Login failed' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Seller Central = seller profiles only. Staff use :3002; buyers use :3000.
  if (profile?.role !== 'seller') {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error:
        'This login is not a seller profile. Staff use the ops portal (port 3002). Buyers use the buyer site (port 3000). Create a separate seller account here.',
    };
  }

  const { data: staff } = await supabase
    .from('staff_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (staff) {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error:
        'Ops staff accounts cannot use Seller Central. Sign in at the ops portal (port 3002), or use a separate seller email.',
    };
  }

  return { ok: true as const };
}

export async function sellerSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login');
}

export async function requestVendorPlanAction(planId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('request_vendor_plan', {
    p_plan_id: planId,
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as {
    ok?: boolean;
    mode?: string;
    slug?: string;
    message?: string;
    error?: string;
  };
  if (!payload?.ok) {
    return { ok: false as const, error: payload?.error ?? 'Could not change plan' };
  }
  revalidatePath('/plans');
  revalidatePath('/listings');
  revalidatePath('/');
  return {
    ok: true as const,
    mode: payload.mode ?? 'ok',
    slug: payload.slug ?? null,
    message: payload.message ?? null,
  };
}

export async function estimateFreightAction(input: {
  weightKg: number;
  pincode?: string;
  international?: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('estimate_freight_inr', {
    p_weight_kg: input.weightKg,
    p_pincode: input.pincode ?? '',
    p_international: input.international ?? false,
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as {
    ok?: boolean;
    freight_amount?: number;
    zone?: string;
    currency?: string;
    rate_per_kg?: number;
    min_charge?: number;
    weight_kg?: number;
  };
  if (!payload?.ok) return { ok: false as const, error: 'Could not estimate freight' };
  return { ok: true as const, estimate: payload };
}

export async function createQuoteAction(input: {
  inquiryId: string;
  unitPrice: number;
  quantity: number;
  leadTimeDays: number;
  validUntil?: string;
  notes?: string;
  isSample?: boolean;
  incoterm?: string;
  freightAmount?: number;
  destinationPincode?: string;
  estimatedWeightKg?: number;
  shipByDate?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_quote', {
    p_inquiry_id: input.inquiryId,
    p_unit_price: input.unitPrice,
    p_quantity: input.quantity,
    p_lead_time_days: input.leadTimeDays,
    p_valid_until: input.validUntil || ('2099-12-31' as string),
    p_notes: input.notes ?? '',
    p_is_sample: input.isSample ?? false,
    p_currency: 'INR',
    p_incoterm: input.incoterm ?? 'FOB',
    p_freight_amount: input.freightAmount ?? 0,
    p_destination_pincode: input.destinationPincode ?? null,
    p_estimated_weight_kg: input.estimatedWeightKg ?? null,
    p_ship_by_date: input.shipByDate || null,
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; quote_id?: string; error?: string };
  if (!payload?.ok) return { ok: false as const, error: payload?.error ?? 'Could not create quote' };
  revalidatePath('/quotes');
  revalidatePath('/orders');
  return { ok: true as const, quoteId: payload.quote_id ?? null };
}

export async function updateOrderStatusAction(orderId: string, toStatus: string, note?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_note: note ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) return { ok: false as const, error: payload?.error ?? 'Could not update status' };
  revalidatePath('/orders');
  return { ok: true as const };
}
