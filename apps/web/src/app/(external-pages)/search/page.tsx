import { SearchBar } from '@/components/marketplace/SearchBar';
import { SearchHistorySync } from '@/components/marketplace/SearchHistorySync';
import { SearchRfqResults } from '@/components/marketplace/rfq/SearchRfqResults';
import { SearchFiltersSidebar, SortBar } from '@/components/marketplace/search/SearchFilters';
import { SearchModeTabs } from '@/components/marketplace/search/SearchModeTabs';
import { SearchWithinBar } from '@/components/marketplace/search/SearchWithinBar';
import { SupplierSearchCard } from '@/components/marketplace/search/SupplierSearchCard';
import {
  searchProducts,
  searchSuppliers,
  getCategories,
  getAllSuppliers,
} from '@/data/anon/marketplace';
import { getSponsoredPlacements } from '@/data/anon/ads';
import { SponsoredSearchBlock } from '@/components/marketplace/ads/SponsoredSearchBlock';
import { createSupabaseClient } from '@/supabase-clients/server';
import { Suspense } from 'react';

type SearchParams = Promise<{
  q?: string;
  within?: string;
  category?: string;
  sort?: string;
  moq?: string;
  minPrice?: string;
  maxPrice?: string;
  verified?: string;
  gold?: string;
  guarantee?: string;
  country?: string;
  mode?: string;
  rfq?: string;
  ai?: string;
  aiFallback?: string;
  image?: string;
}>;

interface SearchPageProps {
  searchParams: SearchParams;
}

function SearchPageFallback() {
  return (
    <div className="bg-[#fafafa] py-6">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-6 h-12 max-w-xl animate-pulse rounded-full bg-white" />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-64 rounded-xl border border-marketplace-border bg-white" />
          <div className="h-96 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode =
    params.mode === 'suppliers'
      ? 'suppliers'
      : params.mode === 'ai'
        ? 'products'
        : 'products';
  const tabMode: 'products' | 'suppliers' | 'ai' =
    params.mode === 'suppliers'
      ? 'suppliers'
      : params.mode === 'ai' || params.ai === '1'
        ? 'ai'
        : 'products';
  const barMode: 'products' | 'suppliers' | 'ai' =
    params.mode === 'suppliers' ? 'suppliers' : params.mode === 'ai' || params.ai === '1' ? 'ai' : 'products';
  const categories = await getCategories();
  const suppliers = await getAllSuppliers();
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const commonFilters = {
    q: params.q,
    within: params.within,
    verified: params.verified === '1',
    gold: params.gold === '1' || params.verified === 'gold',
    guarantee: params.guarantee === '1',
    country: params.country,
    mode: mode as 'products' | 'suppliers',
  };

  const productResults =
    mode === 'products'
      ? await searchProducts({
          ...commonFilters,
          category: params.category,
          sort: params.sort as
            | 'relevance'
            | 'price-asc'
            | 'price-desc'
            | 'moq-asc'
            | 'sold-desc'
            | undefined,
          moq: params.moq ? Number(params.moq) : undefined,
          minPrice: params.minPrice ? Number(params.minPrice) : undefined,
          maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        })
      : [];

  const sponsoredAds =
    mode === 'products'
      ? await getSponsoredPlacements('search_results_top', {
          query: params.q,
          categorySlug: params.category,
          limit: 3,
        })
      : [];

  const sidebarAds =
    mode === 'products'
      ? await getSponsoredPlacements('search_sidebar', {
          query: params.q,
          categorySlug: params.category,
          limit: 2,
        })
      : [];

  const supplierResults =
    mode === 'suppliers' ? await searchSuppliers(commonFilters) : [];

  const resultCount = mode === 'products' ? productResults.length : supplierResults.length;
  const rfqMode = mode === 'products' && params.rfq === '1';

  let favoritedProductIds = new Set<string>();
  if (mode === 'products' && productResults.length > 0) {
    try {
      const supabase = await createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ids = productResults.map((p) => p.id);
        const { data: favs } = await supabase
          .from('buyer_favorites')
          .select('product_id')
          .eq('buyer_id', user.id)
          .in('product_id', ids);
        favoritedProductIds = new Set(
          (favs ?? []).map((f) => f.product_id).filter(Boolean) as string[],
        );
      }
    } catch {
      /* anonymous / no cookie */
    }
  }

  return (
    <div className="bg-[#fafafa] py-6">
      <SearchHistorySync query={params.q} />
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-4 max-w-xl">
          <SearchBar defaultValue={params.q ?? ''} variant="compact" defaultMode={barMode} />
        </div>

        <SearchModeTabs activeMode={tabMode} />

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <SearchFiltersSidebar
            categories={categories}
            mode={mode}
            currentCategory={params.category}
            currentMoq={params.moq ? Number(params.moq) : undefined}
            currentVerified={params.verified === '1'}
            currentGold={params.gold === '1' || params.verified === 'gold'}
            currentGuarantee={params.guarantee === '1'}
            currentMinPrice={params.minPrice ? Number(params.minPrice) : undefined}
            currentMaxPrice={params.maxPrice ? Number(params.maxPrice) : undefined}
            currentCountry={params.country}
            sidebarAds={sidebarAds}
            searchQuery={params.q}
          />

          <div className="space-y-4">
            {params.ai === '1' ? (
              <div className="rounded-xl border border-[#ff6600]/40 bg-orange-50 px-4 py-3 text-sm text-marketplace-ink">
                <strong>AI Mode</strong>
                {params.aiFallback === '1'
                  ? ' — used your original text (AI rewrite skipped).'
                  : ' — sentence shortened to marketplace keywords.'}
                {params.q ? (
                  <span className="mt-1 block text-marketplace-muted">Searching: “{params.q}”</span>
                ) : null}
              </div>
            ) : null}
            {params.image === '1' ? (
              <div className="rounded-xl border border-[#ff6600]/40 bg-orange-50 px-4 py-3 text-sm text-marketplace-ink">
                <strong>Image search</strong> — photo described by Groq vision, then keyword match
                {params.q ? <> for “{params.q}”</> : null}.
              </div>
            ) : null}
            {mode === 'products' && params.rfq === '1' ? (
              <div className="rounded-xl border-2 border-brand-primary bg-brand-primary/15 p-4">
                <p className="text-lg font-bold text-marketplace-ink">Multi-supplier RFQ mode</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-marketplace-ink">
                  <li>
                    Slide to pick suppliers — <strong>one RFQ per factory</strong> (first listing in
                    sort)
                  </li>
                  <li>
                    Open the <strong>RFQ cart</strong> (top-right) to review or remove
                  </li>
                  <li>
                    When you have <strong>2+ suppliers</strong>, tap <strong>Request quotes</strong>
                  </li>
                </ol>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SortBar currentSort={params.sort} mode={mode} />
              <SearchWithinBar mode={mode} />
            </div>

            <p className="text-sm text-marketplace-muted">
              {resultCount} {mode === 'products' ? 'product' : 'supplier'}
              {resultCount !== 1 ? 's' : ''}
              {params.q ? ` for "${params.q}"` : ''}
              {params.within ? ` · within “${params.within}”` : ''}
            </p>

            {mode === 'products' ? (
              productResults.length === 0 && sponsoredAds.length === 0 ? (
                <div className="rounded-xl border border-marketplace-border bg-white p-12 text-center">
                  <p className="text-lg font-medium">No products found</p>
                  <p className="mt-2 text-sm text-marketplace-muted">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              ) : (
                <>
                  <SponsoredSearchBlock ads={sponsoredAds} searchQuery={params.q} />
                  {productResults.length > 0 ? (
                    <SearchRfqResults
                      results={productResults}
                      supplierMap={supplierMap}
                      searchQuery={params.q}
                      rfqMode={rfqMode}
                      favoritedProductIds={favoritedProductIds}
                    />
                  ) : null}
                </>
              )
            ) : supplierResults.length === 0 ? (
              <div className="rounded-xl border border-marketplace-border bg-white p-12 text-center">
                <p className="text-lg font-medium">No suppliers found</p>
                <p className="mt-2 text-sm text-marketplace-muted">
                  Try a different name, country, or clear filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {supplierResults.map((s) => (
                  <SupplierSearchCard key={s.id} supplier={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const mode = params.mode === 'suppliers' ? 'Suppliers' : 'Products';
  return {
    title: params.q
      ? `Search ${mode}: ${params.q} | SourceByJay`
      : `Search ${mode} | SourceByJay`,
  };
}
