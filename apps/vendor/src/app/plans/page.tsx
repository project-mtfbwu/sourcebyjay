import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { ChoosePlanButton } from '@/components/ChoosePlanButton';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

function formatInr(cents: number, slug?: string) {
  if (slug === 'enterprise') return 'Contact ops / Custom';
  if (cents <= 0) return '₹0/year';
  return `₹${Math.round(cents / 100).toLocaleString('en-IN')}/year`;
}

export default async function VendorPlansPage() {
  const { user, supplier } = await getSessionProfile();
  const canChoose = Boolean(user && supplier?.id);

  const supabase = await createClient();
  const { data: plans } = await supabase
    .from('listing_plans')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  let currentSlug: string | null = null;
  let pendingSlug: string | null = null;

  if (supplier?.id) {
    const [{ data: sub }, { data: pending }] = await Promise.all([
      supabase
        .from('vendor_subscriptions')
        .select('plan_id, listing_plans(slug)')
        .eq('supplier_id', supplier.id)
        .in('status', ['active', 'comped'])
        .maybeSingle(),
      supabase
        .from('vendor_subscriptions')
        .select('plan_id, listing_plans(slug)')
        .eq('supplier_id', supplier.id)
        .eq('status', 'pending')
        .maybeSingle(),
    ]);

    const nested = sub?.listing_plans as { slug?: string } | { slug?: string }[] | null;
    currentSlug = Array.isArray(nested) ? nested[0]?.slug ?? null : nested?.slug ?? null;

    const pendingNested = pending?.listing_plans as
      | { slug?: string }
      | { slug?: string }[]
      | null;
    pendingSlug = Array.isArray(pendingNested)
      ? pendingNested[0]?.slug ?? null
      : pendingNested?.slug ?? null;
  }

  return (
    <VendorAuthenticated
      title="Seller plans"
      subtitle="Free switches instantly. Paid plans (Starter+) need ops approval until Stripe checkout."
    >
      {currentSlug ? (
        <p>
          Your current plan: <strong>{currentSlug}</strong>
          {pendingSlug ? (
            <>
              {' '}
              · Pending request: <strong>{pendingSlug}</strong>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {(plans ?? []).map((p) => {
          const slug = p.slug as string;
          const isCurrent = slug === currentSlug;
          const isPendingRequest = slug === pendingSlug;
          const isFree = slug === 'free';
          return (
            <div
              key={p.id as string}
              className="card"
              style={
                isCurrent
                  ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' }
                  : undefined
              }
            >
              <div className="muted">{slug}</div>
              <div className="kpi" style={{ fontSize: '1.35rem' }}>
                {p.name as string}
              </div>
              <p style={{ fontWeight: 600, margin: '0.5rem 0' }}>
                {formatInr(p.price_inr_cents_annual as number, slug)}
              </p>
              <ul className="muted" style={{ paddingLeft: '1.1rem', margin: 0, lineHeight: 1.6 }}>
                <li>
                  {(p.max_listings as number | null) == null
                    ? 'Unlimited listings'
                    : `${p.max_listings} active listings`}
                </li>
                <li>Search rank +{(p.rank_boost_bps as number) / 100}%</li>
                <li>{p.rfq_leads_per_week as number} RFQ leads / week</li>
                <li>
                  {p.guarantee_eligible ? 'SourceByJay Guarantee ✓' : 'Guarantee: not included'}
                </li>
              </ul>
              {canChoose ? (
                <ChoosePlanButton
                  planId={p.id as string}
                  planName={p.name as string}
                  isCurrent={isCurrent}
                  isPendingRequest={isPendingRequest}
                  isFree={isFree}
                />
              ) : (
                <p className="muted" style={{ marginTop: '0.75rem' }}>
                  <Link href="/login">Log in</Link> as a seller to choose this plan.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </VendorAuthenticated>
  );
}
