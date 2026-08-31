import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function OpsBuyersPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: buyers } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_name, phone, city, country, gstin, industry, created_at')
    .eq('role', 'buyer')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Buyers"
      subtitle="All buyer accounts — open one to see orders & inquiries."
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name / email</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(buyers ?? []).map((b) => (
              <tr key={b.id as string}>
                <td>
                  <strong>{(b.full_name as string) || '—'}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {b.email as string}
                  </div>
                </td>
                <td>{(b.company_name as string) || '—'}</td>
                <td>{(b.phone as string) || '—'}</td>
                <td>
                  {[b.city, b.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td>
                  <Link href={`/buyers/${b.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(buyers ?? []).length === 0 ? <p className="muted">No buyers yet.</p> : null}
      </div>
    </OpsShell>
  );
}
