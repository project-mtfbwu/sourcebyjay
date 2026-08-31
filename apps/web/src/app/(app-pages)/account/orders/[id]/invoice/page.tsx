import { getLoggedInUserId } from '@/data/user/user';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { createSupabaseClient } from '@/supabase-clients/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await getCachedLoggedInVerifiedSupabaseUser();
  const userId = await getLoggedInUserId();
  const { id: orderId } = await params;
  const supabase = await createSupabaseClient();

  const { data: invoice } = await supabase
    .from('order_invoices')
    .select(
      'invoice_number, issued_at, status, currency, subtotal, total, line_summary, order_id, buyer_id, suppliers(name), orders(status, quantity, is_sample, escrow_status)',
    )
    .eq('order_id', orderId)
    .eq('buyer_id', userId)
    .maybeSingle();

  if (!invoice) notFound();

  const supplier = Array.isArray(invoice.suppliers) ? invoice.suppliers[0] : invoice.suppliers;
  const order = Array.isArray(invoice.orders) ? invoice.orders[0] : invoice.orders;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Orders
        </Link>
        <p className="text-xs text-muted-foreground">Browser Print → Save as PDF</p>
      </div>

      <article className="rounded-xl border bg-white p-8 text-foreground shadow-sm">
        <header className="border-b pb-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            SourceByJay
          </p>
          <h1 className="mt-1 text-2xl font-bold">Invoice {invoice.invoice_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issued {String(invoice.issued_at).slice(0, 10)} · Status {invoice.status}
            {invoice.status === 'voided' ? ' (refunded / cancelled)' : ''}
          </p>
        </header>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Supplier</dt>
            <dd className="font-medium">{(supplier as { name?: string } | null)?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{invoice.order_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Line</dt>
            <dd>{invoice.line_summary ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Order / escrow</dt>
            <dd>
              {(order as { status?: string } | null)?.status ?? '—'} · escrow{' '}
              {(order as { escrow_status?: string } | null)?.escrow_status ?? '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex items-baseline justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Total (test / fake)</span>
          <span className="text-xl font-bold">
            ₹{Number(invoice.total).toLocaleString('en-IN')} {invoice.currency}
          </span>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          TEST MODE — mirrors Alibaba Trade Assurance on-platform payment records. Not a GST tax
          invoice. Stripe invoicing is Phase 10B.
        </p>
      </article>
    </div>
  );
}
