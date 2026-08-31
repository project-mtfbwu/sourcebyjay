import { type ReactNode } from 'react';
import { TopBar, MainNav } from './TopBar';
import { FloatAside, MarketplaceFooter } from './Footer';
import { CompareProvider } from '@/components/marketplace/compare/CompareContext';

export function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <CompareProvider>
      <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-roboto)]">
        <TopBar />
        <MainNav />
        <main className="flex-1">{children}</main>
        <MarketplaceFooter />
        <FloatAside />
      </div>
    </CompareProvider>
  );
}
