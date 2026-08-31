---
name: sourcebyjay-reference-repos
description: >-
  Reference open-source repos to steal patterns for SourceByJay without changing
  stack. Use BEFORE implementing any feature (search, personalization, orders,
  admin, chat, logistics, ads). Mandatory gate — do not build from zero when OSS exists.
---

# SourceByJay Reference Repos

**Rule:** Steal schema ideas, workflows, and UI patterns. Implement in **Next.js + Supabase**. Do not migrate to Medusa/Refine as primary stack.

**Vision:** Alibaba alternative for India — full MVP go-live bar in [ALIBABA-INDIA-MVP.md](../sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md).

**User rule (locked):** Every feature must name at least one **primary GitHub reference** before code is written. See [feature-reference-checklist.md](references/feature-reference-checklist.md).

## Workflow (mandatory before coding)

```
1. Name the feature (e.g. multi-supplier RFQ)
2. Open primary reference repo(s) below — skim README + 1–2 key files
3. List: what we steal vs what we skip (their auth/ORM/deploy)
4. Add/update row in "By feature" table if new
5. Link from feature spec or IMPLEMENTATION.md phase
6. Implement in our schema + apps
```

If no OSS fit exists, document **why** in the feature spec before building.

## By feature

| Feature | Primary reference | Also see |
|---------|-------------------|----------|
| Starter/auth/Supabase | [Nextbase upstream](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | This repo |
| **Search bar + query routing** | [vercel/commerce](https://github.com/vercel/commerce) | nextjs-starter-medusa |
| **Search filters (URL params)** | [nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa) | Alibaba UX |
| **Supplier / manufacturer search** | [Mercur](https://github.com/mercurjs/mercur) | Alibaba manufacturers tab |
| **Autocomplete / typeahead** | [Algolia InstantSearch](https://github.com/algolia/instantsearch) (UI only) | vercel/commerce |
| **Search ranking + trending** | Mercur, Medusa product ranking | `product_trend_scores`, PostHog |
| **Past searches + home recs** | Mercur + Alibaba UX | [checklist](references/feature-reference-checklist.md) |
| Postgres full-text search | [Supabase FTS guide](https://supabase.com/docs/guides/database/full-text-search) | `pg_trgm` synonyms |
| AI / hybrid search (Phase 8) | [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search) | Supabase vector guide |
| Image / visual search | Supabase vector + OpenAI CLIP patterns | nextjs-openai-doc-search |
| Order lifecycle, dashboards | [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) | — |
| **Sample / trial orders** | [Medusa B2B](https://docs.medusajs.com/resources/recipes/b2b) | Mercur |
| **Multi-supplier RFQ** | Alibaba RFQ (UX), Medusa B2B quote groups | Mercur offers |
| Marketplace vendor/admin | [Mercur](https://github.com/mercurjs/mercur) | Medusa admin |
| B2B quote/order states | [Medusa B2B](https://docs.medusajs.com/resources/recipes/b2b) | community medusa-marketplace |
| **Trade assurance + disputes** | Alibaba Trade Assurance (UX) | Mercur returns/disputes |
| **Logistics / freight** | [Medusa fulfillment](https://docs.medusajs.com/resources/commerce-modules/fulfillment) | Flexport API (future) |
| **Favorites / wishlist** | [vercel/commerce](https://github.com/vercel/commerce) | — |
| **Supplier compare** | Alibaba compare (UX) | Refine data tables |
| Ops CRUD + RBAC UI | [Refine](https://github.com/refinedev/refine) | Directus roles |
| Chat | [Supabase Realtime demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) · Alibaba Message Center UX (Phase 5B) | — |
| **SourceByJay Guarantee** | [Alibaba Trade Assurance](https://buyer.alibaba.com/page/tradeassurance/buyer/story.html) | Escrow, badge, dispute | [sourcebyjay-guarantee.md](../sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |
| **Vendor listing plans** | IndiaMART MDC/TrustSEAL, Alibaba Gold | Free → paid tiers | [vendor-listing-plans.md](../sourcebyjay-b2b-workflows/references/vendor-listing-plans.md) |
| **Global i18n** | [next-intl](https://github.com/amannn/next-intl) | Indian + intl locales | [i18n-languages.md](../sourcebyjay-b2b-workflows/references/i18n-languages.md) |
| **Alibaba feature map** | alibaba.com (UX/docs) | Full parallel index | [alibaba-parallels.md](../sourcebyjay-architecture/references/alibaba-parallels.md) |
| **India GST / HS codes** | IndiaMART listing fields (UX) | GSTIN validation libs |
| **Ad campaigns (CPC, sponsored search)** | [Google Ads](https://support.google.com/google-ads/answer/6324971), Mercur promotions | Campaign/keywords/CPC wallet | [ad-campaigns.md](../sourcebyjay-b2b-workflows/references/ad-campaigns.md) |
| **Video supplier media** | [Mux Next.js](https://github.com/muxinc/examples) | Cloudflare Stream |
| **Background jobs** | [Inngest](https://github.com/inngest/inngest-js) | Trigger.dev, Supabase Edge |
| **Analytics** | [PostHog](https://github.com/PostHog/posthog) | Plausible |
| **Error monitoring** | [Sentry Next.js](https://github.com/getsentry/sentry-javascript) | — |
| **Search at scale (later)** | [Meilisearch](https://github.com/meilisearch/meilisearch) | Typesense |
| Seller Central layout | Amazon Seller Central (UX) | Mercur vendor panel |
| Alibaba UX | alibaba.com (layout only) | Figma refs |
| Payments | [Stripe Connect docs](https://stripe.com/docs/connect) | Stripe India |
| Platform commission | [Stripe application fees](https://stripe.com/docs/connect/marketplace/tasks/app-fees) | commission.md |
| Trust / verification | Mercur verification | Alibaba supplier page · **factory mini-site (Phase 18)** |

## Same-stack (copy freely)

- Ruang Usaha Kita — Next.js + Supabase
- Supabase official examples
- Nextbase patterns in this repo

## Patterns only (do not adopt stack)

- Mercur, Medusa, Spree, Refine, Directus, Strapi, vercel/commerce (different backend)

## License caution

| Repo | License | Note |
|------|---------|------|
| Mercur, Medusa, Refine, vercel/commerce | MIT/Apache | Safe to learn |
| MOMM market-fe | AGPL v3 | Do not copy code verbatim |

## Phase → reference map

| Phase | Open first |
|-------|------------|
| S0 | SECURITY.md, Supabase RLS docs |
| 1 | Mercur verification, Alibaba supplier UI |
| 2 | Ruang Usaha Kita, Refine, Seller Central, Mercur onboarding |
| 17 | IndiaMART MDC/TrustSEAL pricing pages, vendor-listing-plans.md |
| 3 | Mercur, Medusa B2B samples, Ruang Usaha Kita |
| 4 | Alibaba RFQ, Medusa B2B quote groups |
| 5 | Supabase Realtime demo |
| 6 | Ruang Usaha Kita reviews, vercel/commerce wishlist, Alibaba compare |
| 7 | vercel/commerce, nextjs-starter-medusa, Mercur filters, PostHog |
| 8 | nextjs-openai-doc-search, feature-reference-checklist |
| 9 | Alibaba Trade Assurance, sourcebyjay-guarantee.md, Mercur disputes |
| 10 | Stripe Connect + application fees, commission.md |
| 11 | Medusa fulfillment, India pincode zones |
| 12 | next-intl, i18n-languages.md, IndiaMART fields, Alibaba language UX |
| 13 | Mercur promotions, Google Ads campaign/CPC docs, ad-campaigns.md |
| 14 | Mux examples, trust-media skill |
| 15 | Inngest, PostHog, Sentry, Vercel deploy docs |
| 16 | Built app screenshots → Figma |

## Agent reminder

When user asks for a **new capability**, respond with:

1. Primary reference repo link(s)
2. What we'll steal
3. Then implement

Never skip step 1–2.
