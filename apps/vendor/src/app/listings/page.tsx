import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { ListingStatusButtons } from '@/components/ListingStatusButtons';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorListingsPage() {
  const { supplier } = await getSessionProfile();
  const supabase = await createClient();

  let planName = 'Free';
  let maxListings: number | null = 5;
  let used = 0;
  let canPublish = true;
  let products: Array<{
    id: string;
    title: string;
    status: string;
    price: number;
    currency: string;
    moq: number;
    updated_at: string;
  }> = [];

  if (supplier?.id) {
    const [{ data: plan }, { count }, { data: can }, { data: rows }] = await Promise.all([
      supabase.rpc('supplier_active_plan', { p_supplier_id: supplier.id }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplier.id)
        .neq('status', 'draft'),
      supabase.rpc('supplier_can_publish_listing', { p_supplier_id: supplier.id }),
      supabase
        .from('products')
        .select('id, title, status, price, currency, moq, updated_at')
        .eq('supplier_id', supplier.id)
        .order('updated_at', { ascending: false }),
    ]);

    if (plan && typeof plan === 'object' && !Array.isArray(plan)) {
      planName = (plan as { name?: string }).name ?? planName;
      maxListings = ((plan as { max_listings?: number | null }).max_listings ?? maxListings) as
        | number
        | null;
    } else if (Array.isArray(plan) && plan[0]) {
      planName = (plan[0] as { name?: string }).name ?? planName;
      maxListings = ((plan[0] as { max_listings?: number | null }).max_listings ?? maxListings) as
        | number
        | null;
    }
    used = count ?? 0;
    canPublish = Boolean(can);
    products = (rows ?? []) as typeof products;
  }

  return (
    <VendorAuthenticated
      title="Listings"
      subtitle="Products on your storefront — publish, draft, and manage caps by plan."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
        <Link className="btn" href="/listings/new">
          + New listing
        </Link>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <p>
          Plan <strong>{planName}</strong>: {used}
          {maxListings == null ? ' / unlimited' : ` / ${maxListings}`} active (non-draft) listings.
        </p>
        {!canPublish ? (
          <p className="denied" style={{ marginTop: '0.75rem' }}>
            Listing cap reached. <Link href="/plans">Upgrade plan</Link> or unpublish some products.
          </p>
        ) : null}
      </div>

      {!supplier?.id ? (
        <div className="card denied" style={{ marginTop: '1rem' }}>
          Finish company signup before creating listings.
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p className="muted">No listings yet. Create your first product.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {products.map((p) => (
            <li key={p.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <strong>{p.title}</strong>
                  <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                    {p.status} · {p.currency} {Number(p.price).toFixed(2)} · MOQ {p.moq}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <Link href={`/listings/${p.id}/edit`}>Edit</Link>
                  <ListingStatusButtons listingId={p.id} status={p.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </VendorAuthenticated>
  );
}
