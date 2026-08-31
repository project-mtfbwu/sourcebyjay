import { MinisiteLayout } from '@/components/marketplace/layout/MinisiteLayout';
import { type ReactNode } from 'react';

export default function MinisiteRootLayout({ children }: { children: ReactNode }) {
  return <MinisiteLayout>{children}</MinisiteLayout>;
}
