# SourceByJay — Alibaba-for-India MVP roadmap

**Vision:** Fully functional B2B marketplace + search engine for **India-first** sourcing with **international buyer** revenue — Alibaba alternative.  
**Go-live bar:** Phases **S0 through 15** + **17** complete. No launch with known gaps.  
**Strategy:** Steal like an artist — [reference-repos](../../sourcebyjay-reference-repos/SKILL.md) · [alibaba-parallels.md](alibaba-parallels.md)

---

## Gap analysis → phase mapping

### Search engine gaps

| Gap | Phase | Primary reference |
|-----|-------|-------------------|
| Supplier / manufacturer search mode | **7** | Mercur, Alibaba Find Manufacturers |
| Deep B2B facets + **Guarantee filter** | **7** | nextjs-starter-medusa, Alibaba sidebar |
| Autocomplete / typeahead | **7** | vercel/commerce, Algolia InstantSearch (UI) |
| Ranking (personal + trend + tier + plan boost + sponsored) | **7** | Mercur, vendor plan `rank_boost_bps` |
| AI + image search | **8** | nextjs-openai-doc-search |

### Marketplace gaps

| Gap | Phase | Primary reference |
|-----|-------|-------------------|
| **SourceByJay Guarantee** (Trade Assurance) | **9 + 10** | Alibaba TA, Stripe escrow |
| **Vendor listing plans** (Free → paid) | **17** | IndiaMART MDC/TrustSEAL, Alibaba Gold |
| Multi-supplier RFQ | **4** | Alibaba RFQ |
| Logistics / freight | **11** | Medusa fulfillment |
| **Global i18n** (Indian + intl languages) | **12** | next-intl, Alibaba language picker |
| Ad campaigns (CPC + hybrid) | **13** | Google Ads, Mercur, Amazon SP |
| **Message Center UX + seller PWA** | **5B** (post go-live) | Alibaba Message Center, Supabase Realtime |
| Video / factory media | **14** | Mux, Phase 1 gallery |
| **Factory mini-site** (Alibaba company storefront) | **18** | PDP company card → `/suppliers` or `/factory/{slug}` |

### Infrastructure gaps

| Gap | Phase | Reference |
|-----|-------|-----------|
| Prod stack, jobs, analytics | **15** | Inngest, PostHog, Sentry |

---

## Master phase map

```
DONE  0   Foundation storefront
DONE* S0  Security hardening (*manual items remain)
 →    1   Trust & supplier media          ← CURRENT
      2   Three portals + buyer account
     17   Vendor listing plans (Free → Enterprise)  ← after 2
      3   B2B orders + samples
      4   Multi-supplier RFQ
      5   Chat
      6   Reviews, favorites, compare
      7   Search engine (Alibaba-grade)
      8   AI + image search
      9   SourceByJay Guarantee + disputes
     10   Payments + commission + subscriptions
     11   Logistics / freight
     12   Global i18n + INR/GST/HS
     13   Ad campaigns (CPC + hybrid)
     14   Video media
     18   Supplier factory mini-site (Alibaba company page)
     15   Infrastructure GO-LIVE
     5B   Chat UX parity + seller PWA/notifications  ← POST go-live
     16   Figma polish
```

**MVP launch = S0 + 1–15 + 17.**

---

## Alibaba parallels (summary)

Full map: [alibaba-parallels.md](alibaba-parallels.md)

| Alibaba | SourceByJay |
|---------|-------------|
| Trade Assurance | **SourceByJay Guarantee** |
| Gold / Verified Supplier | Verified / Gold / Assessed tiers |
| Paid seller membership | **Phase 17 listing plans** |
| Find Manufacturers | Supplier search mode |
| RFQ marketplace | Multi-supplier RFQ |
| Message Center | Chat (Phase 5) · **full UX (Phase 5B, post go-live)** |
| Factory mini-site | Supplier profile (Phase 1) · **Alibaba company storefront (Phase 18)** |
| Sponsored listings | CPC ad campaigns (Phase 13) |

---

## India + international defaults

| Area | Default |
|------|---------|
| Primary market | India buyers + **export buyers abroad** |
| Languages | en + hi launch; 8+ Indian; 12+ international (Phase 12) |
| Currency | INR (India), USD (international), toggle on product |
| Vendor monetization | Free tier + paid plans (undercut IndiaMART entry) |
| Buyer protection | **SourceByJay Guarantee** on Pro+ vendor plans |

---

## Key specs

| Topic | Doc |
|-------|-----|
| Guarantee segments | [sourcebyjay-guarantee.md](../../sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |
| Vendor plans | [vendor-listing-plans.md](../../sourcebyjay-b2b-workflows/references/vendor-listing-plans.md) |
| Languages | [i18n-languages.md](../../sourcebyjay-b2b-workflows/references/i18n-languages.md) |
| Ad campaigns | [ad-campaigns.md](../../sourcebyjay-b2b-workflows/references/ad-campaigns.md) |
| Chat UX parity (5B) | [chat-ux-parity.md](../../sourcebyjay-b2b-workflows/references/chat-ux-parity.md) |
| Factory mini-site (18) | [supplier-factory-minisite.md](../../sourcebyjay-b2b-workflows/references/supplier-factory-minisite.md) |

---

## MVP go-live checklist

- [ ] S0 security + prod Supabase
- [ ] Gold verification + gallery workflow
- [ ] Three portals on DNS
- [ ] **Vendor plans:** Free + paid tiers + listing caps
- [ ] RFQ → multi-supplier → order → sample
- [ ] **SourceByJay Guarantee** badge + filter + escrow pay + disputes
- [ ] Stripe orders + plan subscriptions + 5% commission
- [ ] Search (products + suppliers) + facets + sponsored CPC
- [ ] **en + hi** + intl language roadmap started
- [ ] GST/HS compliance fields
- [ ] PostHog + jobs + CI green

---

## Time estimate (solo, part-time)

**~9–13 months** to full go-live bar (added Phase 17 + expanded 9/12).

