import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import type { Product } from '@/types/marketplace';

/** Shown when buyer arrives from PDP company card (?productId=). */
export function SupplierContextBanner({ product }: { product: Product }) {
  const thumb = product.imageUrl || product.images[0];

  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        You viewed this product
      </p>
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-emerald-100 bg-muted">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex size-full items-center justify-center text-emerald-600">
              <Package className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{product.title}</p>
          <p className="text-sm text-marketplace-muted">
            MOQ {product.moq} · ${product.price.toFixed(2)}/unit
          </p>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          View
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
