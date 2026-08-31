import Link from 'next/link';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { updateListingAction } from '@/lib/crm-actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsListingEditPage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const canEdit = hasStaffRole(staff?.role, 'manager');
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*, suppliers(id, name)')
    .eq('id', id)
    .maybeSingle();

  if (!product) {
    return (
      <OpsShell email={profile?.email} staffRole={staff?.role} title="Listing not found">
        <Link href="/listings">← Listings</Link>
      </OpsShell>
    );
  }

  const supplier = Array.isArray(product.suppliers) ? product.suppliers[0] : product.suppliers;

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Edit listing"
      subtitle={
        canEdit
          ? 'Manager+ help-desk edit. Changes are written to the audit log.'
          : 'Viewer: read-only.'
      }
    >
      <p>
        <Link href="/listings">← Listings</Link>
        {(supplier as { id?: string; name?: string } | null)?.id ? (
          <>
            {' · '}
            <Link href={`/vendors/${(supplier as { id: string }).id}`}>
              {(supplier as { name?: string }).name ?? 'Seller'}
            </Link>
          </>
        ) : null}
      </p>

      <form action={updateListingAction} className="card form-grid">
        <input type="hidden" name="id" value={product.id as string} />
        <label className="span-2">
          Title
          <input name="title" defaultValue={product.title as string} required disabled={!canEdit} />
        </label>
        <label>
          Price
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={Number(product.price)}
            required
            disabled={!canEdit}
          />
        </label>
        <label>
          MOQ
          <input
            name="moq"
            type="number"
            min={1}
            defaultValue={Number(product.moq)}
            required
            disabled={!canEdit}
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={product.status as string} disabled={!canEdit}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="span-2">
          Description
          <textarea
            name="description"
            rows={6}
            defaultValue={(product.description as string) ?? ''}
            disabled={!canEdit}
          />
        </label>
        {canEdit ? (
          <div className="span-2">
            <button className="btn" type="submit">
              Save listing
            </button>
          </div>
        ) : (
          <p className="span-2 muted">Ask a manager+ to make changes.</p>
        )}
      </form>
    </OpsShell>
  );
}
