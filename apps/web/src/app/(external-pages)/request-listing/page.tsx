import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { RequestListingForm } from '@/components/marketplace/listing-requests/RequestListingForm';

type SearchParams = Promise<{ posted?: string }>;

async function RequestListingContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;

  let email = '';
  try {
    const { user } = await getCachedLoggedInVerifiedSupabaseUser();
    email = user.email ?? '';
  } catch {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Post a purchase request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in as a buyer to post a public request (Alibaba RFQ board).
        </p>
        <Link
          href="/login?next=/request-listing"
          className="mt-6 inline-block rounded-full bg-[#ff6600] px-5 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const supabase = await createSupabaseClient();
  const { data: openRequests } = await supabase
    .from('listing_requests')
    .select('id, title, quantity, category_hint, created_at, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <div className="bg-[#fafafa] min-h-[60vh] py-8">
      <div className="mx-auto max-w-3xl px-4">
        {params.posted ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Request posted. Sellers see it on their Listing requests board. Watch{' '}
            <Link href="/account/listing-offers" className="font-medium underline">
              your offers inbox
            </Link>{' '}
            for replies.
          </div>
        ) : null}
        <RequestListingForm defaultEmail={email} />

        {(openRequests ?? []).length > 0 ? (
          <div className="mx-auto mt-10 max-w-xl">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Recent open requests
            </h2>
            <ul className="space-y-2">
              {(openRequests ?? []).map((r) => (
                <li key={r.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
                  <span className="font-medium">{r.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {r.quantity ? `Qty ${r.quantity} · ` : ''}
                    {r.category_hint ? `${r.category_hint} · ` : ''}
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RequestListingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <RequestListingContent searchParams={searchParams} />
    </Suspense>
  );
}
