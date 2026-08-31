import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { OrderStatusButton } from '@/components/OrderStatusButton';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorOrdersPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Orders" subtitle="Fulfillment after a buyer accepts your quote.">
        <div className="card denied">Complete seller signup to view orders.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, currency, quantity, is_sample, commission_rate_bps, created_at, incoterm, freight_amount, product_subtotal, shipping_zone, destination_pincode, ship_by_date, payments(status, provider)',
    )
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <VendorAuthenticated
      title="Orders"
      subtitle="Timeline after a buyer accepts your quote. Payment is TEST MODE (fake slab) until Stripe."
    >
      {(orders ?? []).length === 0 ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          No orders yet. Send a quote from an inquiry first.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
          {(orders ?? []).map((o) => {
            const pay = Array.isArray(o.payments) ? o.payments[0] : o.payments;
            return (
              <div key={o.id as string} className="card">
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {String(o.created_at).slice(0, 10)} · {(o.id as string).slice(0, 8)}…
                </div>
                <div className="kpi" style={{ fontSize: '1.2rem' }}>
                  ₹{Number(o.total_amount).toLocaleString('en-IN')} · {o.status as string}
                </div>
                <p className="muted" style={{ margin: '0.35rem 0' }}>
                  Qty {o.quantity as number}
                  {o.is_sample ? ' · sample' : ''} · commission{' '}
                  {((o.commission_rate_bps as number) / 100).toFixed(1)}%
                  {o.incoterm ? ` · ${o.incoterm as string}` : ''}
                  {Number(o.freight_amount) > 0
                    ? ` · freight ₹${Number(o.freight_amount).toLocaleString('en-IN')}`
                    : ''}
                  {o.shipping_zone ? ` · ${o.shipping_zone as string} zone` : ''}
                  {o.ship_by_date ? ` · ship by ${o.ship_by_date as string}` : ''}
                  {pay
                    ? ` · payment ${pay.status as string} (${pay.provider as string})`
                    : ''}
                </p>
                <OrderStatusButton orderId={o.id as string} status={o.status as string} />
              </div>
            );
          })}
        </div>
      )}
    </VendorAuthenticated>
  );
}
