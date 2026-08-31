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
import Link from 'next/link';
import { Columns2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CompareItem = {
  supplierId: string;
  supplierName: string;
  supplierSlug: string;
  verificationTier: string;
  city: string;
  country: string;
  yearsInBusiness: number;
  responseRate: string;
  mainProducts: string;
  productId?: string;
  productTitle?: string;
};

const STORAGE_KEY = 'sbj-compare-suppliers';
const MAX = 4;

type CompareCtx = {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (supplierId: string) => void;
  clear: () => void;
  isSelected: (supplierId: string) => boolean;
};

const CompareContext = createContext<CompareCtx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompareItem[];
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.supplierId === item.supplierId)) return prev;
      if (prev.length >= MAX) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((supplierId: string) => {
    setItems((prev) => prev.filter((p) => p.supplierId !== supplierId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback(
    (supplierId: string) => items.some((i) => i.supplierId === supplierId),
    [items],
  );

  const value = useMemo(
    () => ({ items, add, remove, clear, isSelected }),
    [items, add, remove, clear, isSelected],
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
      <CompareTray />
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

export function useCompareOptional() {
  return useContext(CompareContext);
}

function CompareTray() {
  const ctx = useContext(CompareContext);
  if (!ctx || ctx.items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-marketplace-border bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 lg:px-10">
        <Columns2 className="size-5 shrink-0 text-[#ff6600]" />
        <p className="text-sm font-medium">
          Compare ({ctx.items.length}/{MAX})
        </p>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
          {ctx.items.map((item) => (
            <li
              key={item.supplierId}
              className="flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
            >
              <span className="max-w-[140px] truncate">{item.supplierName}</span>
              <button
                type="button"
                aria-label={`Remove ${item.supplierName}`}
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => ctx.remove(item.supplierId)}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="bg-[#ff6600] hover:bg-[#e55c00]">
          <Link href="/compare">Compare now</Link>
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={ctx.clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
