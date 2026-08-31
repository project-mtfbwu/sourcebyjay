/** Split a buyer/AI search string into tokens for AND matching. */
export function searchTokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
    .slice(0, 8);
}

/**
 * True when every token appears somewhere in the haystack.
 * So "wireless earbuds" matches "Wireless Bluetooth Earbuds OEM".
 */
export function matchesSearchText(haystack: string, q: string): boolean {
  const tokens = searchTokens(q);
  if (!tokens.length) return true;
  const hay = haystack.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}
