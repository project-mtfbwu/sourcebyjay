# Vendor listing & membership plans (Phase 17)

**Goal:** Monetize suppliers like **IndiaMART** (paid tiers) while keeping a **free** entry path — without blocking MVP launch.

**Parallel:** IndiaMART Free → MDC (~₹35k) → TrustSEAL Pro (~₹60k) → Maximiser (~₹85k) → Verified Exporter (₹1.1L+).  
**Strategy:** Lower entry price for India; bundle **SourceByJay Guarantee** eligibility at Pro+.

Cross-links: [alibaba-parallels.md](../sourcebyjay-architecture/references/alibaba-parallels.md) · [sourcebyjay-guarantee.md](sourcebyjay-guarantee.md) · Phase 10 Stripe subscriptions

---

## Plan tiers (MVP)

| Plan | Target price (INR/yr) | Listings | Search rank | RFQ leads/wk | Guarantee | Notes |
|------|----------------------|----------|-------------|--------------|-----------|-------|
| **Free** | ₹0 | 5 products | Baseline | 0 (inbound only) | No | Register + go live after ops storefront queue |
| **Starter** | ₹9,999 | 25 | +10% rank weight | 3 | No | Email support |
| **Pro** | ₹29,999 | 100 | +25% | 10 | **Yes** | Trust badge, Guarantee eligible |
| **Business** | ₹59,999 | 500 | +40% | 25 | Yes | Video tab, priority storefront review |
| **Export** | ₹99,999 | Unlimited | +50% intl buyers | 40 | Yes | Highlighted for non-IN buyers, USD pricing |
| **Enterprise** | Custom (ops) | Unlimited | Max + featured | Custom | Yes | Dedicated manager, IM Star equivalent |

*Prices are MVP targets — ops can edit in `listing_plans` table. Undercut IndiaMART MDC/TrustSEAL while scaling up.*

---

## Feature matrix

| Feature | Free | Starter | Pro | Business | Export | Enterprise |
|---------|:----:|:-------:|:---:|:--------:|:------:|:----------:|
| Public storefront | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Max active products | 5 | 25 | 100 | 500 | ∞ | ∞ |
| Verification badge | Basic | Basic | Pro trust badge | Business badge | Export badge | Enterprise |
| SourceByJay Guarantee | — | — | ✓ | ✓ | ✓ | ✓ |
| Factory gallery slots | 5 | 15 | 50 | 100 | 100 | ∞ |
| RFQ inbox (broadcast) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Weekly RFQ lead quota | 0 | 3 | 10 | 25 | 40 | Custom |
| Search rank boost | 0% | 10% | 25% | 40% | 50% | Max |
| Intl buyer highlight | — | — | — | — | ✓ | ✓ |
| Ad wallet bonus (one-time) | — | ₹500 | ₹2,000 | ₹5,000 | ₹10,000 | Custom |
| CPC campaigns (Phase 13) | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Custom domain mini-site | — | — | — | ✓ | ✓ | ✓ |
| Ops onboarding assist | — | — | — | — | ✓ | ✓ |

---

## Who manages subscriptions

| Actor | Portal | Actions |
|-------|--------|---------|
| **Vendor** (default) | `sell.*/plans` | View plans, upgrade, pay via Stripe |
| **Ops** (assist) | `ops.*/vendors/[id]/subscription` | Assign plan, comp months, enterprise quote |

Audit: `subscription.change`, `subscription.comp_grant`.

---

## Schema

File: `apps/database/supabase/schemas/marketplace_vendor_plans.sql`

```sql
listing_plans (
  id, slug,  -- free | starter | pro | business | export | enterprise
  name, price_inr_cents_annual, max_listings,
  rank_boost_bps, rfq_leads_per_week,
  guarantee_eligible, ad_wallet_bonus_inr_cents,
  features jsonb, active, sort_order
)

vendor_subscriptions (
  id, vendor_id, plan_id, status,  -- active | past_due | cancelled | comped
  started_at, expires_at,
  stripe_subscription_id?,
  granted_by_staff_id?,  -- ops comp
  created_at
)

vendor_subscription_events (
  id, vendor_id, from_plan_id, to_plan_id, event_type, actor, created_at
)
```

Enforcement:
- RLS block publish when `active_listings > plan.max_listings`
- Search RPC reads `rank_boost_bps` from active plan
- `guarantee_eligible` synced from plan (see sourcebyjay-guarantee.md)

---

## Billing

- **Phase 17 MVP:** Stripe Billing annual subscriptions (Phase 10 infra)
- **Fallback:** Ops marks plan active after offline payment (NEFT/UPI invoice) until Stripe live
- Free tier: no payment; downgrade on expiry removes excess listings to draft

---

## Vendor portal UX

| Route | Work |
|-------|------|
| `/plans` | Compare table (like IndiaMART pricing page) |
| `/plans/upgrade` | Stripe Checkout |
| `/settings/subscription` | Current plan, renewal, invoices |

## Ops portal UX

| Route | Work |
|-------|------|
| `/plans` | Edit plan prices/limits (super_admin) |
| `/vendors/[id]/subscription` | Change plan, comp, enterprise quote |

---

## Acceptance criteria

- [ ] New vendor defaults to **Free** with 5 listing cap
- [ ] Upgrade unlocks limits + rank + Guarantee (Pro+)
- [ ] Search rank reflects plan boost
- [ ] Ops can comp or assign Enterprise
- [ ] Expired paid plan downgrades gracefully (draft excess SKUs)
- [ ] Pricing page compares to IndiaMART value prop (more Guarantee, lower entry)

---

## References

IndiaMART MDC, TrustSEAL Pro, Maximiser Pro, Verified Exporter pricing pages · Alibaba Gold/Verified supplier tiers (UX) · Stripe Billing subscriptions · Mercur vendor plans (patterns)
