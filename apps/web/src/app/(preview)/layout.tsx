import { type ReactNode } from 'react';

/** Minimal chrome for vendor iframe preview — no marketplace nav. */
export default function PreviewRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
