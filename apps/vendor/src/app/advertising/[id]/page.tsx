import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { AdCampaignStatusButton } from '@/components/AdCampaignStatusButton';

function formatInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function AdCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Campaign" subtitle="Campaign performance.">
        <div className="card denied">Complete seller signup first.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', supplier.id)
    .maybeSingle();

  if (!campaign) notFound();

  const [{ data: creatives }, { data: keywords }] = await Promise.all([
    supabase
      .from('ad_creatives')
      .select('id, product_id, headline_override, products(title, slug)')
      .eq('campaign_id', id),
    supabase.from('ad_keywords').select('keyword, match_type, negative').eq('campaign_id', id),
  ]);

  return (
    <VendorAuthenticated title={campaign.name as string} subtitle={`${campaign.status} · ${campaign.billing_model}`}>
      <p style={{ marginTop: '1rem' }}>
        <Link href="/advertising">← Advertising</Link>
      </p>

      <div className="card" style={{ marginTop: '1rem' }}>
        <dl style={{ display: 'grid', gap: '0.5rem' }}>
          <div>
            <dt className="muted">Spent</dt>
            <dd>{formatInr(Number(campaign.spent_inr_cents))}</dd>
          </div>
          <div>
            <dt className="muted">Today</dt>
            <dd>{formatInr(Number(campaign.spent_today_inr_cents))}</dd>
          </div>
          <div>
            <dt className="muted">Impressions / clicks</dt>
            <dd>
              {Number(campaign.impressions_count)} / {Number(campaign.clicks_count)}
            </dd>
          </div>
          <div>
            <dt className="muted">Placements</dt>
            <dd>{(campaign.placement_types as string[]).join(', ')}</dd>
          </div>
        </dl>
        <div style={{ marginTop: '1rem' }}>
          <AdCampaignStatusButton campaignId={id} status={campaign.status as string} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Creatives</h2>
        {(creatives ?? []).map((cr) => {
          const product = Array.isArray(cr.products) ? cr.products[0] : cr.products;
          return (
            <p key={cr.id as string}>
              {(product as { title?: string } | null)?.title ?? 'Product'} ·{' '}
              {cr.headline_override ? String(cr.headline_override) : 'Default headline'}
            </p>
          );
        })}
      </div>

      {(keywords ?? []).length > 0 ? (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>Keywords</h2>
          <p>{(keywords ?? []).map((k) => k.keyword).join(', ')}</p>
        </div>
      ) : null}
    </VendorAuthenticated>
  );
}
