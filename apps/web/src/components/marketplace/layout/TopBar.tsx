'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Globe, ShoppingCart, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/supabase-clients/client';

const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3001';

export function TopBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-sm lg:px-10">
        <div className="hidden items-center gap-2 text-marketplace-muted md:flex">
          <span>Deliver to:</span>
          <span className="font-medium text-foreground">🇺🇸 US</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hidden items-center gap-1 text-marketplace-muted hover:text-foreground sm:flex"
          >
            <Globe className="size-4" />
            <span>English-USD</span>
          </button>
          {email ? (
            <Link
              href="/account/profile"
              className="flex max-w-[220px] items-center gap-1 truncate text-marketplace-muted hover:text-foreground"
              title={email}
            >
              <User className="size-4 shrink-0" />
              <span className="truncate">{email}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-marketplace-muted hover:text-foreground"
            >
              <User className="size-4" />
              <span>Sign in</span>
            </Link>
          )}
          {email ? (
            <>
              <Link
                href="/account/favorites"
                className="hidden text-marketplace-muted hover:text-foreground sm:inline"
              >
                Favorites
              </Link>
              <Link
                href="/account/messages"
                className="rounded-full border border-foreground px-4 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Messages
              </Link>
            </>
          ) : (
            <Link
              href="/sign-up"
              className="rounded-full border border-foreground px-4 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Create account
            </Link>
          )}
          <button type="button" className="text-marketplace-muted hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainNav() {
  const links: { label: string; href: string; highlight?: boolean }[] = [
    { label: 'All categories', href: '/search' },
    { label: 'Request quotes (RFQ)', href: '/search?rfq=1', highlight: true },
    { label: 'Post a request', href: '/request-listing' },
    { label: 'Verified manufacturers', href: '/search?verified=gold' },
    { label: 'About SourceByJay', href: '/about' },
    { label: 'My account', href: '/account' },
    { label: 'Sell on SourceByJay', href: `${vendorUrl}/signup` },
  ];

  return (
    <div className="border-b border-marketplace-border bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link href="/" className="shrink-0">
          <Image src="/brand/logo.svg" alt="SourceByJay" width={185} height={40} priority />
        </Link>
        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-1 text-sm text-marketplace-muted lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                link.highlight
                  ? 'whitespace-nowrap rounded-full bg-brand-primary px-3 py-1 font-semibold text-black hover:opacity-90'
                  : 'whitespace-nowrap hover:text-foreground'
              }
              {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
