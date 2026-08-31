/** Local fallback when product/listing images are missing or blocked. */
export const MARKETPLACE_PLACEHOLDER_IMAGE = '/mockups/placeholder.jpeg';

const BLOCKED_IMAGE_HOSTS = new Set(['images.unsplash.com', 'unsplash.com']);

/** Normalize image URLs for next/image — blocks removed hosts and empty values. */
export function safeMarketplaceImageSrc(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return '';

  if (trimmed.startsWith('/')) return trimmed;

  try {
    const { hostname } = new URL(trimmed);
    if (BLOCKED_IMAGE_HOSTS.has(hostname)) return MARKETPLACE_PLACEHOLDER_IMAGE;
  } catch {
    return MARKETPLACE_PLACEHOLDER_IMAGE;
  }

  return trimmed;
}
