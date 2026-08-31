import Link from 'next/link';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { AssignPlanForm } from './AssignPlanForm';
import { ApprovePendingButton } from './ApprovePendingButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsVendorSubscriptionPage({ params }: PageProps) {
  const { id } = await params;
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const canEdit = hasStaffRole(staff?.role, 'manager');
  const supabase = await createClient();
  const [{ data: vendor }, { data: plans }, { data: sub }, { data: pending }] = await Promise.all([
    supabase.from('suppliers').select('id, name').eq('id', id).maybeSingle(),
    supabase.from('listing_plans').select('id, slug, name').eq('active', true).order('sort_order'),
    supabase
      .from('vendor_subscriptions')
      .select('id, status, plan_id, notes, listing_plans(slug, name)')
      .eq('supplier_id', id)
      .in('status', ['active', 'comped'])
      .maybeSingle(),
    supabase
      .from('vendor_subscriptions')
      .select('id, status, notes, listing_plans(slug, name)')
      .eq('supplier_id', id)
      .eq('status', 'pending')
      .maybeSingle(),
  ]);

  if (!vendor) {
    return <OpsDenied message="Seller not found." />;
  }

  const planNested = sub?.listing_plans as
    | { slug?: string; name?: string }
    | { slug?: string; name?: string }[]
    | null;
  const currentPlan = Array.isArray(planNested) ? planNested[0] : planNested;

  const pendingNested = pending?.listing_plans as
    | { slug?: string; name?: string }
    | { slug?: string; name?: string }[]
    | null;
  const pendingPlan = Array.isArray(pendingNested) ? pendingNested[0] : pendingNested;

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Subscription"
      subtitle={String(vendor.name)}
    >
      <p style={{ marginTop: 0 }}>
        <Link href={`/vendors/${id}`}>← Seller</Link>
        {' · '}
        <Link href="/plans">All plans</Link>
      </p>
      <div className="card">
        <p>
          Current:{' '}
          <strong>
            {currentPlan?.name ?? 'None'} ({currentPlan?.slug ?? '—'})
          </strong>{' '}
          · status <strong>{(sub?.status as string) ?? '—'}</strong>
        </p>
        {sub?.notes ? <p className="muted">Notes: {sub.notes as string}</p> : null}
      </div>

      {pendingPlan ? (
        <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--accent)' }}>
          <p>
            Seller requested:{' '}
            <strong>
              {pendingPlan.name} ({pendingPlan.slug})
            </strong>
          </p>
          {pending?.notes ? <p className="muted">{pending.notes as string}</p> : null}
          {canEdit ? <ApprovePendingButton supplierId={id} /> : null}
        </div>
      ) : null}

      {canEdit ? (
        <AssignPlanForm
          supplierId={id}
          plans={(plans ?? []).map((p) => ({
            id: p.id as string,
            label: `${p.name as string} (${p.slug as string})`,
          }))}
        />
      ) : (
        <p className="muted">Manager+ required to change plans. Your role: {staff?.role}</p>
      )}
    </OpsShell>
  );
}
