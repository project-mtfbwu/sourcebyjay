import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { addVendorDisputeMessageAction } from '@/lib/dispute-actions';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorDisputesPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Guarantee disputes" subtitle="SourceByJay Guarantee claims on your orders.">
        <div className="card denied">Complete seller signup to view disputes.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: orderRows } = await supabase
    .from('orders')
    .select('id')
    .eq('supplier_id', supplier.id)
    .limit(200);
  const orderIds = (orderRows ?? []).map((o) => o.id as string);

  const { data: disputes } =
    orderIds.length === 0
      ? { data: [] as never[] }
      : await supabase
          .from('disputes')
          .select(
            'id, reason, status, resolution, created_at, order_id, orders(total_amount, currency, escrow_status), dispute_messages(id, sender_type, body, created_at)',
          )
          .in('order_id', orderIds)
          .order('created_at', { ascending: false })
          .limit(50);

  return (
    <VendorAuthenticated
      title="Guarantee disputes"
      subtitle="Respond when a buyer opens a SourceByJay Guarantee claim. Ops mediates."
    >
      {(disputes ?? []).length === 0 ? (
        <p className="muted">No disputes on your orders.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {(disputes ?? []).map((d) => {
            const order = Array.isArray(d.orders) ? d.orders[0] : d.orders;
            const messages = Array.isArray(d.dispute_messages)
              ? [...d.dispute_messages].sort((a, b) =>
                  String(a.created_at).localeCompare(String(b.created_at)),
                )
              : [];
            const open = ['open', 'under_review'].includes(d.status as string);

            return (
              <div key={d.id as string} className="card">
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {String(d.created_at).slice(0, 10)} · {(d.order_id as string).slice(0, 8)}…
                </div>
                <div>
                  <strong>{d.status as string}</strong> · {d.reason as string}
                  {d.resolution ? ` · ${d.resolution}` : ''}
                </div>
                <p className="muted">
                  ₹{Number((order as { total_amount?: number } | null)?.total_amount ?? 0).toLocaleString('en-IN')}{' '}
                  · escrow {(order as { escrow_status?: string } | null)?.escrow_status ?? '—'}
                </p>
                <ul style={{ margin: '0.75rem 0', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                  {messages.map((m, i) => (
                    <li key={`${d.id}-${i}`}>
                      <strong>{m.sender_type as string}</strong>: {m.body as string}
                    </li>
                  ))}
                </ul>
                {open ? (
                  <form action={addVendorDisputeMessageAction}>
                    <input type="hidden" name="disputeId" value={d.id as string} />
                    <textarea
                      name="body"
                      rows={2}
                      required
                      placeholder="Your response…"
                      style={{ width: '100%', marginBottom: '0.5rem' }}
                    />
                    <button className="btn" type="submit">
                      Reply
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </VendorAuthenticated>
  );
}
