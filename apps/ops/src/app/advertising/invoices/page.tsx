import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function OpsAdvertisingInvoicesPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('ad_invoices')
    .select('id, invoice_number, invoice_type, total_inr, issued_at, suppliers(name)')
    .order('issued_at', { ascending: false })
    .limit(100);

  return (
    <OpsShell email={profile?.email} staffRole={staff?.role} title="Ad invoices" subtitle="Wallet receipts and spend statements (TEST MODE).">
      {(invoices ?? []).length === 0 ? (
        <p className="muted">No ad invoices yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {(invoices ?? []).map((inv) => {
            const supplier = Array.isArray(inv.suppliers) ? inv.suppliers[0] : inv.suppliers;
            return (
              <Link key={inv.id as string} href={`/advertising/invoices/${inv.id}`} className="card">
                {inv.invoice_number as string} · {(supplier as { name?: string } | null)?.name ?? 'Seller'} · ₹
                {Number(inv.total_inr).toLocaleString('en-IN')} · {String(inv.issued_at).slice(0, 10)}
              </Link>
            );
          })}
        </div>
      )}
    </OpsShell>
  );
}
