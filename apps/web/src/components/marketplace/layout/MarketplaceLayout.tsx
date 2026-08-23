import { type ReactNode } from 'react';
import { TopBar, MainNav } from './TopBar';
import { FloatAside, MarketplaceFooter } from './Footer';

export function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-roboto)]">
      <TopBar />
      <MainNav />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
      <FloatAside />
    </div>
  );
}
