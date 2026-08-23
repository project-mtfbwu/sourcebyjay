import type { Category } from '@/types/marketplace';

export const categories: Category[] = [
  { id: '1', name: 'Categories for you', slug: 'featured' },
  { id: '10', name: 'Electronics', slug: 'electronics', parentId: null },
  { id: '3', name: 'Consumer Electronics', slug: 'consumer-electronics', parentId: '10' },
  { id: '11', name: 'Audio & Headphones', slug: 'audio-headphones', parentId: '10' },
  { id: '5', name: 'Renewable Energy', slug: 'renewable-energy', parentId: null },
  { id: '12', name: 'Solar & Energy', slug: 'solar-energy', parentId: '5' },
  { id: '13', name: 'Machinery', slug: 'machinery', parentId: null },
  { id: '8', name: 'Industrial Machinery', slug: 'industrial-machinery', parentId: '13' },
  { id: '14', name: 'CNC & Machine Tools', slug: 'cnc-machine-tools', parentId: '13' },
  { id: '2', name: 'Apparel & Accessories', slug: 'apparel-accessories', parentId: null },
  { id: '4', name: 'Sports & Entertainment', slug: 'sports-entertainment', parentId: null },
  { id: '6', name: 'Packaging & Printing', slug: 'packaging-printing', parentId: null },
  { id: '7', name: 'Home & Garden', slug: 'home-garden', parentId: null },
  { id: '9', name: 'Automotive Supplies & Tools', slug: 'automotive', parentId: null },
  { id: '15', name: 'Electrical Equipment', slug: 'electrical', parentId: '10' },
  { id: '12b', name: 'Raw Materials', slug: 'raw-materials', parentId: null },
];
