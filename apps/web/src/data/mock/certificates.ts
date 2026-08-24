import type { SupplierCertificate } from '@/types/marketplace';

export const certificates: SupplierCertificate[] = [
  {
    id: 'c1',
    supplierId: 's1',
    name: 'ISO 9001:2015',
    fileUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=520&fit=crop',
    expiresAt: '2027-06-01',
    status: 'approved',
  },
  {
    id: 'c2',
    supplierId: 's1',
    name: 'CE Declaration of Conformity',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7e4f?w=400&h=520&fit=crop',
    expiresAt: '2026-12-31',
    status: 'approved',
  },
  {
    id: 'c3',
    supplierId: 's2',
    name: 'GOTS Organic Textile',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=520&fit=crop',
    status: 'approved',
  },
];

export function getApprovedCertificatesBySupplier(supplierId: string) {
  return certificates.filter((c) => c.supplierId === supplierId && c.status === 'approved');
}
