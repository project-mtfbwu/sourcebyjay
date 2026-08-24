import type { VerificationTier } from '@/types/marketplace';

const PUBLIC_TIERS: VerificationTier[] = ['verified', 'gold', 'assessed'];
const GOLD_TIERS: VerificationTier[] = ['gold', 'assessed'];

export function isPubliclyVerified(tier: VerificationTier): boolean {
  return PUBLIC_TIERS.includes(tier);
}

export function isGoldTier(tier: VerificationTier): boolean {
  return GOLD_TIERS.includes(tier);
}

export function tierFromLegacyVerified(verified: boolean): VerificationTier {
  return verified ? 'verified' : 'none';
}

export function legacyVerifiedFromTier(tier: VerificationTier): boolean {
  return isPubliclyVerified(tier);
}

export const TIER_LABELS: Record<VerificationTier, string> = {
  none: 'Unverified',
  basic: 'Basic',
  verified: 'Verified',
  gold: 'Gold Verified',
  assessed: 'Assessed Supplier',
};

export const TIER_OPTIONS: VerificationTier[] = [
  'none',
  'basic',
  'verified',
  'gold',
  'assessed',
];
