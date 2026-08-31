import type { SupplierGalleryItem } from '@/types/marketplace';

export const galleryItems: SupplierGalleryItem[] = [
  {
    id: 'g1',
    supplierId: '00000001-0000-4000-8000-000000000001',
    mediaType: 'factory',
    contentKind: 'image',
    imageUrl: '/mockups/placeholder.jpeg',
    caption: 'SMT production line — Shenzhen facility',
    sortOrder: 0,
    status: 'approved',
  },
  {
    id: 'g2',
    supplierId: '00000001-0000-4000-8000-000000000001',
    mediaType: 'warehouse',
    contentKind: 'image',
    imageUrl: '/mockups/placeholder.jpeg',
    caption: 'Finished goods warehouse',
    sortOrder: 1,
    status: 'approved',
  },
  {
    id: 'g3',
    supplierId: '00000001-0000-4000-8000-000000000001',
    mediaType: 'team',
    contentKind: 'image',
    imageUrl: '/mockups/placeholder.jpeg',
    caption: 'Quality control team',
    sortOrder: 2,
    status: 'approved',
  },
  {
    id: 'g4',
    supplierId: '00000002-0000-4000-8000-000000000001',
    mediaType: 'factory',
    contentKind: 'image',
    imageUrl: '/mockups/placeholder.jpeg',
    caption: 'Textile weaving floor',
    sortOrder: 0,
    status: 'approved',
  },
  {
    id: 'g5',
    supplierId: '00000003-0000-4000-8000-000000000001',
    mediaType: 'factory',
    contentKind: 'image',
    imageUrl: '/mockups/placeholder.jpeg',
    caption: 'CNC machining workshop',
    sortOrder: 0,
    status: 'pending',
  },
];

export function getApprovedGalleryBySupplier(supplierId: string) {
  return galleryItems
    .filter((g) => g.supplierId === supplierId && g.status === 'approved')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPendingGalleryItems() {
  return galleryItems.filter((g) => g.status === 'pending');
}

export function getAllGalleryItems() {
  return galleryItems;
}
