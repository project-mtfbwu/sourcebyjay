import { observabilityStatus } from '@sourcebyjay/observability';
import { connection } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  await connection();
  return NextResponse.json({
    ok: true,
    portal: 'web',
    at: new Date().toISOString(),
    observability: observabilityStatus(),
  });
}
