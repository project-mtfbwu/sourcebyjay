'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleFavoriteAction } from '@/data/user/favorites';
import { createClient } from '@/supabase-clients/client';
import { cn } from '@/lib/utils';

type FavoriteButtonProps = {
  kind: 'product' | 'supplier';
  supplierId: string;
  productId?: string;
  initialFavorited?: boolean;
  className?: string;
  /**
   * Alibaba PC PDP / cards: circular heart overlay on the image (top-right).
   * `button` = text pill (rare; prefer overlay for listings).
   */
  variant?: 'overlay' | 'button';
};

/** Alibaba-style Favorites — prefer overlay heart on the listing image. */
export function FavoriteButton({
  kind,
  supplierId,
  productId,
  initialFavorited = false,
  className,
  variant = 'button',
}: FavoriteButtonProps) {
  const [authReady, setAuthReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
      setAuthReady(true);
    });
  }, []);

  const { execute, status } = useAction(toggleFavoriteAction, {
    onSuccess: ({ data }) => {
      if (typeof data?.favorited === 'boolean') {
        setFavorited(data.favorited);
        toast.success(data.favorited ? 'Saved to Favorites' : 'Removed from Favorites');
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not update Favorites');
    },
  });

  const runToggle = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!loggedIn) return;
    execute({
      kind,
      supplierId,
      productId: kind === 'product' ? productId : undefined,
    });
  };

  if (variant === 'overlay') {
    const overlayClass = cn(
      'absolute right-2 top-2 z-20 flex size-9 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105',
      className,
    );

    if (authReady && !loggedIn) {
      return (
        <Link
          href="/login?next=/account/favorites"
          className={overlayClass}
          aria-label="Add to Favorites"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="size-4 text-[#ff6600]" strokeWidth={2} />
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={overlayClass}
        disabled={!authReady || status === 'executing'}
        aria-label={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
        aria-pressed={favorited}
        onClick={(e) => {
          if (!loggedIn) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/login?next=/account/favorites';
            return;
          }
          runToggle(e);
        }}
      >
        <Heart
          className={cn(
            'size-4 text-[#ff6600]',
            favorited && 'fill-[#ff6600]',
          )}
          strokeWidth={2}
        />
      </button>
    );
  }

  if (!loggedIn) {
    return (
      <Button asChild variant="outline" size="sm" className={className}>
        <Link href="/login?next=/account/favorites">
          <Heart className="mr-1.5 size-4" />
          Favorite
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={status === 'executing'}
      onClick={() => runToggle()}
      aria-pressed={favorited}
    >
      <Heart
        className={`mr-1.5 size-4 ${favorited ? 'fill-[#ff6600] text-[#ff6600]' : ''}`}
      />
      {favorited ? 'Saved' : 'Favorite'}
    </Button>
  );
}
