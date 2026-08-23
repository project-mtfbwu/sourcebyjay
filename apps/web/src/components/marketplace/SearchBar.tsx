'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  defaultValue?: string;
  variant?: 'hero' | 'compact';
}

export function SearchBar({ defaultValue = '', variant = 'hero' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Search className="size-4" />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="marketplace-search-shadow overflow-hidden rounded-2xl bg-white p-4">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What are you looking for?"
        className="mb-3 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-marketplace-border px-4 py-3 text-sm text-marketplace-muted hover:bg-muted"
        >
          <Camera className="size-5" />
          <span className="hidden sm:inline">Image Search</span>
        </button>
        <Button
          type="submit"
          className="rounded-full bg-marketplace-accent px-8 py-6 text-base hover:bg-marketplace-accent/90"
        >
          <Search className="mr-2 size-5" />
          Search
        </Button>
      </div>
    </form>
  );
}
