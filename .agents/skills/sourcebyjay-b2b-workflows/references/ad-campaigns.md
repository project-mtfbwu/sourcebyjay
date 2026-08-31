# Ad campaigns — Google-style sponsored search (Phase 13)

**Locked:** Custom ad campaigns with **CPC (cost per click)** billing, sponsored results in search, and dual management — **vendor portal by default**, **ops portal when team assists**.

Cross-links: [IMPLEMENTATION.md](../../../../IMPLEMENTATION.md) Phase 13 · Phase 7 search rank · Phase 10 payments/wallet

---

## Product model (Google Ads–like)

| Layer | Purpose | Example |
|-------|---------|---------|
| **Campaign** | Budget, schedule, status, owner vendor | “Diwali LED bulk — Search” |
| **Ad group** | Keyword set + product/listing targets | “LED bulbs MOQ 500+” |
| **Keywords** | Search terms to match (+ optional negative) | `led bulb manufacturer`, `[exact match]` |
| **Creative / ad** | Product or supplier card promoted | Product ID + headline override |
| **Placement** | Where ad may appear | `search_results`, `home_featured`, `category_top` |

**Billing model:** **CPC** — vendor charged only when a buyer clicks a sponsored result (not on impression alone for search slot).

---

## Who manages campaigns

| Actor | Portal | Default? | Scope |
|-------|--------|----------|-------|
| **Manufacturer / lister** | `sell.sourcebyjay.com` → `/advertising` | **Yes** | Own campaigns only |
| **Ops team (assist)** | `ops.sourcebyjay.com` → `/advertising` or `/vendors/[id]/advertising` | When helping vendor | Any vendor (manager+) |

### Rules

1. **Self-service is default** — every onboarded vendor can create campaigns without ops.
2. **Ops can proxy** — manager / admin / super_admin creates or edits campaigns **on behalf of** a vendor (audit log required).
3. **Ops moderation** — admin+ can pause/fraud-block any campaign; viewer read-only.
4. **`created_by`** on campaign: `vendor_user_id` or `staff_id` + `on_behalf_of_vendor_id`.

---

## Sponsored search results

When buyer searches (Phase 7):

1. Run normal organic rank.
2. Run **ad auction** for matching active campaigns (keyword match + budget remaining + placement = `search_results`).
3. Insert up to **N sponsored slots** (e.g. top 2–3) with clear **“Sponsored”** label — same pattern as Google Shopping / Alibaba sponsored rows.
4. Organic results follow; never hide disclosure.
5. On sponsored card click → log `ad_clicks` → deduct **CPC bid** from vendor ad wallet → redirect to product/supplier.

### Rank score (simplified second-price auction)

```
ad_rank = cpc_bid_inr × quality_score × tier_boost
quality_score = f(verification_tier, CTR history, listing completeness)
```

Winner pays min(next_rank / quality_score, own_bid) — document in code; MVP can use flat CPC bid.

---

## Vendor portal (`apps/vendor`)

| Route | Work |
|-------|------|
| `/advertising` | Campaign list, spend summary, wallet balance |
| `/advertising/new` | Wizard: objective → keywords → products → CPC bid → daily budget |
| `/advertising/[id]` | Edit, pause, reports (impressions, clicks, spend, CPC avg) |
| `/advertising/wallet` | Top-up via Stripe (Phase 10) or ops credit |

### Campaign wizard fields

- Name, start/end date
- Placement checkboxes: Search, Home featured, Category (if enabled)
- Keywords (comma or line-separated; match type per row)
- Linked products (1–N from vendor catalog)
- **Max CPC bid (INR)** — minimum platform floor (ops setting)
- **Daily budget (INR)** — auto-pause when hit
- **Total campaign budget (INR)** optional cap

---

## Ops portal (`apps/ops`)

| Route | Work |
|-------|------|
| `/advertising` | All campaigns; filter by vendor, status, spend |
| `/vendors/[id]/advertising` | Create/manage **on behalf of** vendor |
| `/advertising/review` | Fraud / policy queue (admin+) |

### Ops permissions

| Action | manager | admin | super_admin |
|--------|:-------:|:-----:|:-----------:|
| View all campaigns | ✓ | ✓ | ✓ |
| Create campaign for vendor | ✓ | ✓ | ✓ |
| Edit/pause vendor campaign | ✓ | ✓ | ✓ |
| Approve / reject flagged campaign | — | ✓ | ✓ |
| Set platform min CPC / floor bid | — | — | ✓ |
| Grant promotional ad credit | — | ✓ | ✓ |

Audit log: `ad_campaign.create`, `ad_campaign.update`, `ad_campaign.pause`, `ad_wallet.credit`.

---

## Schema (schema-first)

File: `apps/database/supabase/schemas/marketplace_ad_campaigns.sql`

```sql
-- Wallet (prepaid CPC balance per vendor)
ad_wallets (vendor_id, balance_inr_cents, updated_at)

ad_wallet_transactions (
  id, vendor_id, amount_inr_cents, type,  -- top_up | cpc_charge | ops_credit | refund
  ad_click_id?, stripe_payment_id?, created_by_staff_id?, created_at
)

ad_campaigns (
  id, vendor_id, name, status,  -- draft | pending_review | active | paused | ended | rejected
  placement_types[],  -- search_results | home_featured | category_top
  daily_budget_inr_cents, total_budget_inr_cents, spent_inr_cents,
  start_at, end_at,
  created_by_user_id, created_by_staff_id, on_behalf_of_vendor_id,
  reviewed_by_staff_id?, rejection_reason?
)

ad_groups (id, campaign_id, name, default_cpc_bid_inr_cents)

ad_keywords (
  id, ad_group_id, keyword, match_type,  -- broad | phrase | exact
  negative boolean default false
)

ad_creatives (
  id, ad_group_id, product_id?, supplier_id?,
  headline_override?, sort_order
)

ad_impressions (id, creative_id, campaign_id, placement, search_query?, user_id?, created_at)
ad_clicks (
  id, impression_id, creative_id, campaign_id,
  cpc_charged_inr_cents, wallet_transaction_id, created_at
)
```

RLS: vendor CRUD own campaigns; staff read/write all via `staff_has_min_role('manager')`; public insert impressions/clicks via server actions only.

---

## Buyer app (`apps/web`)

- Search results: sponsored block at top with **“Sponsored”** badge (India ASCI-style disclosure).
- Home / category: optional featured sponsored carousel (Phase 13 placement).
- No charge to buyer — CPC is vendor-side only.

---

## Billing flow (CPC + CPM + sponsorship — **fake only in MVP**)

1. Vendor tops up **ad wallet** via **test credit button** or ops grant (Stripe deferred to Phase 10B).
2. Campaign goes `active` when wallet ≥ min balance.
3. **CPC:** qualified click → atomic debit + `ad_clicks` + wallet transaction line.
4. **CPM:** impression logged on render → debit per mille (or simplified per-impression in MVP).
5. **Sponsorship:** daily prorated burn from wallet for flat CPT campaigns.
6. **Invoices:** generate real-looking **fake ad invoices** (`SBJ-AD-…`) — wallet receipts, spend statements, platform service invoice — **TEST MODE**, no payment rail. Mirror `order_invoices` from Phase 10A.
7. Low balance → campaign auto-pause (email in Phase 15).

**Scout doc:** [SCOUT-PHASE-13-ADS.md](../../sourcebyjay-vomit-protocol/references/SCOUT-PHASE-13-ADS.md)

**Not in MVP:** Retargeting pixels, Google Ads import API, real Stripe top-up, off-platform display network.

---

## Primary references (steal patterns)

| Reference | Steal |
|-----------|-------|
| [Google Ads campaign structure](https://support.google.com/google-ads/answer/6324971) (docs) | Campaign → ad group → keywords hierarchy |
| [Google Ads CPC bidding](https://support.google.com/google-ads/answer/2470105) | Max CPC bid, daily budget |
| [Mercur promotions](https://github.com/mercurjs/mercur) | Marketplace vendor promotion admin |
| Alibaba sponsored product rows (UX) | Label + slot above organic |
| Phase 7 search rank | Inject sponsored after auction RPC |

---

## Acceptance criteria (Phase 13)

- [ ] Vendor creates search campaign with keywords + CPC bid + daily budget
- [ ] Sponsored products appear in `/search` with disclosure label
- [ ] Click charges CPC from ad wallet; campaign pauses at budget cap
- [ ] Ops can create/edit campaign on behalf of vendor with audit log
- [ ] Ops can pause fraudulent campaign (admin+)
- [ ] Impression/click reports on vendor and ops dashboards

---

## Agent reminder

Before coding Phase 13: complete [feature-reference-checklist.md](../../sourcebyjay-reference-repos/references/feature-reference-checklist.md) gate and read Google Ads campaign docs + Mercur promotions skim.
