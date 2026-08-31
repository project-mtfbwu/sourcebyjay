'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { RecentSearches } from '@/components/marketplace/home/RecentSearches';
import { categories } from '@/data/mock/categories';
import { hotSearches } from '@/data/mock/products';

export function HeroSearch() {
  return (
    <section className="marketplace-hero-gradient relative overflow-hidden px-4 pb-10 pt-6 lg:px-10">
      <div className="pointer-events-none absolute -right-20 -top-20 size-[660px] rounded-full bg-purple-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-10 size-[500px] rounded-full bg-pink-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-[960px]">
        {/* Alibaba: AI Mode | Products | Suppliers live inside SearchBar */}
        <SearchBar defaultMode="products" />
        <RecentSearches />
      </div>
    </section>
  );
}

export function QuickLinks() {
  const links = [
    { label: 'Request for Quotation', href: '/search?rfq=1&mode=products' },
    { label: 'Top Ranking', href: '/search?sort=sold-desc&mode=products' },
    { label: 'Find suppliers', href: '/search?mode=suppliers' },
  ];

  return (
    <section className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-4 py-5 lg:flex-row lg:items-center lg:px-10">
        <h2 className="text-xl font-semibold">Welcome to SourceByJay</h2>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link, i) => (
            <div key={link.label} className="flex items-center gap-4">
              <Link href={link.href} className="flex items-center gap-2 hover:text-marketplace-accent">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary/30 text-xs">
                  ★
                </span>
                {link.label}
              </Link>
              {i < links.length - 1 && (
                <span className="hidden h-4 w-px bg-marketplace-border sm:block" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function CategoryGrid() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto grid max-w-[1440px] gap-4 px-4 lg:grid-cols-[286px_1fr_380px] lg:px-10">
        <div className="overflow-hidden rounded-xl border border-marketplace-border bg-white">
          <div className="max-h-[304px] overflow-y-auto">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}&mode=products`}
                className="flex items-center justify-between border-b border-marketplace-border px-4 py-3 text-sm last:border-0 hover:bg-muted"
              >
                <span>{cat.name}</span>
                <ChevronRight className="size-4 text-marketplace-muted" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {hotSearches.map((item) => (
            <Link
              key={item.term}
              href={`/products/${item.productSlug}`}
              className="marketplace-card-hover overflow-hidden rounded-xl border border-marketplace-border p-4"
            >
              <p className="mb-1 text-xs text-marketplace-muted">Frequently searched</p>
              <p className="mb-3 font-medium">{item.term}</p>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={item.imageUrl} alt={item.term} fill className="object-cover" sizes="200px" />
              </div>
            </Link>
          ))}
        </div>

        <div className="relative hidden overflow-hidden rounded-xl bg-gradient-to-br from-brand-primary/20 to-purple-200/40 lg:block">
          <div className="flex h-full min-h-[304px] flex-col justify-end p-6">
            <p className="text-sm font-medium text-marketplace-muted">Featured</p>
            <h3 className="mt-1 text-2xl font-bold">Verified Suppliers Week</h3>
            <p className="mt-2 text-sm text-marketplace-muted">Connect with top-rated manufacturers</p>
            <Link
              href="/search?mode=suppliers&verified=1"
              className="mt-4 inline-flex w-fit rounded-full bg-marketplace-accent px-4 py-2 text-sm font-medium text-white"
            >
              Explore now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PromoStrip() {
  return (
    <section className="bg-white py-4">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary text-lg">
              🚚
            </span>
            <p className="text-sm font-medium">FREE shipping capped at $20 on $200+ orders</p>
          </div>
          <Link href="/search?mode=products" className="text-sm text-marketplace-accent hover:underline">
            More details →
          </Link>
        </div>
      </div>
    </section>
  );
}

export { PersonalizedProductGrid as ProductGridSection } from '@/components/marketplace/home/PersonalizedProductGrid';
