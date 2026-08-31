import type { Category, Product } from '@/types/marketplace';

export const PERSONAL_WEIGHT = 0.6;
export const HOME_GRID_SIZE = 8;

function personalScore(product: Product, queries: string[], categories: Category[]): number {
  if (queries.length === 0) return 0;
  const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? '';
  const haystack = `${product.title} ${product.description} ${categoryName}`.toLowerCase();
  let score = 0;
  for (const query of queries) {
    const tokens = query.toLowerCase().split(/\s+/).filter((token) => token.length > 1);
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2;
    }
  }
  return score;
}

function trendScore(product: Product): number {
  return product.soldCount ?? 0;
}

/**
 * 60% products matching past searches + 40% platform trending.
 * New visitors (no history) get trending only.
 * Primary refs: Mercur featured mix + Alibaba home recs.
 */
export function recommendHomeProducts(
  products: Product[],
  queries: string[],
  categories: Category[],
): Product[] {
  const published = products.filter((product) => product.status === 'published');
  const byTrend = [...published].sort((a, b) => trendScore(b) - trendScore(a));

  if (queries.length === 0) {
    return byTrend.slice(0, HOME_GRID_SIZE);
  }

  const byPersonal = [...published]
    .map((product) => ({ product, score: personalScore(product, queries, categories) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.product);

  const personalCount = Math.round(HOME_GRID_SIZE * PERSONAL_WEIGHT);
  const picked: Product[] = [];
  const seen = new Set<string>();

  for (const product of byPersonal) {
    if (picked.length >= personalCount) break;
    seen.add(product.id);
    picked.push(product);
  }

  for (const product of byTrend) {
    if (picked.length >= HOME_GRID_SIZE) break;
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    picked.push(product);
  }

  for (const product of published) {
    if (picked.length >= HOME_GRID_SIZE) break;
    if (seen.has(product.id)) continue;
    picked.push(product);
  }

  return picked;
}
