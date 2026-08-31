import { NextResponse } from 'next/server';
import { suggestSearch } from '@/data/anon/marketplace';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const suggestions = await suggestSearch(q, 8);
  return NextResponse.json({ suggestions });
}
