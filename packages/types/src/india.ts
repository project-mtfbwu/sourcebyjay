/** India B2B field validators (GSTIN, PAN, HSN, pincode). */

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const HSN_RE = /^[0-9]{4,8}$/;
const PINCODE_RE = /^[0-9]{6}$/;

export const GST_RATE_BPS_OPTIONS = [0, 500, 1200, 1800, 2800] as const;

export const CERT_TYPE_OPTIONS = [
  'ISO_9001',
  'ISO_14001',
  'CE',
  'BIS',
  'RoHS',
  'FSSAI',
  'GMP',
  'other',
] as const;

export const BUSINESS_TYPE_OPTIONS = ['manufacturer', 'trader', 'both'] as const;

export function normalizeGstin(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizePan(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidGstin(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return GSTIN_RE.test(normalizeGstin(value));
}

export function isValidPan(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return PAN_RE.test(normalizePan(value));
}

export function isValidHsn(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return HSN_RE.test(value.trim());
}

export function isValidPincode(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return PINCODE_RE.test(value.trim());
}

export function gstRateLabel(bps: number): string {
  return `${bps / 100}%`;
}
