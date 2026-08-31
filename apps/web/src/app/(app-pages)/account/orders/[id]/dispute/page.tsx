import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { DisputeMessageForm } from '@/components/marketplace/orders/DisputeMessageForm';
import Link from 'next/link';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function DisputeContent({ orderId }: { orderId: string }) {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const supabase = await createSupabaseClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, status, guarantee_protected, escrow_status, total_amount, currency, suppliers(name)',
    )
    .eq('id', orderId)
    .eq('buyer_id', userId)
    .maybeSingle();

  if (!order) notFound();

  const { data: disputes } = await supabase
    .from('disputes')
    .select(
      'id, reason, status, resolution, buyer_note, created_at, resolved_at, dispute_messages(id, sender_type, body, created_at)',
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  const dispute = disputes?.[0];
  const supplier = Array.isArray(order.suppliers) ? order.suppliers[0] : order.suppliers;
  const messages = dispute?.dispute_messages
    ? [...(dispute.dispute_messages as { sender_type: string; body: string; created_at: string }[])].sort(
        (a, b) => String(a.created_at).localeCompare(String(b.created_at)),
      )
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to orders
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Dispute</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(supplier as { name?: string } | null)?.name ?? 'Supplier'} · order{' '}
          {order.id.slice(0, 8)}… · escrow {order.escrow_status}
        </p>
      </div>

      {!order.guarantee_protected ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          This order is not covered by SourceByJay Guarantee.
        </p>
      ) : null}

      {!dispute ? (
        <p className="text-sm text-muted-foreground">No dispute on this order yet.</p>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-medium">{dispute.status}</span>
            <span className="text-muted-foreground">· {dispute.reason}</span>
            {dispute.resolution ? (
              <span className="text-muted-foreground">· resolved: {dispute.resolution}</span>
            ) : null}
          </div>
          <ul className="space-y-2">
            {messages.map((m, i) => (
              <li key={`${m.created_at}-${i}`} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium capitalize">{m.sender_type}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {String(m.created_at).slice(0, 16).replace('T', ' ')}
                </span>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
          {dispute.status === 'open' || dispute.status === 'under_review' ? (
            <DisputeMessageForm disputeId={dispute.id} />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default async function OrderDisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <DisputeContent orderId={id} />
    </Suspense>
  );
}
