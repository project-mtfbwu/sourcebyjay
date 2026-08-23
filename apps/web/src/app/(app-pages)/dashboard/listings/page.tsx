import Link from 'next/link';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyListings } from '@/data/user/listings';
import { getMySupplier } from '@/data/user/profile';
import { ListingsTable } from '@/components/marketplace/dashboard/ListingsTable';
import { Button } from '@/components/ui/button';

export default async function ListingsPage() {
  const userId = await getLoggedInUserId();
  const supplier = await getMySupplier(userId);
  const listings = await getMyListings(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My listings</h1>
          <p className="text-sm text-muted-foreground">Manage product listings, pricing tiers, and publish status.</p>
        </div>
        {supplier && (
          <Button asChild>
            <Link href="/dashboard/listings/new">New listing</Link>
          </Button>
        )}
      </div>

      {!supplier ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">Seller account required</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Register as a seller on your profile page before creating listings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/profile">Go to profile</Link>
          </Button>
        </div>
      ) : (
        <ListingsTable listings={listings} />
      )}
    </div>
  );
}
