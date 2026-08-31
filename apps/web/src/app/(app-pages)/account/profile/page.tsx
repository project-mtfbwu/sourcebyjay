import { getLoggedInUserId } from '@/data/user/user';
import { ensureProfile, getMyProfile, getMySupplier } from '@/data/user/profile';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { ProfilePageClient } from '@/components/marketplace/dashboard/ProfilePageClient';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

function ProfileFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

async function ProfileContent() {
  await connection();
  const { user } = await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const profile = (await getMyProfile(userId)) ?? (await ensureProfile(userId, user.email!));
  const supplier = await getMySupplier(userId);
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3001';

  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-6 pt-6 text-sm">
        <Link href="/account/profile" className="font-medium text-foreground">
          Profile
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/account/inquiries" className="text-muted-foreground hover:text-foreground">
          My inquiries
        </Link>
        {(profile.role === 'seller' || profile.role === 'admin' || Boolean(supplier)) && (
          <>
            <span className="text-muted-foreground">·</span>
            <a href={vendorUrl} className="text-brand-primary hover:underline">
              Open seller portal →
            </a>
          </>
        )}
      </div>
      <ProfilePageClient profile={profile} />
    </div>
  );
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileContent />
    </Suspense>
  );
}
