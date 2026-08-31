import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { AdWalletTopUpButton } from '@/components/AdWalletTopUpButton';
import { AdCampaignStatusButton } from '@/components/AdCampaignStatusButton';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function VendorAdvertisingPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Advertising" subtitle="Promote listings with CPC, CPM, or sponsorship.">
        <div className="card denied">Complete seller signup to run ads.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  await supabase.rpc('ensure_ad_wallet', { p_supplier_id: supplier.id });

  const [{ data: wallet }, { data: campaigns }, { count: invoiceCount }] = await Promise.all([
    supabase.from('ad_wallets').select('balance_inr_cents').eq('supplier_id', supplier.id).maybeSingle(),
    supabase
      .from('ad_campaigns')
      .select(
        'id, name, status, billing_model, placement_types, spent_inr_cents, impressions_count, clicks_count, created_at',
      )
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('ad_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id),
  ]);

  const balance = Number(wallet?.balance_inr_cents ?? 0);

  return (
    <VendorAuthenticated
      title="Advertising"
      subtitle="Hybrid ad engine — CPC search, CPM display, sponsorship. TEST MODE wallet (no Stripe)."
    >
      <div className="kpi-grid" style={{ marginTop: '1.25rem' }}>
        <div className="card kpi-card">
          <p className="muted">Wallet balance</p>
          <p className="kpi">{formatInr(balance)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            <AdWalletTopUpButton />
            <Link href="/advertising/wallet" className="btn secondary">
              Wallet & transactions
            </Link>
          </div>
        </div>
        <div className="card kpi-card">
          <p className="muted">Campaigns</p>
          <p className="kpi">{(campaigns ?? []).length}</p>
          <Link href="/advertising/new" className="btn" style={{ marginTop: '0.75rem' }}>
            Open Ad Studio
          </Link>
        </div>
        <div className="card kpi-card">
          <p className="muted">Invoices</p>
          <p className="kpi">{invoiceCount ?? 0}</p>
          <Link href="/advertising/invoices" className="btn secondary" style={{ marginTop: '0.75rem' }}>
            View invoices
          </Link>
        </div>
      </div>

      {(campaigns ?? []).length === 0 ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          No campaigns yet.{' '}
          <Link href="/advertising/wallet">Top up wallet</Link> then{' '}
          <Link href="/advertising/new">open Ad Studio</Link> or view{' '}
          <Link href="/advertising/campaigns">all campaigns</Link>.
        </p>
      ) : (
        <>
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/advertising/campaigns">View all campaigns →</Link>
          </p>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '0.75rem' }}>
            {(campaigns ?? []).slice(0, 3).map((c) => (
            <div key={c.id as string} className="card">
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {String(c.created_at).slice(0, 10)} · {(c.id as string).slice(0, 8)}…
              </div>
              <div className="kpi" style={{ fontSize: '1.15rem' }}>
                <Link href={`/advertising/${c.id}`}>{c.name as string}</Link> · {c.status as string}
              </div>
              <p className="muted" style={{ margin: '0.35rem 0' }}>
                {String(c.billing_model).toUpperCase()} · spent {formatInr(Number(c.spent_inr_cents))} ·{' '}
                {Number(c.impressions_count)} impressions · {Number(c.clicks_count)} clicks ·{' '}
                {(c.placement_types as string[]).join(', ')}
              </p>
              <AdCampaignStatusButton campaignId={c.id as string} status={c.status as string} />
            </div>
            ))}
          </div>
        </>
      )}
    </VendorAuthenticated>
  );
}
