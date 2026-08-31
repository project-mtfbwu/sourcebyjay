'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  isValidGstin,
  isValidHsn,
  isValidPan,
  isValidPincode,
  normalizeGstin,
  normalizePan,
} from '@sourcebyjay/types';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { getSupplierVideoPlanFeatures } from '@/lib/plan-features';
import { MAX_IMAGE_UPLOAD_BYTES } from '@/lib/media-storage';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base: string) {
  const supabase = await createClient();
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

function parseListingForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const price = Number(formData.get('price'));
  const moq = Number(formData.get('moq') || 1);
  const unit = String(formData.get('unit') ?? 'piece').trim() || 'piece';
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'INR').trim() || 'INR';
  const status = String(formData.get('status') ?? 'draft') as 'draft' | 'published' | 'archived';
  const sampleAvailable = formData.get('sampleAvailable') === 'on';
  const leadTimeDaysRaw = String(formData.get('leadTimeDays') ?? '').trim();
  const leadTimeDays = leadTimeDaysRaw ? Number(leadTimeDaysRaw) : null;
  const hsnCode = String(formData.get('hsnCode') ?? '').trim();
  const gstRateBpsRaw = String(formData.get('gstRateBps') ?? '').trim();
  const gstRateBps = gstRateBpsRaw ? Number(gstRateBpsRaw) : null;
  const videoUrlRaw = String(formData.get('videoUrl') ?? '').trim();
  const productVideoEnabled = formData.get('productVideoEnabled') === 'on';
  void videoUrlRaw;
  void productVideoEnabled;

  if (title.length < 3) return { error: 'Title must be at least 3 characters.' };
  if (description.length < 10) return { error: 'Description must be at least 10 characters.' };
  if (!categoryId) return { error: 'Pick a category.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Enter a valid price.' };
  if (!Number.isFinite(moq) || moq < 1) return { error: 'MOQ must be at least 1.' };
  if (!imageUrl.startsWith('http')) return { error: 'Image URL must start with http.' };
  if (!['draft', 'published', 'archived'].includes(status)) return { error: 'Invalid status.' };
  if (hsnCode && !isValidHsn(hsnCode)) return { error: 'HSN code must be 4–8 digits.' };
  if (gstRateBps != null && ![0, 500, 1200, 1800, 2800].includes(gstRateBps)) {
    return { error: 'Pick a valid GST slab.' };
  }

  return {
    title,
    description,
    categoryId,
    price,
    moq,
    unit,
    imageUrl,
    currency,
    status,
    sampleAvailable,
    leadTimeDays: leadTimeDays != null && Number.isFinite(leadTimeDays) ? leadTimeDays : null,
    hsnCode: hsnCode || null,
    gstRateBps,
  };
}

export async function createListingAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const { supplier } = await getSessionProfile();
  if (!supplier?.id) return { error: 'Seller company required. Finish signup first.' };

  const parsed = parseListingForm(formData);
  if ('error' in parsed && parsed.error) return { error: parsed.error };

  const input = parsed as Exclude<ReturnType<typeof parseListingForm>, { error: string }>;
  const supabase = await createClient();

  if (input.status === 'published') {
    const { data: can } = await supabase.rpc('supplier_can_publish_listing', {
      p_supplier_id: supplier.id,
    });
    if (!can) return { error: 'Listing cap reached. Upgrade plan or unpublish another listing.' };
  }

  const slug = await uniqueSlug(slugify(input.title));
  const { data, error } = await supabase
    .from('products')
    .insert({
      slug,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      price: input.price,
      currency: input.currency,
      moq: input.moq,
      unit: input.unit,
      image_url: input.imageUrl,
      images: [input.imageUrl],
      sample_available: input.sampleAvailable,
      lead_time_days: input.leadTimeDays,
      status: input.status,
      supplier_id: supplier.id,
      hsn_code: input.hsnCode,
      gst_rate_bps: input.gstRateBps,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/listings');
  redirect(`/listings/${data.id}/edit`);
}

export async function updateListingAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const { supplier } = await getSessionProfile();
  if (!supplier?.id) return { error: 'Seller company required.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing listing id.' };

  const parsed = parseListingForm(formData);
  if ('error' in parsed && parsed.error) return { error: parsed.error };
  const input = parsed as Exclude<ReturnType<typeof parseListingForm>, { error: string }>;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('products')
    .select('id, status')
    .eq('id', id)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (!existing) return { error: 'Listing not found.' };

  if (input.status === 'published' && existing.status !== 'published') {
    const { data: can } = await supabase.rpc('supplier_can_publish_listing', {
      p_supplier_id: supplier.id,
    });
    if (!can) return { error: 'Listing cap reached. Upgrade plan or unpublish another listing.' };
  }

  const { error } = await supabase
    .from('products')
    .update({
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      price: input.price,
      currency: input.currency,
      moq: input.moq,
      unit: input.unit,
      image_url: input.imageUrl,
      images: [input.imageUrl],
      sample_available: input.sampleAvailable,
      lead_time_days: input.leadTimeDays,
      status: input.status,
      hsn_code: input.hsnCode,
      gst_rate_bps: input.gstRateBps,
    })
    .eq('id', id)
    .eq('supplier_id', supplier.id);

  if (error) return { error: error.message };

  revalidatePath('/listings');
  revalidatePath(`/listings/${id}/edit`);
  return {};
}

export async function setListingStatusAction(listingId: string, status: 'draft' | 'published' | 'archived') {
  const { supplier } = await getSessionProfile();
  if (!supplier?.id) return { ok: false as const, error: 'Seller company required.' };

  const supabase = await createClient();
  if (status === 'published') {
    const { data: can } = await supabase.rpc('supplier_can_publish_listing', {
      p_supplier_id: supplier.id,
    });
    if (!can) return { ok: false as const, error: 'Listing cap reached.' };
  }

  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', listingId)
    .eq('supplier_id', supplier.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/listings');
  return { ok: true as const };
}

export async function uploadGalleryMediaAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const contentKind = String(formData.get('contentKind') ?? 'image') as 'image' | 'video';
  if (contentKind === 'video') {
    return uploadGalleryVideoAction(_prev, formData);
  }
  return uploadGalleryPhotoAction(_prev, formData);
}

export async function uploadGalleryPhotoAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' };

  const file = formData.get('file');
  const caption = String(formData.get('caption') ?? '').trim();
  const mediaType = String(formData.get('mediaType') ?? 'factory');

  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image file.' };
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { error: 'Images max 5MB.' };

  const supabase = await createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${user.id}/${supplier.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('supplier-media').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from('supplier-media').getPublicUrl(path);
  const { error } = await supabase.from('supplier_gallery').insert({
    supplier_id: supplier.id,
    media_type: mediaType,
    content_kind: 'image',
    image_url: pub.publicUrl,
    caption: caption || null,
    uploaded_by: user.id,
    status: 'pending',
  });

  if (error) return { error: error.message };
  revalidatePath('/gallery');
  return { ok: true };
}

export async function uploadGalleryVideoAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' };

  const plan = await getSupplierVideoPlanFeatures(supplier.id);
  const maxSlots = plan.videoSlots;
  if (!maxSlots || maxSlots <= 0) {
    return { error: 'Factory videos require Business plan or higher (or Export/Enterprise).' };
  }

  const supabase = await createClient();
  const { data: used } = await supabase.rpc('supplier_video_slot_count', {
    p_supplier_id: supplier.id,
  });
  if (Number(used) >= maxSlots) {
    return { error: `Video limit reached (${maxSlots}). Remove a pending video or upgrade plan.` };
  }

  const caption = String(formData.get('caption') ?? '').trim();
  const mediaType = String(formData.get('mediaType') ?? 'factory');
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Upload a video file — external URLs are not allowed.' };
  }

  let videoUrl = '';
  if (file instanceof File && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) return { error: 'Max 50MB for video files.' };
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${user.id}/${supplier.id}/videos/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('supplier-media').upload(path, file, {
      contentType: file.type || 'video/mp4',
      upsert: false,
    });
    if (uploadError) return { error: uploadError.message };
    videoUrl = supabase.storage.from('supplier-media').getPublicUrl(path).data.publicUrl;
  }

  if (!videoUrl.startsWith('http')) {
    return { error: 'Video upload failed.' };
  }

  const thumb = '';

  const { error } = await supabase.from('supplier_gallery').insert({
    supplier_id: supplier.id,
    media_type: mediaType,
    content_kind: 'video',
    image_url: thumb,
    video_url: videoUrl,
    caption: caption || null,
    uploaded_by: user.id,
    status: 'pending',
  });

  if (error) return { error: error.message };
  revalidatePath('/gallery');
  return { ok: true };
}

export async function updateCompanySettingsAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' };

  const name = String(formData.get('name') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const mainProducts = String(formData.get('mainProducts') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const yearsInBusiness = Number(formData.get('yearsInBusiness') || 0);
  const phone = String(formData.get('phone') ?? '').trim();
  const gstin = String(formData.get('gstin') ?? '').trim();
  const pan = String(formData.get('pan') ?? '').trim();
  const pincode = String(formData.get('pincode') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const businessType = String(formData.get('businessType') ?? '').trim();
  const msmeUdhyam = String(formData.get('msmeUdhyam') ?? '').trim();
  const employeeCountBand = String(formData.get('employeeCountBand') ?? '').trim();
  const exportMarketsRaw = String(formData.get('exportMarkets') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();

  if (name.length < 2) return { error: 'Company name required.' };
  if (!country || !city) return { error: 'Country and city required.' };
  if (!state) return { error: 'State required (IndiaMART).' };
  if (!pincode || !isValidPincode(pincode)) return { error: 'Valid 6-digit PIN code required.' };
  if (!pan || !isValidPan(pan)) return { error: 'Valid PAN required (AAAAA9999A).' };
  if (gstin && !isValidGstin(gstin)) return { error: 'GSTIN format invalid.' };
  if (!mainProducts) return { error: 'Main products required.' };
  if (!phone || phone.length < 8) return { error: 'Phone required (Alibaba/IndiaMART-style).' };
  if (!['manufacturer', 'trader', 'both'].includes(businessType)) {
    return { error: 'Business type required.' };
  }

  const exportMarkets = exportMarketsRaw
    ? exportMarketsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const supabase = await createClient();
  const { error: supplierError } = await supabase
    .from('suppliers')
    .update({
      name,
      country,
      city,
      state,
      pincode,
      pan: normalizePan(pan),
      business_type: businessType,
      msme_udhyam: msmeUdhyam || null,
      employee_count_band: employeeCountBand || null,
      export_markets: exportMarkets,
      main_products: mainProducts,
      description: description || `${name} — ${mainProducts}`,
      years_in_business: Number.isFinite(yearsInBusiness) ? yearsInBusiness : 0,
    })
    .eq('id', supplier.id)
    .eq('owner_id', user.id);

  if (supplierError) return { error: supplierError.message };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      company_name: name,
      phone,
      country,
      city,
      gstin: gstin ? normalizeGstin(gstin) : null,
    })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath('/settings');
  revalidatePath('/storefront');
  revalidatePath('/');
  return { ok: true };
}

export async function updateComplianceSettingsAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' };

  const name = String(formData.get('name') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const gstin = String(formData.get('gstin') ?? '').trim();
  const pan = String(formData.get('pan') ?? '').trim();
  const pincode = String(formData.get('pincode') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const businessType = String(formData.get('businessType') ?? '').trim();
  const msmeUdhyam = String(formData.get('msmeUdhyam') ?? '').trim();
  const exportMarketsRaw = String(formData.get('exportMarkets') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();

  if (name.length < 2) return { error: 'Company name required.' };
  if (!country || !city) return { error: 'Country and city required.' };
  if (!state) return { error: 'State required (IndiaMART).' };
  if (!pincode || !isValidPincode(pincode)) return { error: 'Valid 6-digit PIN code required.' };
  if (!pan || !isValidPan(pan)) return { error: 'Valid PAN required (AAAAA9999A).' };
  if (gstin && !isValidGstin(gstin)) return { error: 'GSTIN format invalid.' };
  if (!phone || phone.length < 8) return { error: 'Phone required (Alibaba/IndiaMART-style).' };
  if (!['manufacturer', 'trader', 'both'].includes(businessType)) {
    return { error: 'Business type required.' };
  }

  const exportMarkets = exportMarketsRaw
    ? exportMarketsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const supabase = await createClient();
  const { error: supplierError } = await supabase
    .from('suppliers')
    .update({
      name,
      country,
      city,
      state,
      pincode,
      pan: normalizePan(pan),
      business_type: businessType,
      msme_udhyam: msmeUdhyam || null,
      export_markets: exportMarkets,
    })
    .eq('id', supplier.id)
    .eq('owner_id', user.id);

  if (supplierError) return { error: supplierError.message };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      company_name: name,
      phone,
      country,
      city,
      gstin: gstin ? normalizeGstin(gstin) : null,
    })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath('/storefront');
  return { ok: true };
}

export async function uploadCertificateAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' };

  const name = String(formData.get('name') ?? '').trim();
  const certType = String(formData.get('certType') ?? 'other').trim();
  const certNumber = String(formData.get('certNumber') ?? '').trim();
  const issuingAuthority = String(formData.get('issuingAuthority') ?? '').trim();
  const expiresAt = String(formData.get('expiresAt') ?? '').trim() || null;
  const file = formData.get('file');

  if (name.length < 2) return { error: 'Certificate name required.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a PDF or image.' };
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { error: 'Images max 5MB.' };

  const supabase = await createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const path = `${user.id}/${supplier.id}/certs/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('supplier-media').upload(path, file, {
    contentType: file.type || 'application/pdf',
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from('supplier-media').getPublicUrl(path);
  const { error } = await supabase.from('supplier_certificates').insert({
    supplier_id: supplier.id,
    name,
    cert_type: certType,
    cert_number: certNumber || null,
    issuing_authority: issuingAuthority || null,
    expires_at: expiresAt,
    file_url: pub.publicUrl,
    status: 'pending',
  });

  if (error) return { error: error.message };
  revalidatePath('/certificates');
  return { ok: true };
}
