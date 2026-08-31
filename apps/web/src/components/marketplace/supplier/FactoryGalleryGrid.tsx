'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { SupplierGalleryItem } from '@/types/marketplace';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

/** Approved factory photos — grid + lightbox (Phase 18). */
export function FactoryGalleryGrid({ items }: { items: SupplierGalleryItem[] }) {
  const [lightbox, setLightbox] = useState<SupplierGalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightbox(item)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-marketplace-border bg-muted text-left"
          >
            <Image
              src={item.imageUrl}
              alt={item.caption ?? 'Factory photo'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            {item.caption ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-xs text-white line-clamp-2">
                {item.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">{lightbox?.caption ?? 'Factory photo'}</DialogTitle>
          {lightbox ? (
            <div className="relative">
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white"
                onClick={() => setLightbox(null)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
              <div className="relative aspect-video bg-black">
                <Image
                  src={lightbox.imageUrl}
                  alt={lightbox.caption ?? 'Factory photo'}
                  fill
                  className="object-contain"
                  sizes="900px"
                />
              </div>
              {lightbox.caption ? (
                <p className="border-t border-marketplace-border px-4 py-3 text-sm text-marketplace-muted">
                  {lightbox.caption}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
