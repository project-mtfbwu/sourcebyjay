'use client';

import Link from 'next/link';
import type { Product } from '@/types/marketplace';

/** Trending chips from sold_count — Alibaba “frequently searched / hot” style. */
export function TrendingChips({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-marketplace-border bg-white py-3">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 lg:px-10">
        <span className="text-xs font-semibold uppercase tracking-wide text-marketplace-muted">
          Trending
        </span>
        {products.slice(0, 6).map((p) => (
          <Link
            key={p.id}
            href={`/search?q=${encodeURIComponent(p.title.split('—')[0]?.trim() || p.title)}&mode=products&sort=sold-desc`}
            className="rounded-full border border-marketplace-border bg-[#fafafa] px-3 py-1 text-xs hover:border-[#ff6600] hover:text-[#ff6600]"
          >
            {p.title.length > 36 ? `${p.title.slice(0, 34)}…` : p.title}
          </Link>
        ))}
        <Link
          href="/search?mode=products&sort=sold-desc"
          className="text-xs font-medium text-[#ff6600] hover:underline"
        >
          See all →
        </Link>
      </div>
    </section>
  );
}
