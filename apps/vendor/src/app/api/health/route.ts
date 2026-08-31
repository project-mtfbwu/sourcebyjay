import { observabilityStatus } from '@sourcebyjay/observability';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    portal: 'vendor',
    at: new Date().toISOString(),
    observability: observabilityStatus(),
  });
}
