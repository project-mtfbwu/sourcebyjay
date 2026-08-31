'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VENDOR_ICONS } from '@/components/vendor-icons';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
};

const LINKS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: VENDOR_ICONS.dashboard },
  { href: '/listings', label: 'Listings', icon: VENDOR_ICONS.listings },
  { href: '/quotes', label: 'Quotes', icon: VENDOR_ICONS.quotes },
  { href: '/orders', label: 'Orders', icon: VENDOR_ICONS.orders },
  { href: '/messages', label: 'Messages', icon: VENDOR_ICONS.messages },
  { href: '/listing-requests', label: 'Listing requests', icon: VENDOR_ICONS.requests },
  { href: '/plans', label: 'Plans', icon: VENDOR_ICONS.plans },
  { href: '/advertising', label: 'Advertising', icon: VENDOR_ICONS.advertising },
  { href: '/media', label: 'Media library', icon: VENDOR_ICONS.gallery },
  { href: '/gallery', label: 'Factory gallery', icon: VENDOR_ICONS.gallery },
  { href: '/certificates', label: 'Certificates', icon: VENDOR_ICONS.certificates },
  { href: '/disputes', label: 'Disputes', icon: VENDOR_ICONS.disputes },
  { href: '/storefront', label: 'Storefront', icon: VENDOR_ICONS.storefront },
  { href: '/settings', label: 'Company settings', icon: VENDOR_ICONS.settings },
  { href: buyerUrl, label: 'Buyer site', icon: VENDOR_ICONS.storefront, external: true },
];

export function VendorNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="crm-nav">
      {LINKS.map((item) => {
        const active =
          !item.external &&
          (item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`crm-nav-link${active ? ' is-active' : ''}`}
            title={item.label}
            aria-label={item.label}
            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {item.icon}
            <span className="crm-nav-label">{item.label}</span>
            {collapsed ? <span className="crm-nav-tip">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
