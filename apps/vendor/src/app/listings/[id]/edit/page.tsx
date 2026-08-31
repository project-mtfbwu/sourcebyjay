import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { ListingForm } from '@/components/ListingForm';
import { ProductMediaPicker } from '@/components/ProductMediaPicker';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { ensureDefaultFoldersAction } from '@/lib/media-actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Edit listing" subtitle="Update product details.">
        <div className="card denied">
          <Link href="/login">Sign in</Link> required.
        </div>
      </VendorAuthenticated>
    );
  }

  await ensureDefaultFoldersAction(supplier.id);

  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: folders }, { data: libraryAssets }, { data: productMedia }] =
    await Promise.all([
      supabase
        .from('products')
        .select(
          'id, title, description, category_id, price, currency, moq, unit, image_url, status, sample_available, lead_time_days, hsn_code, gst_rate_bps',
        )
        .eq('id', id)
        .eq('supplier_id', supplier.id)
        .maybeSingle(),
      supabase.from('categories').select('id, name').order('name'),
      supabase
        .from('supplier_media_folders')
        .select('id, name')
        .eq('supplier_id', supplier.id)
        .order('sort_order'),
      supabase
        .from('supplier_media_assets')
        .select('id, public_url, content_kind, caption, folder_id, created_at, file_size_bytes')
        .eq('supplier_id', supplier.id)
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false }),
      supabase
        .from('product_media')
        .select('asset_id, sort_order')
        .eq('product_id', id)
        .order('sort_order'),
    ]);

  if (!product) notFound();

  const seen = new Set<string>();
  const folderList = (folders ?? []).filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  return (
    <VendorAuthenticated title="Edit listing" subtitle={product.title as string}>
      <p className="muted">
        <Link href="/listings">← Back to listings</Link>
      </p>
      <ListingForm
        categories={categories ?? []}
        mode="edit"
        defaults={{
          id: product.id,
          title: product.title,
          description: product.description,
          categoryId: product.category_id ?? undefined,
          price: Number(product.price),
          currency: product.currency,
          moq: product.moq,
          unit: product.unit,
          imageUrl: product.image_url,
          status: product.status,
          sampleAvailable: product.sample_available,
          leadTimeDays: product.lead_time_days,
          hsnCode: product.hsn_code,
          gstRateBps: product.gst_rate_bps,
        }}
      />
      <ProductMediaPicker
        productId={product.id}
        folders={folderList.map((f) => ({ id: f.id, name: f.name }))}
        libraryAssets={(libraryAssets ?? []).map((a) => ({
          id: a.id,
          publicUrl: a.public_url,
          contentKind: a.content_kind as 'image' | 'video',
          caption: a.caption,
          folderId: a.folder_id,
          createdAt: a.created_at,
          fileSizeBytes: a.file_size_bytes,
        }))}
        initialSelectedIds={(productMedia ?? []).map((m) => m.asset_id)}
      />
    </VendorAuthenticated>
  );
}
