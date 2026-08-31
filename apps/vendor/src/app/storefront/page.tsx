import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { getSupplierVideoPlanFeatures } from '@/lib/plan-features';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { StorefrontStudio } from '@/components/StorefrontStudio';
import { ensureDefaultFoldersAction } from '@/lib/media-actions';
import { ensureStorefrontEditableDraftAction } from '@/lib/storefront-actions';
import {
  hydrateMainProductCategories,
  normalizeStorefrontPayload,
  parentCategoriesFromProductCategories,
  payloadFromSupplierRow,
} from '@sourcebyjay/types';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

export default async function VendorStorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string }>;
}) {
  const { version: versionQuery } = await searchParams;
  const { user, profile, supplier } = await getSessionProfile();

  if (!supplier?.id || !supplier.slug) {
    return (
      <VendorAuthenticated title="Storefront" subtitle="Marketing editor with live buyer preview.">
        <div className="card denied">
          Complete seller signup first — then your factory page goes live here.
        </div>
      </VendorAuthenticated>
    );
  }

  await ensureDefaultFoldersAction(supplier.id);

  const supabase = await createClient();
  const plan = await getSupplierVideoPlanFeatures(supplier.id);

  const [
    { data: supplierRow },
    { data: profileRow },
    { data: versionRows },
    { data: assets },
    { data: products },
    { data: categories },
    { count: certCount },
  ] = await Promise.all([
    supabase
      .from('suppliers')
      .select(
        'name, country, city, state, pan, msme_udhyam, employee_count_band, main_products, description, years_in_business, banner_url, logo_url, response_rate, storefront_featured_product_ids',
      )
      .eq('id', supplier.id)
      .single(),
    user
      ? supabase.from('profiles').select('gstin').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('supplier_storefront_versions')
      .select('id, version_number, version_label, status, review_notes, payload, updated_at')
      .eq('supplier_id', supplier.id)
      .order('version_number', { ascending: false })
      .limit(20),
    supabase
      .from('supplier_media_assets')
      .select('id, public_url, content_kind, caption, folder_id, status, created_at, file_size_bytes')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, title, image_url, status, category_id')
      .eq('supplier_id', supplier.id)
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
    supabase.from('categories').select('id, name, slug, parent_id'),
    supabase
      .from('supplier_certificates')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id),
  ]);

  if (!supplierRow) {
    return (
      <VendorAuthenticated title="Storefront" subtitle="Marketing editor with live buyer preview.">
        <div className="card denied">Supplier record missing.</div>
      </VendorAuthenticated>
    );
  }

  const livePayload = payloadFromSupplierRow(supplierRow);
  const versions = (versionRows ?? []).map((row) => ({
    id: row.id as string,
    versionNumber: row.version_number as number,
    versionLabel: (row.version_label as string | null) ?? null,
    status: row.status as string,
    reviewNotes: (row.review_notes as string | null) ?? null,
    updatedAt: row.updated_at as string,
    payload: normalizeStorefrontPayload(row.payload),
  }));

  const categoryRows = (categories ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    parentId: (c.parent_id as string | null) ?? null,
  }));

  const categoryOptions = parentCategoriesFromProductCategories(
    (products ?? []).map((p) => p.category_id as string | null).filter(Boolean) as string[],
    categoryRows,
  );

  let editableVersion = versions.find((v) => v.status === 'draft' || v.status === 'rejected');

  if (!editableVersion && versions.length > 0 && user) {
    const ensured = await ensureStorefrontEditableDraftAction();
    if (ensured.versionId && ensured.created) {
      redirect(`/storefront?version=${ensured.versionId}`);
    }
    if (ensured.versionId) {
      editableVersion = versions.find((v) => v.id === ensured.versionId) ?? editableVersion;
    }
  }

  const picked =
    (versionQuery ? versions.find((v) => v.id === versionQuery) : null) ??
    editableVersion ??
    versions[0] ??
    null;

  const rawInitial = picked?.payload ?? livePayload;
  const initialPayload = hydrateMainProductCategories(
    normalizeStorefrontPayload(rawInitial) ?? livePayload,
    categoryOptions,
  );
  const initialVersionId = picked?.id ?? null;
  const initialStatus = picked?.status ?? 'draft';

  return (
    <VendorAuthenticated
      title="Storefront"
      subtitle="Marketing layer only — banner, logo, featured products, about text. Company legal data is read-only."
    >
      <StorefrontStudio
        slug={supplier.slug}
        buyerUrl={buyerUrl}
        customMinisite={plan.customMinisite}
        profileFacts={{
          name: supplierRow.name,
          city: supplierRow.city,
          country: supplierRow.country,
          state: supplierRow.state,
          gstin: profileRow?.gstin,
          pan: supplierRow.pan,
          msmeUdhyam: supplierRow.msme_udhyam,
          yearsInBusiness: supplierRow.years_in_business ?? 0,
          employeeCountBand: supplierRow.employee_count_band,
          responseRate: supplierRow.response_rate,
          listingCount: (products ?? []).length,
          certificateCount: certCount ?? 0,
        }}
        catalogProducts={(products ?? []).map((p) => ({
          id: p.id as string,
          title: p.title as string,
          imageUrl: p.image_url as string,
        }))}
        categoryOptions={categoryOptions}
        mediaAssets={(assets ?? []).map((a) => ({
          id: a.id as string,
          publicUrl: a.public_url as string,
          contentKind: a.content_kind as 'image' | 'video',
          caption: a.caption as string | null,
          folderId: a.folder_id as string | null,
          status: a.status as string,
          createdAt: a.created_at as string,
          fileSizeBytes: a.file_size_bytes as number | null,
        }))}
        versions={versions.map(({ payload: _p, ...rest }) => rest)}
        editableDraftId={editableVersion?.id ?? null}
        initialVersionId={initialVersionId}
        initialPayload={initialPayload}
        initialStatus={initialStatus}
      />
      <p className="muted" style={{ marginTop: '1rem' }}>
        <Link href="/settings">Company settings (statutory)</Link>
        {' · '}
        <Link href="/media">Media library</Link>
      </p>
    </VendorAuthenticated>
  );
}
