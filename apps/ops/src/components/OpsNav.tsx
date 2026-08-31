'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { StaffRole } from '@sourcebyjay/types';
import { hasStaffRole } from '@sourcebyjay/auth';
import { ICONS } from '@/components/ops-icons';

type NavItem = {
  href: string;
  label: string;
  minRole?: StaffRole;
  icon: React.ReactNode;
};

const LINKS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: ICONS.dashboard },
  { href: '/buyers', label: 'Buyers', icon: ICONS.buyers },
  { href: '/vendors', label: 'Sellers', icon: ICONS.sellers },
  { href: '/listings', label: 'Listings', icon: ICONS.listings },
  { href: '/orders', label: 'Orders', icon: ICONS.orders },
  { href: '/advertising', label: 'Advertising', icon: ICONS.advertising },
  { href: '/disputes', label: 'Disputes', icon: ICONS.disputes },
  { href: '/storefront-queue', label: 'Queues', icon: ICONS.queues },
  { href: '/plans', label: 'Plans', icon: ICONS.plans },
  { href: '/form-fields', label: 'Form fields', icon: ICONS.forms },
  { href: '/audit-log', label: 'Audit log', icon: ICONS.audit },
  { href: '/staff', label: 'Staff', minRole: 'admin', icon: ICONS.staff },
];

export function OpsNav({
  staffRole,
  collapsed = false,
}: {
  staffRole?: StaffRole | null;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const role = staffRole ?? null;

  return (
    <nav className="crm-nav">
      {LINKS.map((item) => {
        if (item.minRole && !hasStaffRole(role, item.minRole)) return null;
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`crm-nav-link${active ? ' is-active' : ''}`}
            title={item.label}
            aria-label={item.label}
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
