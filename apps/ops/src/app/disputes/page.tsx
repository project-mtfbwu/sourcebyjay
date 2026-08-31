import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { opsAddDisputeMessageAction, resolveDisputeAction } from '@/lib/dispute-actions';

export default async function OpsDisputesPage() {
  const { user, profile, staff } = await getOpsSession();
  const allowed = canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null);
  const canResolve = hasStaffRole(staff?.role, 'manager');

  if (!user || !allowed) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: disputes } = await supabase
    .from('disputes')
    .select(
      'id, reason, status, resolution, buyer_note, created_at, order_id, refund_amount_cents, orders(total_amount, currency, guarantee_protected, escrow_status, suppliers(name)), dispute_messages(id, sender_type, body, created_at)',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Disputes"
      subtitle="SourceByJay Guarantee claims. Escrow is still fake until Phase 10 Stripe."
    >
      {(disputes ?? []).length === 0 ? (
        <p className="muted">No disputes yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {(disputes ?? []).map((d) => {
            const order = Array.isArray(d.orders) ? d.orders[0] : d.orders;
            const supplier = order
              ? Array.isArray((order as { suppliers?: unknown }).suppliers)
                ? (order as { suppliers: { name?: string }[] }).suppliers[0]
                : (order as { suppliers?: { name?: string } }).suppliers
              : null;
            const messages = Array.isArray(d.dispute_messages)
              ? [...d.dispute_messages].sort((a, b) =>
                  String(a.created_at).localeCompare(String(b.created_at)),
                )
              : [];
            const open = ['open', 'under_review'].includes(d.status as string);

            return (
              <div key={d.id as string} className="card">
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {(d.id as string).slice(0, 8)}… · {String(d.created_at).slice(0, 10)}
                </div>
                <div>
                  <strong>{d.status as string}</strong> · {d.reason as string}
                  {d.resolution ? ` · ${d.resolution}` : ''}
                </div>
                <p className="muted" style={{ margin: '0.35rem 0' }}>
                  {(supplier as { name?: string } | null)?.name ?? 'Supplier'} · order{' '}
                  {(d.order_id as string).slice(0, 8)}… · escrow{' '}
                  {(order as { escrow_status?: string } | null)?.escrow_status ?? '—'}
                </p>
                {d.buyer_note ? <p style={{ margin: '0.5rem 0' }}>{d.buyer_note as string}</p> : null}
                <ul style={{ margin: '0.75rem 0', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                  {messages.map((m, i) => (
                    <li key={`${d.id}-${i}`}>
                      <strong>{m.sender_type as string}</strong>: {m.body as string}
                    </li>
                  ))}
                </ul>

                {open ? (
                  <>
                    <form action={opsAddDisputeMessageAction} style={{ marginTop: '0.75rem' }}>
                      <input type="hidden" name="disputeId" value={d.id as string} />
                      <textarea
                        name="body"
                        rows={2}
                        placeholder="Ops note to thread…"
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                        required
                      />
                      <button className="btn" type="submit">
                        Add message
                      </button>
                    </form>
                    {canResolve ? (
                      <form action={resolveDisputeAction} style={{ marginTop: '0.75rem' }}>
                        <input type="hidden" name="disputeId" value={d.id as string} />
                        <label className="muted" style={{ display: 'block', marginBottom: '0.35rem' }}>
                          Resolution
                        </label>
                        <select name="resolution" defaultValue="full_refund" required>
                          <option value="full_refund">Full refund</option>
                          <option value="partial_refund">Partial refund</option>
                          <option value="reject">Reject claim</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                        <input
                          name="refundCents"
                          type="number"
                          placeholder="Refund cents (optional)"
                          style={{ display: 'block', margin: '0.5rem 0', width: '100%' }}
                        />
                        <input
                          name="note"
                          type="text"
                          placeholder="Resolution note"
                          style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                        />
                        <button className="btn" type="submit">
                          Resolve
                        </button>
                      </form>
                    ) : (
                      <p className="muted">Manager+ can resolve. Your role: {staff?.role}</p>
                    )}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </OpsShell>
  );
}
