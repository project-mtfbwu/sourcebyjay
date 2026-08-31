import type { Metadata } from 'next';
import './globals.css';
import { VendorObservabilityProvider } from '@/components/VendorObservabilityProvider';

export const metadata: Metadata = {
  title: 'SourceByJay Seller',
  description: 'Sell on SourceByJay — vendor portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VendorObservabilityProvider>{children}</VendorObservabilityProvider>
      </body>
    </html>
  );
}
