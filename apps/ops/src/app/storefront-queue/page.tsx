import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { StorefrontVersionReviewActions } from '@/components/StorefrontVersionReviewActions';

export default async function StorefrontQueuePage() {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const supabase = await createClient();
  const [{ data: pendingGallery }, { data: pendingStorefronts }] = await Promise.all([
    supabase
      .from('supplier_gallery')
      .select('id, supplier_id, caption, status, created_at, suppliers(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('supplier_storefront_versions')
      .select(
        'id, supplier_id, version_number, version_label, status, submitted_at, payload, suppliers(name, slug)',
      )
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: false })
      .limit(40),
  ]);

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Queues"
      subtitle="Pending storefront versions, gallery photos, and go-live work."
    >
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Storefront versions (manager+ approve)</h2>
        {(pendingStorefronts ?? []).length === 0 ? (
          <p className="muted">No storefront drafts waiting for approval.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Seller</th>
                <th>Version</th>
                <th>Preview fields</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(pendingStorefronts ?? []).map((row) => {
                const supplier = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;
                const payload = row.payload as { mainProducts?: string; description?: string } | null;
                return (
                  <tr key={row.id as string}>
                    <td>{String(row.submitted_at ?? '').slice(0, 10)}</td>
                    <td>{(supplier as { name?: string } | null)?.name ?? '—'}</td>
                    <td>
                      v{row.version_number as number}
                      {row.version_label ? ` — ${row.version_label as string}` : ''}
                    </td>
                    <td>
                      <span className="muted">{payload?.mainProducts ?? '—'}</span>
                    </td>
                    <td>
                      <StorefrontVersionReviewActions
                        versionId={row.id as string}
                        supplierId={row.supplier_id as string}
                        supplierName={(supplier as { name?: string } | null)?.name ?? 'Seller'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Pending gallery</h2>
        {(pendingGallery ?? []).length === 0 ? (
          <p className="muted">Nothing waiting — nice.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Seller</th>
                <th>Caption</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(pendingGallery ?? []).map((row) => {
                const supplier = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;
                return (
                  <tr key={row.id as string}>
                    <td>{String(row.created_at).slice(0, 10)}</td>
                    <td>{(supplier as { name?: string } | null)?.name ?? '—'}</td>
                    <td>{(row.caption as string) || '—'}</td>
                    <td>
                      <Link href={`/vendors/${row.supplier_id as string}/gallery`}>Review →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Sellers edit at vendor <strong>Storefront</strong> with live buyer preview. Manager+ approves
        versions here before they go live.
      </p>
    </OpsShell>
  );
}
