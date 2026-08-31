'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';
import type { ProductMediaItem } from '@/types/marketplace';

export function ProductMediaGallery({
  media,
  title,
  favorite,
}: {
  media: ProductMediaItem[];
  title: string;
  favorite?: { supplierId: string; productId: string; initialFavorited?: boolean };
}) {
  const [selected, setSelected] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slides = useMemo(() => (media.length > 0 ? media : []), [media]);
  const current = slides[selected];

  if (slides.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-marketplace-border bg-muted" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-marketplace-border bg-muted">
        {current?.kind === 'video' ? (
          <video
            ref={videoRef}
            key={current.url}
            src={current.url}
            className="h-full w-full object-contain bg-black"
            controls
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <Image
            src={current?.url ?? slides[0].url}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        )}
        {favorite ? (
          <FavoriteButton
            variant="overlay"
            kind="product"
            supplierId={favorite.supplierId}
            productId={favorite.productId}
            initialFavorited={favorite.initialFavorited}
          />
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              onClick={() => {
                setSelected(i);
                if (item.kind === 'video') {
                  requestAnimationFrame(() => void videoRef.current?.play().catch(() => undefined));
                }
              }}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                selected === i ? 'border-marketplace-accent' : 'border-transparent'
              }`}
            >
              {item.kind === 'video' ? (
                <>
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="size-4 fill-white text-white" />
                  </span>
                </>
              ) : (
                <Image src={item.url} alt="" fill className="object-cover" sizes="64px" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated — use ProductMediaGallery */
export function ProductVideoGallery({
  images,
  title,
  videoUrl,
  favorite,
}: {
  images: string[];
  title: string;
  videoUrl?: string | null;
  favorite?: { supplierId: string; productId: string; initialFavorited?: boolean };
}) {
  const media: ProductMediaItem[] = images.map((url, i) => ({
    id: `img-${i}`,
    kind: 'image',
    url,
    sortOrder: i,
  }));
  if (videoUrl) {
    media.push({ id: 'legacy-video', kind: 'video', url: videoUrl, sortOrder: media.length });
  }
  return <ProductMediaGallery media={media} title={title} favorite={favorite} />;
}
