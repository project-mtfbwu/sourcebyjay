'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { categories } from '@/data/mock/categories';
import { hotSearches, products } from '@/data/mock/products';

const searchTabs = ['AI Mode', 'Products', 'Manufacturers', 'Worldwide'];

export function HeroSearch() {
  return (
    <section className="marketplace-hero-gradient relative overflow-hidden px-4 pb-10 pt-6 lg:px-10">
      <div className="pointer-events-none absolute -right-20 -top-20 size-[660px] rounded-full bg-purple-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-10 size-[500px] rounded-full bg-pink-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-[960px]">
        <div className="mb-6 flex items-center justify-center gap-6 text-sm lg:gap-10">
          {searchTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              disabled={tab === 'AI Mode'}
              className={`relative pb-2 font-medium ${
                tab === 'Products'
                  ? 'text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-12 after:-translate-x-1/2 after:rounded-full after:bg-marketplace-accent'
                  : tab === 'AI Mode'
                    ? 'cursor-not-allowed text-marketplace-muted/60'
                    : 'text-marketplace-muted hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'AI Mode' && (
                <span className="ml-1 rounded bg-muted px-1 text-[10px]">Soon</span>
              )}
            </button>
          ))}
        </div>
        <SearchBar />
      </div>
    </section>
  );
}

export function QuickLinks() {
  const links = [
    { label: 'Request for Quotation', href: '/search?q=rfq' },
    { label: 'Top Ranking', href: '/search?sort=price-desc' },
    { label: 'Fast customization', href: '/search?q=custom' },
  ];

  return (
    <section className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-4 py-5 lg:flex-row lg:items-center lg:px-10">
        <h2 className="text-xl font-semibold">Welcome to SourceByJay</h2>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link, i) => (
            <div key={link.label} className="flex items-center gap-4">
              <Link href={link.href} className="flex items-center gap-2 hover:text-marketplace-accent">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary/30 text-xs">★</span>
                {link.label}
              </Link>
              {i < links.length - 1 && <span className="hidden h-4 w-px bg-marketplace-border sm:block" />}
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
                href={`/search?category=${cat.slug}`}
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
              href="/search?category=industrial-machinery"
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
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary text-lg">🚚</span>
            <p className="text-sm font-medium">FREE shipping capped at $20 on $200+ orders</p>
          </div>
          <Link href="#" className="text-sm text-marketplace-accent hover:underline">
            More details →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ProductGridSection() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-marketplace-border" />
          <h2 className="text-center text-lg font-medium">Recommended for your business</h2>
          <span className="h-px w-10 bg-marketplace-border" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.slice(4, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
