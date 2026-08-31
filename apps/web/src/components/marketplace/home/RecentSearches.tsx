'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readSearchHistory } from '@/lib/search-history';

export function RecentSearches() {
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    setTerms(readSearchHistory());
  }, []);

  if (terms.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs text-marketplace-muted">Your recent searches</span>
      {terms.map((term) => (
        <Link
          key={term}
          href={`/search?q=${encodeURIComponent(term)}`}
          className="rounded-full border border-marketplace-border bg-white px-3 py-1 text-xs hover:border-marketplace-accent hover:text-marketplace-accent"
        >
          {term}
        </Link>
      ))}
    </div>
  );
}
