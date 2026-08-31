'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import type { Product } from '@/types/marketplace';
import { Slider } from '@/components/ui/slider';

const MAX_SUPPLIERS = 20;
const MIN_SUBMIT = 2;
const STORAGE_KEY = 'sbj-rfq-cart-v2';

export type RfqPick = {
  supplierId: string;
  productId: string;
  productTitle: string;
  imageUrl?: string;
};

type RfqSelectContextValue = {
  selected: Map<string, RfqPick>;
  toggle: (pick: RfqPick) => void;
  remove: (productId: string) => void;
  isSelected: (productId: string) => boolean;
  clear: () => void;
  /** First N unique suppliers in sort order (one product pick per supplier) */
  selectFromProducts: (products: Product[], limit?: number) => void;
  count: number;
  picks: RfqPick[];
  supplierCount: number;
};

export const RfqSelectContext = createContext<RfqSelectContextValue | null>(null);

function picksToMap(picks: RfqPick[]): Map<string, RfqPick> {
  return new Map(picks.map((p) => [p.productId, p]));
}

function readStored(): Map<string, RfqPick> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as RfqPick[];
    if (!Array.isArray(parsed)) return new Map();
    return picksToMap(parsed.slice(0, MAX_SUPPLIERS));
  } catch {
    return new Map();
  }
}

function productToPick(product: Product): RfqPick {
  return {
    supplierId: product.supplierId,
    productId: product.id,
    productTitle: product.title,
    imageUrl: product.imageUrl,
  };
}

/** Walk sorted list — first product seen per supplier, up to limit (Alibaba-style). */
export function uniqueSupplierPicks(products: Product[], limit: number): RfqPick[] {
  const n = Math.max(0, Math.min(limit, MAX_SUPPLIERS));
  const seen = new Set<string>();
  const out: RfqPick[] = [];
  for (const product of products) {
    if (seen.has(product.supplierId)) continue;
    seen.add(product.supplierId);
    out.push(productToPick(product));
    if (out.length >= n) break;
  }
  return out;
}

export function RfqSelectProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Map<string, RfqPick>>(() => new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelected(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected.values())));
    } catch {
      // ignore quota / private mode
    }
  }, [selected, hydrated]);

  const toggle = useCallback((pick: RfqPick) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(pick.productId)) {
        next.delete(pick.productId);
      } else {
        for (const [key, value] of next) {
          if (value.supplierId === pick.supplierId) next.delete(key);
        }
        if (next.size >= MAX_SUPPLIERS) return prev;
        next.set(pick.productId, pick);
      }
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setSelected((prev) => {
      if (!prev.has(productId)) return prev;
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Map()), []);

  const selectFromProducts = useCallback((products: Product[], limit = MAX_SUPPLIERS) => {
    setSelected(picksToMap(uniqueSupplierPicks(products, limit)));
  }, []);

  const value = useMemo<RfqSelectContextValue>(() => {
    const picks = Array.from(selected.values());
    const supplierCount = new Set(picks.map((p) => p.supplierId)).size;
    return {
      selected,
      toggle,
      remove,
      isSelected: (productId: string) => selected.has(productId),
      clear,
      selectFromProducts,
      count: selected.size,
      picks,
      supplierCount,
    };
  }, [selected, toggle, remove, clear, selectFromProducts]);

  return <RfqSelectContext.Provider value={value}>{children}</RfqSelectContext.Provider>;
}

export function useRfqSelect() {
  const ctx = useContext(RfqSelectContext);
  if (!ctx) throw new Error('useRfqSelect must be used within RfqSelectProvider');
  return ctx;
}

export function RfqBulkActions({ products }: { products: Product[] }) {
  const { selectFromProducts, clear, count, supplierCount } = useRfqSelect();
  const uniqueOnPage = Math.max(1, new Set(products.map((p) => p.supplierId)).size);
  const sliderMax = Math.min(MAX_SUPPLIERS, uniqueOnPage);
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const capped = Math.min(target, sliderMax);
    selectFromProducts(products, capped);
    if (capped !== target) setTarget(capped);
  }, [products, target, sliderMax, selectFromProducts]);

  return (
    <div className="space-y-2">
      <p className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs leading-snug text-sky-950">
        <strong>One RFQ per supplier</strong> (same as Alibaba compare-sourcing). Each factory gets
        one quote request — we tick the <strong>first listing</strong> for that supplier in the
        current sort. More listings from the same supplier stay unticked unless you click them
        yourself (that swaps which product you ask about).
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-marketplace-ink">
            Suppliers to quote
            {target > 0 ? (
              <span className="text-[#ff6600]"> · {supplierCount} selected</span>
            ) : (
              <span className="font-normal text-marketplace-muted"> · slide to auto-tick</span>
            )}
          </p>
          <div className="flex w-[168px] items-center gap-1.5">
            <span className="w-3 text-[10px] text-marketplace-muted">0</span>
            <Slider
              min={0}
              max={sliderMax}
              step={1}
              value={[target]}
              onValueChange={(v) => {
                const next = v[0] ?? 0;
                setTarget(next);
                if (next <= 0) clear();
                else selectFromProducts(products, next);
              }}
              className="w-[140px]"
              aria-label="Number of suppliers to add to RFQ"
            />
            <span className="w-4 text-[10px] text-marketplace-muted">{sliderMax}</span>
          </div>
          <p className="text-[10px] text-marketplace-muted">
            {uniqueOnPage} supplier{uniqueOnPage === 1 ? '' : 's'} on this page (max {sliderMax})
          </p>
        </div>
        {count > 0 ? (
          <button
            type="button"
            onClick={() => {
              setTarget(0);
              clear();
            }}
            className="text-xs text-marketplace-muted hover:text-foreground"
          >
            Clear ({supplierCount})
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Floating RFQ cart — mid-right for easy reach; list, remove, submit. */
export function RfqSelectBar({ searchQuery }: { searchQuery?: string }) {
  const { count, picks, supplierCount, remove, clear } = useRfqSelect();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (count === 0) setOpen(false);
  }, [count]);

  if (count === 0) return null;

  const params = new URLSearchParams();
  params.set(
    'targets',
    picks.map((p) => `${p.supplierId}:${p.productId}`).join(','),
  );
  if (searchQuery) params.set('q', searchQuery);

  const ready = supplierCount >= MIN_SUBMIT;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 top-28 z-40 flex items-center gap-2 rounded-full border border-marketplace-border bg-white px-4 py-3 shadow-lg sm:top-32"
        >
          <ShoppingCart className="size-5" />
          <span className="text-sm font-semibold">
            RFQ cart · {supplierCount}
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-[#ff6600] text-xs font-bold text-white">
            {count}
          </span>
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-end p-0 sm:inset-x-auto sm:right-4 sm:top-28 sm:p-0">
          <div className="flex max-h-[min(75vh,560px)] w-full flex-col border border-marketplace-border bg-white shadow-2xl sm:w-[380px] sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-marketplace-border px-4 py-3">
              <div>
                <p className="font-semibold">RFQ cart</p>
                <p className="text-xs text-marketplace-muted">
                  {supplierCount}/{MAX_SUPPLIERS} suppliers · one RFQ each
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-marketplace-muted hover:bg-muted hover:text-foreground"
                aria-label="Close cart"
              >
                <X className="size-5" />
              </button>
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {picks.map((pick) => (
                <li
                  key={pick.productId}
                  className="flex items-center gap-3 rounded-lg border border-marketplace-border p-2"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {pick.imageUrl ? (
                      <Image
                        src={pick.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{pick.productTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(pick.productId)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-marketplace-border px-4 py-3">
              {!ready ? (
                <p className="text-center text-sm text-marketplace-muted">
                  Add products from at least <strong>{MIN_SUBMIT} different suppliers</strong>
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clear}
                  className="h-11 flex-1 rounded-md border border-marketplace-border text-sm font-medium hover:bg-muted"
                >
                  Clear all
                </button>
                {ready ? (
                  <Link
                    href={`/rfq/new?${params.toString()}`}
                    className="inline-flex h-11 flex-[2] items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-black"
                  >
                    Request quotes
                  </Link>
                ) : (
                  <span className="inline-flex h-11 flex-[2] items-center justify-center rounded-md bg-muted text-sm text-marketplace-muted">
                    Need {MIN_SUBMIT}+ suppliers
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
