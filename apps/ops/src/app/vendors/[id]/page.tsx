import Link from 'next/link';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { updateSupplierAction } from '@/lib/crm-actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsVendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const canEdit = hasStaffRole(staff?.role, 'manager');
  const supabase = await createClient();
  const [{ data: vendor }, { data: products }, { data: eligible }] = await Promise.all([
    supabase.from('suppliers').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('products')
      .select('id, title, status, price, currency')
      .eq('supplier_id', id)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase.rpc('supplier_is_guarantee_eligible', { p_supplier_id: id }),
  ]);

  if (!vendor) {
    return (
      <OpsShell email={profile?.email} staffRole={staff?.role} title="Seller not found">
        <Link href="/vendors">← Sellers</Link>
      </OpsShell>
    );
  }

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title={vendor.name as string}
      subtitle="Seller CRM — edit storefront fields to help when needed."
    >
      <nav className="nav" style={{ marginTop: 0 }}>
        <Link href="/vendors">← Sellers</Link>
        <Link href={`/vendors/${id}/verification`}>Verification</Link>
        <Link href={`/vendors/${id}/gallery`}>Gallery</Link>
        <Link href={`/vendors/${id}/subscription`}>Subscription</Link>
      </nav>

      <div className="card">
        <p>
          <strong>Slug:</strong> {vendor.slug as string}
        </p>
        <p>
          <strong>Tier:</strong> {(vendor.verification_tier as string) ?? 'none'}
        </p>
        <p>
          <strong>SourceByJay Guarantee eligible:</strong> {eligible ? 'yes' : 'no'}
          {vendor.guarantee_ops_override != null
            ? ` (ops override: ${String(vendor.guarantee_ops_override)})`
            : ' (from plan)'}
        </p>
        <p>
          <strong>GSTIN / PAN:</strong>{' '}
          {(vendor as { pan?: string }).pan
            ? `PAN ${(vendor as { pan?: string }).pan}`
            : 'PAN —'}
          {' · '}
          PIN {(vendor as { pincode?: string }).pincode ?? '—'},{' '}
          {(vendor as { state?: string }).state ?? '—'}
        </p>
        <p>
          <strong>Business type:</strong> {(vendor as { business_type?: string }).business_type ?? '—'}
          {(vendor as { msme_udhyam?: string }).msme_udhyam
            ? ` · Udyam ${(vendor as { msme_udhyam?: string }).msme_udhyam}`
            : ''}
        </p>
      </div>

      <form action={updateSupplierAction} className="card form-grid">
        <input type="hidden" name="id" value={vendor.id as string} />
        <label className="span-2">
          Company name
          <input name="name" defaultValue={vendor.name as string} required disabled={!canEdit} />
        </label>
        <label>
          City
          <input name="city" defaultValue={vendor.city as string} required disabled={!canEdit} />
        </label>
        <label>
          Country
          <input
            name="country"
            defaultValue={vendor.country as string}
            required
            disabled={!canEdit}
          />
        </label>
        <label className="span-2">
          Main products
          <input
            name="main_products"
            defaultValue={(vendor.main_products as string) ?? ''}
            disabled={!canEdit}
          />
        </label>
        <label className="span-2">
          Description
          <textarea
            name="description"
            rows={5}
            defaultValue={(vendor.description as string) ?? ''}
            disabled={!canEdit}
          />
        </label>
        {canEdit ? (
          <div className="span-2">
            <button className="btn" type="submit">
              Save seller page
            </button>
          </div>
        ) : (
          <p className="span-2 muted">Viewer: read-only. Manager+ can edit.</p>
        )}
      </form>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Their listings</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id as string}>
                <td>{p.title as string}</td>
                <td>{p.status as string}</td>
                <td>
                  {p.currency as string} {Number(p.price).toLocaleString()}
                </td>
                <td>
                  <Link href={`/listings/${p.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(products ?? []).length === 0 ? <p className="muted">No listings.</p> : null}
      </div>
    </OpsShell>
  );
}
