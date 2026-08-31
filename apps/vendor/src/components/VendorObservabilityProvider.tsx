'use client';

import { PostHogProvider } from '@sourcebyjay/observability/PostHogProvider';

export function VendorObservabilityProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider portal="vendor">{children}</PostHogProvider>;
}
