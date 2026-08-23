import type { Supplier } from '@/types/marketplace';

export const suppliers: Supplier[] = [
  {
    id: 's1',
    slug: 'jaytech-industries',
    name: 'JayTech Industries Co.',
    verified: true,
    country: 'China',
    city: 'Shenzhen',
    yearsInBusiness: 12,
    responseRate: '98%',
    mainProducts: 'Electronics, Industrial Components',
    description:
      'JayTech Industries is a verified manufacturer specializing in consumer electronics and industrial components. We serve B2B buyers across 40+ countries with OEM/ODM capabilities.',
    bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=300&fit=crop',
  },
  {
    id: 's2',
    slug: 'global-source-trading',
    name: 'Global Source Trading Ltd.',
    verified: true,
    country: 'India',
    city: 'Mumbai',
    yearsInBusiness: 8,
    responseRate: '95%',
    mainProducts: 'Textiles, Apparel, Packaging',
    description:
      'Global Source Trading connects international buyers with quality textile and packaging manufacturers across South Asia.',
    bannerUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=300&fit=crop',
  },
  {
    id: 's3',
    slug: 'precision-parts-co',
    name: 'Precision Parts Co.',
    verified: false,
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    yearsInBusiness: 5,
    responseRate: '92%',
    mainProducts: 'Machinery Parts, Tools',
    description:
      'Precision Parts Co. manufactures high-quality machinery components and tools for industrial buyers worldwide.',
    bannerUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&h=300&fit=crop',
  },
];

export function getSupplierBySlug(slug: string) {
  return suppliers.find((s) => s.slug === slug);
}

export function getSupplierById(id: string) {
  return suppliers.find((s) => s.id === id);
}
