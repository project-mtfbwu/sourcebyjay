import { notFound } from 'next/navigation';

import { ProductDetailView, RelatedProducts } from '@/components/marketplace/product/ProductDetail';
import { getProductBySlug, getProductsBySupplier, getSupplierById } from '@/data/anon/marketplace';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const supplier = await getSupplierById(product.supplierId);
  if (!supplier) {
    notFound();
  }

  const related = (await getProductsBySupplier(product.supplierId))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <ProductDetailView product={product} supplier={supplier} />
      <div className="mx-auto max-w-[1440px] px-4 pb-12 lg:px-10">
        <RelatedProducts products={related} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.title} | SourceByJay` : 'Product | SourceByJay',
  };
}
