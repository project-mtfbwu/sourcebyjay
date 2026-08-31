'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { canAccessPortal } from '@sourcebyjay/auth';

export async function submitListingOfferAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !canAccessPortal('vendor', profile?.role ?? null)) {
    throw new Error('Seller login required');
  }

  const listingRequestId = String(formData.get('listingRequestId') ?? '');
  const message = String(formData.get('message') ?? '').trim();
  const unitPriceRaw = String(formData.get('unitPrice') ?? '').trim();
  const leadRaw = String(formData.get('leadTimeDays') ?? '').trim();

  if (!/^[0-9a-f-]{36}$/i.test(listingRequestId)) {
    throw new Error('Invalid request id');
  }
  if (message.length < 10 || message.length > 2000) {
    throw new Error('Message must be 10–2000 characters');
  }

  const unitPrice = unitPriceRaw ? Number(unitPriceRaw) : undefined;
  const leadTimeDays = leadRaw ? Number(leadRaw) : undefined;
  if (unitPrice != null && (Number.isNaN(unitPrice) || unitPrice < 0)) {
    throw new Error('Invalid unit price');
  }
  if (leadTimeDays != null && (Number.isNaN(leadTimeDays) || leadTimeDays < 0)) {
    throw new Error('Invalid lead time');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_listing_offer', {
    p_listing_request_id: listingRequestId,
    p_message: message,
    ...(unitPrice != null ? { p_unit_price: unitPrice } : {}),
    ...(leadTimeDays != null ? { p_lead_time_days: leadTimeDays } : {}),
  });
  if (error) throw new Error(error.message);
  const payload = data as { ok?: boolean; error?: string };
  if (!payload?.ok) throw new Error(payload?.error ?? 'Offer failed');

  revalidatePath('/listing-requests');
}
