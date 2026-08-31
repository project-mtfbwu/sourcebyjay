import Link from 'next/link';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { OpsGrantAdCreditForm, OpsPauseCampaignButton } from '../OpsAdActions';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function OpsAdvertisingCampaignsPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const isManager = hasStaffRole(staff?.role ?? null, 'manager');
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(
      'id, name, status, billing_model, spent_inr_cents, impressions_count, clicks_count, created_at, suppliers(name, id)',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="All ad campaigns"
      subtitle="Alibaba / Amazon Ads oversight — pause fraudulent campaigns (manager+)."
    >
      {(campaigns ?? []).length === 0 ? (
        <p className="muted">No campaigns yet. Seed demo data or wait for sellers to launch ads.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {(campaigns ?? []).map((c) => {
            const supplier = Array.isArray(c.suppliers) ? c.suppliers[0] : c.suppliers;
            return (
              <div key={c.id as string} className="card">
                <strong>{c.name as string}</strong> · {c.status as string} ·{' '}
                {(supplier as { name?: string } | null)?.name ?? 'Supplier'}
                <p className="muted" style={{ margin: '0.35rem 0' }}>
                  {String(c.billing_model).toUpperCase()} · spent {formatInr(Number(c.spent_inr_cents))} ·{' '}
                  {Number(c.impressions_count)} imp · {Number(c.clicks_count)} clicks
                </p>
                {isManager && c.status === 'active' ? (
                  <OpsPauseCampaignButton campaignId={c.id as string} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </OpsShell>
  );
}
