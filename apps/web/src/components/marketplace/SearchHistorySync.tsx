'use client';

import { useEffect } from 'react';
import { recordSearch } from '@/lib/search-history';

export function SearchHistorySync({ query }: { query?: string }) {
  useEffect(() => {
    if (query) recordSearch(query);
  }, [query]);

  return null;
}
