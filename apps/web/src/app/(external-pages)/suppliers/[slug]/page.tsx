import { Suspense } from 'react';
import { renderSupplierStorefrontPage } from '@/lib/supplier-storefront-page';
import { getSupplierBySlug } from '@/data/anon/marketplace';

interface SupplierPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ productId?: string; from?: string }>;
}

function SupplierPageFallback() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-10 lg:px-10">
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

async function SupplierContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ productId?: string; from?: string }>;
}) {
  const { slug } = await params;
  const { productId, from: entryFrom } = await searchParams;
  return renderSupplierStorefrontPage({
    slug,
    productId,
    entryFrom,
    mode: 'marketplace',
  });
}

export default function SupplierPage({ params, searchParams }: SupplierPageProps) {
  return (
    <Suspense fallback={<SupplierPageFallback />}>
      <SupplierContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: SupplierPageProps) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) {
    return { title: 'Supplier | SourceByJay' };
  }
  const description = `${supplier.name} — ${supplier.mainProducts}. ${supplier.city}, ${supplier.country}. B2B supplier on SourceByJay.`;
  return {
    title: `${supplier.name} | Factory & Products | SourceByJay`,
    description,
    openGraph: {
      title: supplier.name,
      description: supplier.mainProducts,
    },
  };
}
