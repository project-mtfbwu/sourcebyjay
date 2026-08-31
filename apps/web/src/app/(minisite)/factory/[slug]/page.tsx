import { Suspense } from 'react';
import { renderSupplierStorefrontPage } from '@/lib/supplier-storefront-page';
import { getSupplierBySlug } from '@/data/anon/marketplace';

interface FactoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ productId?: string; from?: string }>;
}

function FactoryPageFallback() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-10 lg:px-10">
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

async function FactoryContent({
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
    mode: 'minisite',
  });
}

export default function FactoryPage({ params, searchParams }: FactoryPageProps) {
  return (
    <Suspense fallback={<FactoryPageFallback />}>
      <FactoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: FactoryPageProps) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) {
    return { title: 'Factory | SourceByJay' };
  }
  const description = `${supplier.name} — ${supplier.mainProducts}. ${supplier.city}, ${supplier.country}. Official factory storefront on SourceByJay.`;
  return {
    title: `${supplier.name} | Factory Storefront`,
    description,
    openGraph: {
      title: `${supplier.name} — Factory`,
      description: supplier.mainProducts,
    },
  };
}
