import { createSupabaseClient } from '@/supabase-clients/server';

export async function supplierHasCustomMinisite(supplierId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient();
    const { data: features } = await supabase.rpc('supplier_plan_features', {
      p_supplier_id: supplierId,
    });
    const f = features as Record<string, unknown> | null;
    return Boolean(f?.custom_minisite);
  } catch {
    return false;
  }
}

export function buildSupplierStorefrontPath(
  slug: string,
  hasMinisite: boolean,
  opts?: { productId?: string; from?: string },
): string {
  const base = hasMinisite ? `/factory/${slug}` : `/suppliers/${slug}`;
  if (!opts?.productId) return base;
  const params = new URLSearchParams({ productId: opts.productId });
  if (opts.from) params.set('from', opts.from);
  return `${base}?${params.toString()}`;
}
