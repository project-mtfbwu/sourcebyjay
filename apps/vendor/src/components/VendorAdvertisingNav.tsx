'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Amazon / Google Ads–style sub-nav inside Advertising */
const TABS = [
  { href: '/advertising', label: 'Overview', exact: true },
  { href: '/advertising/campaigns', label: 'Campaigns' },
  { href: '/advertising/new', label: 'Ad Studio' },
  { href: '/advertising/wallet', label: 'Wallet & billing' },
  { href: '/advertising/invoices', label: 'Invoices' },
] as const;

export function VendorAdvertisingNav() {
  const pathname = usePathname();

  return (
    <div className="ad-tabs-wrap">
      <nav className="ad-tabs" aria-label="Advertising sections">
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
      <p className="muted ad-tabs-hint">
        Hybrid ads — CPC (search clicks) · CPM (home/display) · Sponsorship (daily). TEST MODE wallet.
      </p>
    </div>
  );
}
