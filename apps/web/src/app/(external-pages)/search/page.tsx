import { SearchBar } from '@/components/marketplace/SearchBar';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { SearchFiltersSidebar, SortBar } from '@/components/marketplace/search/SearchFilters';
import { searchProducts, getCategories, getAllSuppliers } from '@/data/anon/marketplace';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    moq?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    gold?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const categories = await getCategories();
  const suppliers = await getAllSuppliers();
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const results = await searchProducts({
    q: params.q,
    category: params.category,
    sort: params.sort as 'relevance' | 'price-asc' | 'price-desc' | 'moq-asc' | undefined,
    moq: params.moq ? Number(params.moq) : undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    verified: params.verified === '1',
    gold: params.gold === '1',
  });

  return (
    <div className="bg-[#fafafa] py-6">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-6 max-w-xl">
          <SearchBar defaultValue={params.q ?? ''} variant="compact" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <SearchFiltersSidebar
            categories={categories}
            currentCategory={params.category}
            currentMoq={params.moq ? Number(params.moq) : undefined}
            currentVerified={params.verified === '1'}
            currentGold={params.gold === '1'}
            currentMinPrice={params.minPrice ? Number(params.minPrice) : undefined}
            currentMaxPrice={params.maxPrice ? Number(params.maxPrice) : undefined}
          />

          <div className="space-y-4">
            <SortBar currentSort={params.sort} />
            <p className="text-sm text-marketplace-muted">
              {results.length} result{results.length !== 1 ? 's' : ''}
              {params.q ? ` for "${params.q}"` : ''}
            </p>

            {results.length === 0 ? (
              <div className="rounded-xl border border-marketplace-border bg-white p-12 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-2 text-sm text-marketplace-muted">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    supplierVerificationTier={supplierMap.get(product.supplierId)?.verificationTier}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return {
    title: params.q ? `Search: ${params.q} | SourceByJay` : 'Search Products | SourceByJay',
  };
}
