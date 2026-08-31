'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

/** Alibaba-style AI Mode | Products | Suppliers tabs under search. */
export function SearchModeTabs({
  activeMode,
}: {
  activeMode: 'products' | 'suppliers' | 'ai';
}) {
  const searchParams = useSearchParams();

  function hrefFor(mode: 'products' | 'suppliers' | 'ai') {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    if (mode === 'suppliers' || mode === 'ai') params.delete('rfq');
    if (mode !== 'ai') {
      params.delete('ai');
      params.delete('aiFallback');
    }
    return `/search?${params.toString()}`;
  }

  const tabs: { mode: 'products' | 'suppliers' | 'ai'; label: string; sparkle?: boolean }[] = [
    { mode: 'ai', label: 'AI Mode', sparkle: true },
    { mode: 'products', label: 'Products' },
    { mode: 'suppliers', label: 'Suppliers' },
  ];

  return (
    <div className="mb-4 flex items-center gap-6 border-b border-marketplace-border">
      {tabs.map((tab) => {
        const active = activeMode === tab.mode;
        return (
          <Link
            key={tab.mode}
            href={hrefFor(tab.mode)}
            className={`relative pb-2 text-sm font-medium ${
              active
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6600]'
                : 'text-marketplace-muted hover:text-foreground'
            }`}
          >
            {tab.sparkle ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3.5 text-[#ff6600]" />
                {tab.label}
              </span>
            ) : (
              tab.label
            )}
          </Link>
        );
      })}
    </div>
  );
}
