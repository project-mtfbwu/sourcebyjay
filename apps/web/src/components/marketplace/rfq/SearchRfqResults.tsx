'use client';

import { ProductCard } from '@/components/marketplace/ProductCard';
import type { Product, Supplier } from '@/types/marketplace';
import {
  RfqSelectProvider,
  RfqSelectBar,
  RfqBulkActions,
} from '@/components/marketplace/rfq/RfqSelectContext';

export function SearchRfqResults({
  results,
  supplierMap,
  searchQuery,
  rfqMode = false,
  favoritedProductIds,
}: {
  results: Product[];
  supplierMap: Map<string, Supplier>;
  searchQuery?: string;
  /** Only when URL has rfq=1 — Alibaba RFQ multi-select chrome */
  rfqMode?: boolean;
  favoritedProductIds?: Set<string>;
}) {
  const grid = (
    <div className="grid grid-cols-2 gap-4 pb-28 sm:grid-cols-3 md:grid-cols-4">
      {results.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selectable={rfqMode}
          initialFavorited={favoritedProductIds?.has(product.id)}
          supplierVerificationTier={supplierMap.get(product.supplierId)?.verificationTier}
          guaranteeEligible={supplierMap.get(product.supplierId)?.guaranteeEligible}
        />
      ))}
    </div>
  );

  if (!rfqMode) {
    return <div className="pb-8">{grid}</div>;
  }

  return (
    <RfqSelectProvider>
      <div className="mb-3 space-y-3 rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-3 py-3 text-sm text-marketplace-ink">
        <p>
          <strong>Multi-supplier RFQ:</strong> pick different factories to compare quotes (see note
          below), open the <strong>RFQ cart</strong>, then Request quotes. Need at least{' '}
          <strong>2 suppliers</strong>. Login as <em>buyer</em> to submit.
        </p>
        <RfqBulkActions products={results} />
      </div>
      {grid}
      <RfqSelectBar searchQuery={searchQuery} />
    </RfqSelectProvider>
  );
}
