import Link from 'next/link';
import { getSessionProfile } from '@/lib/session';
import { createClient } from '@/lib/supabase';
import { submitListingOfferAction } from '@/lib/listing-request-actions';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

export default async function ListingRequestsPage() {
  const { user } = await getSessionProfile();

  if (!user) {
    return (
      <VendorAuthenticated title="Listing requests" subtitle="Public buyer RFQ board — submit offers.">
        <div className="card denied">
          <Link href="/login">Seller login</Link> required.
        </div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from('listing_requests')
    .select(
      'id, title, description, quantity, category_hint, contact_email, created_at, listing_request_offers(id, message, unit_price, status, supplier_id)',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(40);

  return (
    <VendorAuthenticated
      title="Listing requests"
      subtitle="Public buyer posts (Alibaba RFQ board). Submit an offer — buyer sees it on their side."
    >
      {(requests ?? []).length === 0 ? (
        <div className="card">
          <p className="muted">No open requests. Buyers post at {buyerUrl}/request-listing</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(requests ?? []).map((r) => {
            const offers = Array.isArray(r.listing_request_offers)
              ? r.listing_request_offers
              : r.listing_request_offers
                ? [r.listing_request_offers]
                : [];
            return (
              <li key={r.id} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <p className="muted" style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                  {r.description}
                </p>
                <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {r.quantity ? `Qty ${r.quantity} · ` : ''}
                  {r.category_hint ? `${r.category_hint} · ` : ''}
                  {new Date(r.created_at).toLocaleString()}
                </p>
                {offers.length > 0 ? (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Your offers: {offers.length}
                  </p>
                ) : null}
                <form action={submitListingOfferAction} style={{ marginTop: '0.75rem' }}>
                  <input type="hidden" name="listingRequestId" value={r.id} />
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    rows={3}
                    placeholder="Your offer / capability message (min 10 chars)"
                    style={{ width: '100%', padding: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit price (optional)"
                      style={{ padding: '0.4rem' }}
                    />
                    <input
                      name="leadTimeDays"
                      type="number"
                      min="0"
                      placeholder="Lead days"
                      style={{ padding: '0.4rem', width: '7rem' }}
                    />
                    <button className="btn" type="submit">
                      Submit offer
                    </button>
                  </div>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </VendorAuthenticated>
  );
}
