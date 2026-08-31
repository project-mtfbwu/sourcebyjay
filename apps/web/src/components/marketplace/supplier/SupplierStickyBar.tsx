'use client';

import { StartChatButton } from '@/components/marketplace/chat/StartChatButton';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';
import { InquiryDialog } from '@/components/marketplace/product/InquiryDialog';
import type { Product, Supplier } from '@/types/marketplace';

/**
 * Mobile sticky action bar — Alibaba factory storefront pattern.
 * Desktop actions remain in the hero; this bar is `md:hidden`.
 */
export function SupplierStickyBar({
  supplier,
  rfqProduct,
}: {
  supplier: Supplier;
  rfqProduct: Product | null;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-marketplace-border bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      role="toolbar"
      aria-label="Contact supplier"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <StartChatButton
          supplierId={supplier.id}
          productId={rfqProduct?.id}
          supplierName={supplier.name}
          label="Chat"
          className="flex-1 justify-center text-sm"
        />
        {rfqProduct ? (
          <InquiryDialog
            productId={rfqProduct.id}
            supplierId={supplier.id}
            productTitle={rfqProduct.title}
            productSlug={rfqProduct.slug}
            type="rfq"
            label="RFQ"
            variant="outline"
          />
        ) : null}
        <FavoriteButton kind="supplier" supplierId={supplier.id} />
      </div>
    </div>
  );
}
