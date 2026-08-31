import Link from 'next/link';
import { notFound } from 'next/navigation';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function OpsAdInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from('ad_invoices')
    .select('*, suppliers(name)')
    .eq('id', id)
    .maybeSingle();

  if (!invoice) notFound();

  const supplier = Array.isArray(invoice.suppliers) ? invoice.suppliers[0] : invoice.suppliers;
  const lineItems = (invoice.line_items as { description?: string; amount_inr?: number }[] | null) ?? [];

  return (
    <OpsShell email={profile?.email} staffRole={staff?.role} title={invoice.invoice_number as string}>
      <p style={{ marginTop: '1rem' }}>
        <Link href="/advertising">← Advertising</Link>
      </p>

      <article className="card" style={{ marginTop: '1rem', maxWidth: 720 }}>
        <p className="muted">
          {(supplier as { name?: string } | null)?.name ?? 'Seller'} · {invoice.invoice_type as string} ·{' '}
          {String(invoice.issued_at).slice(0, 10)}
        </p>
        <h1 style={{ margin: '0.5rem 0' }}>{invoice.invoice_number as string}</h1>
        <p>{invoice.line_summary as string}</p>
        {lineItems.length > 0 ? (
          <ul>
            {lineItems.map((line, i) => (
              <li key={i}>
                {line.description ?? 'Line'} — ₹{Number(line.amount_inr ?? 0).toLocaleString('en-IN')}
              </li>
            ))}
          </ul>
        ) : null}
        <p style={{ marginTop: '1rem' }}>
          <strong>Total: ₹{Number(invoice.total_inr).toLocaleString('en-IN')}</strong>
        </p>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          TEST MODE — not a GST tax invoice.
        </p>
      </article>
    </OpsShell>
  );
}
