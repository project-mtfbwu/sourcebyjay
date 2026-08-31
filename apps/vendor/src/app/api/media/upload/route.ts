import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { ensureDefaultFoldersAction } from '@/lib/media-actions';
import { MAX_IMAGE_UPLOAD_BYTES, isHeicUploadFile, isImageUploadFile, isVideoUploadFile } from '@/lib/media-storage';

export const runtime = 'nodejs';

/** Cubone FileManager POST target — returns a File object JSON for onFileUploaded. */
export async function POST(request: Request) {
  const { user, supplier } = await getSessionProfile();
  if (!user || !supplier?.id) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const folderId = String(form.get('folderId') ?? '').trim() || null;
  const folderPath = String(form.get('folderPath') ?? form.get('parentPath') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file.' }, { status: 400 });
  }

  const isVideo = isVideoUploadFile(file);
  const isImage = isImageUploadFile(file);
  if (isHeicUploadFile(file)) {
    return NextResponse.json(
      { error: 'HEIC/HEIF not supported — export as JPG or PNG first (Photos → Share → Save as JPEG).' },
      { status: 400 },
    );
  }
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF images (or MP4/WebM video).' }, { status: 400 });
  }
  if (isImage && file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Images max 5MB.' }, { status: 400 });
  }
  if (isVideo && file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Videos max 50MB.' }, { status: 400 });
  }

  const supabase = await createClient();
  await ensureDefaultFoldersAction(supplier.id);

  let resolvedFolderId = folderId;
  if (!resolvedFolderId && folderPath) {
    const folderName = folderPath.replace(/^\//, '').split('/')[0];
    if (folderName) {
      const { data: folder } = await supabase
        .from('supplier_media_folders')
        .select('id')
        .eq('supplier_id', supplier.id)
        .eq('name', folderName)
        .maybeSingle();
      resolvedFolderId = folder?.id ?? null;
    }
  }

  if (!resolvedFolderId) {
    const { data: first } = await supabase
      .from('supplier_media_folders')
      .select('id, name')
      .eq('supplier_id', supplier.id)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    resolvedFolderId = first?.id ?? null;
  }

  const { data: folderRow } = resolvedFolderId
    ? await supabase.from('supplier_media_folders').select('id, name').eq('id', resolvedFolderId).maybeSingle()
    : { data: null };

  const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const path = `${user.id}/${supplier.id}/library/${resolvedFolderId ?? 'root'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('supplier-media').upload(path, file, {
    contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from('supplier-media').getPublicUrl(path).data.publicUrl;

  const { data: row, error } = await supabase
    .from('supplier_media_assets')
    .insert({
      supplier_id: supplier.id,
      folder_id: resolvedFolderId,
      content_kind: isVideo ? 'video' : 'image',
      storage_path: path,
      public_url: publicUrl,
      thumbnail_url: isVideo ? null : publicUrl,
      caption: file.name,
      file_size_bytes: file.size,
      uploaded_by: user.id,
      status: 'approved',
    })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const folderName = folderRow?.name ?? 'Library';
  const safeName = file.name.replace(/\//g, '-');
  const fmPath = `/${folderName}/${row.id}__${safeName}`;

  // Cubone expects the uploaded File object (often JSON.parsed from body)
  return NextResponse.json({
    name: safeName,
    isDirectory: false,
    path: fmPath,
    updatedAt: row.created_at,
    size: file.size,
    // extras for our UI
    id: row.id,
    publicUrl,
    contentKind: isVideo ? 'video' : 'image',
    folderId: resolvedFolderId,
  });
}
