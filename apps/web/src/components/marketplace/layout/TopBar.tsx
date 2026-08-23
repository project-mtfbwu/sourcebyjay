'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Globe, ShoppingCart, User } from 'lucide-react';

export function TopBar() {
  return (
    <div className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-sm lg:px-10">
        <div className="hidden items-center gap-2 text-marketplace-muted md:flex">
          <span>Deliver to:</span>
          <span className="font-medium text-foreground">🇺🇸 US</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" className="hidden items-center gap-1 text-marketplace-muted hover:text-foreground sm:flex">
            <Globe className="size-4" />
            <span>English-USD</span>
          </button>
          <Link href="/login" className="flex items-center gap-1 text-marketplace-muted hover:text-foreground">
            <User className="size-4" />
            <span>Sign in</span>
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-foreground px-4 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Create account
          </Link>
          <button type="button" className="text-marketplace-muted hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainNav() {
  const links = [
    'All categories',
    'Verified manufacturers',
    'Dropshipping',
    'About SourceByJay',
    'Tax exemption',
    'Help Center',
    'Source Hub',
    'Sell on SourceByJay',
  ];

  return (
    <div className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link href="/" className="shrink-0">
          <Image src="/brand/logo.svg" alt="SourceByJay" width={185} height={40} priority />
        </Link>
        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-1 text-sm text-marketplace-muted lg:flex">
          {links.map((link) => (
            <Link key={link} href="#" className="whitespace-nowrap hover:text-foreground">
              {link}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
