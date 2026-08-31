import { AnalyticsEvents } from '@sourcebyjay/observability';
import { captureAnalyticsEvent } from '@sourcebyjay/observability/posthog';

const STORAGE_KEY = 'sbj:search-history';
const MAX_ITEMS = 8;

/** Anonymous past searches — Phase 1 localStorage only. */

function normalize(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function readSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map(normalize)
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function recordSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const term = normalize(query);
  if (term.length < 2) return;
  const next = [term, ...readSearchHistory().filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(
    0,
    MAX_ITEMS,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  captureAnalyticsEvent(AnalyticsEvents.searchSubmitted, { query: term });
}
