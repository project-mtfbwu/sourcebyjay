import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { FakePayButton } from '@/components/marketplace/orders/FakePayButton';
import { OpenDisputeForm } from '@/components/marketplace/orders/OpenDisputeForm';
import {
  CancelUnpaidButton,
  RequestRefundButton,
} from '@/components/marketplace/orders/OrderEscrowActions';
import { ReviewOrderForm } from '@/components/marketplace/reviews/ReviewOrderForm';
import { GuaranteeBadge } from '@/components/marketplace/GuaranteeBadge';
import { LogisticsSummary } from '@/components/marketplace/orders/LogisticsSummary';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

const UNPAID = ['awaiting_payment', 'pending_confirmation', 'confirmed'] as const;
const REFUNDABLE = ['paid', 'in_production', 'shipped', 'delivered'] as const;

async function OrdersContent() {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const supabase = await createSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, currency, quantity, is_sample, commission_rate_bps, created_at, guarantee_protected, escrow_status, delivered_at, supplier_id, product_subtotal, freight_amount, incoterm, destination_pincode, shipping_zone, estimated_weight_kg, ship_by_date, payments(status, provider), suppliers(name), order_events(from_status, to_status, note, created_at), reviews(id), disputes(id, status), order_invoices(invoice_number, status)',
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: credits } = await supabase
    .from('buyer_fake_credits')
    .select('amount, currency, reason, created_at, order_id')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const supplierIds = [...new Set((orders ?? []).map((o) => o.supplier_id as string))];
  const eligibleMap = new Map<string, boolean>();
  await Promise.all(
    supplierIds.map(async (id) => {
      const { data } = await supabase.rpc('supplier_is_guarantee_eligible', {
        p_supplier_id: id,
      });
      eligibleMap.set(id, Boolean(data));
    }),
  );

  const creditTotal = (credits ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/account/profile" className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/account/inquiries" className="text-muted-foreground hover:text-foreground">
          Inquiries
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/account/quotes" className="text-muted-foreground hover:text-foreground">
          Quotes
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium text-foreground">Orders</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phase 10A: fake pay → escrow → invoice. Phase 11: freight + incoterms on each order.
        </p>
        {creditTotal > 0 ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Test wallet returned: ₹{creditTotal.toLocaleString('en-IN')} (fake credits from refunds)
          </p>
        ) : null}
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No orders yet. Accept a quote from{' '}
          <Link href="/account/quotes" className="text-brand-primary hover:underline">
            Quotes
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {(orders ?? []).map((o) => {
            const supplier = Array.isArray(o.suppliers) ? o.suppliers[0] : o.suppliers;
            const pay = Array.isArray(o.payments) ? o.payments[0] : o.payments;
            const events = Array.isArray(o.order_events)
              ? [...o.order_events].sort((a, b) =>
                  String(a.created_at).localeCompare(String(b.created_at)),
                )
              : [];
            const invoice = Array.isArray(o.order_invoices)
              ? o.order_invoices[0]
              : o.order_invoices;
            const payStatus = (pay as { status?: string } | null)?.status;
            const canFakePay =
              payStatus === 'pending' && UNPAID.includes(o.status as (typeof UNPAID)[number]);
            const canCancelUnpaid =
              payStatus === 'pending' && UNPAID.includes(o.status as (typeof UNPAID)[number]);
            const canRequestRefund =
              o.escrow_status === 'held' &&
              REFUNDABLE.includes(o.status as (typeof REFUNDABLE)[number]);
            const existingReview = Array.isArray(o.reviews) ? o.reviews[0] : o.reviews;
            const canReview = o.status === 'completed' && !existingReview;
            const disputes = Array.isArray(o.disputes) ? o.disputes : o.disputes ? [o.disputes] : [];
            const openDispute = disputes.find((d) =>
              ['open', 'under_review'].includes((d as { status?: string }).status ?? ''),
            );
            const anyDispute = disputes[0] as { id?: string; status?: string } | undefined;
            const canOpenDispute =
              o.guarantee_protected &&
              ['shipped', 'delivered', 'completed'].includes(o.status) &&
              !openDispute;

            return (
              <li key={o.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {(supplier as { name?: string } | null)?.name ?? 'Supplier'} · {o.status}
                  </span>
                  <span>
                    ₹{Number(o.total_amount).toLocaleString('en-IN')} {o.currency}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Qty {o.quantity}
                  {o.is_sample ? ' · sample' : ''} · payment {payStatus ?? '—'} (
                  {(pay as { provider?: string } | null)?.provider ?? 'fake'}) · escrow{' '}
                  {o.escrow_status}
                  {o.guarantee_protected ? (
                    <>
                      {' '}
                      · <GuaranteeBadge />
                    </>
                  ) : null}
                </p>
                <LogisticsSummary
                  incoterm={o.incoterm}
                  freightAmount={o.freight_amount}
                  productSubtotal={o.product_subtotal}
                  destinationPincode={o.destination_pincode}
                  shippingZone={o.shipping_zone}
                  estimatedWeightKg={o.estimated_weight_kg}
                  shipByDate={o.ship_by_date}
                  currency={o.currency}
                  compact
                />
                {events.length > 0 ? (
                  <ol className="mt-3 space-y-1 border-l pl-3 text-xs text-muted-foreground">
                    {events.map((ev, i) => (
                      <li key={`${o.id}-${i}`}>
                        {ev.to_status}
                        {ev.note ? ` — ${ev.note}` : ''}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {invoice ? (
                  <Link
                    href={`/account/orders/${o.id}/invoice`}
                    className="mt-2 inline-block text-sm text-[#ff6600] hover:underline"
                  >
                    Invoice {(invoice as { invoice_number?: string }).invoice_number}
                    {(invoice as { status?: string }).status === 'voided' ? ' (voided)' : ''}
                  </Link>
                ) : null}
                {canFakePay ? (
                  <FakePayButton
                    orderId={o.id}
                    guaranteeEligible={eligibleMap.get(o.supplier_id as string) ?? false}
                  />
                ) : null}
                {canCancelUnpaid ? <CancelUnpaidButton orderId={o.id} /> : null}
                {canRequestRefund ? <RequestRefundButton orderId={o.id} /> : null}
                {o.escrow_status === 'refunded' ? (
                  <p className="mt-2 text-xs text-emerald-700">Returned to buyer (fake wallet)</p>
                ) : null}
                {anyDispute ? (
                  <Link
                    href={`/account/orders/${o.id}/dispute`}
                    className="mt-2 inline-block text-sm text-[#ff6600] hover:underline"
                  >
                    View dispute ({anyDispute.status})
                  </Link>
                ) : null}
                {canOpenDispute ? <OpenDisputeForm orderId={o.id} /> : null}
                {canReview ? <ReviewOrderForm orderId={o.id} /> : null}
                {existingReview ? (
                  <p className="mt-2 text-xs text-[#ff6600]">Verified review submitted</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
