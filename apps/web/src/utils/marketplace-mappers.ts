import type {
  DbProductRow,
  ListingAttribute,
  ListingVariant,
  PriceTier,
  Product,
} from '@/types/marketplace';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function mapDbProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    currency: row.currency ?? 'USD',
    moq: Number(row.moq),
    maxOrderQty: row.max_order_qty,
    soldCount: row.sold_count ?? undefined,
    isLocal: row.is_local,
    status: row.status,
    unit: row.unit,
    imageUrl: row.image_url,
    images: (row.images as string[]) ?? [row.image_url],
    categoryId: row.category_id ?? '',
    supplierId: row.supplier_id,
    description: row.description,
    specs: (row.specs as Record<string, string>) ?? {},
    priceTiers: (row.price_tiers as unknown as PriceTier[]) ?? undefined,
    leadTimeDays: row.lead_time_days,
    paymentTerms: row.payment_terms,
    shippingInfo: (row.shipping_info as Record<string, string>) ?? {},
    attributes: (row.attributes as unknown as ListingAttribute[]) ?? [],
    variants: (row.variants as unknown as ListingVariant[]) ?? [],
    sampleAvailable: row.sample_available,
    customizationAvailable: row.customization_available,
  };
}
