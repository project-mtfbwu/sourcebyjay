export type StorefrontDraftPayload = {
  bannerUrl: string;
  bannerAssetId?: string | null;
  logoUrl: string;
  logoAssetId?: string | null;
  description: string;
  /** Comma-separated parent category names — derived from mainProductCategoryIds */
  mainProducts: string;
  mainProductCategoryIds: string[];
  featuredProductIds: string[];
};

export type StorefrontCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export const STOREFRONT_DRAFT_MESSAGE = 'sbj-storefront-draft' as const;
export const STOREFRONT_PREVIEW_READY = 'sbj-storefront-preview-ready' as const;

export function normalizeStorefrontPayload(raw: unknown): StorefrontDraftPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const featured = p.featuredProductIds;
  const categoryIds = p.mainProductCategoryIds;
  return {
    bannerUrl: String(p.bannerUrl ?? ''),
    bannerAssetId: (p.bannerAssetId as string | null | undefined) ?? null,
    logoUrl: String(p.logoUrl ?? ''),
    logoAssetId: (p.logoAssetId as string | null | undefined) ?? null,
    description: String(p.description ?? ''),
    mainProducts: String(p.mainProducts ?? ''),
    mainProductCategoryIds: Array.isArray(categoryIds) ? categoryIds.map(String) : [],
    featuredProductIds: Array.isArray(featured) ? featured.map(String) : [],
  };
}

export function payloadFromSupplierRow(row: {
  banner_url?: string | null;
  logo_url?: string | null;
  description: string;
  main_products: string;
  storefront_featured_product_ids?: unknown;
}): StorefrontDraftPayload {
  const featured = row.storefront_featured_product_ids;
  return {
    bannerUrl: row.banner_url ?? '',
    logoUrl: row.logo_url ?? '',
    description: row.description ?? '',
    mainProducts: row.main_products ?? '',
    mainProductCategoryIds: [],
    featuredProductIds: Array.isArray(featured) ? featured.map(String) : [],
  };
}

type CategoryRow = { id: string; name: string; slug: string; parentId?: string | null };

/** Parent/top-level categories inferred from a seller's product category assignments */
export function parentCategoriesFromProductCategories(
  productCategoryIds: string[],
  allCategories: CategoryRow[],
): StorefrontCategoryOption[] {
  const byId = new Map(allCategories.map((c) => [c.id, c]));
  const roots = new Map<string, StorefrontCategoryOption>();

  for (const productCatId of productCategoryIds) {
    if (!productCatId) continue;
    let current = byId.get(productCatId);
    if (!current) continue;
    while (current.parentId && byId.has(current.parentId)) {
      current = byId.get(current.parentId)!;
    }
    roots.set(current.id, { id: current.id, name: current.name, slug: current.slug });
  }

  return [...roots.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mainProductsLabelFromCategoryIds(
  categoryIds: string[],
  categories: StorefrontCategoryOption[],
): string {
  const byId = new Map(categories.map((c) => [c.id, c.name]));
  return categoryIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .join(', ');
}

export function categoryIdsFromMainProductsLabel(
  mainProducts: string,
  options: StorefrontCategoryOption[],
): string[] {
  if (!mainProducts.trim()) return [];
  const names = new Set(mainProducts.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  return options.filter((o) => names.has(o.name.toLowerCase())).map((o) => o.id);
}

export function hydrateMainProductCategories(
  payload: StorefrontDraftPayload,
  catalogParentCategories: StorefrontCategoryOption[],
): StorefrontDraftPayload {
  let ids = payload.mainProductCategoryIds.filter((id) =>
    catalogParentCategories.some((c) => c.id === id),
  );
  if (ids.length === 0) {
    ids = categoryIdsFromMainProductsLabel(payload.mainProducts, catalogParentCategories);
  }
  if (ids.length === 0 && catalogParentCategories.length > 0) {
    ids = catalogParentCategories.map((c) => c.id);
  }
  const mainProducts = mainProductsLabelFromCategoryIds(ids, catalogParentCategories);
  return { ...payload, mainProductCategoryIds: ids, mainProducts };
}

export function mergeDraftIntoSupplier<
  T extends {
    bannerUrl?: string;
    logoUrl?: string;
    description: string;
    mainProducts: string;
  },
>(supplier: T, draft: Partial<StorefrontDraftPayload> | null | undefined): T {
  if (!draft) return supplier;
  return {
    ...supplier,
    bannerUrl: draft.bannerUrl !== undefined ? draft.bannerUrl || undefined : supplier.bannerUrl,
    logoUrl: draft.logoUrl !== undefined ? draft.logoUrl || undefined : supplier.logoUrl,
    description: draft.description ?? supplier.description,
    mainProducts: draft.mainProducts ?? supplier.mainProducts,
  };
}

/** Rewrite self-hosted media to same-origin proxy URLs for live preview iframes. */
export function storefrontPreviewMediaUrl(
  url: string | undefined,
  assetId: string | null | undefined,
): string | undefined {
  if (assetId) return `/api/supplier-media/${assetId}`;
  if (!url) return undefined;
  if (!url.startsWith('http')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes('/storage/v1/object/public/supplier-media/')) {
      // Legacy drafts without assetId — keep public URL (works when storage is reachable).
      return url;
    }
  } catch {
    return url;
  }
  return url;
}

export function mergeDraftIntoSupplierForPreview<
  T extends {
    bannerUrl?: string;
    logoUrl?: string;
    description: string;
    mainProducts: string;
  },
>(supplier: T, draft: Partial<StorefrontDraftPayload> | null | undefined): T {
  const merged = mergeDraftIntoSupplier(supplier, draft);
  if (!draft) return merged;
  return {
    ...merged,
    bannerUrl: storefrontPreviewMediaUrl(
      draft.bannerUrl !== undefined ? draft.bannerUrl || undefined : merged.bannerUrl,
      draft.bannerAssetId,
    ),
    logoUrl: storefrontPreviewMediaUrl(
      draft.logoUrl !== undefined ? draft.logoUrl || undefined : merged.logoUrl,
      draft.logoAssetId,
    ),
  };
}

export function orderProductsByFeatured<T extends { id: string }>(
  products: T[],
  featuredIds?: string[] | null,
): T[] {
  if (!featuredIds?.length) return products;
  const byId = new Map(products.map((p) => [p.id, p]));
  const head = featuredIds.map((id) => byId.get(id)).filter(Boolean) as T[];
  const featuredSet = new Set(featuredIds);
  const tail = products.filter((p) => !featuredSet.has(p.id));
  return [...head, ...tail];
}
