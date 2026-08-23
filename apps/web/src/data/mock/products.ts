import type { HotSearch, Product } from '@/types/marketplace';
import { getCategoryAndDescendantIds } from '@/utils/category-tree';
import { categories } from './categories';

const pub = (p: Omit<Product, 'status' | 'unit'> & Partial<Pick<Product, 'status' | 'unit'>>): Product => ({
  status: 'published',
  unit: 'piece',
  ...p,
});

export const products: Product[] = [
  pub({
    id: 'p1',
    slug: 'wireless-bluetooth-earbuds-oem',
    title: 'Wireless Bluetooth Earbuds OEM — Bulk Order',
    price: 14.9,
    currency: 'USD',
    moq: 1,
    isLocal: true,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    ],
    categoryId: '3',
    supplierId: 's1',
    description:
      'Premium wireless Bluetooth earbuds with active noise cancellation. Available for OEM branding with custom packaging. CE/FCC certified.',
    specs: {
      'Bluetooth Version': '5.3',
      'Battery Life': '8 hours (30h with case)',
      'Driver Size': '10mm',
      'Water Resistance': 'IPX5',
      Certification: 'CE, FCC, RoHS',
    },
    priceTiers: [
      { minQty: 1, price: 14.9 },
      { minQty: 100, price: 12.5 },
      { minQty: 500, price: 10.8 },
      { minQty: 1000, price: 9.2 },
    ],
  }),
  pub({
    id: 'p2',
    slug: 'industrial-solar-panel-400w',
    title: 'Industrial Solar Panel 400W Monocrystalline',
    price: 75,
    currency: 'USD',
    moq: 1,
    isLocal: true,
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=800&fit=crop',
    ],
    categoryId: '10',
    supplierId: 's1',
    description:
      'High-efficiency monocrystalline solar panel rated at 400W. Ideal for commercial and industrial installations.',
    specs: {
      'Rated Power': '400W',
      Efficiency: '21.2%',
      'Cell Type': 'Monocrystalline',
      Warranty: '25 years linear',
    },
    priceTiers: [
      { minQty: 1, price: 75 },
      { minQty: 50, price: 68 },
      { minQty: 200, price: 62 },
    ],
  }),
  pub({
    id: 'p3',
    slug: 'custom-printed-packaging-boxes',
    title: 'Custom Printed Packaging Boxes — MOQ 4',
    price: 2.99,
    currency: 'USD',
    moq: 4,
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a960f2a4b9d?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1607082348824-0a960f2a4b9d?w=800&h=800&fit=crop',
    ],
    categoryId: '6',
    supplierId: 's2',
    description: 'Fully customizable corrugated packaging boxes with full-color printing. Eco-friendly materials available.',
    specs: {
      Material: 'Corrugated cardboard',
      'Print Method': 'Offset / Digital',
      'Lead Time': '7-14 days',
    },
    priceTiers: [
      { minQty: 4, price: 2.99 },
      { minQty: 100, price: 1.85 },
      { minQty: 1000, price: 0.95 },
    ],
  }),
  pub({
    id: 'p4',
    slug: 'cnc-machining-center-vmc850',
    title: 'CNC Machining Center VMC-850',
    price: 3980,
    currency: 'USD',
    moq: 1,
    isLocal: true,
    imageUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=800&fit=crop',
    ],
    categoryId: '8',
    supplierId: 's3',
    description: 'Vertical machining center with 850mm travel. Suitable for precision metal and plastic parts manufacturing.',
    specs: {
      'Table Size': '1000 x 500 mm',
      'Spindle Speed': '8000 RPM',
      'Tool Capacity': '24 tools',
    },
    priceTiers: [{ minQty: 1, price: 3980 }],
  }),
  pub({
    id: 'p5',
    slug: 'organic-cotton-t-shirts-bulk',
    title: 'Organic Cotton T-Shirts — Bulk Wholesale',
    price: 0.16,
    currency: 'USD',
    moq: 100,
    soldCount: 26100,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    ],
    categoryId: '2',
    supplierId: 's2',
    description: 'GOTS-certified organic cotton t-shirts available in 20+ colors. Custom screen printing and embroidery.',
    specs: {
      Material: '100% Organic Cotton',
      Weight: '180 GSM',
      Sizes: 'XS - 3XL',
      Certification: 'GOTS, OEKO-TEX',
    },
    priceTiers: [
      { minQty: 100, price: 0.16 },
      { minQty: 1000, price: 0.12 },
      { minQty: 5000, price: 0.09 },
    ],
  }),
  pub({
    id: 'p6',
    slug: 'stainless-steel-water-bottles',
    title: 'Stainless Steel Insulated Water Bottles',
    price: 0.72,
    currency: 'USD',
    moq: 50,
    soldCount: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop',
    ],
    categoryId: '7',
    supplierId: 's2',
    description: 'Double-wall vacuum insulated stainless steel bottles. Custom logo laser engraving available.',
    specs: {
      Capacity: '500ml / 750ml / 1000ml',
      Material: '304 Stainless Steel',
      'Insulation': '24 hours cold / 12 hours hot',
    },
    priceTiers: [
      { minQty: 50, price: 0.72 },
      { minQty: 500, price: 0.55 },
    ],
  }),
  pub({
    id: 'p7',
    slug: 'led-strip-lights-rgb',
    title: 'LED Strip Lights RGB 5050 — 5M Roll',
    price: 5.7,
    currency: 'USD',
    moq: 10,
    soldCount: 250,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ],
    categoryId: '11',
    supplierId: 's1',
    description: 'Flexible RGB LED strip lights with remote control and adhesive backing. IP65 waterproof option.',
    specs: {
      Type: '5050 SMD RGB',
      Length: '5 meters',
      Voltage: '12V DC',
      'LED Count': '300 LEDs/roll',
    },
    priceTiers: [
      { minQty: 10, price: 5.7 },
      { minQty: 100, price: 4.2 },
    ],
  }),
  pub({
    id: 'p8',
    slug: 'precision-ball-bearings-6205',
    title: 'Precision Ball Bearings 6205-2RS',
    price: 0.26,
    currency: 'USD',
    moq: 100,
    soldCount: 5500,
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=800&fit=crop',
    ],
    categoryId: '9',
    supplierId: 's3',
    description: 'High-precision deep groove ball bearings with rubber seals. ISO 9001 certified factory.',
    specs: {
      Model: '6205-2RS',
      'Inner Diameter': '25mm',
      'Outer Diameter': '52mm',
      'Width': '15mm',
    },
    priceTiers: [
      { minQty: 100, price: 0.26 },
      { minQty: 1000, price: 0.18 },
    ],
  }),
];

export const hotSearches: HotSearch[] = [
  {
    term: 'Sneakers',
    productSlug: 'organic-cotton-t-shirts-bulk',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  },
  {
    term: 'Sunglasses',
    productSlug: 'wireless-bluetooth-earbuds-oem',
    imageUrl: 'https://images.unsplash.com/photo-1572635196233-8f11f4353319?w=400&h=400&fit=crop',
  },
  {
    term: 'Drones',
    productSlug: 'industrial-solar-panel-400w',
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop',
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsBySupplier(supplierId: string) {
  return products.filter((p) => p.supplierId === supplierId);
}

export function searchProducts(filters: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  moq?: number;
  sort?: string;
}) {
  let results = [...products];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters.category) {
    const categoryIds = getCategoryAndDescendantIds(categories, filters.category);
    if (categoryIds.length) {
      results = results.filter((p) => categoryIds.includes(p.categoryId));
    }
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.moq !== undefined) {
    results = results.filter((p) => p.moq <= filters.moq!);
  }

  switch (filters.sort) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'moq-asc':
      results.sort((a, b) => a.moq - b.moq);
      break;
    default:
      break;
  }

  return results;
}

export { categories };
