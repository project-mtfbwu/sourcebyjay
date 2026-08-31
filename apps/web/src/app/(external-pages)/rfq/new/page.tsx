import { BroadcastRfqForm } from '@/components/marketplace/rfq/BroadcastRfqForm';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

type SearchParams = Promise<{ targets?: string; q?: string }>;

async function RfqNewContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const { user } = await getCachedLoggedInVerifiedSupabaseUser();
  const params = await searchParams;
  const raw = (params.targets ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const pairs = raw.map((entry) => {
    const [supplierId, productId] = entry.split(':');
    return { supplierId, productId };
  });

  const productIds = pairs.map((p) => p.productId).filter(Boolean) as string[];
  const supabase = await createSupabaseClient();
  const { data: products } = productIds.length
    ? await supabase.from('products').select('id, title, supplier_id').in('id', productIds)
    : { data: [] as { id: string; title: string; supplier_id: string }[] };

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const targets = pairs
    .filter((p) => p.supplierId)
    .map((p) => {
      const product = p.productId ? productMap.get(p.productId) : null;
      return {
        supplierId: p.supplierId,
        productId: p.productId,
        label: product?.title ?? `Supplier ${p.supplierId.slice(0, 8)}…`,
      };
    });

  return (
    <div className="bg-[#fafafa] min-h-[60vh]">
      <div className="mx-auto max-w-3xl px-4 py-4 text-sm">
        <Link href="/search" className="text-muted-foreground hover:text-foreground">
          ← Back to search
        </Link>
      </div>
      <BroadcastRfqForm
        targets={targets}
        defaultEmail={user.email ?? ''}
        defaultTitle={params.q ?? ''}
      />
    </div>
  );
}

export default function RfqNewPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading RFQ form…</div>}>
      <RfqNewContent searchParams={searchParams} />
    </Suspense>
  );
}
