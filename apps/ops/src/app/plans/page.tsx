import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { PlansEditor } from './PlansEditor';

function formatInr(cents: number) {
  if (cents <= 0) return 'Custom / ₹0';
  return `₹${Math.round(cents / 100).toLocaleString('en-IN')}/yr`;
}

export default async function OpsPlansPage() {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const canEdit = hasStaffRole(staff?.role, 'admin');
  const supabase = await createClient();
  const { data: plans } = await supabase.from('listing_plans').select('*').order('sort_order');

  const rows = (plans ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    priceInrCentsAnnual: p.price_inr_cents_annual as number,
    maxListings: p.max_listings as number | null,
    rankBoostBps: p.rank_boost_bps as number,
    rfqLeadsPerWeek: p.rfq_leads_per_week as number,
    guaranteeEligible: Boolean(p.guarantee_eligible),
    active: Boolean(p.active),
    priceLabel: formatInr(p.price_inr_cents_annual as number),
  }));

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Listing plans"
      subtitle={
        canEdit
          ? 'IndiaMART-style seller tiers. Admin+ can edit prices.'
          : 'View only — ask an admin to edit prices.'
      }
    >
      <PlansEditor rows={rows} canEdit={canEdit} />
    </OpsShell>
  );
}
