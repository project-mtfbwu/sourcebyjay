# Platform commission

Every order placed through SourceByJay charges a **platform commission** to the vendor. Commission is configured during **ops vendor onboarding** and enforced at **Stripe Connect payment** time (Phase 10).

## Locked rules

| Rule | Value |
|------|-------|
| Default commission | **5%** (500 basis points) |
| Platform minimum | **5%** — vendors cannot be onboarded below this unless approved |
| Who sets at onboarding | `manager`, `admin`, `super_admin` |
| Below-minimum rates | **super_admin only**, or staff with `can_set_below_min_commission` (granted by super_admin) |
| Change platform default/min | **super_admin only** |
| `viewer` | Read-only — cannot set commission |

**Basis points (bps):** `500` = 5.00%, `750` = 7.50%, `10000` = 100%.

## Schema

| Object | Purpose |
|--------|---------|
| `platform_settings` | Singleton: `default_commission_bps`, `min_commission_bps` |
| `staff_members.can_set_below_min_commission` | Delegated override for below-min rates |
| `suppliers.commission_rate_bps` | Per-vendor rate (default 500) |
| `suppliers.commission_below_min_approved` | Flag when rate < platform minimum |
| `validate_supplier_commission()` | Server-side guard before ops updates |

Phase 3/7 order snapshot (add with orders table):

```sql
orders.commission_rate_bps      -- frozen at order confirm
orders.commission_amount_cents  -- computed from order total
orders.stripe_application_fee_id -- optional audit
```

## Ops onboarding UI (Phase 2)

Route: `/vendors/[id]/onboarding`

1. Load `platform_settings.min_commission_bps` (default 500)
2. Commission field defaults to `default_commission_bps` (500)
3. Manager+ can raise rate per vendor (e.g. 7%, 10%)
4. Below 5%: show approval toggle — only visible if actor is super_admin or has `can_set_below_min_commission`
5. On save: call `validate_supplier_commission()` + audit log `supplier.set_commission`

## Stripe implementation (Phase 10)

Use **Connect application fees** on the PaymentIntent / Checkout Session:

```typescript
const commissionCents = Math.round(orderTotalCents * order.commission_rate_bps / 10000);

await stripe.paymentIntents.create({
  amount: orderTotalCents,
  currency: 'usd',
  application_fee_amount: commissionCents,
  transfer_data: { destination: vendor.stripe_connect_account_id },
});
```

Platform keeps `application_fee_amount`; vendor receives the remainder.

## Reference repos (steal patterns, build in Next.js + Supabase)

| Priority | Reference | What to steal |
|----------|-----------|---------------|
| **1 — implement here** | [Stripe Connect marketplace](https://stripe.com/docs/connect/marketplace/tasks/app-fees) | `application_fee_amount`, Connect onboarding, webhooks |
| **2 — UX/workflow** | [Mercur](https://github.com/mercurjs/mercur) | Vendor onboarding admin, marketplace fee concepts |
| **3 — domain model** | [Medusa marketplace recipe](https://docs.medusajs.com/resources/recipes/marketplace) | Split payments, vendor accounts (patterns only) |
| **4 — order flow** | [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) | Next.js + Supabase order states (same stack) |

**Do not** adopt Medusa/Mercur as primary stack — copy fee + onboarding patterns only.

## Phases

| Phase | Work |
|-------|------|
| S0+ | Schema in `marketplace_commission.sql` (this file) |
| 2 | Ops onboarding UI + commission field + audit |
| 3 | Snapshot `commission_rate_bps` on order confirm |
| 7 | Stripe Connect charge + `application_fee_amount` |

## Audit

```typescript
await supabase.from('audit_logs').insert({
  actor_id: userId,
  action: 'supplier.set_commission',
  entity_type: 'supplier',
  entity_id: supplierId,
  metadata: {
    commission_rate_bps: 750,
    below_min_approved: false,
    previous_bps: 500,
  },
});
```
