'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { SponsoredAd } from '@/data/anon/ads';
import { recordAdClickAction, recordAdImpressionAction } from '@/data/anon/ad-actions';
import { safeMarketplaceImageSrc } from '@/utils/marketplace-image';

export function SponsoredProductCard({
  ad,
  placement,
  searchQuery,
  size = 'md',
}: {
  ad: SponsoredAd;
  placement: string;
  searchQuery?: string;
  size?: 'sm' | 'md';
}) {
  const impressionRecorded = useRef(false);
  const imageSize = size === 'sm' ? 140 : 165;
  const title = ad.headlineOverride ?? ad.productTitle;
  const href = ad.productId ? `/products/${ad.productSlug}` : `/suppliers/${ad.supplierSlug}`;

  useEffect(() => {
    if (impressionRecorded.current) return;
    impressionRecorded.current = true;
    void recordAdImpressionAction(ad.creativeId, placement, searchQuery);
  }, [ad.creativeId, placement, searchQuery]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    await recordAdClickAction(ad.creativeId, null, placement);
    window.location.href = href;
  }

  if (ad.creativeFormat === 'text') {
    return (
      <div className="relative rounded-lg border border-marketplace-border bg-white p-3" style={{ maxWidth: imageSize + 40 }}>
        <span className="absolute right-2 top-2 z-10 rounded bg-marketplace-muted/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Sponsored
        </span>
        <Link href={href} onClick={handleClick} className="marketplace-card-hover block">
          <p className="line-clamp-2 text-sm font-semibold text-marketplace-ink">{title}</p>
          {ad.bodyText ? (
            <p className="mt-1 line-clamp-3 text-xs text-marketplace-muted">{ad.bodyText}</p>
          ) : null}
          <p className="mt-2 text-xs text-marketplace-muted">{ad.supplierName}</p>
          <span className="mt-2 inline-block text-xs font-semibold text-blue-600">{ad.ctaLabel}</span>
        </Link>
      </div>
    );
  }

  const imageSrc = safeMarketplaceImageSrc(ad.productImageUrl || ad.mediaUrl || '');
  const isVideo = ad.creativeFormat === 'video' && Boolean(ad.mediaUrl);

  return (
    <div className="relative" style={{ width: imageSize }}>
      <span className="absolute right-2 top-2 z-10 rounded bg-marketplace-muted/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        Sponsored
      </span>
      <Link
        href={href}
        onClick={handleClick}
        className="marketplace-card-hover block overflow-hidden rounded-lg border border-marketplace-border bg-white"
      >
        <div className="relative aspect-square bg-muted">
          {isVideo ? (
            <video
              src={ad.mediaUrl!}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : imageSrc ? (
            <Image src={imageSrc} alt={title} fill className="object-cover" sizes={`${imageSize}px`} />
          ) : null}
        </div>
        <div className="p-2">
          <p className="line-clamp-2 text-xs font-medium text-marketplace-ink">{title}</p>
          {ad.bodyText ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-marketplace-muted">{ad.bodyText}</p>
          ) : null}
          <p className="mt-1 text-xs text-marketplace-muted">{ad.supplierName}</p>
          {ad.productPrice > 0 ? (
            <p className="mt-0.5 text-sm font-semibold text-marketplace-accent">
              ₹{ad.productPrice.toLocaleString('en-IN')}
            </p>
          ) : (
            <span className="mt-1 inline-block text-xs font-semibold text-blue-600">{ad.ctaLabel}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
