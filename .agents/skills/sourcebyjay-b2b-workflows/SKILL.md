---
name: sourcebyjay-b2b-workflows
description: >-
  B2B marketplace domain flows for SourceByJay — RFQ, quotes, orders, chat,
  reviews, request listing, trust tiers, and payments. Use when implementing
  buyer/vendor features, database tables, or Alibaba-style sourcing flows.
---

# SourceByJay B2B Workflows

Alibaba-style: **inquiry-first**, not cart-first checkout.

## Core flow

```
Browse / AI search → RFQ or Request Listing → Chat → Quote → Confirm → Pay → Track → Review
```

## Status machines

### Inquiry (exists)
- Buyer submits via product page → `inquiries` table

### Quote (Phase 3)
- `draft` → `sent` → `accepted` | `rejected` | `expired`

### Order (Phase 3)
```
pending_confirmation → confirmed → awaiting_payment → paid
  → in_production → shipped → delivered → completed | cancelled
```

### Order events
Append-only `order_events` for timeline UI.

### Gallery / verification (Phase 1)
- Image: `pending` → `approved` | `rejected`
- Supplier tier: `none` → `basic` → `verified` → `gold` → `assessed`

## Tables by phase

| Phase | Tables |
|-------|--------|
| 0 ✅ | categories, suppliers, products, inquiries, profiles |
| S0 | staff_members, audit_logs |
| 1 | supplier_gallery, supplier_certificates, verification_tier |
| 3 | quotes, orders, order_events, payments (+ commission snapshot) |
| 4 | conversations, messages |
| 5 | reviews, listing_requests, listing_request_offers |
| 6 | products.embedding (pgvector) |
| 7 | stripe_customers, connect_accounts, application fees |

## Platform commission

- **Default / minimum:** 5% (500 bps) — see [commission.md](../sourcebyjay-payments/references/commission.md)
- Set on vendor during **ops onboarding** (manager+)
- **Snapshotted** on `orders.commission_rate_bps` at order confirm — never recalculate retroactively
- Charged via Stripe `application_fee_amount` in Phase 7

## Buyer vs vendor actions

| Action | Buyer (web) | Vendor (sell.*) |
|--------|-------------|-----------------|
| Send RFQ | ✓ | — |
| Send quote | — | ✓ |
| Confirm order | ✓ | — |
| Update production/shipped | — | ✓ |
| Upload factory photos | — | ✓ |
| Reply to review | — | ✓ |
| Post buying request | ✓ | — |
| Bid on request | — | ✓ |

## MOQ & pricing

- `products.moq`, `price_tiers` (json), `unit`
- Display volume pricing table on product page
- Quotes can override list price for negotiation

## Mock data fallback

When Supabase unavailable, `apps/web/src/data/mock/*` serves storefront. New features should add mock fallbacks until DB seeded.

## Validation rules

- RFQ: message min 10 chars; rate limited
- Quote: valid_until date; price > 0
- Review: requires `verified_order_id` on completed order
- Request listing: deadline in future

References: [reference-repos](../sourcebyjay-reference-repos/SKILL.md)
