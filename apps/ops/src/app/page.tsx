import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { DoughnutChart, OrdersBarChart } from '@/components/dashboard/Charts';
import { ICONS } from '@/components/ops-icons';

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function last7DayBuckets(isoDates: string[]) {
  const days: { key: string; label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: 0,
    });
  }
  const map = new Map(days.map((x) => [x.key, x]));
  for (const iso of isoDates) {
    const key = String(iso).slice(0, 10);
    const bucket = map.get(key);
    if (bucket) bucket.count += 1;
  }
  return days.map(({ label, count }) => ({ label, count }));
}

const PLAN_COLORS = ['#7c5cfc', '#27ae60', '#3b82f6', '#e67e22', '#eb5757', '#8b849c'];

export default async function OpsHomePage() {
  const { user, profile, staff } = await getOpsSession();
  const allowed = canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null);

  if (!user) {
    return (
      <main className="shell">
        <h1>SourceByJay Ops CRM</h1>
        <p className="muted">Staff control room for buyers, sellers, listings, and disputes.</p>
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <Link className="btn" href="/login">
            Ops sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <OpsDenied message="You are signed in, but not on the staff roster (staff_members)." />
    );
  }

  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [
    { count: buyers },
    { count: sellers },
    { count: listings },
    { count: publishedListings },
    { count: draftListings },
    { count: archivedListings },
    { count: pendingGallery },
    { count: approvedGallery },
    { count: openDisputes },
    { count: closedDisputes },
    { count: orders },
    { count: pendingPlans },
    { count: staffActive },
    { data: recentBuyers },
    { data: recentAudit },
    { data: weekOrders },
    { data: activeSubs },
    { data: allPlans },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived'),
    supabase
      .from('supplier_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('supplier_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'under_review']),
    supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['resolved', 'closed', 'withdrawn']),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('vendor_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('staff_members').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('role', 'buyer')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('orders')
      .select('id, created_at')
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('vendor_subscriptions')
      .select('plan_id, listing_plans(slug, name)')
      .in('status', ['active', 'comped']),
    supabase.from('listing_plans').select('id, slug, name').eq('active', true).order('sort_order'),
  ]);

  const planCounts = new Map<string, { label: string; value: number }>();
  for (const p of allPlans ?? []) {
    planCounts.set(p.id as string, { label: p.name as string, value: 0 });
  }
  for (const sub of activeSubs ?? []) {
    const nested = sub.listing_plans as
      | { name?: string; slug?: string }
      | { name?: string; slug?: string }[]
      | null;
    const plan = Array.isArray(nested) ? nested[0] : nested;
    const id = sub.plan_id as string;
    const existing = planCounts.get(id);
    if (existing) existing.value += 1;
    else
      planCounts.set(id, {
        label: plan?.name ?? 'Unknown',
        value: 1,
      });
  }
  const pieSlices = [...planCounts.values()].map((p, i) => ({
    ...p,
    color: PLAN_COLORS[i % PLAN_COLORS.length]!,
  }));

  const pub = publishedListings ?? 0;
  const draft = draftListings ?? 0;
  const arch = archivedListings ?? 0;
  const listingTotal = pub + draft + arch;
  const galleryTotal = (pendingGallery ?? 0) + (approvedGallery ?? 0);
  const disputeTotal = (openDisputes ?? 0) + (closedDisputes ?? 0);

  const barDays = last7DayBuckets((weekOrders ?? []).map((o) => o.created_at as string));
  const weekOrderCount = (weekOrders ?? []).length;

  const displayName =
    profile?.fullName?.trim() ||
    profile?.email?.split('@')[0] ||
    'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const attention = [
    {
      title: 'Open disputes',
      desc: 'Guarantee claims needing mediation',
      count: openDisputes ?? 0,
      href: '/disputes',
    },
    {
      title: 'Gallery review queue',
      desc: 'Factory photos waiting approval',
      count: pendingGallery ?? 0,
      href: '/storefront-queue',
    },
    {
      title: 'Plan upgrade requests',
      desc: 'Sellers waiting for plan approval',
      count: pendingPlans ?? 0,
      href: '/vendors',
    },
    {
      title: 'Draft listings',
      desc: 'Products not live on marketplace',
      count: draft,
      href: '/listings',
    },
  ];

  return (
    <OpsShell email={profile?.email} staffRole={staff?.role} hideHeader>
      <section className="dash-banner">
        <h1>Welcome, {displayName}</h1>
        <p>
          Concise view of buyers, sellers, listings, disputes, and managed marketplace content.
        </p>
        <div className="dash-banner-meta">
          <span className="dash-banner-pill">{staff?.role ?? 'staff'}</span>
          <span className="dash-banner-date">{today}</span>
        </div>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total buyers</div>
          <div className="kpi-icon purple">{ICONS.buyers}</div>
          <div className="kpi-value">{buyers ?? 0}</div>
          <div className="kpi-sub">Buyer profiles in CRM</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Sellers</div>
          <div className="kpi-icon green">{ICONS.sellers}</div>
          <div className="kpi-value">{sellers ?? 0}</div>
          <div className="kpi-sub">Supplier records</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Listings</div>
          <div className="kpi-icon blue">{ICONS.listings}</div>
          <div className="kpi-value">{listings ?? 0}</div>
          <div className="kpi-sub">{pub} published live</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Orders</div>
          <div className="kpi-icon purple">{ICONS.orders}</div>
          <div className="kpi-value">{orders ?? 0}</div>
          <div className="kpi-sub">{weekOrderCount} in last 7 days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open disputes</div>
          <div className="kpi-icon orange">{ICONS.disputes}</div>
          <div className="kpi-value">{openDisputes ?? 0}</div>
          <div className="kpi-sub">Need staff action</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending gallery</div>
          <div className="kpi-icon orange">{ICONS.queues}</div>
          <div className="kpi-value">{pendingGallery ?? 0}</div>
          <div className="kpi-sub">Photos in review</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Plan requests</div>
          <div className="kpi-icon blue">{ICONS.plans}</div>
          <div className="kpi-value">{pendingPlans ?? 0}</div>
          <div className="kpi-sub">Awaiting approval</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active staff</div>
          <div className="kpi-icon green">{ICONS.staff}</div>
          <div className="kpi-value">{staffActive ?? 0}</div>
          <div className="kpi-sub">On staff roster</div>
        </div>
      </section>

      <section className="dash-split">
        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Operational Attention</h2>
              <p className="muted">Items that may need action</p>
            </div>
          </div>
          {attention.map((row) => (
            <Link key={row.title} href={row.href} className="attn-row" style={{ color: 'inherit' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>{row.title}</strong>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {row.desc}
                </span>
              </div>
              <span className={`attn-count${row.count > 0 ? ' hot' : ''}`}>{row.count}</span>
            </Link>
          ))}
        </div>

        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Operational Health</h2>
              <p className="muted">Completion and coverage</p>
            </div>
          </div>
          <div className="health-row">
            <div className="health-meta">
              <span>Listings published</span>
              <strong>{pct(pub, listingTotal)}%</strong>
            </div>
            <div className="health-track">
              <div
                className="health-fill green"
                style={{ width: `${pct(pub, listingTotal)}%` }}
              />
            </div>
          </div>
          <div className="health-row">
            <div className="health-meta">
              <span>Gallery approved</span>
              <strong>{pct(approvedGallery ?? 0, galleryTotal)}%</strong>
            </div>
            <div className="health-track">
              <div
                className="health-fill purple"
                style={{ width: `${pct(approvedGallery ?? 0, galleryTotal)}%` }}
              />
            </div>
          </div>
          <div className="health-row">
            <div className="health-meta">
              <span>Disputes closed</span>
              <strong>{pct(closedDisputes ?? 0, disputeTotal)}%</strong>
            </div>
            <div className="health-track">
              <div
                className="health-fill orange"
                style={{ width: `${pct(closedDisputes ?? 0, disputeTotal || 1)}%` }}
              />
            </div>
          </div>

          <p className="muted" style={{ margin: '1.1rem 0 0.35rem', fontSize: '0.82rem' }}>
            Listing status mix
          </p>
          <div className="status-stack">
            {listingTotal > 0 ? (
              <>
                <div
                  className="status-seg"
                  style={{
                    width: `${pct(pub, listingTotal)}%`,
                    background: 'var(--success)',
                  }}
                />
                <div
                  className="status-seg"
                  style={{
                    width: `${pct(draft, listingTotal)}%`,
                    background: '#cfc6e8',
                  }}
                />
                <div
                  className="status-seg"
                  style={{
                    width: `${pct(arch, listingTotal)}%`,
                    background: 'var(--danger)',
                  }}
                />
              </>
            ) : null}
          </div>
          <div className="status-legend">
            <div>
              <strong>{pub}</strong>
              <span className="muted">Published</span>
            </div>
            <div>
              <strong>{draft}</strong>
              <span className="muted">Draft</span>
            </div>
            <div>
              <strong>{arch}</strong>
              <span className="muted">Archived</span>
            </div>
          </div>
        </div>
      </section>

      <section className="viz-grid">
        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Sellers by plan</h2>
              <p className="muted">Active / comped subscriptions</p>
            </div>
            <Link href="/plans">Plans</Link>
          </div>
          <DoughnutChart slices={pieSlices} />
        </div>
        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Orders — last 7 days</h2>
              <p className="muted">Fills in as buyers place orders</p>
            </div>
            <Link href="/orders">All orders</Link>
          </div>
          <OrdersBarChart days={barDays} />
        </div>
      </section>

      <section className="dash-split">
        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Quick Access</h2>
              <p className="muted">Jump to common CRM work</p>
            </div>
          </div>
          <div className="quick-grid">
            <Link className="quick-tile" href="/buyers">
              {ICONS.buyers}
              Buyers
            </Link>
            <Link className="quick-tile" href="/vendors">
              {ICONS.sellers}
              Sellers
            </Link>
            <Link className="quick-tile" href="/listings">
              {ICONS.listings}
              Listings
            </Link>
            <Link className="quick-tile" href="/disputes">
              {ICONS.disputes}
              Disputes
            </Link>
            <Link className="quick-tile" href="/storefront-queue">
              {ICONS.queues}
              Queues
            </Link>
            <Link className="quick-tile" href="/orders">
              {ICONS.orders}
              Orders
            </Link>
            <Link className="quick-tile" href="/audit-log">
              {ICONS.audit}
              Audit log
            </Link>
            <Link className="quick-tile" href="/plans">
              {ICONS.plans}
              Plans
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="dash-card-head">
            <div>
              <h2>Recent admin activity</h2>
              <p className="muted">Latest audit events</p>
            </div>
            <Link href="/audit-log">View logs</Link>
          </div>
          {(recentAudit ?? []).length === 0 ? (
            <p className="muted">No audit events yet — edits will show here.</p>
          ) : (
            (recentAudit ?? []).map((row) => (
              <div key={row.id as string} className="feed-row">
                <div className="feed-avatar" style={{ background: 'var(--accent-soft)' }}>
                  {ICONS.audit}
                </div>
                <div className="feed-body">
                  <strong>{row.action as string}</strong>
                  <div className="muted">
                    {row.entity_type as string} ·{' '}
                    {new Date(row.created_at as string).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <div className="dash-card-head">
          <div>
            <h2>Recent buyers</h2>
            <p className="muted">Latest buyer accounts in your scope</p>
          </div>
          <Link href="/buyers">View buyers</Link>
        </div>
        {(recentBuyers ?? []).length === 0 ? (
          <p className="muted">No buyers yet.</p>
        ) : (
          (recentBuyers ?? []).map((b) => {
            const name = (b.full_name as string) || (b.email as string) || 'Buyer';
            const initial = name.charAt(0).toUpperCase();
            return (
              <div key={b.id as string} className="feed-row">
                <div className="feed-avatar">{initial}</div>
                <div className="feed-body">
                  <strong>{name}</strong>
                  <div className="muted">
                    {b.email as string} · {String(b.created_at).slice(0, 10)}
                  </div>
                </div>
                <Link href={`/buyers/${b.id as string}`}>View</Link>
              </div>
            );
          })
        )}
      </section>
    </OpsShell>
  );
}
