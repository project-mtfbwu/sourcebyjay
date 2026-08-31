'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export type FavoriteRow = {
  id: string;
  kind: string;
  product_id: string | null;
  supplier_id: string;
  created_at: string;
  products: { id: string; title: string; slug: string; image_url: string | null } | null;
  suppliers: { id: string; name: string; slug: string; city: string; country: string } | null;
};

/** Alibaba Favorites: select rows → Contact selected (batch RFQ when 2+). */
export function FavoritesList({ rows }: { rows: FavoriteRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const targetsParam = useMemo(() => {
    const picks = rows.filter((r) => selected.has(r.id));
    const bySupplier = new Map<string, string>();
    for (const r of picks) {
      const productPart = r.product_id ?? '';
      if (!bySupplier.has(r.supplier_id)) {
        bySupplier.set(r.supplier_id, `${r.supplier_id}:${productPart}`);
      }
    }
    return [...bySupplier.values()].join(',');
  }, [rows, selected]);

  const supplierCount = useMemo(() => {
    const s = new Set(
      rows.filter((r) => selected.has(r.id)).map((r) => r.supplier_id),
    );
    return s.size;
  }, [rows, selected]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No favorites yet. Tap the heart on a product or supplier (Alibaba Favorites).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
        >
          Select all
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
          Clear
        </Button>
        {supplierCount >= 2 ? (
          <Button asChild size="sm" className="bg-[#ff6600] hover:bg-[#e55c00]">
            <Link href={`/rfq/new?targets=${encodeURIComponent(targetsParam)}`}>
              Contact selected ({supplierCount})
            </Link>
          </Button>
        ) : supplierCount === 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/suppliers/${
                rows.find((r) => selected.has(r.id))?.suppliers?.slug ?? ''
              }`}
            >
              Open supplier (add another to batch RFQ)
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Select 2+ suppliers to batch-send RFQ (Alibaba Favorites on PC)
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {rows.map((row) => {
          const product = Array.isArray(row.products) ? row.products[0] : row.products;
          const supplier = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;
          const checked = selected.has(row.id);
          return (
            <li key={row.id} className="flex items-start gap-3 rounded-xl border p-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#ff6600]"
                checked={checked}
                onChange={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(row.id)) next.delete(row.id);
                    else next.add(row.id);
                    return next;
                  });
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {row.kind === 'product'
                    ? (product as { title?: string } | null)?.title ?? 'Product'
                    : (supplier as { name?: string } | null)?.name ?? 'Supplier'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(supplier as { name?: string } | null)?.name}
                  {' · '}
                  {(supplier as { city?: string } | null)?.city},{' '}
                  {(supplier as { country?: string } | null)?.country}
                  {' · '}
                  {row.kind}
                </p>
                <div className="mt-1 flex gap-3 text-xs">
                  {product && (product as { slug?: string }).slug ? (
                    <Link
                      href={`/products/${(product as { slug: string }).slug}`}
                      className="text-[#ff6600] hover:underline"
                    >
                      Product
                    </Link>
                  ) : null}
                  {supplier && (supplier as { slug?: string }).slug ? (
                    <Link
                      href={`/suppliers/${(supplier as { slug: string }).slug}`}
                      className="text-[#ff6600] hover:underline"
                    >
                      Store
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
