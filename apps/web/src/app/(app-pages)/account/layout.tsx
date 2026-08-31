import { isBuyerAccountRole } from '@sourcebyjay/auth';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyProfile } from '@/data/user/profile';
import { signOutAction } from '@/data/auth/sign-out';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { connection } from 'next/server';
import { type ReactNode, Suspense } from 'react';

const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3001';

/**
 * Seller-on-buyer overlay. Lives in its own Suspense so `{children}` always
 * stays in the layout tree (required for Next.js Instant Navigation).
 */
async function SellerOnBuyerOverlay() {
  await connection();
  const { user } = await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const profile = await getMyProfile(userId);

  if (!profile || isBuyerAccountRole(profile.role)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <h1 className="text-2xl font-bold">Seller login on buyer site</h1>
        <p className="text-sm text-muted-foreground">
          You signed in with a <strong>seller</strong> account ({user.email}). Buyer Quotes / Orders
          need a <strong>separate buyer email</strong> — same idea as Amazon.com vs Seller Central.
        </p>
        <p className="text-sm text-muted-foreground">
          Your seller emails (<code>anjay@aol.in</code>, etc.) will never open buyer account pages.
          Sign out here, then create or use a buyer account.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Sign out buyer session
            </button>
          </form>
          <a
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
          >
            Create buyer account
          </a>
          <a
            href={vendorUrl}
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
          >
            Go to Seller portal
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SellerOnBuyerOverlay />
      </Suspense>
      {children}
    </>
  );
}
