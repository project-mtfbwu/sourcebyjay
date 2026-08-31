import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { isGroqConfigured, rewriteSearchWithGroq } from '@/lib/groq-search';

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const limited = rateLimit(`ai-search:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many AI searches. Try again later.' }, { status: 429 });
  }

  let body: { query?: string };
  try {
    body = (await req.json()) as { query?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = String(body.query ?? '').trim();
  if (query.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  const plan = await rewriteSearchWithGroq(query);
  return NextResponse.json({
    configured: isGroqConfigured(),
    original: query,
    q: plan.q,
    moq: plan.moq,
    minPrice: plan.minPrice,
    maxPrice: plan.maxPrice,
    country: plan.country,
    mode: plan.mode,
    fallback: plan.fallback ?? false,
    // Do not expose provider error strings to the browser
  });
}
