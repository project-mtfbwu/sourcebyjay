import { notFound, redirect } from 'next/navigation';
import { SupplierProfileView } from '@/components/marketplace/supplier/SupplierProfile';
import {
  getCategories,
  getProductsBySupplier,
  getSupplierBySlug,
  getSupplierCertificates,
  getSupplierGallery,
} from '@/data/anon/marketplace';
import { supplierHasCustomMinisite } from '@/data/anon/supplier-storefront';

export async function renderSupplierStorefrontPage({
  slug,
  productId,
  entryFrom,
  mode,
}: {
  slug: string;
  productId?: string;
  entryFrom?: string;
  mode: 'marketplace' | 'minisite';
}) {
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) notFound();

  if (mode === 'minisite') {
    const hasMinisite = await supplierHasCustomMinisite(supplier.id);
    if (!hasMinisite) {
      const qs = new URLSearchParams();
      if (productId) qs.set('productId', productId);
      if (entryFrom) qs.set('from', entryFrom);
      const suffix = qs.toString();
      redirect(suffix ? `/suppliers/${slug}?${suffix}` : `/suppliers/${slug}`);
    }
  }

  const [products, galleryItems, certificates, categories] = await Promise.all([
    getProductsBySupplier(supplier.id),
    getSupplierGallery(supplier.id),
    getSupplierCertificates(supplier.id),
    getCategories(),
  ]);

  const gallery = galleryItems.filter((g) => g.contentKind !== 'video');
  const videos = galleryItems.filter((g) => g.contentKind === 'video');
  const contextProduct = productId ? products.find((p) => p.id === productId) ?? null : null;

  return (
    <SupplierProfileView
      supplier={supplier}
      products={products}
      gallery={gallery}
      videos={videos}
      certificates={certificates}
      categories={categories}
      contextProduct={contextProduct}
      entryFrom={entryFrom ?? null}
      variant={mode}
    />
  );
}
