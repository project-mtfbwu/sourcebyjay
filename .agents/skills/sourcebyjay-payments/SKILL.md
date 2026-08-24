---
name: sourcebyjay-payments
description: >-
  Stripe Connect payments, platform commission (min 5%), deposits, and marketplace
  payouts for SourceByJay Phase 7. Use when implementing checkout, vendor
  onboarding commission, webhooks, or application fees. Do not store card data.
---

# SourceByJay Payments (Phase 7)

**Never store card numbers.** Use Stripe Connect only.

## Platform commission (locked)

| Rule | Value |
|------|-------|
| Default | **5%** per vendor |
| Minimum | **5%** unless super_admin approves lower |
| Set at onboarding | Ops: manager / admin / super_admin |
| Below minimum | super_admin only, or delegated staff flag |

Full spec: [references/commission.md](references/commission.md)  
Schema: `apps/database/supabase/schemas/marketplace_vendor_commission.sql`

## Flow

1. Ops onboards vendor → sets `suppliers.commission_rate_bps` (default 500)
2. Vendor completes Stripe Connect onboarding (vendor app)
3. Buyer confirms order → `awaiting_payment` (commission rate **snapshotted** on order)
4. Stripe Checkout / PaymentIntent with `application_fee_amount` = commission
5. Webhook updates `payments` + `orders.status`

## Stripe Connect (primary reference)

Implement from **Stripe docs**, not Medusa:

- [Marketplace overview](https://stripe.com/docs/connect/marketplace)
- [Application fees](https://stripe.com/docs/connect/marketplace/tasks/app-fees)
- [Direct charges](https://stripe.com/docs/connect/direct-charges)

```typescript
const feeCents = Math.round(totalCents * order.commission_rate_bps / 10000);

await stripe.paymentIntents.create({
  amount: totalCents,
  currency: 'usd',
  application_fee_amount: feeCents,
  transfer_data: { destination: vendor.stripe_connect_account_id },
});
```

## OSS references (patterns only)

| Repo | Use for |
|------|---------|
| [Mercur](https://github.com/mercurjs/mercur) | Vendor onboarding admin, fee UX |
| [Medusa marketplace](https://docs.medusajs.com/resources/recipes/marketplace) | Split payment domain model |
| [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) | Order flow in Next.js + Supabase |

## Rules

- Verify webhook signatures (`stripe.webhooks.constructEvent`)
- Idempotent webhook handling (store `event.id`)
- Service role only in server route handlers — never client
- Test mode until explicit prod promotion
- Commission on order is immutable after confirm (snapshot bps)

## Schema

```sql
platform_settings (default_commission_bps, min_commission_bps)
suppliers (commission_rate_bps, commission_below_min_approved, ...)
staff_members (can_set_below_min_commission)
orders (commission_rate_bps, commission_amount_cents)  -- Phase 3
payments (order_id, stripe_intent_id, amount, status, metadata)
suppliers.stripe_connect_account_id  -- Phase 7
```

## Prerequisites

- Phase 2 ops onboarding UI (commission field)
- Phase 3 orders complete
- Legal terms updated (commission disclosure)
- User explicit go-ahead for live payments

Do not start Phase 7 before Phases S0–6 and user GO on payment scope.
