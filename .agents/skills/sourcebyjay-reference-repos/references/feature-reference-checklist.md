# Feature reference checklist

**Before writing new feature code**, complete this checklist. No greenfield invention when OSS already solved it.

## Gate (mandatory)

```
[ ] Feature named (e.g. "multi-supplier RFQ broadcast")
[ ] Primary GitHub repo opened and skimmed (README + 1–2 key files)
[ ] Secondary reference noted (if any)
[ ] What we steal listed (schema / UI / algorithm / API shape)
[ ] What we skip listed (their ORM, auth, deployment, stack migration)
[ ] Entry added to sourcebyjay-reference-repos/SKILL.md "By feature" table
[ ] Phase noted in IMPLEMENTATION.md or feature spec
```

If no suitable OSS exists, document **why** in the feature spec before building.

---

## Search engine (Phase 7–8)

| What | Primary reference | Steal | Our target |
|------|-------------------|-------|------------|
| Search → URL routing | [vercel/commerce](https://github.com/vercel/commerce) | Form → `/search?q=` + mode | `SearchBar.tsx` |
| Filters in URL | [nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa) | `searchParams` facets | `SearchFilters.tsx` |
| **Supplier search mode** | Mercur, Alibaba manufacturers | Separate index + tab | `/search?mode=suppliers` |
| Autocomplete | Algolia InstantSearch (UI) | Debounced suggestions dropdown | search RPC |
| Postgres FTS | Supabase FTS docs | `search_vector`, `websearch` | `marketplace.ts` |
| Synonyms / fuzzy | `pg_trgm` extension | Trigram fallback | Phase 7 migration |
| Ranking formula | Mercur | tier + trend + quality + sponsored weight | rank RPC |
| Trending pipeline | Mercur, PostHog | `product_trend_scores` job | Inngest Phase 15 |
| Search analytics | PostHog | `search_events` table | Phase 7 |
| AI / semantic (Phase 8) | [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search) | pgvector RPC + hybrid | Phase 8 |
| Image search (Phase 8) | Supabase vector + CLIP | Image embedding match | Phase 8 |
| Home personalization | vercel/commerce, Mercur | 60/40 merge | `home-recommendations.ts` |
| Recent searches | Alibaba UX, localStorage pattern | Chip row | `RecentSearches.tsx` |

---

## Marketplace (Phases 3–6, 9–14)

| What | Primary reference | Steal | Phase |
|------|-------------------|-------|-------|
| Quote → order flow | Medusa B2B, Ruang Usaha Kita | Status machine | 3 |
| **Sample orders** | Medusa B2B | `order_type=sample`, low MOQ | 3 |
| **Multi-supplier RFQ** | Alibaba RFQ, Medusa quote groups | `inquiry_suppliers` junction | 4 |
| Buyer verification / anti-spam | Rate limits + buyer tier | Broadcast caps | 4 |
| Chat | Supabase Realtime demo + **Alibaba Message Center UX** (on-page right panel; inbox for history) | RLS channels + drawer | 5 · **5B** full sidebar/quick Q/attachments/PWA |
| Verified reviews | Ruang Usaha Kita | `verified_order_id` | 6 |
| Listing requests | Mercur offers | Buyer post + vendor bid | 6 |
| **Favorites** | vercel/commerce wishlist | `buyer_favorites` table | 6 |
| **Supplier compare** | Alibaba compare (UX) | Compare tray max 4 | 6 |
| **Factory mini-site** | Alibaba `{company}.m.alibaba.com` from PDP company card | Enhanced `/suppliers/[slug]` + `/factory/{slug}` Business+ | 18 |
| **SourceByJay Guarantee** | Alibaba Trade Assurance | Badge, filter, escrow, disputes | [sourcebyjay-guarantee.md](../../sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |
| **Vendor listing plans** | IndiaMART MDC/TrustSEAL | Free → Enterprise tiers | 17 |
| **Global i18n** | next-intl, i18n-languages.md | 8+ Indian + 12+ intl locales | 12 |
| **Disputes** | Mercur returns | Ops mediation queue | 9 |
| **Freight / incoterms** | Medusa fulfillment | `shipping_quotes`, FOB/CIF | 11 |
| **INR + GSTIN + HS code** | IndiaMART fields | Profile + product columns | 12 |
| **Promoted listings / hybrid ad engine (CPC + CPM + sponsorship)** | [Google Ads campaign docs](https://support.google.com/google-ads/answer/6324971), Mercur campaigns, Amazon SP/SD UX, Alibaba KWA | Campaign → keywords → placements; fake wallet + ad invoices | 13 · [SCOUT-PHASE-13-ADS.md](../../sourcebyjay-vomit-protocol/references/SCOUT-PHASE-13-ADS.md) |
| **Video gallery** | Mux Next.js examples (processing pattern) · **Cloudflare Stream** (blob target) | `media_provider`, `cdn_asset_id` at migration | 14 · post-15 |
| Payments + 5% commission | Stripe Connect, commission.md | `application_fee_amount` | 10 |

---

## Infrastructure (Phases S0, 15)

| What | Primary reference | Steal | Phase |
|------|-------------------|-------|-------|
| RLS + security | Supabase docs, SECURITY.md | Policy patterns | S0 |
| Background jobs | Inngest | Cron + event handlers | 15 |
| Analytics | PostHog | Search + funnel events | 15 |
| Error tracking | Sentry Next.js | Server + client | 15 |
| Email | Resend | Transactional templates | 15 |
| CDN / images | Vercel Image | Remote patterns | 15 |
| Search scale path | Meilisearch docs | Migration guide when FTS limits hit | 15 |

---

## When implementing any new feature

1. Read this file + [SKILL.md](../SKILL.md)
2. Grep GitHub: `"nextjs" "supabase" <feature>` or ask in spec
3. Prefer **same-stack** refs first (Next.js + Supabase)
4. Add row to SKILL.md before PR / visual demo
5. Cross-check [ALIBABA-INDIA-MVP.md](../../sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md) — is this gap covered?

## License reminder

| OK to read & adapt patterns | Avoid verbatim copy |
|------------------------------|---------------------|
| MIT, Apache 2.0 | AGPL (e.g. some market-fe forks) |
| Supabase examples | — |
