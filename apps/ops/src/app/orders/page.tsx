import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { OpsOrderActions } from './OpsOrderActions';

export default async function OpsOrdersPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, currency, quantity, created_at, buyer_id, guarantee_protected, escrow_status, incoterm, freight_amount, product_subtotal, shipping_zone, destination_pincode, payments(status, provider), suppliers(name)',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Orders"
      subtitle="All marketplace orders. Fake pay is TEST MODE until Stripe."
    >
      {(orders ?? []).length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {(orders ?? []).map((o) => {
            const pay = Array.isArray(o.payments) ? o.payments[0] : o.payments;
            const supplier = Array.isArray(o.suppliers) ? o.suppliers[0] : o.suppliers;
            return (
              <div key={o.id as string} className="card">
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {(o.id as string).slice(0, 8)}… · {String(o.created_at).slice(0, 10)}
                  {' · '}
                  <Link href={`/buyers/${o.buyer_id}`}>Buyer</Link>
                </div>
                <div>
                  <strong>{o.status as string}</strong> · ₹
                  {Number(o.total_amount).toLocaleString('en-IN')} · qty {o.quantity as number}
                  {o.guarantee_protected ? ' · Guarantee' : ''}
                </div>
                <p className="muted" style={{ margin: '0.35rem 0' }}>
                  {(supplier as { name?: string } | null)?.name ?? 'Supplier'} · payment{' '}
                  {(pay as { status?: string; provider?: string } | null)?.status ?? '—'} (
                  {(pay as { provider?: string } | null)?.provider ?? 'fake'})
                  {o.escrow_status ? ` · escrow ${o.escrow_status}` : ''}
                  {o.incoterm ? ` · ${o.incoterm as string}` : ''}
                  {Number(o.freight_amount) > 0
                    ? ` · freight ₹${Number(o.freight_amount).toLocaleString('en-IN')}`
                    : ''}
                  {o.shipping_zone ? ` · ${o.shipping_zone as string} zone` : ''}
                </p>
                <OpsOrderActions
                  orderId={o.id as string}
                  status={o.status as string}
                  paymentStatus={(pay as { status?: string } | null)?.status ?? null}
                  escrowStatus={(o.escrow_status as string | null) ?? null}
                />
              </div>
            );
          })}
        </div>
      )}
    </OpsShell>
  );
}
