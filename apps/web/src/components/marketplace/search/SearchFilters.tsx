'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CategoryTree } from '@/components/marketplace/search/CategoryTree';
import { buildCategoryTree } from '@/utils/category-tree';
import type { Category } from '@/types/marketplace';
import type { SponsoredAd } from '@/data/anon/ads';
import { SponsoredSidebarBlock } from '@/components/marketplace/ads/SponsoredSidebarBlock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFiltersProps {
  categories: Category[];
  mode: 'products' | 'suppliers';
  currentCategory?: string;
  currentMoq?: number;
  currentVerified?: boolean;
  currentGold?: boolean;
  currentGuarantee?: boolean;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentCountry?: string;
  sidebarAds?: SponsoredAd[];
  searchQuery?: string;
}

export function SearchFiltersSidebar({
  categories,
  mode,
  currentCategory,
  currentMoq,
  currentVerified,
  currentGold,
  currentGuarantee,
  currentMinPrice,
  currentMaxPrice,
  currentCountry,
  sidebarAds,
  searchQuery,
}: SearchFiltersProps) {
  const searchParams = useSearchParams();
  const tree = buildCategoryTree(categories);

  function buildFilterHref(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    return `/search?${params.toString()}`;
  }

  function toggleParam(key: string, active: boolean) {
    return buildFilterHref({ [key]: active ? null : '1' });
  }

  return (
    <aside className="space-y-6 rounded-xl border border-marketplace-border bg-white p-4">
      <div>
        <h3 className="mb-3 font-semibold">Filters</h3>
        <p className="mb-3 text-xs text-marketplace-muted">
          Same idea as Alibaba’s left sidebar — filters stay in the URL.
        </p>
      </div>

      {/* SourceByJay Guarantee — Alibaba Trade Assurance parallel */}
      <div>
        <h3 className="mb-2 font-semibold">Buyer protection</h3>
        <Link
          href={toggleParam('guarantee', !!currentGuarantee)}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
            currentGuarantee ? 'bg-emerald-50 font-medium text-emerald-900' : ''
          }`}
          title="Protected by SourceByJay Guarantee when you pay on platform"
        >
          <input type="checkbox" readOnly checked={!!currentGuarantee} className="rounded" />
          SourceByJay Guarantee
        </Link>
        {currentGuarantee ? (
          <p className="mt-1 text-[11px] text-marketplace-muted">
            Shows Pro+ (or ops-granted) suppliers only. Pay on SourceByJay to be protected.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Supplier features</h3>
        <div className="space-y-2 text-sm">
          <Link
            href={toggleParam('verified', !!currentVerified)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted ${
              currentVerified ? 'bg-sky-50 font-medium text-sky-800' : ''
            }`}
          >
            <input type="checkbox" readOnly checked={!!currentVerified} className="rounded" />
            Verified Supplier
          </Link>
          <Link
            href={toggleParam('gold', !!currentGold)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted ${
              currentGold ? 'bg-amber-50 font-medium text-amber-900' : ''
            }`}
          >
            <input type="checkbox" readOnly checked={!!currentGold} className="rounded" />
            Gold suppliers
          </Link>
        </div>
      </div>

      {mode === 'products' ? (
        <>
          <div>
            <h3 className="mb-3 font-semibold">Category</h3>
            <CategoryTree categories={tree} currentSlug={currentCategory} baseHref="/search?mode=products" />
          </div>

          <form action="/search" method="get" className="space-y-2">
            <input type="hidden" name="mode" value="products" />
            {searchParams.get('q') && <input type="hidden" name="q" value={searchParams.get('q')!} />}
            {searchParams.get('within') && (
              <input type="hidden" name="within" value={searchParams.get('within')!} />
            )}
            {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
            {currentVerified && <input type="hidden" name="verified" value="1" />}
            {currentGold && <input type="hidden" name="gold" value="1" />}
            {currentGuarantee && <input type="hidden" name="guarantee" value="1" />}
            <h3 className="font-semibold">Price range (USD)</h3>
            <div className="flex gap-2">
              <Input
                name="minPrice"
                type="number"
                placeholder="Min"
                className="h-9"
                defaultValue={currentMinPrice ?? ''}
              />
              <Input
                name="maxPrice"
                type="number"
                placeholder="Max"
                className="h-9"
                defaultValue={currentMaxPrice ?? ''}
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Apply
            </Button>
          </form>

          <div>
            <Label htmlFor="moq-filter" className="mb-2 block font-semibold">
              Max MOQ
            </Label>
            <Select
              value={currentMoq?.toString() ?? 'any'}
              onValueChange={(value) => {
                window.location.href = buildFilterHref({
                  moq: value === 'any' ? null : value,
                });
              }}
            >
              <SelectTrigger id="moq-filter">
                <SelectValue placeholder="Any MOQ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any MOQ</SelectItem>
                <SelectItem value="1">MOQ ≤ 1</SelectItem>
                <SelectItem value="10">MOQ ≤ 10</SelectItem>
                <SelectItem value="100">MOQ ≤ 100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form action="/search" method="get" className="space-y-2">
            <input type="hidden" name="mode" value="products" />
            {searchParams.get('q') && <input type="hidden" name="q" value={searchParams.get('q')!} />}
            {searchParams.get('within') && (
              <input type="hidden" name="within" value={searchParams.get('within')!} />
            )}
            {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
            {currentVerified && <input type="hidden" name="verified" value="1" />}
            {currentGold && <input type="hidden" name="gold" value="1" />}
            {currentGuarantee && <input type="hidden" name="guarantee" value="1" />}
            {currentMinPrice != null && (
              <input type="hidden" name="minPrice" value={String(currentMinPrice)} />
            )}
            {currentMaxPrice != null && (
              <input type="hidden" name="maxPrice" value={String(currentMaxPrice)} />
            )}
            {currentMoq != null && <input type="hidden" name="moq" value={String(currentMoq)} />}
            <Label htmlFor="product-country-filter" className="font-semibold">
              Supplier country
            </Label>
            <Input
              id="product-country-filter"
              name="country"
              placeholder="e.g. India, China"
              className="h-9"
              defaultValue={currentCountry ?? ''}
            />
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Apply country
            </Button>
          </form>
        </>
      ) : (
        <form action="/search" method="get" className="space-y-2">
          <input type="hidden" name="mode" value="suppliers" />
          {searchParams.get('q') && <input type="hidden" name="q" value={searchParams.get('q')!} />}
          {searchParams.get('within') && (
            <input type="hidden" name="within" value={searchParams.get('within')!} />
          )}
          {currentVerified && <input type="hidden" name="verified" value="1" />}
          {currentGold && <input type="hidden" name="gold" value="1" />}
          <Label htmlFor="country-filter" className="font-semibold">
            Country / region
          </Label>
          <Input
            id="country-filter"
            name="country"
            placeholder="e.g. India, China"
            className="h-9"
            defaultValue={currentCountry ?? ''}
          />
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Apply
          </Button>
        </form>
      )}

      {mode === 'products' && sidebarAds && sidebarAds.length > 0 ? (
        <SponsoredSidebarBlock ads={sidebarAds} searchQuery={searchQuery} />
      ) : null}
    </aside>
  );
}

export function SortBar({
  currentSort,
  mode,
}: {
  currentSort?: string;
  mode: 'products' | 'suppliers';
}) {
  const searchParams = useSearchParams();

  const sorts =
    mode === 'products'
      ? [
          { value: 'relevance', label: 'Best match' },
          { value: 'sold-desc', label: 'Trending' },
          { value: 'price-asc', label: 'Price: low to high' },
          { value: 'price-desc', label: 'Price: high to low' },
          { value: 'moq-asc', label: 'MOQ: low to high' },
        ]
      : [{ value: 'relevance', label: 'Best match' }];

  function buildSortHref(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    params.set('sort', sort);
    return `/search?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-marketplace-border bg-white px-4 py-3">
      <p className="text-sm text-marketplace-muted">Sort by:</p>
      <div className="flex flex-wrap gap-2">
        {sorts.map((sort) => {
          const active = (currentSort ?? 'relevance') === sort.value;
          return (
            <Link
              key={sort.value}
              href={buildSortHref(sort.value)}
              aria-current={active ? 'true' : undefined}
              className={
                active
                  ? 'rounded-full bg-[#ff6600] px-3 py-1 text-sm font-semibold text-white'
                  : 'rounded-full bg-muted px-3 py-1 text-sm text-foreground hover:bg-muted/80'
              }
            >
              {sort.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
