# Alibaba.com parallels → SourceByJay phases

**Purpose:** Map Alibaba B2B patterns to our MVP so we steal deliberately, not accidentally.  
**India competitor:** IndiaMART subscription tiers mapped in [vendor-listing-plans.md](../../sourcebyjay-b2b-workflows/references/vendor-listing-plans.md).

Sources: [Alibaba Trade Assurance](https://buyer.alibaba.com/page/tradeassurance/buyer/story.html) · [How sourcing works](https://buyer.alibaba.com/page/HowItWorks/Page.html) · [Verified Supplier](https://seller.alibaba.com/verified_supplier) · IndiaMART MDC / TrustSEAL docs.

---

## Buyer-side parallels

| Alibaba feature | What it does | SourceByJay equivalent | Phase |
|-----------------|--------------|------------------------|-------|
| **Trade Assurance** | Escrow payment, quality + on-time ship protection, 30-day dispute window; free for buyers | **SourceByJay Guarantee** — pay on-platform only; escrow via Stripe; dispute mediation | **9 + 10** |
| **Trade Assurance filter** | Search filter for protected suppliers only | Facet `guarantee_eligible=true` | **7** |
| **Trade Assurance badge** | Icon on listing / supplier | Guarantee shield on product + supplier cards | **9** |
| **Verified Supplier** | Third-party on-site audit, assessment report | Gold / **Assessed** tier + factory gallery + certs | **1** |
| **Gold Supplier** | Paid verified business registration | **Verified** tier (ops-approved GSTIN/company) | **1–2** |
| **Find Manufacturers** | Supplier/manufacturer search mode | `/search?mode=suppliers` | **7** |
| **RFQ (Request for Quotation)** | Post need → multiple suppliers quote | Multi-supplier RFQ broadcast | **4** |
| **Compare suppliers** | Side-by-side MOQ, certs, response | Compare tray (max 4) | **6** |
| **Message Center** | In-platform chat (required for TA protection) | Realtime chat linked to inquiry/order | **5** · full Alibaba UX **5B** |
| **Sample order** | Small qty before bulk | `order_type=sample` | **3** |
| **Search facets** | Country, cert, TA, min order, supplier type | Full B2B sidebar facets | **7** |
| **Sponsored / ads** | Promoted product rows | CPC ad campaigns + Sponsored label | **13** |
| **AI / smart search** | Natural language discovery | AI Mode + image search | **8** |
| **Multi-currency / international** | USD, global buyers | INR default + USD/EUR display; intl languages | **12** |
| **Reviews (verified transaction)** | Post-order reviews only | Verified purchase reviews | **6** |
| **Logistics / shipping terms** | FOB, CIF on quotes | Freight quotes + incoterms | **11** |

---

## Seller-side parallels

| Alibaba feature | What it does | SourceByJay equivalent | Phase |
|-----------------|--------------|------------------------|-------|
| **Seller membership tiers** | Paid visibility + features | **Vendor listing plans** (Free → Enterprise) | **17** |
| **Trade Assurance supplier** | Opt-in; escrow; more buyer trust | Guarantee-eligible vendors (Pro+ plans) | **9 + 17** |
| **Verified Supplier program** | Premium audit + traffic boost | Gold/Assessed + higher search rank weight | **1 + 7** |
| **Storefront / mini-site** | `{company}.m.alibaba.com` factory page from PDP | `/suppliers/[slug]` today → **Phase 18** full mini-site + Business+ `/factory/{slug}` | **18** (1 + 14 base done) |
| **Response rate / years on platform** | Trust metrics on profile | `response_rate`, `member_since` on supplier | **6 + 7** |
| **Quote on RFQ** | Respond to buyer RFQs | Vendor RFQ inbox | **4** |
| **Product listing limits** | Tier-based catalog size | Plan `max_listings` | **17** |
| **Promoted listings** | Pay for visibility | `/advertising` CPC campaigns | **13** |

---

## IndiaMART parallels (pricing / trust)

| IndiaMART plan | ~Price (INR/yr) | SourceByJay plan | Our MVP positioning |
|----------------|-----------------|------------------|---------------------|
| Free listing | ₹0 | **Free** | Onboard vendors; capped listings |
| MDC (Mini Dynamic Catalog) | ~₹35,000 | **Starter** | More listings + basic rank boost |
| TrustSEAL Pro | ~₹60,000 | **Pro** | Trust badge + **Guarantee eligible** + RFQ leads |
| Maximiser Pro | ~₹85,000 | **Business** | Higher rank + mini-site + video |
| Verified Exporter | ₹1.1L+ | **Export** | Intl buyer features + multi-currency highlight |
| IM Star / Leader | Custom | **Enterprise** | Ops-assigned; max visibility |

**Strategy:** Undercut IndiaMART on entry tiers for India; match Alibaba on **Guarantee + international buyer** experience.

---

## Phase 10A rehearsal (fake money — no Stripe yet)

| Alibaba | SourceByJay 10A |
|---------|-----------------|
| Pay **on platform** only for Trade Assurance | Fake pay on SBJ → always **escrow held** |
| Funds held until confirm / dispute window | `escrow_status=held` + ledger row |
| Unpaid → cancel | `cancel_unpaid_order` |
| Paid → apply for refund | `return_escrow_to_buyer` → `buyer_fake_credits` |
| Order / payment document | `order_invoices` + `/account/orders/[id]/invoice` |
| Stripe Connect | **Phase 10B** (later) |

Scout shots: `alibaba-p10-trade-assurance-peace.png`, `alibaba-p10-pay-trade-assurance-order.png`


| Dimension | Alibaba | SourceByJay Guarantee |
|-----------|---------|----------------------|
| Buyer cost | Free | Free |
| Protection scope | Quality, on-time ship, payment | Same + India GST invoice dispute add-on |
| Requires on-platform pay | Yes | Yes (Stripe Connect escrow) |
| Dispute window | 30 days post-delivery | 30 days (configurable in ops) |
| Supplier eligibility | Gold + opt-in TA | **Pro+ listing plan** or ops grant |
| Search filter | “Trade Assurance” | **“SourceByJay Guarantee”** facet |
| Segments | Product + supplier level | Product, supplier, **order** segments — see [sourcebyjay-guarantee.md](../../sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |

---

## Segments to build (user-requested)

### 1. Payment segments
- Pay on-platform (Guarantee-eligible) vs off-platform (no protection)
- INR domestic vs international (USD/EUR) checkout
- Milestone/deposit vs full payment
- Phase **10** payments + Phase **9** guarantee linkage

### 2. SourceByJay Guarantee segments
- **Listing segment:** badge on eligible products/suppliers
- **Search segment:** filter + boosted trust in rank
- **Order segment:** escrow hold until delivery confirm
- **Dispute segment:** ops mediation queue
- **Plan segment:** only Pro+ vendors default eligible (ops override)

### Phase 10A rehearsal (fake money — Stripe = 10B)

| Alibaba Trade Assurance | SourceByJay 10A |
|-------------------------|-----------------|
| Pay **on platform** only | Fake pay on SBJ → always **escrow held** |
| Funds held until confirm | `escrow_status=held` + ledger |
| Unpaid → cancel | `cancel_unpaid_order` |
| Paid → apply for refund | `return_escrow_to_buyer` → buyer fake credits |
| Payment / order document | `order_invoices` + invoice page |
| Real card / bank rails | **Phase 10B Stripe** |

Scout: `alibaba-p10-trade-assurance-peace.png`, `alibaba-p10-pay-trade-assurance-order.png`

### 3. Language segments
- **India:** Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi (rollout waves)
- **International:** Arabic, Chinese (Simplified), French, Spanish, Portuguese, German, Japanese, Korean, Turkish, Vietnamese, Indonesian, Russian
- Buyer auto-detect + manual switch; supplier content stays source language with optional machine translation (Phase 12+)

### 4. Vendor plan segments
- Free / Starter / Pro / Business / Export / Enterprise
- Each unlocks: listing caps, search rank, Guarantee eligibility, RFQ lead quotas, ad wallet bonus
- See [vendor-listing-plans.md](../../sourcebyjay-b2b-workflows/references/vendor-listing-plans.md)

---

## Reference-first gate

Before implementing any row above, add to [feature-reference-checklist.md](../../sourcebyjay-reference-repos/references/feature-reference-checklist.md) and skim primary Alibaba UX (layout only) + OSS repo.
