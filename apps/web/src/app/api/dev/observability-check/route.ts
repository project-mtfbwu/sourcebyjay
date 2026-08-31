import { observabilityStatus } from '@sourcebyjay/observability';
import { connection } from 'next/server';
import { NextResponse } from 'next/server';

/** Dev-only: shows which Phase 15 integrations have env keys set. */
export async function GET() {
  await connection();
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    portal: 'web',
    observability: observabilityStatus(),
    hint: 'Set keys in .env.local, redeploy/restart, then search once to test PostHog.',
  });
}
