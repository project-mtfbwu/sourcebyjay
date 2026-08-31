'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { isSelfHostedMediaUrl, MAX_PRODUCT_MEDIA, MAX_IMAGE_UPLOAD_BYTES, isHeicUploadFile, isImageUploadFile, isVideoUploadFile } from '@/lib/media-storage';

async function requireSeller() {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) return { error: 'Seller company required.' as const };
  return { user, supplier };
}

const DEFAULT_FOLDERS = [
  { name: 'Product photos', sort_order: 0 },
  { name: 'Product videos', sort_order: 1 },
  { name: 'Factory tours', sort_order: 2 },
] as const;

/** Idempotent: inserts only missing default folder names. */
export async function ensureDefaultFoldersAction(supplierId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('supplier_media_folders')
    .select('name')
    .eq('supplier_id', supplierId)
    .is('parent_id', null);

  const have = new Set((existing ?? []).map((r) => r.name));
  const missing = DEFAULT_FOLDERS.filter((f) => !have.has(f.name));
  if (missing.length === 0) return;

  await supabase.from('supplier_media_folders').insert(
    missing.map((f) => ({
      supplier_id: supplierId,
      name: f.name,
      sort_order: f.sort_order,
    })),
  );
}

export async function createMediaFolderAction(
  name: string,
): Promise<{ error?: string; ok?: boolean; id?: string }> {
  const session = await requireSeller();
  if ('error' in session) return { error: session.error };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return { error: 'Folder name required (max 80 chars).' };

  const supabase = await createClient();
  await ensureDefaultFoldersAction(session.supplier.id);

  const { data, error } = await supabase
    .from('supplier_media_folders')
    .insert({
      supplier_id: session.supplier.id,
      name: trimmed,
      sort_order: 100,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'A folder with that name already exists.' };
    return { error: error.message };
  }

  revalidatePath('/media');
  return { ok: true, id: data.id };
}

export async function uploadMediaAssetAction(
  _prev: { error?: string; ok?: boolean; publicUrl?: string } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; publicUrl?: string; assetId?: string }> {
  const session = await requireSeller();
  if ('error' in session) return { error: session.error };

  const { user, supplier } = session;
  const folderId = String(formData.get('folderId') ?? '').trim() || null;
  const caption = String(formData.get('caption') ?? '').trim();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' };

  if (isHeicUploadFile(file)) return { error: 'HEIC/HEIF not supported — export as JPG or PNG first.' };
  const isVideo = isVideoUploadFile(file);
  const isImage = isImageUploadFile(file);
  if (!isVideo && !isImage) return { error: 'Only JPG, PNG, WebP, GIF, or MP4/WebM video.' };
  if (isImage && file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { error: 'Images max 5MB.' };
  }
  if (isVideo && file.size > 50 * 1024 * 1024) return { error: 'Videos max 50MB.' };

  const supabase = await createClient();
  await ensureDefaultFoldersAction(supplier.id);

  const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const path = `${user.id}/${supplier.id}/library/${folderId ?? 'root'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('supplier-media').upload(path, file, {
    contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const publicUrl = supabase.storage.from('supplier-media').getPublicUrl(path).data.publicUrl;

  const { data: row, error } = await supabase
    .from('supplier_media_assets')
    .insert({
      supplier_id: supplier.id,
      folder_id: folderId,
      content_kind: isVideo ? 'video' : 'image',
      storage_path: path,
      public_url: publicUrl,
      thumbnail_url: isVideo ? null : publicUrl,
      caption: caption || file.name,
      file_size_bytes: file.size,
      uploaded_by: user.id,
      status: 'approved',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/media');
  return { ok: true, publicUrl, assetId: row.id };
}

export async function deleteMediaAssetAction(
  assetId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSeller();
  if ('error' in session) return { error: session.error };

  const supabase = await createClient();
  const { data: asset } = await supabase
    .from('supplier_media_assets')
    .select('id, storage_path')
    .eq('id', assetId)
    .eq('supplier_id', session.supplier.id)
    .maybeSingle();

  if (!asset) return { error: 'File not found.' };

  await supabase.from('product_media').delete().eq('asset_id', assetId);
  await supabase.from('supplier_media_assets').delete().eq('id', assetId);
  if (asset.storage_path) {
    await supabase.storage.from('supplier-media').remove([asset.storage_path]);
  }

  revalidatePath('/media');
  revalidatePath('/listings');
  return { ok: true };
}

export async function saveProductMediaAction(
  productId: string,
  assetIds: string[],
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSeller();
  if ('error' in session) return { error: session.error };

  const { supplier } = session;
  if (assetIds.length === 0) return { error: 'Add at least one photo from your media library.' };
  if (assetIds.length > MAX_PRODUCT_MEDIA) {
    return { error: `Maximum ${MAX_PRODUCT_MEDIA} images/videos per listing.` };
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (!product) return { error: 'Listing not found.' };

  const { data: assets } = await supabase
    .from('supplier_media_assets')
    .select('id, public_url, content_kind, status')
    .eq('supplier_id', supplier.id)
    .in('id', assetIds);

  if (!assets || assets.length !== assetIds.length) {
    return { error: 'Some media items were not found in your library.' };
  }

  for (const a of assets) {
    if (a.status === 'archived' || a.status === 'flagged') {
      return { error: 'Cannot use flagged or archived media on a listing.' };
    }
    if (!isSelfHostedMediaUrl(a.public_url)) {
      return { error: 'Only self-uploaded media from your library is allowed.' };
    }
  }

  await supabase.from('product_media').delete().eq('product_id', productId);

  const rows = assetIds.map((assetId, index) => ({
    product_id: productId,
    asset_id: assetId,
    sort_order: index,
  }));

  const { error: linkError } = await supabase.from('product_media').insert(rows);
  if (linkError) return { error: linkError.message };

  const primary = assets.find((a) => a.id === assetIds[0]);
  const images = assets.filter((a) => a.content_kind === 'image').map((a) => a.public_url);
  const firstVideo = assets.find((a) => a.content_kind === 'video');

  const { error: updateError } = await supabase
    .from('products')
    .update({
      image_url: primary?.public_url ?? images[0] ?? '',
      images: images.length > 0 ? images : [primary?.public_url ?? ''],
      video_url: firstVideo?.public_url ?? null,
      product_video_enabled: Boolean(firstVideo),
    })
    .eq('id', productId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/listings');
  revalidatePath(`/listings/${productId}/edit`);
  return { ok: true };
}

export async function submitFactoryMediaFromLibraryAction(
  assetId: string,
  mediaType: string,
  caption: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSeller();
  if ('error' in session) return { error: session.error };

  const { user, supplier } = session;
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from('supplier_media_assets')
    .select('id, public_url, content_kind, thumbnail_url')
    .eq('id', assetId)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (!asset || !isSelfHostedMediaUrl(asset.public_url)) {
    return { error: 'Pick a file from your media library.' };
  }

  const thumb =
    asset.content_kind === 'video'
      ? asset.thumbnail_url ?? asset.public_url
      : asset.public_url;

  const { error } = await supabase.from('supplier_gallery').insert({
    supplier_id: supplier.id,
    media_type: mediaType,
    content_kind: asset.content_kind,
    image_url: thumb,
    video_url: asset.content_kind === 'video' ? asset.public_url : null,
    asset_id: asset.id,
    caption: caption || null,
    uploaded_by: user.id,
    status: 'pending',
  });

  if (error) return { error: error.message };
  revalidatePath('/gallery');
  return { ok: true };
}
