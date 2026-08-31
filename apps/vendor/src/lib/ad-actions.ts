'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';

const PLACEMENTS = [
  'search_results_top',
  'search_sidebar',
  'home_featured',
  'category_banner',
  'supplier_spotlight',
] as const;

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireSupplier() {
  const { supplier, user } = await getSessionProfile();
  if (!user) return { error: 'Sign in required' } as const;
  if (!supplier?.id) return { error: 'Complete seller signup first' } as const;
  return { supplier, user } as const;
}

export async function fakeTopUpAdWalletAction(amountInrCents = 50000): Promise<ActionResult & { balance?: number }> {
  const gate = await requireSupplier();
  if ('error' in gate) return { ok: false, error: gate.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('fake_top_up_ad_wallet', {
    p_amount_inr_cents: amountInrCents,
  });

  if (error) return { ok: false, error: error.message };
  const result = data as { ok?: boolean; error?: string; balance_inr_cents?: number };
  if (!result?.ok) return { ok: false, error: result.error ?? 'Top-up failed' };

  revalidatePath('/advertising');
  revalidatePath('/advertising/wallet');
  return { ok: true, balance: result.balance_inr_cents };
}

export async function createAdCampaignAction(formData: FormData): Promise<ActionResult & { id?: string }> {
  const gate = await requireSupplier();
  if ('error' in gate) return { ok: false, error: gate.error ?? 'Unauthorized' };
  const { supplier, user } = gate;

  const name = String(formData.get('name') ?? '').trim();
  const billingModel = String(formData.get('billingModel') ?? 'cpc') as 'cpc' | 'cpm' | 'sponsorship';
  const creativeFormat = String(formData.get('creativeFormat') ?? 'image') as 'text' | 'image' | 'video';
  const productId = String(formData.get('productId') ?? '').trim();
  const keywordsRaw = String(formData.get('keywords') ?? '').trim();
  const dailyBudgetInr = Number(formData.get('dailyBudgetInr') ?? 0);
  const totalBudgetInrRaw = String(formData.get('totalBudgetInr') ?? '').trim();
  const maxCpcBidInr = Number(formData.get('maxCpcBidInr') ?? 5);
  const cpmRateInr = Number(formData.get('cpmRateInr') ?? 1);
  const sponsorshipDailyInr = Number(formData.get('sponsorshipDailyInr') ?? 100);
  const categoryHint = String(formData.get('categoryHint') ?? '').trim() || null;
  const headlineOverride = String(formData.get('headlineOverride') ?? '').trim() || null;
  const bodyText = String(formData.get('bodyText') ?? '').trim() || null;
  const mediaUrl = String(formData.get('mediaUrl') ?? '').trim() || null;
  const ctaLabel = String(formData.get('ctaLabel') ?? 'Learn more').trim() || 'Learn more';

  const placementTypes = PLACEMENTS.filter((p) => formData.get(`placement_${p}`) === 'on');
  if (name.length < 2) return { ok: false, error: 'Campaign name is required.' };
  if (placementTypes.length === 0) return { ok: false, error: 'Pick at least one placement.' };
  if (!['cpc', 'cpm', 'sponsorship'].includes(billingModel)) {
    return { ok: false, error: 'Invalid billing model.' };
  }
  if (!['text', 'image', 'video'].includes(creativeFormat)) {
    return { ok: false, error: 'Invalid ad format.' };
  }

  const hasCreative =
    Boolean(headlineOverride || bodyText) ||
    Boolean(creativeFormat !== 'text' && mediaUrl);
  if (!productId && !hasCreative) {
    return { ok: false, error: 'Add a headline, body, or media — or link a listing.' };
  }
  if (creativeFormat === 'text' && !headlineOverride && !bodyText) {
    return { ok: false, error: 'Text ads need a headline or primary text.' };
  }
  if (creativeFormat !== 'text' && !mediaUrl && !productId) {
    return { ok: false, error: 'Image/video ads need a media URL or linked listing.' };
  }

  const supabase = await createClient();

  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('supplier_id', supplier.id)
      .eq('status', 'published')
      .maybeSingle();
    if (!product) return { ok: false, error: 'Product not found or not published.' };
  }

  await supabase.rpc('ensure_ad_wallet', { p_supplier_id: supplier.id });

  const { data: wallet } = await supabase
    .from('ad_wallets')
    .select('balance_inr_cents')
    .eq('supplier_id', supplier.id)
    .maybeSingle();
  if (!wallet || Number(wallet.balance_inr_cents) <= 0) {
    return { ok: false, error: 'Add test credit to your ad wallet first.' };
  }

  const totalBudgetInrCents = totalBudgetInrRaw
    ? Math.round(Number(totalBudgetInrRaw) * 100)
    : null;

  const { data: campaign, error: campErr } = await supabase
    .from('ad_campaigns')
    .insert({
      supplier_id: supplier.id,
      name,
      status: 'active',
      billing_model: billingModel,
      placement_types: placementTypes,
      max_cpc_bid_inr_cents: billingModel === 'cpc' ? Math.round(maxCpcBidInr * 100) : null,
      cpm_rate_inr_cents: billingModel === 'cpm' ? Math.round(cpmRateInr * 100) : null,
      sponsorship_daily_inr_cents:
        billingModel === 'sponsorship' ? Math.round(sponsorshipDailyInr * 100) : null,
      daily_budget_inr_cents: Math.round(Math.max(0, dailyBudgetInr) * 100),
      total_budget_inr_cents: totalBudgetInrCents,
      category_hint: categoryHint,
      created_by_user_id: user.id,
    })
    .select('id')
    .single();

  if (campErr || !campaign) return { ok: false, error: campErr?.message ?? 'Could not create campaign.' };

  const { error: creativeErr } = await supabase.from('ad_creatives').insert({
    campaign_id: campaign.id,
    product_id: productId || null,
    creative_format: creativeFormat,
    headline_override: headlineOverride,
    body_text: bodyText,
    media_url: mediaUrl,
    cta_label: ctaLabel,
  });
  if (creativeErr) return { ok: false, error: creativeErr.message };

  if (billingModel === 'cpc' && keywordsRaw) {
    const keywords = keywordsRaw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length >= 2);
    if (keywords.length > 0) {
      const { error: kwErr } = await supabase.from('ad_keywords').insert(
        keywords.map((keyword) => ({
          campaign_id: campaign.id,
          keyword,
          match_type: 'broad',
        })),
      );
      if (kwErr) return { ok: false, error: kwErr.message };
    }
  }

  revalidatePath('/advertising');
  return { ok: true, id: campaign.id };
}

export async function updateAdCampaignStatusAction(
  campaignId: string,
  status: 'active' | 'paused',
): Promise<ActionResult> {
  const gate = await requireSupplier();
  if ('error' in gate) return { ok: false, error: gate.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('ad_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('supplier_id', gate.supplier.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/advertising');
  revalidatePath(`/advertising/${campaignId}`);
  return { ok: true };
}
