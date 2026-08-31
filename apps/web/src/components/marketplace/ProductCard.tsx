'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product, VerificationTier } from '@/types/marketplace';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';
import { useContext } from 'react';
import {
  RfqSelectContext,
  type RfqPick,
} from '@/components/marketplace/rfq/RfqSelectContext';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';

interface ProductCardProps {
  product: Product;
  size?: 'sm' | 'md';
  supplierVerificationTier?: VerificationTier;
  guaranteeEligible?: boolean;
  /** When true, show multi-RFQ checkbox (search page). */
  selectable?: boolean;
  /** Alibaba-style heart on card image (home + search). Default true. */
  showFavorite?: boolean;
  initialFavorited?: boolean;
}

export function ProductCard({
  product,
  size = 'md',
  supplierVerificationTier,
  guaranteeEligible = false,
  selectable = false,
  showFavorite = true,
  initialFavorited = false,
}: ProductCardProps) {
  const imageSize = size === 'sm' ? 140 : 165;
  const rfq = useContext(RfqSelectContext);
  const checked = selectable && rfq ? rfq.isSelected(product.id) : false;

  return (
    <div className="relative" style={{ width: imageSize }}>
      {selectable && rfq ? (
        <label className="absolute left-2 top-2 z-20 flex cursor-pointer items-center gap-1.5 rounded-md border border-brand-primary bg-white px-2 py-1.5 text-xs font-bold text-black shadow-md">
          <input
            type="checkbox"
            className="size-4 accent-brand-primary"
            checked={checked}
            onChange={() =>
              rfq.toggle({
                supplierId: product.supplierId,
                productId: product.id,
                productTitle: product.title,
                imageUrl: product.imageUrl,
              } satisfies RfqPick)
            }
            onClick={(e) => e.stopPropagation()}
          />
          RFQ
        </label>
      ) : null}
      {showFavorite ? (
        <FavoriteButton
          variant="overlay"
          kind="product"
          supplierId={product.supplierId}
          productId={product.id}
          initialFavorited={initialFavorited}
        />
      ) : null}
      <Link
        href={`/products/${product.slug}`}
        className="marketplace-card-hover group block overflow-hidden rounded-lg bg-white"
      >
        <div
          className="relative overflow-hidden rounded-lg bg-muted"
          style={{ width: imageSize, height: imageSize }}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={imageSize}
            height={imageSize}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
          {!selectable && product.isLocal && (
            <span className="absolute left-2 top-2 rounded bg-brand-primary px-1.5 py-0.5 text-xs font-medium text-black">
              Local
            </span>
          )}
          {selectable && product.isLocal && (
            <span className="absolute bottom-2 left-2 rounded bg-brand-primary px-1.5 py-0.5 text-xs font-medium text-black">
              Local
            </span>
          )}
          <div
            className={`absolute flex flex-col items-end gap-1 ${
              showFavorite ? 'bottom-2 right-2' : 'right-2 top-2'
            }`}
          >
            {guaranteeEligible ? <GuaranteeBadge iconOnly={size === 'sm'} /> : null}
            {supplierVerificationTier ? (
              <VerificationBadge tier={supplierVerificationTier} />
            ) : null}
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-lg font-semibold text-marketplace-accent">
            $
            {product.price.toFixed(product.price < 1 ? 2 : product.price % 1 === 0 ? 0 : 2)}
          </p>
          <p className="line-clamp-2 text-xs text-marketplace-ink">{product.title}</p>
          <p className="text-xs text-marketplace-muted">
            {product.soldCount
              ? `${(product.soldCount / 1000).toFixed(1)}K+ sold`
              : `MOQ: ${product.moq}`}
          </p>
        </div>
      </Link>
    </div>
  );
}
