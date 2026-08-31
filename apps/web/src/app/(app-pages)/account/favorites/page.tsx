import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { FavoritesList } from '@/components/marketplace/favorites/FavoritesList';

function AccountNav() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
        Profile
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/inquiries" className="text-muted-foreground hover:text-foreground">
        Inquiries
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/quotes" className="text-muted-foreground hover:text-foreground">
        Quotes
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/orders" className="text-muted-foreground hover:text-foreground">
        Orders
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/messages" className="text-muted-foreground hover:text-foreground">
        Messages
      </Link>
      <span className="text-muted-foreground">·</span>
        <span className="font-medium text-foreground">Saved list</span>
    </div>
  );
}

async function FavoritesContent() {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const supabase = await createSupabaseClient();

  const { data } = await supabase
    .from('buyer_favorites')
    .select(
      'id, kind, product_id, supplier_id, created_at, products(id, title, slug, image_url), suppliers(id, name, slug, city, country)',
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <AccountNav />
      <div>
        <h1 className="text-2xl font-bold">Saved list</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved products and suppliers (Alibaba Favorites). Select 2+ suppliers to batch RFQ.
        </p>
      </div>
      <FavoritesList rows={(data ?? []) as never} />
    </div>
  );
}

export default function AccountFavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
