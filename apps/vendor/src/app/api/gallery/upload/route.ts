import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { getSupplierVideoPlanFeatures } from '@/lib/plan-features';
import { MAX_IMAGE_UPLOAD_BYTES, isHeicUploadFile, isImageUploadFile, isVideoUploadFile } from '@/lib/media-storage';

export const runtime = 'nodejs';

/** Factory gallery upload for Cubone FileManager (ops-reviewed storefront media). */
export async function POST(request: Request) {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const mediaType = String(form.get('mediaType') ?? 'factory').trim() || 'factory';
  const caption = String(form.get('caption') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file.' }, { status: 400 });
  }

  const isVideo = isVideoUploadFile(file);
  const isImage = isImageUploadFile(file);
  if (isHeicUploadFile(file)) {
    return NextResponse.json(
      { error: 'HEIC/HEIF not supported — export as JPG or PNG first.' },
      { status: 400 },
    );
  }
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF, or MP4/WebM video.' }, { status: 400 });
  }

  const supabase = await createClient();

  if (isVideo) {
    const plan = await getSupplierVideoPlanFeatures(supplier.id);
    const maxSlots = plan.videoSlots;
    if (!maxSlots || maxSlots <= 0) {
      return NextResponse.json(
        { error: 'Factory videos require Business plan or higher.' },
        { status: 403 },
      );
    }
    const { data: used } = await supabase.rpc('supplier_video_slot_count', {
      p_supplier_id: supplier.id,
    });
    if (Number(used) >= maxSlots) {
      return NextResponse.json({ error: `Video limit reached (${maxSlots}).` }, { status: 403 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Videos max 50MB.' }, { status: 400 });
    }
  } else if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Images max 5MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const storagePath = `${user.id}/${supplier.id}/factory/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('supplier-media').upload(storagePath, file, {
    contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from('supplier-media').getPublicUrl(storagePath).data.publicUrl;
  const thumb = isVideo ? '' : publicUrl;

  const { data: row, error } = await supabase
    .from('supplier_gallery')
    .insert({
      supplier_id: supplier.id,
      media_type: mediaType,
      content_kind: isVideo ? 'video' : 'image',
      image_url: thumb,
      video_url: isVideo ? publicUrl : null,
      caption: caption || file.name,
      uploaded_by: user.id,
      status: 'pending',
    })
    .select('id, created_at, status, media_type, content_kind')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const kindFolder = isVideo ? 'Videos' : 'Photos';
  const safeName = file.name.replace(/\//g, '-');

  return NextResponse.json({
    name: safeName,
    isDirectory: false,
    path: `/${kindFolder}/${row.id}__${safeName}`,
    updatedAt: row.created_at,
    size: file.size,
    id: row.id,
    publicUrl: isVideo ? publicUrl : thumb,
    contentKind: row.content_kind,
    status: row.status,
    mediaType: row.media_type,
  });
}
