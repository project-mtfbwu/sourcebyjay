/**
 * Groq helpers for Phase 8 AI Mode + image search.
 * Query rewrite / vision→keywords → existing FTS.
 *
 * Prefer plain keyword replies (no JSON mode) — compound models are flaky with JSON.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? 'groq/compound-mini';
export const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL ?? 'qwen/qwen3.6-27b';

export type AiSearchPlan = {
  q: string;
  moq?: number;
  minPrice?: number;
  maxPrice?: number;
  country?: string;
  mode?: 'products' | 'suppliers';
  fallback?: boolean;
  reason?: string;
};

function getApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key || null;
}

export function isGroqConfigured(): boolean {
  return Boolean(getApiKey());
}

async function groqChat(params: {
  model: string;
  messages: Array<Record<string, unknown>>;
  maxTokens?: number;
}): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: 0.1,
      max_completion_tokens: params.maxTokens ?? 80,
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Groq HTTP ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty Groq response');
  return content;
}

/** Pull usable search keywords from free-form or JSON-ish model output. */
export function extractKeywords(text: string, fallback: string): string {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<think>[\s\S]*?<\/think>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .trim();

  // Prefer explicit "q" field if present
  const qMatch = cleaned.match(/"q"\s*:\s*"([^"]{2,120})"/i);
  if (qMatch?.[1]) return qMatch[1].trim();

  const singleQ = cleaned.match(/'q'\s*:\s*'([^']{2,120})'/i);
  if (singleQ?.[1]) return singleQ[1].trim();

  // Strip JSON wrapper leftovers
  let line = cleaned
    .replace(/^[^{\n]*\{[\s\S]*?"q"\s*:\s*"/i, '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length >= 2 && !/^[{[]/.test(l) && !/^(here|sure|okay|json)/i.test(l));

  if (!line) {
    line = cleaned.split('\n').map((l) => l.trim()).find((l) => l.length >= 2) ?? '';
  }

  // Remove quotes / JSON punctuation
  line = line
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[{}\[\]"]/g, ' ')
    .replace(/\bmode\s*:\s*products\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Drop leading labels
  line = line.replace(/^(keywords?|query|search)\s*[:\-]\s*/i, '').trim();

  if (line.length >= 2 && line.length <= 120) return line;
  return fallback.trim().slice(0, 120);
}

function extractMoq(raw: string): number | undefined {
  const m = raw.match(/\bmoq\s*(?:under|<=|≤|of|:)?\s*(\d{1,6})\b/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Natural language → marketplace search plan for FTS */
export async function rewriteSearchWithGroq(rawQuery: string): Promise<AiSearchPlan> {
  const q = rawQuery.trim();
  if (!q) return { q: '', fallback: true, reason: 'empty' };

  if (!isGroqConfigured()) {
    return { q, fallback: true, reason: 'no_api_key' };
  }

  const moq = extractMoq(q);

  try {
    const content = await groqChat({
      model: GROQ_TEXT_MODEL,
      maxTokens: 40,
      messages: [
        {
          role: 'system',
          content:
            'Extract product search keywords for a B2B marketplace. ' +
            'Reply with ONLY the keywords (2-6 words). No JSON, no punctuation labels, no sentences. ' +
            'Example: input "wireless earbuds MOQ under 100 for a boutique" → wireless earbuds',
        },
        { role: 'user', content: q },
      ],
    });

    const keywords = extractKeywords(content, q);
    const plan: AiSearchPlan = {
      q: keywords,
      mode: 'products',
    };
    if (moq) plan.moq = moq;
    return plan;
  } catch {
    // Still searchable — use buyer's original text
    const plan: AiSearchPlan = { q, mode: 'products', fallback: true, reason: 'groq_error' };
    if (moq) plan.moq = moq;
    return plan;
  }
}

/** Image → keyword query for FTS */
export async function imageToSearchQueryWithGroq(imageDataUrl: string): Promise<AiSearchPlan> {
  if (!isGroqConfigured()) {
    return { q: '', fallback: true, reason: 'no_api_key' };
  }

  try {
    const content = await groqChat({
      model: GROQ_VISION_MODEL,
      maxTokens: 40,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'What product is in this photo for wholesale sourcing? ' +
                'Reply with ONLY 3-6 English product keywords. No JSON, no sentences.',
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    });

    const keywords = extractKeywords(content, '');
    if (!keywords) {
      return { q: '', fallback: true, reason: 'empty_keywords' };
    }
    return { q: keywords, mode: 'products' };
  } catch {
    return { q: '', fallback: true, reason: 'groq_error' };
  }
}
