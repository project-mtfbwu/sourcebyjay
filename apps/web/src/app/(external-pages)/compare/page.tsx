'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';
import type { VerificationTier } from '@/types/marketplace';
import { useCompare } from '@/components/marketplace/compare/CompareContext';
import { Button } from '@/components/ui/button';

export default function ComparePage() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Compare suppliers</h1>
        <p className="mt-2 text-sm text-marketplace-muted">
          Add 2–4 suppliers from product or store pages (Alibaba compare). Tray appears at the
          bottom.
        </p>
        <Button asChild className="mt-6 bg-[#ff6600] hover:bg-[#e55c00]">
          <Link href="/search">Browse products</Link>
        </Button>
      </div>
    );
  }

  const cols = items;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compare suppliers</h1>
          <p className="mt-1 text-sm text-marketplace-muted">
            Side-by-side MOQ signals, location, verify tier, response — max 4.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-marketplace-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-3 text-left font-medium text-marketplace-muted"> </th>
              {cols.map((c) => (
                <th key={c.supplierId} className="p-3 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/suppliers/${c.supplierSlug}`}
                      className="font-semibold hover:text-[#ff6600]"
                    >
                      {c.supplierName}
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => remove(c.supplierId)}
                    >
                      Remove
                    </button>
                  </div>
                  <VerificationBadge
                    tier={c.verificationTier as VerificationTier}
                    className="mt-1"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Location">
              {cols.map((c) => (
                <td key={c.supplierId} className="p-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-marketplace-muted" />
                    {c.city}, {c.country}
                  </span>
                </td>
              ))}
            </Row>
            <Row label="Years in business">
              {cols.map((c) => (
                <td key={c.supplierId} className="p-3">
                  {c.yearsInBusiness}+
                </td>
              ))}
            </Row>
            <Row label="Response rate">
              {cols.map((c) => (
                <td key={c.supplierId} className="p-3">
                  {c.responseRate}
                </td>
              ))}
            </Row>
            <Row label="Main products">
              {cols.map((c) => (
                <td key={c.supplierId} className="p-3">
                  {c.mainProducts}
                </td>
              ))}
            </Row>
            <Row label="Sample product">
              {cols.map((c) => (
                <td key={c.supplierId} className="p-3">
                  {c.productTitle ?? '—'}
                </td>
              ))}
            </Row>
            <tr>
              <th className="border-t p-3 text-left font-medium text-marketplace-muted">Actions</th>
              {cols.map((c) => (
                <td key={c.supplierId} className="border-t p-3">
                  <Link
                    href={`/suppliers/${c.supplierSlug}`}
                    className="text-[#ff6600] hover:underline"
                  >
                    Visit store
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {items.length >= 2 ? (
        <p className="mt-4 text-sm text-marketplace-muted">
          Ready to ask for quotes?{' '}
          <Link href="/search?rfq=1" className="font-medium text-[#ff6600] hover:underline">
            Multi-supplier RFQ from search
          </Link>
          {' · '}
          <Link href="/account/favorites" className="font-medium text-[#ff6600] hover:underline">
            Or contact from Favorites
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-sm text-marketplace-muted">Add at least one more supplier to compare.</p>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b last:border-0">
      <th className="p-3 text-left font-medium text-marketplace-muted">{label}</th>
      {children}
    </tr>
  );
}
