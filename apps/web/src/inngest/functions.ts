import { inngest } from './client';

/** Daily stub — Phase 15 wires the job runner; trend scores table comes later. */
export const refreshTrendScores = inngest.createFunction(
  { id: 'refresh-trend-scores', name: 'Refresh product trend scores (stub)' },
  { cron: '0 3 * * *' },
  async ({ step }) => {
    return step.run('log-stub-refresh', async () => {
      const refreshedAt = new Date().toISOString();
      console.info('[inngest] trend score refresh stub', { refreshedAt });
      return { refreshedAt, status: 'stub' as const };
    });
  },
);

/** Manual / dev trigger via Inngest dashboard or `inngest.send`. */
export const marketplaceHealthPing = inngest.createFunction(
  { id: 'marketplace-health-ping', name: 'Marketplace health ping' },
  { event: 'marketplace/health.ping' },
  async ({ event }) => {
    return {
      ok: true,
      portal: 'web',
      at: new Date().toISOString(),
      source: event.data?.source ?? 'unknown',
    };
  },
);

export const inngestFunctions = [refreshTrendScores, marketplaceHealthPing];
