import type { SupplierCertificate } from '@/types/marketplace';

export const certificates: SupplierCertificate[] = [
  {
    id: 'c1',
    supplierId: '00000001-0000-4000-8000-000000000001',
    name: 'ISO 9001:2015',
    fileUrl: '/mockups/placeholder.jpeg',
    expiresAt: '2027-06-01',
    status: 'approved',
  },
  {
    id: 'c2',
    supplierId: '00000001-0000-4000-8000-000000000001',
    name: 'CE Declaration of Conformity',
    fileUrl: '/mockups/placeholder.jpeg',
    expiresAt: '2026-12-31',
    status: 'approved',
  },
  {
    id: 'c3',
    supplierId: '00000002-0000-4000-8000-000000000001',
    name: 'GOTS Organic Textile',
    fileUrl: '/mockups/placeholder.jpeg',
    status: 'approved',
  },
];

export function getApprovedCertificatesBySupplier(supplierId: string) {
  return certificates.filter((c) => c.supplierId === supplierId && c.status === 'approved');
}
