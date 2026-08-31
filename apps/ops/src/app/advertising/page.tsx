import Link from 'next/link';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function OpsAdvertisingOverviewPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const [{ count: campaignCount }, { count: activeCount }, { data: wallets }] = await Promise.all([
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ad_wallets').select('balance_inr_cents').limit(200),
  ]);

  const totalWallet = (wallets ?? []).reduce((sum, w) => sum + Number(w.balance_inr_cents), 0);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Advertising"
      subtitle="Ops oversight — Alibaba / Amazon Ads / TikTok Ads manager (TEST MODE)."
    >
      <div className="kpi-grid" style={{ marginTop: '0.5rem' }}>
        <div className="card kpi-card">
          <p className="muted">Total campaigns</p>
          <p className="kpi">{campaignCount ?? 0}</p>
          <Link href="/advertising/campaigns">View all →</Link>
        </div>
        <div className="card kpi-card">
          <p className="muted">Active</p>
          <p className="kpi">{activeCount ?? 0}</p>
        </div>
        <div className="card kpi-card">
          <p className="muted">Wallet float (all sellers)</p>
          <p className="kpi">{formatInr(totalWallet)}</p>
          <Link href="/advertising/wallets">Wallets →</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Demo accounts (local seed)</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>
            Seller: <code>ads-demo-seller@sourcebyjay.test</code> / <code>Password123!</code> → :3001/advertising
          </li>
          <li>
            Buyer: <code>ads-demo-buyer@sourcebyjay.test</code> / <code>Password123!</code> → search{' '}
            <code>earbuds</code> on :3000
          </li>
        </ul>
        {!hasStaffRole(staff?.role ?? null, 'manager') ? (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Viewer role — read-only. Manager+ can grant credit and pause campaigns.
          </p>
        ) : null}
      </div>
    </OpsShell>
  );
}
