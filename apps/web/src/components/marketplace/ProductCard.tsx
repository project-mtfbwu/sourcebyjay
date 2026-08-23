'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/marketplace';

interface ProductCardProps {
  product: Product;
  size?: 'sm' | 'md';
}

export function ProductCard({ product, size = 'md' }: ProductCardProps) {
  const imageSize = size === 'sm' ? 140 : 165;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="marketplace-card-hover group block overflow-hidden rounded-lg bg-white"
    >
      <div className="relative overflow-hidden rounded-lg bg-muted" style={{ width: imageSize, height: imageSize }}>
        <Image
          src={product.imageUrl}
          alt={product.title}
          width={imageSize}
          height={imageSize}
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
        {product.isLocal && (
          <span className="absolute left-2 top-2 rounded bg-brand-primary px-1.5 py-0.5 text-xs font-medium text-black">
            Local
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-lg font-semibold text-marketplace-accent">
          ${product.price.toFixed(product.price < 1 ? 2 : product.price % 1 === 0 ? 0 : 2)}
        </p>
        <p className="text-xs text-marketplace-muted">
          {product.soldCount ? `${(product.soldCount / 1000).toFixed(1)}K+ sold` : `MOQ: ${product.moq}`}
        </p>
      </div>
    </Link>
  );
}
