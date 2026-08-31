import { observabilityStatus } from '@sourcebyjay/observability';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    portal: 'web',
    at: new Date().toISOString(),
    observability: observabilityStatus(),
  });
}
