import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { VENDOR_ICONS } from '@/components/vendor-icons';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

export default async function VendorHomePage() {
  const { user, profile, supplier } = await getSessionProfile();

  if (!user) {
    return (
      <main className="shell">
        <h1>SourceByJay Seller</h1>
        <p className="muted">
          Separate seller accounts (not the same as a buyer profile). Like Amazon Seller Central vs
          amazon.in.
        </p>
        <div className="card" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn" href="/login">
            Seller login
          </Link>
          <Link className="btn btn-secondary" href="/signup">
            Create seller account
          </Link>
        </div>
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          <a href={buyerUrl}>← Buyer storefront</a>
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const supplierId = supplier?.id as string | undefined;

  let planName = 'Free';
  let listingsTotal = 0;
  let listingsPublished = 0;
  let listingsDraft = 0;
  let openQuotes = 0;
  let ordersTotal = 0;
  let openDisputes = 0;
  let pendingGallery = 0;
  let listingRequests = 0;

  if (supplierId) {
    const [
      { data: plan },
      { count: total },
      { count: published },
      { count: draft },
      { count: quotes },
      { count: orders },
      { count: disputes },
      { count: gallery },
      { count: requests },
    ] = await Promise.all([
      supabase.rpc('supplier_active_plan', { p_supplier_id: supplierId }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierId),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'published'),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'draft'),
      supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .in('status', ['draft', 'sent']),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierId),
      supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .in('status', ['open', 'under_review']),
      supabase
        .from('supplier_gallery')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'pending'),
      supabase
        .from('listing_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
    ]);

    if (plan && typeof plan === 'object' && !Array.isArray(plan)) {
      planName = (plan as { name?: string }).name ?? planName;
    } else if (Array.isArray(plan) && plan[0]) {
      planName = (plan[0] as { name?: string }).name ?? planName;
    }
    listingsTotal = total ?? 0;
    listingsPublished = published ?? 0;
    listingsDraft = draft ?? 0;
    openQuotes = quotes ?? 0;
    ordersTotal = orders ?? 0;
    openDisputes = disputes ?? 0;
    pendingGallery = gallery ?? 0;
    listingRequests = requests ?? 0;
  }

  const displayName =
    profile?.companyName?.trim() ||
    (supplier?.name as string | undefined)?.trim() ||
    profile?.fullName?.trim() ||
    'Seller';
  const tier = (supplier?.verification_tier as string) ?? 'none';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <VendorAuthenticated hideHeader>
      <section className="dash-banner">
        <h1>Welcome, {displayName}</h1>
        <p>
          Manage listings, respond to RFQs, fulfill orders, and grow your B2B storefront — Seller
          Central on port 3001.
        </p>
        <div className="dash-banner-meta">
          <span className="dash-banner-pill">{planName} plan</span>
          <span className="dash-banner-pill">{tier} verification</span>
          <span className="dash-banner-date">{today}</span>
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Listings</div>
          <div className="kpi-value">{listingsTotal}</div>
          <div className="kpi-sub">
            {listingsPublished} live · {listingsDraft} draft
          </div>
          <div className="kpi-icon green">{VENDOR_ICONS.listings}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open quotes</div>
          <div className="kpi-value">{openQuotes}</div>
          <div className="kpi-sub">RFQs awaiting your price</div>
          <div className="kpi-icon orange">{VENDOR_ICONS.quotes}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Orders</div>
          <div className="kpi-value">{ordersTotal}</div>
          <div className="kpi-sub">All-time on SourceByJay</div>
          <div className="kpi-icon blue">{VENDOR_ICONS.orders}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Plan</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
            {planName}
          </div>
          <div className="kpi-sub">
            <Link href="/plans">Upgrade or manage</Link>
          </div>
          <div className="kpi-icon purple">{VENDOR_ICONS.plans}</div>
        </div>
      </div>

      <div className="dash-split">
        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Needs attention</h2>
              <p className="muted">Items that move revenue or trust</p>
            </div>
          </div>
          <div className="attn-row">
            <div>
              <strong>Open quotes</strong>
              <div className="muted">Buyers waiting for pricing</div>
            </div>
            <span className={`attn-count${openQuotes > 0 ? ' hot' : ''}`}>{openQuotes}</span>
          </div>
          <div className="attn-row">
            <div>
              <strong>Listing requests</strong>
              <div className="muted">Buyer-requested products</div>
            </div>
            <span className={`attn-count${listingRequests > 0 ? ' hot' : ''}`}>{listingRequests}</span>
          </div>
          <div className="attn-row">
            <div>
              <strong>Gallery pending</strong>
              <div className="muted">Factory photos in review</div>
            </div>
            <span className={`attn-count${pendingGallery > 0 ? ' hot' : ''}`}>{pendingGallery}</span>
          </div>
          <div className="attn-row">
            <div>
              <strong>Open disputes</strong>
              <div className="muted">Guarantee / order issues</div>
            </div>
            <span className={`attn-count${openDisputes > 0 ? ' hot' : ''}`}>{openDisputes}</span>
          </div>
        </div>

        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Storefront health</h2>
              <p className="muted">Published vs draft listings</p>
            </div>
          </div>
          <div className="health-row">
            <div className="health-meta">
              <span>Published</span>
              <strong>
                {listingsTotal > 0 ? Math.round((listingsPublished / listingsTotal) * 100) : 0}%
              </strong>
            </div>
            <div className="health-track">
              <div
                className="health-fill green"
                style={{
                  width: `${listingsTotal > 0 ? (listingsPublished / listingsTotal) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="health-row">
            <div className="health-meta">
              <span>Profile completeness</span>
              <strong>{supplierId ? (tier !== 'none' ? 'Good' : 'Add certs') : 'Signup'}</strong>
            </div>
            <div className="health-track">
              <div
                className="health-fill purple"
                style={{ width: supplierId ? (tier !== 'none' ? '75%' : '45%') : '20%' }}
              />
            </div>
          </div>
          <p className="muted" style={{ fontSize: '0.82rem', margin: '0.75rem 0 0' }}>
            Complete <Link href="/settings">company settings</Link>, upload{' '}
            <Link href="/certificates">certificates</Link>, and publish listings to rank higher with
            buyers.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="dash-card-head">
          <div>
            <h2>Quick actions</h2>
            <p className="muted">Common seller workflows</p>
          </div>
        </div>
        <div className="quick-grid">
          <Link href="/listings/new" className="quick-tile">
            {VENDOR_ICONS.listings}
            New listing
          </Link>
          <Link href="/quotes" className="quick-tile">
            {VENDOR_ICONS.quotes}
            View quotes
          </Link>
          <Link href="/messages" className="quick-tile">
            {VENDOR_ICONS.messages}
            Messages
          </Link>
          <Link href="/storefront" className="quick-tile">
            {VENDOR_ICONS.settings}
            Storefront editor
          </Link>
          <Link href="/gallery" className="quick-tile">
            {VENDOR_ICONS.gallery}
            Factory gallery
          </Link>
          <Link href="/certificates" className="quick-tile">
            {VENDOR_ICONS.certificates}
            Certificates
          </Link>
          <Link href="/plans" className="quick-tile">
            {VENDOR_ICONS.plans}
            Listing plans
          </Link>
          <Link href="/advertising" className="quick-tile">
            {VENDOR_ICONS.advertising}
            Advertising
          </Link>
          <Link href="/storefront" className="quick-tile">
            {VENDOR_ICONS.storefront}
            Preview storefront
          </Link>
        </div>
      </div>
    </VendorAuthenticated>
  );
}
