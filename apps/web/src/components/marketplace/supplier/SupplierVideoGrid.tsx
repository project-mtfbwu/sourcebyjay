'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { SupplierGalleryItem } from '@/types/marketplace';

export function SupplierVideoGrid({ items }: { items: SupplierGalleryItem[] }) {
  const [active, setActive] = useState<SupplierGalleryItem | null>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (active && lightboxVideoRef.current) {
      void lightboxVideoRef.current.play().catch(() => undefined);
    }
  }, [active]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-marketplace-border p-12 text-center text-marketplace-muted">
        Factory videos will appear here after ops approval.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const src = item.videoUrl ?? item.imageUrl;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="group overflow-hidden rounded-xl border border-marketplace-border bg-white text-left"
            >
              <div className="relative aspect-video bg-muted">
                {src ? (
                  <video
                    src={src}
                    className="pointer-events-none h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-90 transition group-hover:bg-black/35">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-marketplace-ink shadow">
                    <Play className="ml-0.5 size-5 fill-current" />
                  </span>
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium">{item.caption ?? 'Factory tour'}</p>
                <p className="mt-1 text-xs capitalize text-marketplace-muted">{item.mediaType.replace(/_/g, ' ')}</p>
              </div>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={lightboxVideoRef}
              src={active.videoUrl ?? active.imageUrl}
              className="max-h-[80vh] w-full"
              controls
              autoPlay
              playsInline
              preload="auto"
            />
            {active.caption ? (
              <p className="bg-black px-4 py-2 text-sm text-white/90">{active.caption}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
