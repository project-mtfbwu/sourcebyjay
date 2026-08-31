import { createClient } from '@/lib/supabase';

export type SupplierVideoPlanFeatures = {
  productVideo: boolean;
  videoTab: boolean;
  videoSlots: number | null;
  customMinisite: boolean;
};

const MINISITE_PLAN_SLUGS = new Set(['business', 'export', 'enterprise']);

function parseFeatures(raw: Record<string, unknown> | null): SupplierVideoPlanFeatures {
  const f = raw ?? {};
  const slots = f.video_slots;
  return {
    productVideo: Boolean(f.product_video),
    videoTab: Boolean(f.video_tab),
    videoSlots: slots === null || slots === undefined ? (f.video_tab ? 5 : 0) : Number(slots),
    customMinisite: Boolean(f.custom_minisite),
  };
}

export async function getSupplierVideoPlanFeatures(
  supplierId: string,
): Promise<SupplierVideoPlanFeatures> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('supplier_plan_features', { p_supplier_id: supplierId });
  const parsed = parseFeatures((data as Record<string, unknown> | null) ?? null);
  if (parsed.customMinisite) return parsed;

  const { data: sub } = await supabase
    .from('vendor_subscriptions')
    .select('listing_plans(slug)')
    .eq('supplier_id', supplierId)
    .in('status', ['active', 'comped'])
    .maybeSingle();

  const plan = sub?.listing_plans;
  const slug = Array.isArray(plan)
    ? (plan[0] as { slug?: string } | undefined)?.slug
    : (plan as { slug?: string } | null | undefined)?.slug;
  if (slug && MINISITE_PLAN_SLUGS.has(slug)) {
    return { ...parsed, customMinisite: true };
  }
  return parsed;
}
