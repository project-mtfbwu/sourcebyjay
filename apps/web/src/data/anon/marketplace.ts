import { cacheLife } from 'next/cache';

import type { Product, SearchFilters, Supplier, Category, SupplierGalleryItem, SupplierCertificate, VerificationTier } from '@/types/marketplace';
import { createSupabaseAnonServerClient } from '@/supabase-clients/anon/createSupabaseAnonServerClient';
import { mapDbProduct } from '@/utils/marketplace-mappers';
import { getCategoryAndDescendantIds } from '@/utils/category-tree';
import { matchesSearchText, searchTokens } from '@/utils/search-query';
import { isGoldTier, isPubliclyVerified, legacyVerifiedFromTier, tierFromLegacyVerified } from '@/utils/verification';
import {
  products as mockProducts,
  getProductBySlug as mockGetProductBySlug,
  getProductsBySupplier as mockGetProductsBySupplier,
  searchProducts as mockSearchProducts,
} from '@/data/mock/products';
import {
  suppliers as mockSuppliers,
  getSupplierBySlug as mockGetSupplierBySlug,
} from '@/data/mock/suppliers';
import { getApprovedGalleryBySupplier } from '@/data/mock/gallery';
import { getApprovedCertificatesBySupplier } from '@/data/mock/certificates';
import { categories as mockCategories } from '@/data/mock/categories';

function mapDbSupplier(row: Record<string, unknown>): Supplier {
  const tier = (row.verification_tier as VerificationTier | undefined) ?? tierFromLegacyVerified(Boolean(row.verified));
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    verified: legacyVerifiedFromTier(tier),
    verificationTier: tier,
    country: row.country as string,
    city: row.city as string,
    yearsInBusiness: Number(row.years_in_business),
    responseRate: row.response_rate as string,
    mainProducts: row.main_products as string,
    description: row.description as string,
    bannerUrl: row.banner_url as string | undefined,
    logoUrl: (row.logo_url as string | null) ?? undefined,
    ownerId: (row.owner_id as string | null) ?? null,
    featuredProductIds: Array.isArray(row.storefront_featured_product_ids)
      ? (row.storefront_featured_product_ids as string[])
      : [],
    guaranteeEligible: false,
  };
}

function mapDbGallery(row: Record<string, unknown>): SupplierGalleryItem {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    mediaType: row.media_type as SupplierGalleryItem['mediaType'],
    contentKind: ((row.content_kind as string) ?? 'image') as SupplierGalleryItem['contentKind'],
    imageUrl: row.image_url as string,
    videoUrl: (row.video_url as string | null) ?? null,
    caption: row.caption as string | null,
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status as SupplierGalleryItem['status'],
  };
}

function mapDbCertificate(row: Record<string, unknown>): SupplierCertificate {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    name: row.name as string,
    fileUrl: row.file_url as string,
    certType: (row.cert_type as string) ?? null,
    certNumber: (row.cert_number as string) ?? null,
    issuingAuthority: (row.issuing_authority as string) ?? null,
    expiresAt: row.expires_at as string | null,
    status: row.status as SupplierCertificate['status'],
  };
}

function mapDbCategory(row: { id: string; name: string; slug: string; parent_id: string | null }): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
  };
}

async function fetchDbCategories(): Promise<Category[]> {
  'use cache';
  cacheLife('hours');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) return mockCategories;

  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error || !data?.length) return mockCategories;
  return data.map((row) =>
    mapDbCategory({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parent_id: (row as { parent_id?: string | null }).parent_id ?? null,
    }),
  );
}

export async function getCategories() {
  return fetchDbCategories();
}

function applySupplierFilters(results: Product[], filters: SearchFilters, supplierMap: Map<string, Supplier>) {
  let filtered = results;

  if (filters.country) {
    const c = filters.country.toLowerCase();
    filtered = filtered.filter((product) => {
      const supplier = supplierMap.get(product.supplierId);
      return Boolean(supplier?.country.toLowerCase().includes(c));
    });
  }

  if (filters.guarantee) {
    filtered = filtered.filter((product) => {
      const supplier = supplierMap.get(product.supplierId);
      return Boolean(supplier?.guaranteeEligible);
    });
  }

  if (!filters.verified && !filters.gold) return filtered;

  return filtered.filter((product) => {
    const supplier = supplierMap.get(product.supplierId);
    if (!supplier) return false;
    if (filters.gold) return isGoldTier(supplier.verificationTier);
    if (filters.verified) return isPubliclyVerified(supplier.verificationTier);
    return true;
  });
}

function applyClientFilters(results: Product[], filters: SearchFilters, categories: Category[], supplierMap: Map<string, Supplier>) {
  let filtered = results;

  if (filters.q) {
    filtered = filtered.filter((p) =>
      matchesSearchText(`${p.title} ${p.description}`, filters.q!),
    );
  }

  if (filters.category) {
    const categoryIds = getCategoryAndDescendantIds(categories, filters.category);
    if (categoryIds.length) {
      filtered = filtered.filter((p) => categoryIds.includes(p.categoryId));
    }
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.moq !== undefined) {
    filtered = filtered.filter((p) => p.moq <= filters.moq!);
  }

  if (filters.within) {
    filtered = filtered.filter((p) =>
      matchesSearchText(`${p.title} ${p.description}`, filters.within!),
    );
  }

  filtered = applySupplierFilters(filtered, filters, supplierMap);

  return filtered;
}

function tierBoost(tier: VerificationTier | undefined): number {
  switch (tier) {
    case 'assessed':
      return 40;
    case 'gold':
      return 30;
    case 'verified':
      return 20;
    case 'basic':
      return 8;
    default:
      return 0;
  }
}

function sortProducts(
  results: Product[],
  sort: SearchFilters['sort'] | undefined,
  supplierMap: Map<string, Supplier>,
  rankBoostBySupplier?: Map<string, number>,
) {
  const sorted = [...results];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'moq-asc':
      sorted.sort((a, b) => a.moq - b.moq);
      break;
    case 'sold-desc':
      sorted.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
      break;
    case 'relevance':
    default:
      // Mercur-style: text match already applied; boost verify tier + sold + plan rank_boost_bps
      sorted.sort((a, b) => {
        const boostA = (rankBoostBySupplier?.get(a.supplierId) ?? 0) / 100;
        const boostB = (rankBoostBySupplier?.get(b.supplierId) ?? 0) / 100;
        const sa =
          tierBoost(supplierMap.get(a.supplierId)?.verificationTier) +
          Math.min(50, Math.log10((a.soldCount ?? 0) + 1) * 10) +
          boostA;
        const sb =
          tierBoost(supplierMap.get(b.supplierId)?.verificationTier) +
          Math.min(50, Math.log10((b.soldCount ?? 0) + 1) * 10) +
          boostB;
        return sb - sa;
      });
      break;
  }
  return sorted;
}

async function getRankBoostMap(supplierIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const unique = [...new Set(supplierIds)];
  if (unique.length === 0) return map;

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) return map;

  await Promise.all(
    unique.map(async (id) => {
      const { data } = await supabase.rpc('supplier_active_plan', { p_supplier_id: id });
      const plan = Array.isArray(data) ? data[0] : data;
      const bps =
        plan && typeof plan === 'object' && 'rank_boost_bps' in plan
          ? Number((plan as { rank_boost_bps?: number }).rank_boost_bps ?? 0)
          : 0;
      if (bps > 0) map.set(id, bps);
    }),
  );
  return map;
}

async function enrichSuppliersGuarantee(suppliers: Supplier[]): Promise<Supplier[]> {
  const supabase = await createSupabaseAnonServerClient();
  if (!supabase || suppliers.length === 0) return suppliers;

  await Promise.all(
    suppliers.map(async (s) => {
      const { data } = await supabase.rpc('supplier_is_guarantee_eligible', {
        p_supplier_id: s.id,
      });
      s.guaranteeEligible = Boolean(data);
    }),
  );
  return suppliers;
}

export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSearchProducts(filters);
  }

  const categories = await fetchDbCategories();
  const allSuppliers = await getAllSuppliers();
  const dbSupplierMap = new Map(allSuppliers.map((s) => [s.id, s]));

  let query = supabase.from('products').select('*').eq('status', 'published');

  if (filters.q) {
    // Prefer FTS when search_vector exists; otherwise token OR + client AND.
    const { data: ftsData, error: ftsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .textSearch('search_vector', filters.q, { type: 'websearch', config: 'english' });

    if (!ftsError && ftsData?.length) {
      let results = applyClientFilters(
        ftsData.map(mapDbProduct),
        filters,
        categories,
        dbSupplierMap,
      );
      if (results.length) {
        const boostMap = await getRankBoostMap(results.map((p) => p.supplierId));
        return sortProducts(results, filters.sort, dbSupplierMap, boostMap);
      }
    }

    const tokens = searchTokens(filters.q);
    const orParts = tokens.flatMap((t) => {
      const safe = t.replace(/[%(),]/g, '');
      if (!safe) return [];
      return [`title.ilike.%${safe}%`, `description.ilike.%${safe}%`];
    });
    if (orParts.length) {
      query = query.or(orParts.join(','));
    }
  }

  if (filters.category) {
    const categoryIds = getCategoryAndDescendantIds(categories, filters.category);
    if (categoryIds.length) {
      query = query.in('category_id', categoryIds);
    }
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.moq !== undefined) {
    query = query.lte('moq', filters.moq);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return mockSearchProducts(filters);
  }

  let results = data.map(mapDbProduct);
  results = applyClientFilters(results, filters, categories, dbSupplierMap);
  const boostMap = await getRankBoostMap(results.map((p) => p.supplierId));
  return sortProducts(results, filters.sort, dbSupplierMap, boostMap);
}

export async function searchSuppliers(filters: SearchFilters): Promise<Supplier[]> {
  'use cache: private';
  cacheLife('minutes');

  const all = await getAllSuppliers();
  let results = [...all];

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    results = results.filter((s) => {
      const hay = `${s.name} ${s.mainProducts} ${s.description} ${s.city} ${s.country}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (filters.within) {
    const w = filters.within.toLowerCase();
    results = results.filter((s) => {
      const hay = `${s.name} ${s.mainProducts} ${s.description}`.toLowerCase();
      return hay.includes(w);
    });
  }

  if (filters.country) {
    const c = filters.country.toLowerCase();
    results = results.filter((s) => s.country.toLowerCase().includes(c));
  }

  if (filters.gold) {
    results = results.filter((s) => isGoldTier(s.verificationTier));
  } else if (filters.verified) {
    results = results.filter((s) => isPubliclyVerified(s.verificationTier));
  }

  if (filters.guarantee) {
    results = results.filter((s) => Boolean(s.guaranteeEligible));
  }

  // Rank: verify tier + years
  results.sort((a, b) => {
    const sa = tierBoost(a.verificationTier) + a.yearsInBusiness + (a.guaranteeEligible ? 15 : 0);
    const sb = tierBoost(b.verificationTier) + b.yearsInBusiness + (b.guaranteeEligible ? 15 : 0);
    return sb - sa;
  });

  return results;
}

export type SearchSuggestion = {
  type: 'product' | 'supplier' | 'query';
  label: string;
  href: string;
};

export async function suggestSearch(q: string, limit = 8): Promise<SearchSuggestion[]> {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];

  const [products, suppliers] = await Promise.all([getAllProducts(), getAllSuppliers()]);
  const out: SearchSuggestion[] = [];

  for (const p of products) {
    if (out.length >= limit) break;
    if (
      p.status === 'published' &&
      (p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle))
    ) {
      out.push({
        type: 'product',
        label: p.title,
        href: `/products/${p.slug}`,
      });
    }
  }

  for (const s of suppliers) {
    if (out.length >= limit) break;
    if (
      s.name.toLowerCase().includes(needle) ||
      s.mainProducts.toLowerCase().includes(needle)
    ) {
      out.push({
        type: 'supplier',
        label: s.name,
        href: `/suppliers/${s.slug}`,
      });
    }
  }

  if (out.length < limit) {
    out.push({
      type: 'query',
      label: `Search “${q.trim()}”`,
      href: `/search?q=${encodeURIComponent(q.trim())}&mode=products`,
    });
  }

  return out.slice(0, limit);
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  'use cache';
  cacheLife('minutes');
  const products = await getAllProducts();
  return [...products]
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
    .slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetProductBySlug(slug);
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return mockGetProductBySlug(slug);
  }

  const product = mapDbProduct(data);

  const { data: mediaRows } = await supabase
    .from('product_media')
    .select(
      'sort_order, supplier_media_assets(id, public_url, content_kind, thumbnail_url, status)',
    )
    .eq('product_id', product.id)
    .order('sort_order');

  if (mediaRows && mediaRows.length > 0) {
    product.media = mediaRows
      .map((row) => {
        const asset = row.supplier_media_assets as {
          id: string;
          public_url: string;
          content_kind: string;
          thumbnail_url: string | null;
          status: string;
        } | null;
        if (!asset || asset.status !== 'approved') return null;
        return {
          id: asset.id,
          kind: asset.content_kind as 'image' | 'video',
          url: asset.public_url,
          thumbnailUrl: asset.thumbnail_url,
          sortOrder: row.sort_order,
        };
      })
      .filter(Boolean) as Product['media'];
  }

  if (!product.media?.length) {
    const legacy: NonNullable<Product['media']> = product.images.map((url, i) => ({
      id: `legacy-img-${i}`,
      kind: 'image' as const,
      url,
      sortOrder: i,
    }));
    if (product.productVideoEnabled && product.videoUrl) {
      legacy.push({
        id: 'legacy-video',
        kind: 'video',
        url: product.videoUrl,
        sortOrder: legacy.length,
      });
    }
    product.media = legacy;
  }

  return product;
}

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetProductsBySupplier(supplierId);
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'published');

  if (error || !data?.length) {
    return mockGetProductsBySupplier(supplierId);
  }

  return data.map(mapDbProduct);
}

export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSuppliers.find((s) => s.id === id);
  }

  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();

  if (error || !data) {
    return mockSuppliers.find((s) => s.id === id);
  }

  return mapDbSupplier(data);
}

export async function getSupplierBySlug(slug: string): Promise<Supplier | undefined> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockGetSupplierBySlug(slug);
  }

  const { data, error } = await supabase.from('suppliers').select('*').eq('slug', slug).single();

  if (error || !data) {
    return mockGetSupplierBySlug(slug);
  }

  return mapDbSupplier(data);
}

export async function getAllProducts(): Promise<Product[]> {
  'use cache';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockProducts;
  }

  const { data, error } = await supabase.from('products').select('*');

  if (error || !data?.length) {
    return mockProducts;
  }

  return data.map(mapDbProduct);
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  'use cache';
  cacheLife('hours');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return mockSuppliers;
  }

  const { data, error } = await supabase.from('suppliers').select('*');

  if (error || !data?.length) {
    return mockSuppliers;
  }

  return enrichSuppliersGuarantee(data.map(mapDbSupplier));
}

export async function getSupplierGallery(supplierId: string): Promise<SupplierGalleryItem[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return getApprovedGalleryBySupplier(supplierId);
  }

  const { data, error } = await supabase
    .from('supplier_gallery')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'approved')
    .order('sort_order');

  if (error || !data?.length) {
    return getApprovedGalleryBySupplier(supplierId);
  }

  return data.map(mapDbGallery);
}

export async function getSupplierCertificates(supplierId: string): Promise<SupplierCertificate[]> {
  'use cache: private';
  cacheLife('minutes');

  const supabase = await createSupabaseAnonServerClient();
  if (!supabase) {
    return getApprovedCertificatesBySupplier(supplierId);
  }

  const { data, error } = await supabase
    .from('supplier_certificates')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'approved');

  if (error || !data?.length) {
    return getApprovedCertificatesBySupplier(supplierId);
  }

  return data.map(mapDbCertificate);
}
