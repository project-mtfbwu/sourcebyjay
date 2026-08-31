import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { OpsGrantAdCreditForm } from '../OpsAdActions';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function OpsAdvertisingWalletsPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const isManager = hasStaffRole(staff?.role ?? null, 'manager');
  const supabase = await createClient();

  const [{ data: wallets }, { data: suppliers }] = await Promise.all([
    supabase
      .from('ad_wallets')
      .select('supplier_id, balance_inr_cents, updated_at, suppliers(name)')
      .order('balance_inr_cents', { ascending: false })
      .limit(100),
    supabase.from('suppliers').select('id, name').order('name').limit(200),
  ]);

  const supplierOptions = (suppliers ?? []).map((s) => ({ id: s.id as string, name: s.name as string }));

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Ad wallets"
      subtitle="Grant TEST promotional credit (manager+) — TikTok/Amazon ads manager parallel."
    >
      {isManager ? <OpsGrantAdCreditForm suppliers={supplierOptions} /> : (
        <p className="muted card">Manager+ required to grant ad credit.</p>
      )}

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
        {(wallets ?? []).map((w) => {
          const supplier = Array.isArray(w.suppliers) ? w.suppliers[0] : w.suppliers;
          return (
            <div key={w.supplier_id as string} className="card">
              <strong>{(supplier as { name?: string } | null)?.name ?? w.supplier_id}</strong>
              <p className="kpi" style={{ margin: '0.35rem 0' }}>
                {formatInr(Number(w.balance_inr_cents))}
              </p>
              <p className="muted">Updated {String(w.updated_at).slice(0, 19)}</p>
            </div>
          );
        })}
      </div>
    </OpsShell>
  );
}
