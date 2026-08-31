import type { PortalId } from './events';
import { getSentryDsn } from './env';

export function buildSentryOptions(portal: PortalId) {
  const dsn = getSentryDsn();
  if (!dsn) return null;

  return {
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: true,
    initialScope: {
      tags: { portal },
    },
  } as const;
}
