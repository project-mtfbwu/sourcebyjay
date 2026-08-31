import { cacheLife } from 'next/cache';
import { createSupabaseAnonServerClient } from '@/supabase-clients/anon/createSupabaseAnonServerClient';
import { safeMarketplaceImageSrc } from '@/utils/marketplace-image';

export type SponsoredAd = {
  creativeId: string;
  campaignId: string;
  productId: string | null;
  productSlug: string;
  creativeFormat: 'text' | 'image' | 'video';
  headlineOverride: string | null;
  bodyText: string | null;
  mediaUrl: string | null;
  ctaLabel: string;
  supplierId: string;
  billingModel: string;
  productTitle: string;
  productPrice: number;
  productCurrency: string;
  productImageUrl: string;
  supplierName: string;
  supplierSlug: string;
};

function mapRow(r: Record<string, unknown>): SponsoredAd {
  return {
    creativeId: r.creative_id as string,
    campaignId: r.campaign_id as string,
    productId: (r.product_id as string | null) ?? null,
    productSlug: (r.product_slug as string) ?? (r.product_id as string) ?? '',
    creativeFormat: ((r.creative_format as string) ?? 'image') as SponsoredAd['creativeFormat'],
    headlineOverride: (r.headline_override as string | null) ?? null,
    bodyText: (r.body_text as string | null) ?? null,
    mediaUrl: (() => {
      const raw = (r.media_url as string | null) ?? null;
      const safe = safeMarketplaceImageSrc(raw);
      return safe || null;
    })(),
    ctaLabel: (r.cta_label as string) ?? 'Learn more',
    supplierId: r.supplier_id as string,
    billingModel: r.billing_model as string,
    productTitle: r.product_title as string,
    productPrice: Number(r.product_price),
    productCurrency: (r.product_currency as string) ?? 'INR',
    productImageUrl: safeMarketplaceImageSrc(r.product_image_url as string),
    supplierName: r.supplier_name as string,
    supplierSlug: r.supplier_slug as string,
  };
}

export async function getSponsoredPlacements(
  placement: string,
  options?: { query?: string; categorySlug?: string; limit?: number },
): Promise<SponsoredAd[]> {
  'use cache';
  cacheLife('minutes');

  try {
    const supabase = await createSupabaseAnonServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_sponsored_placements', {
      p_placement: placement,
      p_query: options?.query,
      p_category_slug: options?.categorySlug,
      p_limit: options?.limit ?? 3,
    });

    if (error || !data) return [];
    const payload = data as { ok?: boolean; placements?: Record<string, unknown>[] };
    if (!payload.ok || !payload.placements?.length) return [];
    return payload.placements.map(mapRow);
  } catch {
    return [];
  }
}
