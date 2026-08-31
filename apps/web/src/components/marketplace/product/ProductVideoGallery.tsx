'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { FavoriteButton } from '@/components/marketplace/favorites/FavoriteButton';

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
  const [selected, setSelected] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const hasVideo = Boolean(videoUrl);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-marketplace-border bg-muted">
        {showVideo && videoUrl ? (
          <>
            <video src={videoUrl} className="h-full w-full object-contain bg-black" controls autoPlay playsInline />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white"
              onClick={() => setShowVideo(false)}
              aria-label="Close video"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <Image
              src={images[selected]}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            {favorite ? (
              <FavoriteButton
                variant="overlay"
                kind="product"
                supplierId={favorite.supplierId}
                productId={favorite.productId}
                initialFavorited={favorite.initialFavorited}
              />
            ) : null}
            {hasVideo ? (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/20"
                aria-label="Play product video"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-marketplace-ink shadow-lg">
                  <Play className="ml-1 size-7 fill-current" />
                </span>
              </button>
            ) : null}
          </>
        )}
      </div>
      {images.length > 1 && !showVideo ? (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative size-16 overflow-hidden rounded-lg border-2 ${
                selected === i ? 'border-marketplace-accent' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
      {hasVideo && !showVideo ? (
        <p className="text-xs text-marketplace-muted">Video available — tap play on the image (Alibaba-style).</p>
      ) : null}
    </div>
  );
}
