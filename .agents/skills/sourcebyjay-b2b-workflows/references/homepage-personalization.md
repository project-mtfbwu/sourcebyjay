# Homepage personalization



**Locked:** Home product grid and search hero reflect **past searches + platform trends**, not a static slice.



**Reference-first:** See [feature-reference-checklist.md](../../sourcebyjay-reference-repos/references/feature-reference-checklist.md) — implemented only after mapping OSS prior art.



## Primary references (GitHub / UX)



| Reference | What we stole | Our implementation |

|-----------|---------------|-------------------|

| [vercel/commerce](https://github.com/vercel/commerce) | Search form → navigate with query param | `SearchBar.tsx` |

| [nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa) | Filter state via URL `searchParams` | `search/page.tsx` |

| [Mercur](https://github.com/mercurjs/mercur) | Marketplace trending / featured products | `trendScore()`, Phase 7 `product_trend_scores` |

| Alibaba.com (UX) | Recent searches chips, “Recommended for you” row | `RecentSearches.tsx`, `PersonalizedProductGrid.tsx` |

| [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search) | Phase 8: semantic boost on personal match | Phase 8 hybrid search |



## UX



| Area | Behavior |

|------|----------|

| Hero | **Your recent searches** — clickable chips (last 8, deduped) |

| Home grid | **Recommended for your business** — mixed feed (see mix ratio) |

| Category “Frequently searched” | Platform **trends** (global hot terms) — unchanged |

| Empty state (new visitor) | 100% trending until first search |



## Mix ratio



```

personalScore = match products to user's past search terms + categories

trendScore    = platform trending (sold count, search volume, ops boosts)



finalGrid = 60% personal picks + 40% trending (dedupe by product id, fill to 8)

```



Adjust weights in `apps/web/src/lib/home-recommendations.ts` (`PERSONAL_WEIGHT`).



## Storage



| User | Past searches | Phase |

|------|---------------|-------|

| Anonymous | `localStorage` key `sbj:search-history` | **Now (Phase 1)** |

| Logged-in buyer | `search_events` table + merge with local on login | Phase 7 |



Schema (Phase 7): `apps/database/supabase/schemas/marketplace_personalization.sql`



## Recording searches



- `SearchBar` on submit → `recordSearch(query)`

- Search results page can also record when `q` param present (optional later)



## Privacy



- No PII in search history — query strings only

- RLS: buyer sees only own `search_events`

- Rate limit search recording (same bucket as RFQ limits spirit)



## Phase map



| Phase | Work |

|-------|------|

| 1 (now) | localStorage + client mix + home UI |

| 6 | `search_events`, trending RPC, optional embedding boost |

| 6+ | Logged-in sync, cross-device history |


