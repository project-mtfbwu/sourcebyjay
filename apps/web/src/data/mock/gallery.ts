import type { SupplierGalleryItem } from '@/types/marketplace';

export const galleryItems: SupplierGalleryItem[] = [
  {
    id: 'g1',
    supplierId: 's1',
    mediaType: 'factory',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
    caption: 'SMT production line — Shenzhen facility',
    sortOrder: 0,
    status: 'approved',
  },
  {
    id: 'g2',
    supplierId: 's1',
    mediaType: 'warehouse',
    imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop',
    caption: 'Finished goods warehouse',
    sortOrder: 1,
    status: 'approved',
  },
  {
    id: 'g3',
    supplierId: 's1',
    mediaType: 'team',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    caption: 'Quality control team',
    sortOrder: 2,
    status: 'approved',
  },
  {
    id: 'g4',
    supplierId: 's2',
    mediaType: 'factory',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
    caption: 'Textile weaving floor',
    sortOrder: 0,
    status: 'approved',
  },
  {
    id: 'g5',
    supplierId: 's3',
    mediaType: 'factory',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
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
