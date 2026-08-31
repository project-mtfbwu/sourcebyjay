import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';

async function OffersContent() {
  await connection();
  const { user } = await getCachedLoggedInVerifiedSupabaseUser();
  const supabase = await createSupabaseClient();

  const { data: myRequests } = await supabase
    .from('listing_requests')
    .select('id, title, status, created_at')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const requestIds = (myRequests ?? []).map((r) => r.id);
  const requestMap = new Map((myRequests ?? []).map((r) => [r.id, r]));

  const { data: offers } =
    requestIds.length > 0
      ? await supabase
          .from('listing_request_offers')
          .select(
            'id, listing_request_id, message, unit_price, currency, lead_time_days, status, created_at, supplier_id, suppliers(name, slug)',
          )
          .in('listing_request_id', requestIds)
          .order('created_at', { ascending: false })
      : { data: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/account/inquiries" className="text-muted-foreground hover:text-foreground">
          Inquiries
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium text-foreground">Listing offers</span>
        <span className="text-muted-foreground">·</span>
        <Link href="/request-listing" className="text-muted-foreground hover:text-foreground">
          Post request
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Offers on your listing requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          When sellers respond to your purchase requests, their offers show up here (Alibaba RFQ
          board parallel).
        </p>
      </div>

      {(offers ?? []).length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No seller offers yet.{' '}
          <Link href="/request-listing" className="text-[#ff6600] hover:underline">
            Post a listing request
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {(offers ?? []).map((offer) => {
            const req = requestMap.get(offer.listing_request_id);
            const supplier = offer.suppliers as
              | { name: string; slug: string }
              | { name: string; slug: string }[]
              | null;
            const supplierRow = Array.isArray(supplier) ? supplier[0] : supplier;
            return (
              <li key={offer.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{req?.title ?? 'Your request'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      From{' '}
                      {supplierRow ? (
                        <Link
                          href={`/suppliers/${supplierRow.slug}`}
                          className="text-[#ff6600] hover:underline"
                        >
                          {supplierRow.name}
                        </Link>
                      ) : (
                        'supplier'
                      )}
                      {offer.unit_price != null
                        ? ` · ${offer.currency} ${Number(offer.unit_price).toFixed(2)}`
                        : ''}
                      {offer.lead_time_days != null ? ` · ${offer.lead_time_days} days` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{offer.status}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{offer.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ListingOffersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading offers…</div>}>
      <OffersContent />
    </Suspense>
  );
}
