import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { BusinessProfilesClient } from '@/components/marketplace/account/BusinessProfilesClient';
import { listBuyerBusinessProfiles } from '@/data/user/business-profiles';
import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';

function AccountNav() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
        Profile
      </Link>
      <span className="text-muted-foreground">·</span>
      <span className="font-medium text-foreground">Business details</span>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/favorites" className="text-muted-foreground hover:text-foreground">
        Saved list
      </Link>
      <span className="text-muted-foreground">·</span>
      <Link href="/account/orders" className="text-muted-foreground hover:text-foreground">
        Orders
      </Link>
    </div>
  );
}

async function BusinessContent() {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const profiles = await listBuyerBusinessProfiles(userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <AccountNav />
      <div>
        <h1 className="text-2xl font-bold">Business details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          India B2B: save GSTIN + billing address for repeat orders (separate from your login
          profile).
        </p>
      </div>
      <BusinessProfilesClient profiles={profiles} />
    </div>
  );
}

export default function AccountBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <BusinessContent />
    </Suspense>
  );
}
