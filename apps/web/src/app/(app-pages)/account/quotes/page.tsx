import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import { QuoteActions } from '@/components/marketplace/orders/QuoteActions';
import { LogisticsSummary } from '@/components/marketplace/orders/LogisticsSummary';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function QuotesContent() {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const supabase = await createSupabaseClient();

  const { data: quotes } = await supabase
    .from('quotes')
    .select(
      'id, status, unit_price, quantity, currency, lead_time_days, valid_until, is_sample, notes, created_at, incoterm, freight_amount, destination_pincode, shipping_zone, estimated_weight_kg, ship_by_date, suppliers(name)',
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

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
        <span className="font-medium text-foreground">Quotes</span>
        <span className="text-muted-foreground">·</span>
        <Link href="/account/orders" className="text-muted-foreground hover:text-foreground">
          Orders
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supplier replies to your RFQs. Accept to open an order (test payment, not Stripe yet).
        </p>
      </div>

      {(quotes ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No quotes yet. Send an inquiry from a product page first.
        </div>
      ) : (
        <ul className="space-y-3">
          {(quotes ?? []).map((q) => {
            const supplier = Array.isArray(q.suppliers) ? q.suppliers[0] : q.suppliers;
            return (
              <li key={q.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {(supplier as { name?: string } | null)?.name ?? 'Supplier'} · {q.status}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{Number(q.unit_price).toLocaleString('en-IN')} × {q.quantity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lead {q.lead_time_days} days
                  {q.is_sample ? ' · sample' : ''}
                  {q.valid_until ? ` · valid until ${q.valid_until}` : ''}
                </p>
                {q.notes ? <p className="mt-2 text-sm whitespace-pre-wrap">{q.notes}</p> : null}
                <LogisticsSummary
                  incoterm={q.incoterm}
                  freightAmount={q.freight_amount}
                  unitPrice={q.unit_price}
                  quantity={q.quantity}
                  destinationPincode={q.destination_pincode}
                  shippingZone={q.shipping_zone}
                  estimatedWeightKg={q.estimated_weight_kg}
                  shipByDate={q.ship_by_date}
                  currency={q.currency}
                />
                {q.status === 'sent' ? <QuoteActions quoteId={q.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AccountQuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <QuotesContent />
    </Suspense>
  );
}
