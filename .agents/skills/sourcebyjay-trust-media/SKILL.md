---
name: sourcebyjay-trust-media
description: >-
  Gold verification tiers, supplier gallery, certificates, and storefront
  approval for SourceByJay Phase 1. Use when implementing verified badges,
  factory/godown photos, or ops verification queues.
---

# SourceByJay Trust & Media (Phase 1)

## Verification tiers (Alibaba-style)

| Tier | Badge | Meaning |
|------|-------|---------|
| `none` | — | Unverified |
| `basic` | Gray | Email + company submitted |
| `verified` | Blue check | Ops approved |
| `gold` | Gold check | Audit + docs + history |
| `assessed` | Gold + label | On-site inspection (future) |

Column: `suppliers.verification_tier`

## Gallery types

| Type | Use |
|------|-----|
| `factory` | Production floor |
| `showroom` | Display / store |
| `warehouse` | Godown / storage |
| `team` | Staff photo |
| `certificate` | ISO, CE scans |

Status: `pending` → `approved` | `rejected` — **only approved** on public site.

## Storage

- Bucket: `supplier-media`
- Path: `{user_id}/gallery/{uuid}.{ext}`
- RLS: seller upload; public read approved only (via join or signed policy)

## Public UI

- Supplier profile: tabs — Overview | Products | **Factory tour** | Certificates
- Search filter: `verified=gold` or tier dropdown
- Product/supplier cards: badge component in `packages/ui`

## Ops UI (until apps/ops: web admin temp)

- Queue: pending verifications
- Queue: pending gallery images
- Actions logged to `audit_logs`

## Schema (schemas/*.sql first)

See IMPLEMENTATION.md Phase 1. Generate migration via supabase db diff.

## References

- Mercur verification module
- Alibaba supplier “Company profile” / verified icons
- [ops-rbac](../sourcebyjay-ops-rbac/SKILL.md) for approval permissions

## Acceptance (Phase 1)

- [ ] Gold badge on approved suppliers only
- [ ] Unapproved images hidden from public
- [ ] Ops can approve/reject with audit trail
- [ ] Visual demo per [visual-demo](../sourcebyjay-visual-demo/SKILL.md)
