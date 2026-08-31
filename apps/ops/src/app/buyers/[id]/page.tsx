import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsBuyerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const [{ data: buyer }, { data: orders }, { data: inquiries }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('orders')
      .select('id, status, total_amount, currency, created_at, guarantee_protected, suppliers(name)')
      .eq('buyer_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('inquiries')
      .select('id, message, created_at, quantity, suppliers(name), products(title)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (!buyer) {
    return (
      <OpsShell email={profile?.email} staffRole={staff?.role} title="Buyer not found">
        <Link href="/buyers">← Buyers</Link>
      </OpsShell>
    );
  }

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title={(buyer.full_name as string) || (buyer.email as string)}
      subtitle="Buyer CRM card — behaviour for support."
    >
      <p>
        <Link href="/buyers">← Buyers</Link>
      </p>
      <div className="card">
        <p>
          <strong>Email:</strong> {buyer.email as string}
        </p>
        <p>
          <strong>Company:</strong> {(buyer.company_name as string) || '—'}
        </p>
        <p>
          <strong>Phone:</strong> {(buyer.phone as string) || '—'}
        </p>
        <p>
          <strong>Location:</strong>{' '}
          {[buyer.city, buyer.country].filter(Boolean).join(', ') || '—'}
        </p>
        <p>
          <strong>GSTIN:</strong> {(buyer.gstin as string) || '—'}
        </p>
        <p>
          <strong>Industry:</strong> {(buyer.industry as string) || '—'}
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const supplier = Array.isArray(o.suppliers) ? o.suppliers[0] : o.suppliers;
              return (
                <tr key={o.id as string}>
                  <td>{String(o.created_at).slice(0, 10)}</td>
                  <td>{(supplier as { name?: string } | null)?.name ?? '—'}</td>
                  <td>
                    {o.status as string}
                    {o.guarantee_protected ? ' · Guarantee' : ''}
                  </td>
                  <td>
                    ₹{Number(o.total_amount).toLocaleString('en-IN')} {o.currency as string}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(orders ?? []).length === 0 ? <p className="muted">No orders.</p> : null}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Inquiries</h2>
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {(inquiries ?? []).map((inq) => {
            const supplier = Array.isArray(inq.suppliers) ? inq.suppliers[0] : inq.suppliers;
            const product = Array.isArray(inq.products) ? inq.products[0] : inq.products;
            return (
              <li key={inq.id as string} style={{ marginBottom: '0.65rem' }}>
                <strong>{(supplier as { name?: string } | null)?.name ?? 'Supplier'}</strong>
                {(product as { title?: string } | null)?.title
                  ? ` · ${(product as { title?: string }).title}`
                  : ''}
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {String(inq.created_at).slice(0, 16).replace('T', ' ')}
                </div>
                <div>{inq.message as string}</div>
              </li>
            );
          })}
        </ul>
        {(inquiries ?? []).length === 0 ? <p className="muted">No inquiries.</p> : null}
      </div>
    </OpsShell>
  );
}
