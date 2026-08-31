import { observabilityStatus } from '@sourcebyjay/observability';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Dev-only: shows which Phase 15 integrations have env keys set. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    portal: 'web',
    observability: observabilityStatus(),
    hint: 'Set keys in .env.local, redeploy/restart, then search once to test PostHog.',
  });
}
