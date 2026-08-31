import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { StorefrontPreviewClient } from '@/components/marketplace/supplier/StorefrontPreviewClient';
import { loadSupplierPreviewData } from '@/lib/load-supplier-preview-data';
import { getSupplierBySlug } from '@/data/anon/marketplace';

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

function PreviewFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-muted-foreground">
      Loading buyer preview…
    </div>
  );
}

async function SupplierPreviewContent({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const data = await loadSupplierPreviewData(slug);
  if (!data) notFound();

  // Vendor iframe always passes ?mode=factory|marketplace — no cookies/RPC needed here.
  const useMinisite = mode === 'factory';

  return <StorefrontPreviewClient initial={data} variant={useMinisite ? 'minisite' : 'marketplace'} />;
}

export default function SupplierPreviewPage(props: PreviewPageProps) {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <SupplierPreviewContent {...props} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PreviewPageProps) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) return { title: 'Preview | SourceByJay' };
  return { title: `Preview — ${supplier.name} | SourceByJay` };
}
