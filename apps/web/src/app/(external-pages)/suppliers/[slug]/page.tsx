import { notFound } from 'next/navigation';
import { SupplierProfileView } from '@/components/marketplace/supplier/SupplierProfile';
import {
  getProductsBySupplier,
  getSupplierBySlug,
  getSupplierCertificates,
  getSupplierGallery,
} from '@/data/anon/marketplace';

interface SupplierPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SupplierPage({ params }: SupplierPageProps) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);

  if (!supplier) {
    notFound();
  }

  const [products, gallery, certificates] = await Promise.all([
    getProductsBySupplier(supplier.id),
    getSupplierGallery(supplier.id),
    getSupplierCertificates(supplier.id),
  ]);

  return (
    <SupplierProfileView
      supplier={supplier}
      products={products}
      gallery={gallery}
      certificates={certificates}
    />
  );
}

export async function generateMetadata({ params }: SupplierPageProps) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  return {
    title: supplier ? `${supplier.name} | SourceByJay` : 'Supplier | SourceByJay',
  };
}
