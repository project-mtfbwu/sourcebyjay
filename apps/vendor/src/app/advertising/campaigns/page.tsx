import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { AdWalletTopUpButton } from '@/components/AdWalletTopUpButton';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function VendorAdvertisingCampaignsPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Campaigns" subtitle="Manage sponsored listings.">
        <div className="card denied">Complete seller signup to run ads.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(
      'id, name, status, billing_model, placement_types, spent_inr_cents, impressions_count, clicks_count, max_cpc_bid_inr_cents, cpm_rate_inr_cents, created_at',
    )
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  return (
    <VendorAuthenticated title="Campaigns" subtitle="Amazon / Google Ads style — pause, edit status, track spend.">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Link href="/advertising/new" className="btn">
          + Create campaign
        </Link>
      </div>

      {(campaigns ?? []).length === 0 ? (
        <p className="muted card" style={{ marginTop: '1rem' }}>
          No campaigns yet.{' '}
          <Link href="/advertising/wallet">Top up wallet</Link> then{' '}
          <Link href="/advertising/new">create your first ad</Link>.
        </p>
      ) : (
        <div className="card" style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr className="muted" style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.5rem' }}>Campaign</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Model</th>
                <th style={{ padding: '0.5rem' }}>Placements</th>
                <th style={{ padding: '0.5rem' }}>Spent</th>
                <th style={{ padding: '0.5rem' }}>Imp / clicks</th>
                <th style={{ padding: '0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {(campaigns ?? []).map((c) => (
                <tr key={c.id as string} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <Link href={`/advertising/${c.id}`}>{c.name as string}</Link>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{c.status as string}</td>
                  <td style={{ padding: '0.5rem' }}>{String(c.billing_model).toUpperCase()}</td>
                  <td style={{ padding: '0.5rem', maxWidth: 180 }}>
                    {(c.placement_types as string[]).join(', ')}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{formatInr(Number(c.spent_inr_cents))}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {Number(c.impressions_count)} / {Number(c.clicks_count)}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Link href={`/advertising/${c.id}`}>Manage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorAuthenticated>
  );
}
