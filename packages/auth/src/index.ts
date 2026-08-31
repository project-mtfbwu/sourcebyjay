import {
  STAFF_ROLE_RANK,
  type Portal,
  type StaffRole,
  type UserRole,
} from '@sourcebyjay/types';

/**
 * Separate auth cookie names per portal.
 * On localhost, cookies are host-scoped (not port), so buyer:3000 and seller:3001
 * would overwrite each other with the default Supabase cookie name.
 * Prod uses different subdomains; unique names still keep sessions isolated.
 */
export const PORTAL_AUTH_COOKIE = {
  web: 'sb-sbj-buyer-auth',
  vendor: 'sb-sbj-seller-auth',
  ops: 'sb-sbj-ops-auth',
} as const satisfies Record<Portal, string>;

/** True if staffRole meets or exceeds the required minimum. */
export function hasStaffRole(
  staffRole: StaffRole | null | undefined,
  minimum: StaffRole,
): boolean {
  if (!staffRole) return false;
  return STAFF_ROLE_RANK[staffRole] >= STAFF_ROLE_RANK[minimum];
}

/** Buyer account surfaces (not seller Seller Central). Admin legacy web CMS allowed. */
export function isBuyerAccountRole(role: UserRole | null | undefined): boolean {
  return role === 'buyer' || role === 'admin';
}

/**
 * Which portal a profile role may enter.
 * Vendor = seller only (Amazon Seller Central style). Legacy `admin` stays on web/ops, not Seller Central.
 * Ops also requires an active staff_members role passed as staffRole.
 */
export function canAccessPortal(
  portal: Portal,
  profileRole: UserRole | null | undefined,
  staffRole?: StaffRole | null,
): boolean {
  if (portal === 'web') return profileRole !== 'seller';
  if (portal === 'vendor') return profileRole === 'seller';
  if (portal === 'ops') return hasStaffRole(staffRole ?? null, 'viewer');
  return false;
}

export function assertPortalAccess(
  portal: Portal,
  profileRole: UserRole | null | undefined,
  staffRole?: StaffRole | null,
): void {
  if (!canAccessPortal(portal, profileRole, staffRole)) {
    throw new Error(`Access denied for portal: ${portal}`);
  }
}

export {
  STAFF_ROLE_RANK,
  type Portal,
  type StaffRole,
  type UserRole,
};
