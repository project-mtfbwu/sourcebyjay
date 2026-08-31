'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/advertising', label: 'Overview', exact: true },
  { href: '/advertising/campaigns', label: 'All campaigns' },
  { href: '/advertising/wallets', label: 'Wallets & credits' },
  { href: '/advertising/invoices', label: 'Invoices' },
] as const;

export function OpsAdvertisingNav() {
  const pathname = usePathname();

  return (
    <div className="ad-tabs-wrap">
      <nav className="ad-tabs" aria-label="Advertising oversight">
        {TABS.map((tab) => {
          const active =
            'exact' in tab && tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`ad-tab${active ? ' is-active' : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
