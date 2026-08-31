import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function AdInvoicesPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Ad invoices" subtitle="Wallet receipts and spend statements.">
        <div className="card denied">Complete seller signup first.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('ad_invoices')
    .select('id, invoice_number, invoice_type, total_inr, issued_at, status, test_mode')
    .eq('supplier_id', supplier.id)
    .order('issued_at', { ascending: false })
    .limit(50);

  return (
    <VendorAuthenticated title="Ad invoices" subtitle="GST-style TEST MODE documents — not real tax invoices.">
      <p style={{ marginTop: '1rem' }}>
        <Link href="/advertising">← Advertising</Link>
      </p>

      {(invoices ?? []).length === 0 ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          No invoices yet. Top up your wallet to generate a receipt.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
          {(invoices ?? []).map((inv) => (
            <Link key={inv.id as string} href={`/advertising/invoices/${inv.id}`} className="card">
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {String(inv.issued_at).slice(0, 10)} · {inv.invoice_type as string}
                {inv.test_mode ? ' · TEST MODE' : ''}
              </div>
              <div className="kpi" style={{ fontSize: '1.1rem' }}>
                {inv.invoice_number as string} · ₹{Number(inv.total_inr).toLocaleString('en-IN')}
              </div>
              <span className="muted">{inv.status as string}</span>
            </Link>
          ))}
        </div>
      )}
    </VendorAuthenticated>
  );
}
