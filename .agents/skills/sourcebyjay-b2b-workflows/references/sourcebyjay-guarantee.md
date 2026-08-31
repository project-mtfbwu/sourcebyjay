# SourceByJay Guarantee (Phase 9 + 10)

**Brand:** **SourceByJay Guarantee** — our Trade Assurance equivalent. Buyers see this name everywhere (not “trade assurance”).

**Parallel:** [Alibaba Trade Assurance](https://buyer.alibaba.com/page/tradeassurance/buyer/story.html) — escrow, quality, on-time delivery, 30-day disputes, on-platform payment only.

Cross-links: [alibaba-parallels.md](../sourcebyjay-architecture/references/alibaba-parallels.md) · Phase 10 payments · Phase 17 vendor plans

---

## What buyers get (free)

| Protection | Detail |
|------------|--------|
| **Payment security** | Funds held in escrow (Stripe Connect) until delivery confirmed |
| **Product quality** | Must match agreed specs on order |
| **On-time shipping** | Must ship by quoted date |
| **Dispute window** | 30 days after delivery (ops-configurable) |
| **Mediation** | Ops-assisted resolution; refund recommendation |

**Critical rule (Alibaba parallel):** Guarantee applies **only** when buyer pays **on SourceByJay** — not via WhatsApp, UPI direct, or wire outside platform.

---

## Segments

### Segment A — Listing (discovery)

- **Guarantee badge** on product cards and supplier profiles (shield icon + tooltip)
- Copy: “Protected by SourceByJay Guarantee when you pay on platform”
- Eligibility: supplier on **Pro+ plan** (Phase 17) OR ops `guarantee_eligible` override
- Search facet: **“SourceByJay Guarantee”** in Phase 7 sidebar

### Segment B — Order (transaction)

- Order flag: `guarantee_protected boolean`
- Checkout shows Guarantee terms checkbox + coverage summary
- Escrow state machine tied to Stripe (Phase 10):
  - `funds_held` → `shipped` → `delivered` → `buyer_confirmed` → `released_to_vendor`
- Milestone orders: partial release rules in ops settings

### Segment C — Dispute (post-delivery)

- Buyer opens dispute from order within window
- Reasons: quality mismatch, not shipped, wrong quantity, damaged, non-delivery
- Ops queue: assign mediator, chat + evidence, resolution: full/partial refund or reject
- Audit log on every action

### Segment D — International buyers

- Same Guarantee when paying in **USD/EUR** via Stripe
- Display coverage limits in buyer currency
- Export-tier vendors (Phase 17) prioritized in intl search rank

### Segment E — Vendor eligibility

| Source | Guarantee eligible |
|--------|-------------------|
| Free / Starter plan | No (unless ops promo) |
| Pro / Business / Export / Enterprise | Yes (default) |
| Ops manual grant | Yes |
| Suspended / fraud flagged | No |

---

## Schema

File: `apps/database/supabase/schemas/marketplace_guarantee.sql`

```sql
guarantee_policies (
  id, name, coverage_quality, coverage_shipping, dispute_days,
  max_order_inr_cents?, max_order_usd_cents?, active
)

suppliers.guarantee_eligible boolean
suppliers.guarantee_policy_id uuid?

products.guarantee_eligible boolean  -- derived from supplier + product publish rules

orders.guarantee_protected boolean
orders.guarantee_policy_id uuid?
orders.escrow_status  -- none | held | released | refunded | disputed

disputes (
  id, order_id, opened_by, reason, status,
  resolution, refund_amount_cents, assigned_staff_id, resolved_at
)
dispute_messages (dispute_id, sender_type, body, attachments)
```

---

## Apps

| App | Routes / UI |
|-----|-------------|
| **web** | Guarantee badge; filter; checkout terms; `/account/orders/[id]/dispute` |
| **vendor** | Opt-in status (plan-based); dispute response; escrow timeline |
| **ops** | `/disputes`, `/guarantee/policies`, override eligibility |

---

## India-specific add-ons

- **GST invoice dispute** reason type (wrong GSTIN, missing e-invoice)
- Coverage copy in **Hindi + English** minimum (Phase 12)
- INR coverage cap display (ops sets; IndiaMART TrustSEAL cites ₹5L buyer protection as reference UX)

---

## Acceptance criteria (Phase 9)

- [ ] Guarantee badge on eligible listings only
- [ ] Search filter “SourceByJay Guarantee” works
- [ ] Order with on-platform pay shows Guarantee terms
- [ ] Dispute flow with ops assignment + audit
- [ ] Ineligible pay path (off-platform) shows “not protected” warning
- [ ] Pro+ vendor default eligible per Phase 17 plans

---

## References

Alibaba Trade Assurance buyer/seller pages · Mercur disputes · Stripe Connect separate charges and transfers · IndiaMART TrustSEAL buyer payment protection (UX cap reference)
