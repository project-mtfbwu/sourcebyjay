'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Alibaba-style “search within these results”. */
export function SearchWithinBar({ mode }: { mode: 'products' | 'suppliers' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [within, setWithin] = useState(searchParams.get('within') ?? '');

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', mode);
        const w = within.trim();
        if (w) params.set('within', w);
        else params.delete('within');
        router.push(`/search?${params.toString()}`);
      }}
    >
      <Input
        value={within}
        onChange={(e) => setWithin(e.target.value)}
        placeholder="Search within results…"
        className="h-9 max-w-xs text-sm"
      />
      <Button type="submit" size="sm" variant="outline">
        <Search className="mr-1 size-3.5" />
        Within
      </Button>
    </form>
  );
}
