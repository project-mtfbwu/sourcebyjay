import { BadgeCheck } from 'lucide-react';
import type { VerificationTier } from '@/types/marketplace';
import { isGoldTier, isPubliclyVerified, TIER_LABELS } from '@/utils/verification';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md';
  className?: string;
}

export function VerificationBadge({ tier, size = 'sm', className }: VerificationBadgeProps) {
  if (!isPubliclyVerified(tier)) {
    return null;
  }

  const gold = isGoldTier(tier);
  const label = gold ? 'Gold' : 'Verified';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        gold
          ? 'bg-amber-400 text-amber-950'
          : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
      title={TIER_LABELS[tier]}
    >
      <BadgeCheck className={size === 'sm' ? 'size-3' : 'size-4'} />
      {label}
    </span>
  );
}
