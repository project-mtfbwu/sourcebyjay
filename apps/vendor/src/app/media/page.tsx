import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { SupplierFileBrowser } from '@/components/SupplierFileBrowser';
import { ensureDefaultFoldersAction } from '@/lib/media-actions';

export default async function MediaLibraryPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Media library" subtitle="Finder / Google Drive for your catalog media.">
        <div className="card denied">
          <Link href="/login">Sign in</Link> required.
        </div>
      </VendorAuthenticated>
    );
  }

  await ensureDefaultFoldersAction(supplier.id);

  const supabase = await createClient();
  const [{ data: folders }, { data: assets }] = await Promise.all([
    supabase
      .from('supplier_media_folders')
      .select('id, name, sort_order')
      .eq('supplier_id', supplier.id)
      .order('sort_order'),
    supabase
      .from('supplier_media_assets')
      .select('id, public_url, content_kind, caption, folder_id, status, created_at, file_size_bytes')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false }),
  ]);

  const seen = new Set<string>();
  const folderList = (folders ?? []).filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  return (
    <VendorAuthenticated
      title="Media library"
      subtitle="Chonky2 file browser — upload, folders, grid/list, preview, delete"
    >
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Central library for reuse across listings. You can also upload <strong>directly on a listing edit
          page</strong> or on Factory gallery — you do not have to leave those pages.
        </p>
      </div>

      <SupplierFileBrowser
        mode="library"
        folders={folderList.map((f) => ({ id: f.id, name: f.name }))}
        assets={(assets ?? []).map((a) => ({
          id: a.id,
          publicUrl: a.public_url,
          contentKind: a.content_kind as 'image' | 'video',
          caption: a.caption,
          folderId: a.folder_id,
          status: a.status,
          createdAt: a.created_at,
          fileSizeBytes: a.file_size_bytes,
        }))}
        height={560}
        showCreateFolder
      />
    </VendorAuthenticated>
  );
}
