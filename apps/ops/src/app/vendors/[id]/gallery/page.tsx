import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { getOpsSession } from '@/lib/session';
import { createClient } from '@/lib/supabase';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { OpsGalleryReview } from '@/components/OpsGalleryReview';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsVendorGalleryPage({ params }: PageProps) {
  const { id } = await params;
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const [{ data: vendor }, { data: items }, { data: libraryItems }] = await Promise.all([
    supabase.from('suppliers').select('id, name').eq('id', id).maybeSingle(),
    supabase
      .from('supplier_gallery')
      .select('id, image_url, video_url, caption, media_type, content_kind, status, staff_note, created_at')
      .eq('supplier_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('supplier_media_assets')
      .select('id, public_url, thumbnail_url, content_kind, caption, status, staff_note, created_at')
      .eq('supplier_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Gallery approval"
      subtitle={vendor?.name ? String(vendor.name) : 'Seller gallery'}
    >
      <p style={{ marginTop: 0 }}>
        <Link href={`/vendors/${id}`}>← Seller</Link>
      </p>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="muted" style={{ margin: 0 }}>
          Approve / reject factory photos and videos. Only approved media shows on the public storefront.
        </p>
      </div>
      <OpsGalleryReview items={items ?? []} libraryItems={libraryItems ?? []} />
    </OpsShell>
  );
}
