import type { Metadata } from 'next';
import './globals.css';
import { OpsObservabilityProvider } from '@/components/OpsObservabilityProvider';

export const metadata: Metadata = {
  title: 'SourceByJay Ops',
  description: 'Staff operations console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpsObservabilityProvider>{children}</OpsObservabilityProvider>
      </body>
    </html>
  );
}
