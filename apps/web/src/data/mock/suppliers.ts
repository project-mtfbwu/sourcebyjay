import type { Supplier } from '@/types/marketplace';

export const suppliers: Supplier[] = [
  {
    id: '00000001-0000-4000-8000-000000000001',
    slug: 'jaytech-industries',
    name: 'JayTech Industries Co.',
    verified: true,
    verificationTier: 'gold',
    country: 'China',
    city: 'Shenzhen',
    yearsInBusiness: 12,
    responseRate: '98%',
    mainProducts: 'Electronics, Industrial Components',
    description:
      'JayTech Industries is a verified manufacturer specializing in consumer electronics and industrial components. We serve B2B buyers across 40+ countries with OEM/ODM capabilities.',
    bannerUrl: '/mockups/placeholder.jpeg',
  },
  {
    id: '00000002-0000-4000-8000-000000000001',
    slug: 'global-source-trading',
    name: 'Global Source Trading Ltd.',
    verified: true,
    verificationTier: 'verified',
    country: 'India',
    city: 'Mumbai',
    yearsInBusiness: 8,
    responseRate: '95%',
    mainProducts: 'Textiles, Apparel, Packaging',
    description:
      'Global Source Trading connects international buyers with quality textile and packaging manufacturers across South Asia.',
    bannerUrl: '/mockups/placeholder.jpeg',
  },
  {
    id: '00000003-0000-4000-8000-000000000001',
    slug: 'precision-parts-co',
    name: 'Precision Parts Co.',
    verified: false,
    verificationTier: 'none',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    yearsInBusiness: 5,
    responseRate: '92%',
    mainProducts: 'Machinery Parts, Tools',
    description:
      'Precision Parts Co. manufactures high-quality machinery components and tools for industrial buyers worldwide.',
    bannerUrl: '/mockups/placeholder.jpeg',
  },
];

export function getSupplierBySlug(slug: string) {
  return suppliers.find((s) => s.slug === slug);
}

export function getSupplierById(id: string) {
  return suppliers.find((s) => s.id === id);
}

export function getSupplierMap() {
  return new Map(suppliers.map((s) => [s.id, s]));
}
