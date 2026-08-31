import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function AdInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Ad invoice" subtitle="Invoice detail.">
        <div className="card denied">Complete seller signup first.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from('ad_invoices')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (!invoice) notFound();

  const lineItems = (invoice.line_items as { description?: string; amount_inr?: number }[] | null) ?? [];

  return (
    <VendorAuthenticated title={`Invoice ${invoice.invoice_number}`} subtitle="Print-friendly TEST MODE receipt.">
      <div style={{ marginTop: '1rem' }} className="print:hidden">
        <Link href="/advertising/invoices">← Invoices</Link>
        <span className="muted" style={{ marginLeft: '1rem' }}>
          Browser Print → Save as PDF
        </span>
      </div>

      <article className="card" style={{ marginTop: '1rem', maxWidth: 720 }}>
        <header style={{ borderBottom: '1px solid var(--crm-border)', paddingBottom: '1rem' }}>
          <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SourceByJay Advertising
          </p>
          <h1 style={{ margin: '0.25rem 0' }}>{invoice.invoice_number as string}</h1>
          <p className="muted">
            Issued {String(invoice.issued_at).slice(0, 10)} · {invoice.invoice_type as string} ·{' '}
            {invoice.status as string}
          </p>
        </header>

        <p style={{ marginTop: '1rem' }}>{invoice.line_summary as string}</p>

        {lineItems.length > 0 ? (
          <ul style={{ marginTop: '1rem' }}>
            {lineItems.map((line, i) => (
              <li key={i}>
                {line.description ?? 'Line item'} — ₹{Number(line.amount_inr ?? 0).toLocaleString('en-IN')}
              </li>
            ))}
          </ul>
        ) : null}

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--crm-border)' }}>
          <strong>Total: ₹{Number(invoice.total_inr).toLocaleString('en-IN')} {invoice.currency as string}</strong>
        </div>

        <p className="muted" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          TEST MODE — simulated ad wallet document. Not a GST tax invoice. Real Stripe billing is deferred.
        </p>
      </article>
    </VendorAuthenticated>
  );
}
