import { MarketplaceLayout } from '@/components/marketplace/layout/MarketplaceLayout';
import { type ReactNode } from 'react';

export default function ExternalLayout({ children }: { children: ReactNode }) {
  return <MarketplaceLayout>{children}</MarketplaceLayout>;
}
