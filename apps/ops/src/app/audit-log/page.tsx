import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

export default async function AuditLogPage() {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, created_at, actor_id')
    .order('created_at', { ascending: false })
    .limit(40);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Audit log"
      subtitle="Who changed what (listings, suppliers, disputes, plans)."
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id as string}>
                <td>{new Date(row.created_at as string).toLocaleString()}</td>
                <td>{row.action as string}</td>
                <td>
                  {row.entity_type as string} · {(row.entity_id as string)?.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(rows ?? []).length === 0 ? <p className="muted">No audit events yet.</p> : null}
      </div>
    </OpsShell>
  );
}
