import {
  getCategories,
  getProductsBySupplier,
  getSupplierBySlug,
  getSupplierCertificates,
  getSupplierGallery,
} from '@/data/anon/marketplace';
import type { Category, Product, Supplier, SupplierCertificate, SupplierGalleryItem } from '@/types/marketplace';

export type SupplierPreviewData = {
  supplier: Supplier;
  products: Product[];
  gallery: SupplierGalleryItem[];
  videos: SupplierGalleryItem[];
  certificates: SupplierCertificate[];
  categories: Category[];
};

export async function loadSupplierPreviewData(slug: string): Promise<SupplierPreviewData | null> {
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) return null;

  const [products, galleryItems, certificates, categories] = await Promise.all([
    getProductsBySupplier(supplier.id),
    getSupplierGallery(supplier.id),
    getSupplierCertificates(supplier.id),
    getCategories(),
  ]);

  return {
    supplier,
    products,
    gallery: galleryItems.filter((g) => g.contentKind !== 'video'),
    videos: galleryItems.filter((g) => g.contentKind === 'video'),
    certificates,
    categories,
  };
}
