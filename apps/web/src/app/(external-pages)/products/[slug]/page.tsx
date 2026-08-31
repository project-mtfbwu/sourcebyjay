import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ProductDetailView, RelatedProducts } from '@/components/marketplace/product/ProductDetail';
import { getProductBySlug, getProductsBySupplier, getSupplierById } from '@/data/anon/marketplace';
import {
  buildSupplierStorefrontPath,
  supplierHasCustomMinisite,
} from '@/data/anon/supplier-storefront';
import { createSupabaseClient } from '@/supabase-clients/server';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function ProductPageFallback() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-10 lg:px-10">
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4">
          <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const supplier = await getSupplierById(product.supplierId);
  if (!supplier) {
    notFound();
  }

  const supabase = await createSupabaseClient();
  const { data: planFeatures } = await supabase.rpc('supplier_plan_features', {
    p_supplier_id: product.supplierId,
  });
  const canShowProductVideo = Boolean(
    (planFeatures as { product_video?: boolean } | null)?.product_video,
  );
  if (!canShowProductVideo) {
    product.productVideoEnabled = false;
  }

  const related = (await getProductsBySupplier(product.supplierId))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at')
    .or(`product_id.eq.${product.id},supplier_id.eq.${product.supplierId}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const reviews = reviewRows ?? [];
  const reviewAverage =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  let initialFavorited = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: fav } = await supabase
        .from('buyer_favorites')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      initialFavorited = Boolean(fav);
    }
  } catch {
    /* anonymous */
  }

  const hasMinisite = await supplierHasCustomMinisite(supplier.id);
  const supplierStorefrontHref = buildSupplierStorefrontPath(supplier.slug, hasMinisite, {
    productId: product.id,
    from: 'detail_company_card',
  });

  return (
    <>
      <ProductDetailView
        product={product}
        supplier={supplier}
        reviews={reviews}
        reviewAverage={reviewAverage}
        initialFavorited={initialFavorited}
        supplierStorefrontHref={supplierStorefrontHref}
      />
      <div className="mx-auto max-w-[1440px] px-4 pb-12 lg:px-10">
        <RelatedProducts products={related} />
      </div>
    </>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.title} | SourceByJay` : 'Product | SourceByJay',
  };
}
