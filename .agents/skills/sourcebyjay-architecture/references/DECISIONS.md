# SourceByJay — Locked Decisions

**Status:** Final. Do not revisit without explicit user request.

Agents must follow these when implementing any phase.

---

## Stack & strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary stack | Next.js 16 + Supabase | User requirement; Nextbase starter base |
| Do NOT migrate to | Medusa, Refine, Directus as primary | Steal patterns only; build in our stack |
| Monorepo | pnpm + Turborepo | From Nextbase starter |
| Reference approach | Copy workflows/schema ideas from OSS | See `sourcebyjay-reference-repos` skill |
| **Reference-first gate** | **No new feature without naming primary GitHub/OSS reference** | Checklist: `sourcebyjay-reference-repos/references/feature-reference-checklist.md` |

---

## Product vision

| Decision | Choice |
|----------|--------|
| **North star** | **Fully functional Alibaba alternative for India** + **international export buyers** |
| Go-live bar | Phases **S0 through 15** + **17** (see `ALIBABA-INDIA-MVP.md`) |
| Buyer protection brand | **SourceByJay Guarantee** (not “trade assurance”) — Alibaba TA parallel |
| India-first | INR primary, Indian languages, GSTIN + HS codes |
| Global-ready | 12+ international languages, USD checkout, Export vendor tier |
| Vendor monetization | **Free → Enterprise listing plans** (IndiaMART-style, lower entry price) |
| Alibaba mapping | [alibaba-parallels.md](alibaba-parallels.md) |

## Branding & UX

| Decision | Choice |
|----------|--------|
| Layout reference | Alibaba.com B2B marketplace patterns |
| India UX reference | IndiaMART field patterns (compliance), Alibaba layout |
| Brand | SourceByJay — green `#76EE59`, Roboto (storefront), Inter (dashboard) |
| **Seller portal look (locked 2026-08-29)** | **Polished / cute product UI** — soft cards, rounded panels, green accents, intentional empty states. **Not** bare workable HTML/CSS or third-party skins that fight the CRM (e.g. Cubone purple). |
| Figma timing | **Build first, Figma Phase 16** — polish; not blocking India pilot |
| Initial scope (Phase 0) | Full buyer flow with mock data → Supabase fallback |

---

## Architecture

| Decision | Choice |
|----------|--------|
| Portals | 3 apps: `apps/web` (buyer), `apps/vendor` (seller), `apps/ops` (staff) |
| Domains | `sourcebyjay.com`, `sell.sourcebyjay.com`, `ops.sourcebyjay.com` |
| Backend | One Supabase project for all portals |
| **Buyer vs seller identity** | **Entirely separate profiles** — do **not** “upgrade” a buyer into a seller on the same profile. Optional **link later** for admin / shared analytics only. |
| **Portal auth cookies** | **Separate cookie names** per app (`sb-sbj-buyer-auth` / `sb-sbj-seller-auth` / `sb-sbj-ops-auth`) so localhost ports (and future subdomains) never share one session. Amazon.com ≠ Seller Central. |
| **Multi-supplier RFQ (Phase 4)** | **Model A** — buyer selects 2–20 suppliers from search (slider + cart) → one broadcast RFQ. Open “notice board” posting = Phase 6 request listing. Favorites multi-send = Phase 6. |
| **Phase 6 favorites / compare / reviews / request listing** | Alibaba Favorites heart + batch Contact; compare tray max 4 (local); verified reviews only on `orders.status=completed`; `/request-listing` public board + vendor offers. Heart = **circular overlay top-right of product image** (PDP gallery + home/search cards) — not a CTA pill. |
| **Phase 7 search engine** | Alibaba tabs **Products \| Suppliers**; left facets in URL; typeahead; search-within; relevance rank (tier + sold); Guarantee facet stub (real Phase 9); home Trending chips from sold_count. |
| Seller CMS location | Temporary in `apps/web` until Phase 2 vendor app ships — then **remove** from buyer app |
| Form fields | Scout Amazon Biz IN + Seller Central + IndiaMART + Alibaba; **ops can toggle fields on/off** later for full control |
| Public data layer | `createSupabaseAnonServerClient` + `"use cache"` — no cookies on public pages |
| Auth on public pages | Client-side only where needed (e.g. InquiryDialog login check) |

---

## Security (Phase S0)

| Decision | Choice |
|----------|--------|
| RLS | Required on every table |
| Staff RBAC | `super_admin`, `admin`, `manager`, `viewer` via `staff_members` |
| Audit | `audit_logs` for ops actions |
| Rate limiting | RFQ/inquiries + auth endpoints |
| Security headers | `next.config.ts` |
| Legal pages | `/privacy`, `/terms` with footer links |
| CI scanning | CodeQL + Dependabot + CodeRabbit |
| Schema workflow | `schemas/*.sql` → `supabase db diff` — never hand-edit migrations |
| Copilot subscription | **Not required** for CI/CodeQL/CodeRabbit |

---

## Delivery process

| Decision | Choice |
|----------|--------|
| Phase order | S0 → 1 → 2 → **17** → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 (GO-LIVE) → 16 (Figma) |
| Gap doc | [ALIBABA-INDIA-MVP.md](ALIBABA-INDIA-MVP.md) · [alibaba-parallels.md](alibaba-parallels.md) |
| Visual gate | Mandatory Phase Review Card after each phase |
| User authority | **GO / HOLD / CHANGE is final** — agent never auto-advances |
| Pre-code gate | **Cursor × Jay Vomit Protocol** — Mermaid + scout proposal → Owner **APPROVE** before implementation |
| Commits | Only when user asks |
| Push | Only when user asks |
| Founder experience | Beginner: some coding, no large project yet (verbatim in beginner-eli5 skill) |
| Manual steps | Always ELI5: What / Why / How / How to process |
| Local containers on this Mac | **Colima** + Docker CLI — not Docker Desktop |

---

## Homepage personalization (locked)

| Decision | Choice |
|----------|--------|
| Past searches | Shown on home hero; stored in localStorage (anon), DB in Phase 7 |
| Recommendations | **60%** personal (past searches) + **40%** platform trending |
| New visitors | Trending-only until first search |
| Global trends | “Frequently searched” cards + `product_trend_scores` (Phase 7) |

Spec: `sourcebyjay-b2b-workflows/references/homepage-personalization.md`

## Payments (Phase 10 — Stripe deferred)

| Decision | Choice |
|----------|--------|
| **Until Stripe** | **Fake payment slab (Phase 3+)** — UI says TEST MODE; no real money; buyer/ops click “Mark paid (test)” |
| Why | Avoid Stripe bottlenecks while testing RFQ → order → status flows |
| Provider (later) | Stripe Connect — swap `payments.provider` from `fake` → `stripe` |
| Card storage | Never — Stripe handles PCI when live |
| Platform commission | **5% default**, min 5%, snapshotted on order at confirm |
| Below 5% | super_admin only, or staff with delegated permission |
| Fee collection (live) | Stripe `application_fee_amount` |
| Go-live Stripe | Requires explicit Owner approval + legal terms |

Implementation references: **Stripe Connect marketplace docs** (primary when Phase 10), Mercur + Medusa marketplace recipe (patterns only). See `sourcebyjay-payments/references/commission.md`.

---

## Chat (Phase 5 done · Phase 5B planned — locked)

| Decision | Choice |
|----------|--------|
| Engine | **Supabase Postgres + Realtime** — same auth/RLS as rest of stack |
| **Not using (MVP or 5B)** | Stream Chat React, Sendbird UIKit — deferred unless scale/mobile forces revisit |
| Phase 5 (done) | Text messages, drawer on product, buyer inbox, vendor `/messages` |
| Phase 5B (post go-live) | Alibaba Message Center UX: sidebar, quick questions, product pin, attachments, seller PWA/push |
| Timing | **After Phase 15 GO-LIVE** — not in MVP bar |
| Spec | `sourcebyjay-b2b-workflows/references/chat-ux-parity.md` |

---

## Supplier factory mini-site (Phase 18 — locked)

| Decision | Choice |
|----------|--------|
| Alibaba parallel | `{company}.m.alibaba.com` — factory storefront linked from PDP **company card** |
| MVP route | Upgrade `/suppliers/[slug]` + `?productId=` context from product detail |
| Business+ | Optional `/factory/{slug}` or `{slug}.sourcebyjay.com` (subdomain = scout at implement) |
| Data | Existing `suppliers`, `products`, `supplier_gallery`, certificates — no new chat engine |
| Timing | **Before GO-LIVE recommended** (included in `goLivePhases`) |
| Spec | `sourcebyjay-b2b-workflows/references/supplier-factory-minisite.md` |

---

## Ad campaigns (Phase 13 — locked)

| Decision | Choice |
|----------|--------|
| Model | **Google-style** campaigns: campaign → ad group → keywords → creatives |
| Billing | **CPC (cost per click)** — charge on sponsored result click, not impression-only |
| Sponsored placement | Top slots in **search results** (+ optional home/category); **“Sponsored”** disclosure |
| **Default manager** | **Vendor portal** — manufacturer/lister creates and runs own campaigns |
| **Ops assist** | manager+ creates/edits campaigns **on behalf of** vendor when team helps; audit logged |
| Wallet | Prepaid **ad wallet** (INR); top-up via Stripe (Phase 10) or ops credit |
| Spec | `sourcebyjay-b2b-workflows/references/ad-campaigns.md` |

---

## SourceByJay Guarantee (Phase 9 — locked)

| Decision | Choice |
|----------|--------|
| Brand name | **SourceByJay Guarantee** (buyer-facing) |
| Parallel | Alibaba Trade Assurance — escrow, quality, on-time ship, 30-day disputes |
| On-platform pay only | Protection applies when paying through SourceByJay (Stripe) |
| Eligibility | **Pro+ listing plan** (Phase 17) or ops override |
| Segments | Listing badge · search filter · order escrow · dispute mediation · intl USD orders |
| Spec | `sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md` |

---

## Vendor listing plans (Phase 17 — locked)

| Decision | Choice |
|----------|--------|
| Model | Free + paid tiers (IndiaMART-style; lower entry than MDC ~₹35k) |
| Default | **Free** — 5 listings, no Guarantee |
| Paid | Starter ₹9,999 → Pro ₹29,999 (Guarantee) → Business → Export → Enterprise |
| Unlocks | Listing caps, search rank boost, RFQ lead quota, Guarantee, ad wallet bonus |
| Billing | Stripe Billing (Phase 10) + ops manual comp |
| Spec | `sourcebyjay-b2b-workflows/references/vendor-listing-plans.md` |

---

## Global i18n (Phase 12 — locked)

| Decision | Choice |
|----------|--------|
| Stack | next-intl, locale in URL |
| Wave 1 | English + Hindi |
| Wave 2 | Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi |
| Wave 3 | Arabic, Chinese, French, Spanish, Portuguese, German, Japanese, Korean, + more |
| Currency segment | INR (India locales), USD default for international buyers |
| Spec | `sourcebyjay-b2b-workflows/references/i18n-languages.md` |

---

## Media storage (Phase 14 · Cloudflare migration later — locked)

| Decision | Choice |
|----------|--------|
| **North star** | **Cloudflare** serves buyer-facing **images + video blobs**; **Supabase Postgres** keeps **metadata only** (URLs, moderation, plan gates, provider IDs) |
| Phase 14 MVP blobs | Supabase Storage `supplier-media` bucket (jpeg/png/webp + mp4/webm, 50MB cap) |
| Phase 14 MVP metadata | `supplier_gallery` + `supplier_media_*` + `product_media`; product gallery max **7** mixed photos/videos |
| Phase 14 playback | HTML5 `<video>` + lightbox |
| **Upload source (locked)** | **Self-upload to Supabase Storage only** — no YouTube/external URL paste |
| **File browser UX (locked 2026-08-29)** | **[`chonky2`](https://www.npmjs.com/package/chonky2)** (React 19 fork of [Chonky](https://chonky.io/)) — Finder-like: list/grid, thumbnails, search, sort, filter, DnD, keyboard, toolbar. **Not** Cubone (dropped — broke CRM skin). **Not** SVAR for this phase. |
| **Where it lives** | Same page for listing edit, factory gallery, and `/media` — **never** bounce sellers elsewhere to upload |
| **Look & feel (locked)** | **Polished / cute product UI** — soft cards, green SourceByJay accents, rounded panels, clear empty states. **Forbidden:** raw “workable HTML/CSS”, unstyled forms, purple Cubone defaults fighting the CRM shell |
| **Upload + reorder** | Chonky file actions + our `/api/media/upload` / `/api/gallery/upload`; [dnd-kit](https://dndkit.com/) for listing gallery strip order |
| **Ops moderation** | Approve / reject / **flag** / **archive** |
| **Not MVP** | Mux, Cloudflare Stream SDK, live/360/VR |
| Migration phase | After Phase 15 or dedicated media phase → Cloudflare blobs; Supabase metadata only |
| Spec | `sourcebyjay-vomit-protocol/references/SCOUT-PHASE-14-VIDEO.md` |

---

## Git

| Remote | URL |
|--------|-----|
| `origin` | `project-mtfbwu/sourcebyjay` |
| `upstream` | `imbhargav5/nextbase-nextjs-supabase-starter` |

CI runs on `project-mtfbwu/sourcebyjay` (not upstream repo name).

---

## Skills location

All project skills in `.agents/skills/` only. Index: [README.md](../../README.md).

Never duplicate to `.cursor`, `.codex`, or `.claude`.
