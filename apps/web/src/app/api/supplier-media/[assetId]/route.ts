import { NextResponse } from 'next/server';
import { createSupabaseAnonServerClient } from '@/supabase-clients/anon/createSupabaseAnonServerClient';

function contentTypeForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

function isValidImageBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
  if (buffer.toString('ascii', 0, 3) === 'GIF') return true;
  return false;
}

/** Public read proxy for approved supplier media (storefront live preview). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await context.params;
  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  }

  const { data: asset } = await supabase
    .from('supplier_media_assets')
    .select('storage_path, status, content_kind')
    .eq('id', assetId)
    .maybeSingle();

  if (!asset || asset.status === 'rejected') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { data, error } = await supabase.storage.from('supplier-media').download(asset.storage_path);
  if (error || !data) {
    return NextResponse.json({ error: 'File missing.' }, { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  if (asset.content_kind === 'image' && !isValidImageBytes(buffer)) {
    return NextResponse.json({ error: 'Corrupt image file.' }, { status: 404 });
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentTypeForPath(asset.storage_path),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
