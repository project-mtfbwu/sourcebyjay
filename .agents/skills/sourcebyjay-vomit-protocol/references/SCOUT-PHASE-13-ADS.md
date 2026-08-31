# Scout — Phase 13 Hybrid Ad Engine (fake billing + invoices)

**Date:** 2026-08-28  
**Owner decisions:** No Stripe in MVP · real workflow · fake money · **generate ad invoices** (like order invoices) · hybrid Amazon × Google × Alibaba placements

---

## 1. Platform scout matrix

| Dimension | Google Ads | Amazon Ads | Alibaba.com B2B | SourceByJay hybrid |
|-----------|------------|------------|-----------------|-------------------|
| **Hierarchy** | Account → Campaign → Ad group → Keywords/Creatives | Campaign → Ad group → Targets | Keyword campaigns + Premium slots | Campaign → ad group → keywords/creatives (Google) |
| **Search CPC** | Search / Shopping — pay per click | **Sponsored Products** — search + PDP, CPC | **Keyword Advertising (KWA)** — PPC in search | **Steal all three** — top sponsored product rows |
| **Display / visual** | Demand Gen / GDN — CPM-ish, visual surfaces | **Sponsored Display** — PDP, search in-feed | **Sponsored Brands** banner — top of search, CPT/time | Home carousel + category banner (CPM fake) |
| **Premium exclusivity** | — | Top-of-search placement bid multiplier | **Premium Sponsored Ads** — one supplier owns keyword top slot | Optional `premium_keyword` flag (Gold+ plans) |
| **Who pays** | Advertiser wallet | Seller ad account | Supplier marketing budget / credits | **Ad wallet (fake)** — seller only |
| **Buyer charge** | Never | Never | Never | Never |
| **Disclosure** | "Ad" label policies | Sponsored label on Amazon | Promoted rows in search | **"Sponsored"** (ASCI-permitted label) |
| **Reporting** | Impressions, clicks, CPC, spend | Search term, placement, targeting reports | Marketing Center metrics | Vendor + ops dashboards |
| **Invoice / tax doc** | Google invoice to advertiser | Amazon advertising invoice | Alibaba marketing statements | **SBJ-AD-*** fake GST-style invoices |

### Primary URLs scouted

- Google: [Campaign structure](https://support.google.com/google-ads/answer/6324971) · [CPC bidding](https://support.google.com/google-ads/answer/2470105)
- Amazon: [Sponsored Products](https://advertising.amazon.com/library/guides/sponsored-products-best-practices) · [Display guide](https://advertising.amazon.com/library/guides/display-ads-guide)
- Alibaba: [Seller advertising](https://seller.alibaba.com/advertising) · [KWA blog](https://seller.alibaba.com/businessblogs/how-to-increase-sales-on-alibabacom-with-advertising-tools-px0022f0q)
- India: [ASCI disclosure labels](https://www.ascionline.in/social/tools/) — use **"Sponsored"** or **"Ad"**

---

## 2. OSS / repo scout (mandatory gate)

| Priority | Repo / doc | What we **steal** | What we **skip** |
|----------|------------|-------------------|------------------|
| **Primary** | [Mercur campaigns](https://docs.mercurjs.com/docs/product/workflows/core/campaign-workflows) | `createVendorCampaignWorkflow` — seller-owned campaigns, budgets, dates | Medusa stack, cart-level order discounts |
| **Primary** | [Mercur vendor promotions](https://docs.mercurjs.com/docs/product/workflows/core/promotions-workflows) | Vendor-scoped CRUD, validate seller owns products | Product **price** discounts — different surface |
| **Secondary** | [Google Ads campaign docs](https://support.google.com/google-ads/answer/6324971) | Campaign → ad group → keywords; max CPC; daily budget | Smart Bidding AI, Performance Max |
| **Secondary** | [Medusa B2B](https://docs.medusajs.com/resources/recipes/b2b) | Admin campaign entities pattern | Full Medusa |
| **UX only** | Alibaba.com search sponsored rows | Label + slot above organic | Gold-only Premium exclusivity (map to our plans) |
| **UX only** | Amazon Sponsored Products | Search + PDP placement types | Off-Amazon display, retargeting pixels |
| **Same-stack** | **This repo** Phase 10A | `order_invoices`, `next_invoice_number()`, fake pay + escrow | Stripe provider |
| **Same-stack** | **This repo** Phase 7 | Search rank RPC, `/search` | — |
| **Same-stack** | **This repo** Phase 12 | Seller GSTIN/PAN on invoice header | — |

**Mercur note:** Vendor campaigns there are **promotion/discount** focused, not CPC search ads. Steal **workflow shape**; build our own ad auction + wallet tables.

**No suitable OSS for:** B2B marketplace CPC + CPM + fake wallet + GST ad invoices in Next.js + Supabase → custom schema justified.

---

## 3. Hybrid billing models (fake only)

| Model | Stolen from | Trigger | Wallet movement | Invoice doc |
|-------|-------------|---------|-----------------|-------------|
| **CPC** | Google + Alibaba KWA + Amazon SP | Buyer **clicks** sponsored product | Debit max CPC bid | Line on spend statement |
| **CPM** | Google Demand Gen / Amazon Display | **Impression** on render | Debit per 1000 imps (or per imp MVP) | Line on spend statement |
| **CPT / flat sponsorship** | Alibaba Sponsored Brands | Daily prorated burn | Debit flat daily amount | Platform ad service invoice |
| **Wallet top-up** | — | Seller test credit / ops grant | Credit wallet | Receipt `SBJ-AD-RCP-…` |
| **Ops promo credit** | — | Ops grant | Credit + audit | Credit note |

**Payment skipped.** Invoices show **TEST MODE — settled from ad wallet (simulated)**.

---

## 4. Placement map — buyer `:3000`

| Placement ID | UI location | Billing | MVP |
|--------------|-------------|---------|-----|
| `search_results_top` | Top 2–3 on `/search?mode=products` | CPC | Yes |
| `search_sidebar` | Search right rail (desktop) | CPM | Yes |
| `home_featured` | Home carousel | CPM / CPT | Yes |
| `category_banner` | Search with category filter | CPM | Yes |
| `supplier_spotlight` | Home featured suppliers | CPT daily | Yes |
| `pdp_related` | PDP sponsored row | CPC | Later |
| `off_site_retarget` | Third-party sites | CPM | No |

**Disclosure:** **"Sponsored"** on every slot (ASCI-compliant).

---

## 5. Fake workflow (Owner demo)

1. Seller test credit → wallet receipt invoice  
2. Seller Search CPC campaign  
3. Buyer search → Sponsored rows → click → wallet debit  
4. Buyer home → CPM carousel → impression debit  
5. Seller `/advertising/invoices` → spend statement  
6. Ops pause + audit  

Parallel: buyer fake order pay → `SBJ-INV-…` order invoice (already built).

---

## 6. Implementation slices

| Slice | Scope |
|-------|-------|
| **A** | Schema + RPCs + RLS |
| **B** | Seller `/advertising` + wallet + wizard |
| **C** | Buyer placements (search, home, category, sidebar) |
| **D** | Ops advertising + on-behalf |
| **E** | Ad invoices (mirror Phase 10A order invoices) |

---

## 7. Deferred

Stripe, retargeting pixels, Google Ads import, off-Amazon display, second-price auction, Smart Bidding.
