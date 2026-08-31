import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function OpsListingsPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, title, price, currency, moq, status, updated_at, suppliers(name)')
    .order('updated_at', { ascending: false })
    .limit(100);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Listings CMS"
      subtitle="All products. Manager+ can edit on behalf of sellers (audited)."
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Seller</th>
              <th>Price</th>
              <th>MOQ</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const supplier = Array.isArray(p.suppliers) ? p.suppliers[0] : p.suppliers;
              return (
                <tr key={p.id as string}>
                  <td>{p.title as string}</td>
                  <td>{(supplier as { name?: string } | null)?.name ?? '—'}</td>
                  <td>
                    {p.currency as string} {Number(p.price).toLocaleString()}
                  </td>
                  <td>{p.moq as number}</td>
                  <td>
                    <span className="badge">{p.status as string}</span>
                  </td>
                  <td>
                    <Link href={`/listings/${p.id}`}>Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(products ?? []).length === 0 ? <p className="muted">No listings.</p> : null}
      </div>
    </OpsShell>
  );
}
