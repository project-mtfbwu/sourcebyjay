'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/marketplace/ProductCard';
import type { Category, Product, VerificationTier } from '@/types/marketplace';
import { recommendHomeProducts } from '@/lib/home-recommendations';
import { readSearchHistory } from '@/lib/search-history';

export function PersonalizedProductGrid({
  products,
  categories,
  supplierTiers,
  guaranteeBySupplier,
}: {
  products: Product[];
  categories: Category[];
  supplierTiers: Record<string, VerificationTier>;
  guaranteeBySupplier?: Record<string, boolean>;
}) {
  const [queries, setQueries] = useState<string[]>([]);

  useEffect(() => {
    setQueries(readSearchHistory());
  }, []);

  const recommended = useMemo(
    () => recommendHomeProducts(products, queries, categories),
    [products, queries, categories],
  );

  const heading =
    queries.length > 0 ? 'Recommended for your business' : 'Trending for new buyers';

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-marketplace-border" />
          <h2 className="text-center text-lg font-medium">{heading}</h2>
          <span className="h-px w-10 bg-marketplace-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {recommended.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              supplierVerificationTier={supplierTiers[product.supplierId]}
              guaranteeEligible={guaranteeBySupplier?.[product.supplierId]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
