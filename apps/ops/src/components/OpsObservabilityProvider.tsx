'use client';

import { PostHogProvider } from '@sourcebyjay/observability/PostHogProvider';

export function OpsObservabilityProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider portal="ops">{children}</PostHogProvider>;
}
