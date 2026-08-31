'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  STOREFRONT_DRAFT_MESSAGE,
  STOREFRONT_PREVIEW_READY,
  mergeDraftIntoSupplierForPreview,
  orderProductsByFeatured,
  type StorefrontDraftPayload,
} from '@sourcebyjay/types';
import { SupplierProfileView } from '@/components/marketplace/supplier/SupplierProfile';
import type { SupplierPreviewData } from '@/lib/load-supplier-preview-data';

function isAllowedVendorOrigin(origin: string): boolean {
  if (!origin) return false;
  const configured = process.env.NEXT_PUBLIC_VENDOR_ORIGIN ?? 'http://localhost:3001';
  const allowed = new Set([
    configured,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);
  if (allowed.has(origin)) return true;
  // Dev: allow seller portal on LAN IP (e.g. 192.168.x.x:3001)
  try {
    const url = new URL(origin);
    return url.port === '3001';
  } catch {
    return false;
  }
}

export function StorefrontPreviewClient({
  initial,
  variant = 'marketplace',
}: {
  initial: SupplierPreviewData;
  variant?: 'marketplace' | 'minisite';
}) {
  const [draft, setDraft] = useState<StorefrontDraftPayload | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== STOREFRONT_DRAFT_MESSAGE) return;
      if (!isAllowedVendorOrigin(event.origin)) return;
      setDraft(event.data.payload as StorefrontDraftPayload);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const targets = new Set<string>([
      process.env.NEXT_PUBLIC_VENDOR_ORIGIN ?? 'http://localhost:3001',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ]);
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        targets.add(new URL(document.referrer).origin);
      } catch {
        // ignore bad referrer
      }
    }

    function sendReady() {
      for (const target of targets) {
        window.parent.postMessage({ type: STOREFRONT_PREVIEW_READY }, target);
      }
    }

    sendReady();
    const interval = window.setInterval(sendReady, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const supplier = useMemo(
    () => mergeDraftIntoSupplierForPreview(initial.supplier, draft),
    [initial.supplier, draft],
  );

  const featuredProductIds = draft?.featuredProductIds ?? supplier.featuredProductIds ?? null;
  const products = useMemo(
    () => orderProductsByFeatured(initial.products, featuredProductIds),
    [initial.products, featuredProductIds],
  );

  return (
    <div className="relative min-h-screen bg-white">
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-950">
        View as buyer — live draft preview
      </div>
      <SupplierProfileView
        key={`${supplier.bannerUrl ?? ''}|${supplier.logoUrl ?? ''}|${supplier.mainProducts}|${featuredProductIds?.join(',') ?? ''}`}
        supplier={supplier}
        products={products}
        gallery={initial.gallery}
        videos={initial.videos}
        certificates={initial.certificates}
        categories={initial.categories}
        variant={variant}
        previewMode
        featuredProductIds={featuredProductIds}
      />
    </div>
  );
}
