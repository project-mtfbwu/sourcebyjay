import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { imageToSearchQueryWithGroq, isGroqConfigured } from '@/lib/groq-search';

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — keep base64 payload reasonable for Groq

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const limited = rateLimit(`image-search:${ip}`, 12, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many image searches. Try again later.' }, { status: 429 });
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        fallback: true,
        reason: 'no_api_key',
        error: 'Image search needs GROQ_API_KEY. Falling back unavailable without a description.',
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Choose an image file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 4MB' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'image/jpeg';
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;

  const plan = await imageToSearchQueryWithGroq(dataUrl);
  if (!plan.q) {
    return NextResponse.json(
      {
        configured: true,
        fallback: true,
        error: 'Could not read that image. Try another photo or use keyword search.',
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    configured: true,
    q: plan.q,
    mode: plan.mode ?? 'products',
    fallback: plan.fallback ?? false,
  });
}
