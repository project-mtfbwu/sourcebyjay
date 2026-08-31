# SourceByJay — Project Master Plan

**Last updated:** 2026-08-24  
**Vision:** Fully functional **Alibaba alternative for India** with **international export buyers** — not a thin MVP.  
**Repo:** [project-mtfbwu/sourcebyjay](https://github.com/project-mtfbwu/sourcebyjay)  
**Stack:** Next.js 16 + Supabase · pnpm Turborepo monorepo

This document consolidates everything discussed: implementation phases, OSS references, locked decisions, specs added, current build status, and gaps we might still miss before go-live.

---

## Table of contents

1. [North star & go-live bar](#1-north-star--go-live-bar)
2. [Current status](#2-current-status)
3. [Architecture](#3-architecture)
4. [Phase map (full order)](#4-phase-map-full-order)
5. [Phase summaries](#5-phase-summaries)
6. [Locked decisions](#6-locked-decisions)
7. [Feature specs (deep dives)](#7-feature-specs-deep-dives)
8. [Reference repos — steal like an artist](#8-reference-repos--steal-like-an-artist)
9. [Alibaba & IndiaMART parallels](#9-alibaba--indiamart-parallels)
10. [What we added (planning changelog)](#10-what-we-added-planning-changelog)
11. [What’s built in code (so far)](#11-whats-built-in-code-so-far)
12. [What we might still miss](#12-what-we-might-still-miss)
13. [Agent workflow rules](#13-agent-workflow-rules)
14. [Skills & doc index](#14-skills--doc-index)
15. [Go-live checklist](#15-go-live-checklist)
16. [Timeline & git](#16-timeline--git)

---

## 1. North star & go-live bar

| Item | Detail |
|------|--------|
| **Product** | B2B marketplace + search engine for sourcing manufacturers/suppliers |
| **Primary market** | India buyers (domestic + import sourcing) |
| **Revenue abroad** | International buyers — USD checkout, intl languages, Export vendor tier |
| **UX reference** | Alibaba.com layout & flows; IndiaMART field/compliance patterns |
| **Strategy** | **Reference-first** — name a GitHub/OSS repo before writing new feature code |
| **Go-live bar** | Phases **S0, 1–15, and 17** complete + user **GO** on visual demo each phase |
| **Not blocking pilot** | Phase 16 (Figma token sync) |

---

## 2. Current status

| Field | Value |
|-------|-------|
| **Current phase** | **1** — Trust & supplier media (`in_progress`) |
| **Completed** | Phase 0 (Foundation), Phase S0 (Security — code done; manual items remain) |
| **Next after Phase 1 GO** | Phase 2 (Three portals) |
| **Phase state file** | `.agents/skills/sourcebyjay-phase-tracker/phase-state.json` |
| **Roadmap version** | `2026-08-24-guarantee-i18n-plans` |

### S0 manual items still open

- [ ] Push CI/CodeQL/CodeRabbit workflows to GitHub
- [ ] Branch protection on `main`
- [ ] Docker + apply schema migrations locally
- [ ] Production Supabase project + env separation
- [ ] 2FA on GitHub, Supabase, Vercel

---

## 3. Architecture

### Three portals · one Supabase backend

| Portal | Domain | App | Users |
|--------|--------|-----|-------|
| **Buyer** | `sourcebyjay.com` | `apps/web` | Buyers, customers |
| **Vendor** | `sell.sourcebyjay.com` | `apps/vendor` | Manufacturers, listers |
| **Ops** | `ops.sourcebyjay.com` | `apps/ops` | Staff (super_admin → viewer) |

**Shared packages:** `packages/ui`, `packages/types`, `packages/auth`

**Data layers:**

| Layer | Client | Use |
|-------|--------|-----|
| Public reads | `createSupabaseAnonServerClient` + `"use cache"` | Search, product, supplier pages |
| User writes | Cookie Supabase client | RFQ, profile, listings |
| Ops writes | Staff-checked server actions | Approvals, audit |

**Schema workflow:** Edit `apps/database/supabase/schemas/*.sql` → `supabase db diff -f <name>` — **never hand-edit migrations**.

---

## 4. Phase map (full order)

```
DONE  0   Foundation storefront
DONE* S0  Security hardening (*manual items)
 →    1   Trust & supplier media              ← CURRENT
      2   Three portals + buyer account
     17   Vendor listing plans (Free → Enterprise)
      3   B2B orders + samples
      4   Multi-supplier RFQ
      5   Chat
      6   Reviews, requests, favorites, compare
      7   Search engine (products + suppliers + facets)
      8   AI + image search
      9   SourceByJay Guarantee + disputes
     10   Payments + commission + plan subscriptions
     11   Logistics / freight
     12   Global i18n + INR/GST/HS codes
     13   Ad campaigns (Google-style CPC)
     14   Video & rich supplier media
     15   Infrastructure & GO-LIVE
     16   Figma polish (optional before pilot)
```

**Estimated timeline (solo, part-time):** ~9–13 months to go-live bar.

---

## 5. Phase summaries

| Phase | Name | One-line goal |
|-------|------|---------------|
| **S0** | Security | RLS, CI/CodeQL, headers, rate limits, legal pages, prod separation |
| **1** | Trust & media | Gold badge, factory gallery, certificates, home personalization |
| **2** | Three portals | Split web/vendor/ops; buyer GSTIN profile; move seller CMS |
| **17** | Listing plans | Free → Enterprise; listing caps; rank boost; Guarantee eligibility |
| **3** | Orders + samples | RFQ → quote → order; sample/trial order path |
| **4** | Multi-supplier RFQ | One RFQ → many vendors; anti-spam; buyer trust tier |
| **5** | Chat | Realtime buyer ↔ seller; linked to inquiry/order |
| **6** | Social + tools | Reviews, listing requests, favorites, supplier compare |
| **7** | Search engine | Product + supplier modes; facets; autocomplete; rank; analytics |
| **8** | AI search | pgvector semantic + image search; hybrid fallback |
| **9** | SourceByJay Guarantee | Escrow, badge, search filter, disputes (Alibaba TA parallel) |
| **10** | Payments | Stripe Connect; 5% commission; plan billing; Guarantee escrow |
| **11** | Logistics | Freight quotes; FOB/CIF; India pincode zones |
| **12** | Global i18n | Indian + intl languages; INR/USD; GSTIN; HS codes |
| **13** | Ad campaigns | Google-style CPC; sponsored search; vendor + ops manage |
| **14** | Video media | Factory video tours on supplier profile |
| **15** | Go-live infra | Prod deploy, Inngest jobs, PostHog, Sentry, email |
| **16** | Figma | Design tokens from built UI |

**Full task lists:** [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

## 6. Locked decisions

### Stack & process

- **Next.js 16 + Supabase only** — do not migrate to Medusa/Refine as primary stack
- **Reference-first gate** — no greenfield features without naming primary OSS repo
- **Visual gate** — GO / HOLD / CHANGE after each phase demo; user decision is final
- **Commits/push** — only when user asks

### Product

| Topic | Locked choice |
|-------|---------------|
| Buyer protection | **SourceByJay Guarantee** (not “trade assurance”) |
| Guarantee rule | On-platform pay only (Stripe escrow) |
| Guarantee eligibility | Pro+ listing plan or ops override |
| Platform commission | **5% default**, min 5%, per-vendor at ops onboarding |
| Homepage recs | **60%** personal (past searches) + **40%** trending |
| Past searches | localStorage (anon) → DB sync Phase 7 |
| Vendor plans | Free (5 listings) → Starter ₹9,999 → Pro ₹29,999 (Guarantee) → Business → Export → Enterprise |
| Ad model | Google-style campaigns; **CPC** billing; vendor self-service + ops assist |
| Languages | en + hi launch; 8+ Indian; 12+ international (Phase 12 waves) |
| Currency | INR (India), USD (international buyers) |
| Figma | Phase 16 — build first, design second |

**Full locked doc:** [.agents/skills/sourcebyjay-architecture/references/DECISIONS.md](.agents/skills/sourcebyjay-architecture/references/DECISIONS.md)

---

## 7. Feature specs (deep dives)

| Feature | Spec file |
|---------|-----------|
| Alibaba feature map | [.agents/skills/sourcebyjay-architecture/references/alibaba-parallels.md](.agents/skills/sourcebyjay-architecture/references/alibaba-parallels.md) |
| MVP gap analysis | [.agents/skills/sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md](.agents/skills/sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md) |
| SourceByJay Guarantee | [.agents/skills/sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md](.agents/skills/sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |
| Vendor listing plans | [.agents/skills/sourcebyjay-b2b-workflows/references/vendor-listing-plans.md](.agents/skills/sourcebyjay-b2b-workflows/references/vendor-listing-plans.md) |
| Ad campaigns (CPC) | [.agents/skills/sourcebyjay-b2b-workflows/references/ad-campaigns.md](.agents/skills/sourcebyjay-b2b-workflows/references/ad-campaigns.md) |
| Global i18n | [.agents/skills/sourcebyjay-b2b-workflows/references/i18n-languages.md](.agents/skills/sourcebyjay-b2b-workflows/references/i18n-languages.md) |
| Homepage personalization | [.agents/skills/sourcebyjay-b2b-workflows/references/homepage-personalization.md](.agents/skills/sourcebyjay-b2b-workflows/references/homepage-personalization.md) |
| Platform commission | [.agents/skills/sourcebyjay-payments/references/commission.md](.agents/skills/sourcebyjay-payments/references/commission.md) |
| Reference gate checklist | [.agents/skills/sourcebyjay-reference-repos/references/feature-reference-checklist.md](.agents/skills/sourcebyjay-reference-repos/references/feature-reference-checklist.md) |

---

## 8. Reference repos — steal like an artist

**Rule:** Read patterns from these repos. Implement in **Next.js + Supabase**. Do not adopt their stack.

### By domain

| Feature / need | Primary reference | Also see |
|----------------|-------------------|----------|
| Starter / auth / Supabase | [Nextbase](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | This repo |
| Order lifecycle | [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) | Next.js + Supabase |
| Marketplace vendor/admin | [Mercur](https://github.com/mercurjs/mercur) | Medusa admin |
| B2B quote/order states | [Medusa B2B recipes](https://docs.medusajs.com/resources/recipes/b2b) | — |
| Search routing | [vercel/commerce](https://github.com/vercel/commerce) | — |
| Search filters (URL) | [nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa) | Alibaba sidebar UX |
| Supplier search | Mercur | Alibaba Find Manufacturers |
| Autocomplete UI | [Algolia InstantSearch](https://github.com/algolia/instantsearch) | UI only |
| Postgres FTS | [Supabase FTS guide](https://supabase.com/docs/guides/database/full-text-search) | `pg_trgm` |
| AI / vector search | [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search) | Supabase vector |
| Chat | [Supabase Realtime demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) | — |
| Ops admin + RBAC UI | [Refine](https://github.com/refinedev/refine) | Mercur admin |
| SourceByJay Guarantee | [Alibaba Trade Assurance](https://buyer.alibaba.com/page/tradeassurance/buyer/story.html) | Mercur disputes |
| Vendor listing plans | IndiaMART MDC / TrustSEAL / Maximiser | Alibaba Gold Supplier |
| Global i18n | [next-intl](https://github.com/amannn/next-intl) | Medusa regions |
| Ad campaigns (CPC) | [Google Ads campaign docs](https://support.google.com/google-ads/answer/6324971) | Mercur promotions |
| Payments + commission | [Stripe Connect](https://stripe.com/docs/connect) | commission.md |
| Application fees | [Stripe marketplace fees](https://stripe.com/docs/connect/marketplace/tasks/app-fees) | — |
| Background jobs | [Inngest](https://github.com/inngest/inngest-js) | Supabase Edge |
| Analytics | [PostHog](https://github.com/PostHog/posthog) | Plausible |
| Error monitoring | [Sentry Next.js](https://github.com/getsentry/sentry-javascript) | — |
| Video media | [Mux examples](https://github.com/muxinc/examples) | Cloudflare Stream |
| Search at scale (later) | [Meilisearch](https://github.com/meilisearch/meilisearch) | Typesense |
| Trust / verification | Mercur verification | Alibaba supplier page |
| Favorites / wishlist | vercel/commerce | — |
| India compliance fields | IndiaMART listing UX | GSTIN validation |
| UX layout | Alibaba.com | Figma Phase 16 |

### License caution

| Safe to learn (MIT/Apache) | Avoid verbatim copy |
|----------------------------|---------------------|
| Mercur, Medusa, Refine, vercel/commerce, Supabase examples | AGPL forks (e.g. some market-fe) |

### Reference-first gate (before any new code)

```
[ ] Feature named
[ ] Primary GitHub repo opened (README + 1–2 key files)
[ ] What we steal vs skip listed
[ ] Row added to sourcebyjay-reference-repos/SKILL.md
[ ] Spec linked from IMPLEMENTATION or references/*.md
```

---

## 9. Alibaba & IndiaMART parallels

### Alibaba → SourceByJay

| Alibaba | SourceByJay | Phase |
|---------|-------------|-------|
| Trade Assurance | **SourceByJay Guarantee** | 9 + 10 |
| Gold / Verified Supplier | Verified / Gold / Assessed tiers | 1–2 |
| Find Manufacturers | Supplier search mode | 7 |
| RFQ marketplace | Multi-supplier RFQ | 4 |
| Message Center | Chat | 5 |
| Sample orders | Sample order type | 3 |
| Search facets + TA filter | Full facets + Guarantee filter | 7 |
| Sponsored listings | CPC ad campaigns | 13 |
| Paid seller membership | Listing plans | 17 |
| AI / smart search | AI Mode + image search | 8 |

### IndiaMART → SourceByJay plans (MVP targets)

| IndiaMART (approx.) | SourceByJay plan | Our INR/yr target |
|---------------------|------------------|-------------------|
| Free listing | **Free** | ₹0 (5 listings) |
| MDC ~₹35,000 | **Starter** | ₹9,999 |
| TrustSEAL Pro ~₹60,000 | **Pro** (+ Guarantee) | ₹29,999 |
| Maximiser ~₹85,000 | **Business** | ₹59,999 |
| Verified Exporter ₹1.1L+ | **Export** | ₹99,999 |
| IM Star / Leader | **Enterprise** | Custom (ops) |

**Full parallel index:** [alibaba-parallels.md](.agents/skills/sourcebyjay-architecture/references/alibaba-parallels.md)

---

## 10. What we added (planning changelog)

Chronological summary of what was recharted and locked in this project discussion:

| Date / session | Addition |
|----------------|----------|
| Foundation | Buyer storefront, mock data, RFQ, basic search, admin verify |
| Phase S0 | Security headers, rate limits, legal pages, CI/CodeQL/CodeRabbit, staff/audit schemas |
| Phase 1 | Gold verification, factory gallery, certificates, search gold filter |
| Reference-first gate | Mandatory OSS reference before new features; feature-reference-checklist |
| Homepage personalization | Past searches + 60/40 personal/trending grid; search_events schema |
| Commission model | 5% default platform fee; ops onboarding; super_admin below-min |
| **Full MVP rechart** | Expanded from ~8 phases to **S0–16 + 17**; Alibaba-for-India go-live bar |
| Search gaps | Supplier search, facets, autocomplete, ranking, analytics → Phase 7–8 |
| Marketplace gaps | Samples, multi-RFQ, favorites, compare, logistics, video → Phases 3–14 |
| Infrastructure gaps | Jobs, PostHog, Sentry, prod pipeline → Phase 15 |
| **Ad campaigns** | Google-style CPC; vendor default + ops assist → Phase 13 |
| **SourceByJay Guarantee** | Branded Trade Assurance; listing/search/order/dispute segments → Phase 9 |
| **Vendor listing plans** | Free → Enterprise; IndiaMART-style monetization → Phase 17 |
| **Global i18n** | 8+ Indian + 12+ intl languages; INR/USD segments → Phase 12 |
| **Alibaba parallels doc** | Feature-by-feature mapping for reference-first builds |

---

## 11. What’s built in code (so far)

*May be uncommitted — verify with `git status` before Mac migration.*

| Area | Status | Key paths |
|------|--------|-----------|
| Storefront | ✅ Phase 0 | `apps/web/src/app/(external-pages)/` |
| Search + filters | ✅ Basic | `search/page.tsx`, `SearchFilters.tsx` |
| RFQ / inquiries | ✅ Basic | inquiries server actions |
| Security headers | ✅ S0 | `apps/web/next.config.ts` |
| Rate limiting | ✅ S0 | `apps/web/src/lib/rate-limit.ts` |
| Legal pages | ✅ S0 | `/privacy`, `/terms` |
| CI/CodeQL/e2e config | ✅ Local | `.github/workflows/` |
| Trust media UI | 🔄 Phase 1 | `VerificationBadge.tsx`, gallery tabs |
| Trust schema | 📝 Schema | `schemas/marketplace_trust_media.sql` |
| Personalization | 🔄 Partial | `search-history.ts`, `home-recommendations.ts`, `RecentSearches.tsx` |
| Personalization schema | 📝 Schema | `schemas/marketplace_personalization.sql` |
| Commission schema | 📝 Schema | `schemas/marketplace_vendor_commission.sql` |
| Security schema | 📝 Schema | `schemas/marketplace_security.sql` |
| Vendor / ops apps | ❌ Phase 2 | Not split yet |
| Guarantee, plans, i18n, ads | 📋 Spec only | references/*.md |

---

## 12. What we might still miss

Items **not yet in the phase plan** but common on Alibaba/IndiaMART or needed for scale. Review before declaring “complete”:

### High priority (consider adding before or soon after go-live)

| Gap | Why it matters | Suggested phase / note |
|-----|----------------|------------------------|
| **UPI / Razorpay** | India buyers expect UPI; Stripe India coverage | Evaluate alongside Stripe Phase 10 |
| **WhatsApp notifications** | RFQ/chat in India run on WhatsApp | Phase 15+ integration; keep chat in-app for Guarantee |
| **Vendor KYC / document verify** | GSTIN, PAN, bank proof before payouts | Extend Phase 2 onboarding |
| **E-invoice / GST invoice generation** | B2B India compliance on orders | Post Phase 10 |
| **Bulk listing CSV upload** | Vendors with 100+ SKUs | Phase 2 vendor app |
| **Response rate / reply SLA metrics** | Alibaba shows response rate on profiles | Phase 6 supplier metrics |
| **Third-party on-site verification** | Alibaba “Verified Supplier” audit | Phase 1+ partner (SGS-style) — costly |
| **Legal terms for Guarantee** | Enforceable buyer protection policy | Before Phase 9 go-live |
| **Mobile-responsive PWA** | Buyers on phone | Continuous; smoke test each phase |
| **Off-platform pay warning** | Guarantee void if pay outside app | Phase 9 UX |

### Medium priority (post-MVP or Phase 15+)

| Gap | Notes |
|-----|-------|
| Buyer BNPL / credit lines | B2B net-30 — complex |
| ERP / API for enterprise buyers | Webhooks, REST API |
| Machine translation for listings | Beyond manual hi/en fields |
| Retargeting / display ads (CPM) | Phase 13 is CPC search only |
| Referral / affiliate program | Growth |
| Live factory tour (livestream) | Beyond recorded video Phase 14 |
| Certificate OCR verify (ISO) | Trust automation |
| Multi-warehouse / inventory sync | Vendor ERP |
| Customs / import duty calculator | Beyond HS code |
| Native mobile apps | iOS/Android — far future |
| Seller mobile app | Vendor on-the-go |

### Infrastructure / ops

| Gap | Notes |
|-----|-------|
| **Docker migrations on dev machine** | Schemas written but not all applied locally |
| **Push uncommitted work to GitHub** | Before Mac migration |
| **Branch protection + prod Supabase** | S0 manual |
| **Load testing search + RFQ** | Phase 15 |
| **Disaster recovery / backup runbook** | Phase 15 |
| **Content moderation at scale** | Phase 6 + ops headcount |
| **Fraud ML (fake RFQ, fake vendors)** | PostHog rules first, ML later |

### Explicitly deferred (by design)

| Item | Reason |
|------|--------|
| Medusa/Refine as primary stack | Locked — patterns only |
| Figma before build | Phase 16 after UI exists |
| Live Stripe until legal GO | Phase 10 user approval |
| Meilisearch day one | Postgres FTS until scale requires escape hatch |

---

## 13. Agent workflow rules

1. Read `phase-state.json` + [DECISIONS.md](.agents/skills/sourcebyjay-architecture/references/DECISIONS.md) at session start
2. Implement **current phase only** unless user redirects
3. **Reference gate** before new features ([checklist](.agents/skills/sourcebyjay-reference-repos/references/feature-reference-checklist.md))
4. **Schema first** → `supabase db diff` — never hand-edit migrations
5. RLS on every table; enforce RBAC in server + RLS, not UI alone
6. Run typecheck/lint/tests before visual demo
7. Output Phase Review Card; wait for **GO / HOLD / CHANGE**
8. Commit/push **only when user asks**

---

## 14. Skills & doc index

All skills live in **`.agents/skills/`** only (never duplicate to `.cursor` / `.codex`).

| Skill | Purpose |
|-------|---------|
| `sourcebyjay-phase-tracker` | Phase order, GO gates, phase-state.json |
| `sourcebyjay-architecture` | Three portals, where code lives |
| `sourcebyjay-reference-repos` | **Mandatory** OSS reference index |
| `sourcebyjay-b2b-workflows` | RFQ, orders, guarantee, plans, ads |
| `sourcebyjay-trust-media` | Gold badge, gallery, video |
| `sourcebyjay-ops-rbac` | Staff roles, audit, permissions |
| `sourcebyjay-payments` | Stripe Connect, commission |
| `sourcebyjay-security-review` | Pre-demo security checklist |
| `sourcebyjay-visual-demo` | Mandatory visual review |
| `sourcebyjay-ci-quality` | CI, Playwright, CodeQL |
| `sourcebyjay-figma-handoff` | Phase 16 design tokens |
| `supabase-schema-migrations` | DB workflow |
| `nextjs-cache-components` | PPR, anon cached reads |

**Index:** [.agents/skills/README.md](.agents/skills/README.md)

### Key project docs

| Doc | Path |
|-----|------|
| **This master plan** | `PROJECT-MASTER-PLAN.md` |
| Implementation phases (detailed) | `IMPLEMENTATION.md` |
| Agent rules | `AGENTS.md` |
| Security policy | `SECURITY.md` |
| Phase state | `.agents/skills/sourcebyjay-phase-tracker/phase-state.json` |

---

## 15. Go-live checklist

All required before India/international pilot launch:

- [ ] S0 security + prod Supabase + 2FA + branch protection
- [ ] Gold verification + gallery approval workflow
- [ ] Three portals on DNS (web, sell, ops)
- [ ] **Vendor plans:** Free + paid tiers; listing caps enforced
- [ ] RFQ → multi-supplier quote → order → sample path
- [ ] Chat + reviews + listing requests + favorites + compare
- [ ] Product + supplier search; facets; autocomplete; sponsored CPC
- [ ] AI + image search modes
- [ ] **SourceByJay Guarantee:** badge, filter, escrow pay, disputes
- [ ] Stripe: orders + 5% commission + plan subscriptions
- [ ] Freight estimates + incoterms
- [ ] **Languages:** en + hi minimum; intl roadmap started; INR/USD
- [ ] GSTIN + HS codes on profiles/products
- [ ] Ad campaigns: vendor self-service + ops assist
- [ ] Video on supplier profiles
- [ ] PostHog + Sentry + Inngest jobs + CI green on `main`

---

## 16. Timeline & git

### Rough timeline (solo, part-time)

| Block | Phases | Duration |
|-------|--------|----------|
| Trust + portals + plans | S0–2, 17 | ~7–9 weeks |
| Trade loop | 3–6 | ~10 weeks |
| Search | 7–8 | ~5 weeks |
| Money + guarantee + logistics | 9–11 | ~7 weeks |
| i18n + ads + video | 12–14 | ~6 weeks |
| Go-live infra | 15 | ~2 weeks |

**Total:** ~9–13 months to go-live bar.

### Git remotes

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/project-mtfbwu/sourcebyjay.git |
| `upstream` | Nextbase starter (updates only) |

### Deployment milestones

| Milestone | When |
|-----------|------|
| Push S0 workflows | End of S0 |
| `sell.*` + `ops.*` DNS | Phase 2 |
| Production Supabase + Vercel | Phase 15 (prep in S0) |
| Stripe live | Phase 10 + legal GO |
| **MVP launch** | Phase 15 + 17 GO |

---

*Steal like an artist — reference first, build in Next.js + Supabase, ship phase by phase with your GO.*
