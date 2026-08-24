'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CategoryTree } from '@/components/marketplace/search/CategoryTree';
import { buildCategoryTree } from '@/utils/category-tree';
import type { Category } from '@/types/marketplace';
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
  currentCategory?: string;
  currentMoq?: number;
  currentVerified?: boolean;
  currentGold?: boolean;
  currentMinPrice?: number;
  currentMaxPrice?: number;
}

export function SearchFiltersSidebar({
  categories,
  currentCategory,
  currentMoq,
  currentVerified,
  currentGold,
  currentMinPrice,
  currentMaxPrice,
}: SearchFiltersProps) {
  const searchParams = useSearchParams();
  const tree = buildCategoryTree(categories);

  function buildFilterHref(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
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
        <h3 className="mb-3 font-semibold">Category</h3>
        <CategoryTree categories={tree} currentSlug={currentCategory} />
      </div>

      <form action="/search" method="get" className="space-y-2">
        {searchParams.get('q') && <input type="hidden" name="q" value={searchParams.get('q')!} />}
        {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
        {currentVerified && <input type="hidden" name="verified" value="1" />}
        {currentGold && <input type="hidden" name="gold" value="1" />}
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

      <div>
        <h3 className="mb-3 font-semibold">Supplier type</h3>
        <div className="space-y-2 text-sm">
          <Link
            href={toggleParam('verified', !!currentVerified)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted ${
              currentVerified ? 'bg-sky-50 font-medium text-sky-800' : ''
            }`}
          >
            <input type="checkbox" readOnly checked={!!currentVerified} className="rounded" />
            Verified manufacturers only
          </Link>
          <Link
            href={toggleParam('gold', !!currentGold)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted ${
              currentGold ? 'bg-amber-50 font-medium text-amber-900' : ''
            }`}
          >
            <input type="checkbox" readOnly checked={!!currentGold} className="rounded" />
            Gold suppliers only
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function SortBar({ currentSort }: { currentSort?: string }) {
  const searchParams = useSearchParams();

  const sorts = [
    { value: 'relevance', label: 'Best match' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'moq-asc', label: 'MOQ: low to high' },
  ];

  function buildSortHref(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    return `/search?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-marketplace-border bg-white px-4 py-3">
      <p className="text-sm text-marketplace-muted">Sort by:</p>
      <div className="flex flex-wrap gap-2">
        {sorts.map((sort) => (
          <Link
            key={sort.value}
            href={buildSortHref(sort.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              (currentSort ?? 'relevance') === sort.value
                ? 'bg-marketplace-accent text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {sort.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
