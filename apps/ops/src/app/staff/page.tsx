import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function StaffPage() {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  if (!hasStaffRole(staff?.role, 'admin')) {
    return (
      <OpsDenied message="Admin+ required to manage staff. Your role is viewer/manager-level." />
    );
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from('staff_members')
    .select('user_id, role, is_active, department, created_at')
    .order('created_at', { ascending: false });

  const userIds = (members ?? []).map((m) => m.user_id as string);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Staff roster"
      subtitle="Who can open this CRM. Roles: viewer → manager → admin → super_admin."
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => {
              const p = profileById.get(m.user_id as string);
              return (
                <tr key={m.user_id as string}>
                  <td>{p?.email ?? `${(m.user_id as string).slice(0, 8)}…`}</td>
                  <td>{p?.full_name ?? '—'}</td>
                  <td>
                    <span className="badge">{m.role as string}</span>
                  </td>
                  <td>{m.is_active ? 'yes' : 'no'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(members ?? []).length === 0 ? (
          <p className="muted">No staff_members rows yet.</p>
        ) : null}
      </div>
    </OpsShell>
  );
}
