import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuaranteeBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
  /** Compact icon-only for card overlays */
  iconOnly?: boolean;
}

/** SourceByJay Guarantee — Alibaba Trade Assurance parallel (shield + tooltip). */
export function GuaranteeBadge({ size = 'sm', className, iconOnly = false }: GuaranteeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-emerald-100 font-medium text-emerald-900',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
      title="Protected by SourceByJay Guarantee when you pay on platform"
    >
      <ShieldCheck className={size === 'sm' ? 'size-3' : 'size-4'} aria-hidden />
      {iconOnly ? <span className="sr-only">SourceByJay Guarantee</span> : 'Guarantee'}
    </span>
  );
}
