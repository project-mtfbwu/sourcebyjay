import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { FactoryGalleryDrive } from '@/components/FactoryGalleryDrive';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { getSupplierVideoPlanFeatures } from '@/lib/plan-features';

export default async function VendorGalleryPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Factory gallery" subtitle="Trust media — ops approves before public display.">
        <div className="card denied">
          <Link href="/login">Sign in</Link> as a seller to upload factory photos and videos.
        </div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const [plan, { data: rows }] = await Promise.all([
    getSupplierVideoPlanFeatures(supplier.id),
    supabase
      .from('supplier_gallery')
      .select('id, image_url, video_url, caption, media_type, content_kind, status, created_at')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <VendorAuthenticated
      title="Factory gallery"
      subtitle="Chonky2 — upload, Photos/Videos folders, grid/list, preview on this page"
    >
      <FactoryGalleryDrive
        plan={plan}
        items={(rows ?? []).map((row) => ({
          id: row.id,
          imageUrl: row.image_url as string,
          videoUrl: (row.video_url as string | null) ?? null,
          caption: (row.caption as string | null) ?? null,
          mediaType: row.media_type as string,
          contentKind: ((row.content_kind as string) ?? 'image') as 'image' | 'video',
          status: row.status as string,
          createdAt: row.created_at as string,
        }))}
      />
    </VendorAuthenticated>
  );
}
