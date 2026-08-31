import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function OpsVendorsPage() {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from('suppliers')
    .select('id, name, slug, city, country, verification_tier, verified, guarantee_ops_override')
    .order('name')
    .limit(100);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Sellers"
      subtitle="Factories & suppliers — open to edit profile, plan, gallery, verification."
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Tier</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(vendors ?? []).map((v) => (
              <tr key={v.id as string}>
                <td>{v.name as string}</td>
                <td>
                  {v.city as string}, {v.country as string}
                </td>
                <td>{(v.verification_tier as string) ?? (v.verified ? 'verified' : 'none')}</td>
                <td>
                  <Link href={`/vendors/${v.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(vendors ?? []).length === 0 ? <p className="muted">No sellers yet.</p> : null}
      </div>
    </OpsShell>
  );
}
