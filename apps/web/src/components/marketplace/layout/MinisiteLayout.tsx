import Link from 'next/link';
import { type ReactNode } from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export function MinisiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-roboto)]">
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="size-4" />
            SourceByJay
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-50"
          >
            <Search className="size-3.5" />
            Search products
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-emerald-100 bg-emerald-50/40 py-4 text-center text-xs text-marketplace-muted">
        Powered by{' '}
        <Link href="/" className="font-medium text-emerald-800 hover:underline">
          SourceByJay
        </Link>
      </footer>
    </div>
  );
}
