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
}

export function SearchFiltersSidebar({ categories, currentCategory, currentMoq }: SearchFiltersProps) {
  const tree = buildCategoryTree(categories);

  return (
    <aside className="space-y-6 rounded-xl border border-marketplace-border bg-white p-4">
      <div>
        <h3 className="mb-3 font-semibold">Category</h3>
        <CategoryTree categories={tree} currentSlug={currentCategory} />
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Price range (USD)</h3>
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" className="h-9" />
          <Input type="number" placeholder="Max" className="h-9" />
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full">
          Apply
        </Button>
      </div>

      <div>
        <Label htmlFor="moq-filter" className="mb-2 block font-semibold">
          Max MOQ
        </Label>
        <Select defaultValue={currentMoq?.toString() ?? 'any'}>
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" />
          Verified manufacturers only
        </label>
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
