---
name: sourcebyjay-ops-rbac
description: >-
  Ops portal staff roles, permission matrix, audit logging, and vendor approval
  workflows for SourceByJay. Use when building ops.sourcebyjay.com, staff login,
  gold verification, storefront approval, or manager/viewer access control.
---

# SourceByJay Ops RBAC

Ops portal: `ops.sourcebyjay.com` → `apps/ops` (Phase 2+).

Schema: [marketplace_security.sql](../../../apps/database/supabase/schemas/marketplace_security.sql)

## Roles (least privilege)

| Role | Rank | Purpose |
|------|------|---------|
| `viewer` | 1 | Read dashboards, vendors, audit log |
| `manager` | 2 | Edit clients, approve storefront/gold/media |
| `admin` | 3 | + suspend vendors, manage staff |
| `super_admin` | 4 | + platform settings |

DB helper: `staff_has_min_role(min_role)` — use in RLS policies.

## Permission matrix

| Action | super_admin | admin | manager | viewer |
|--------|:-----------:|:-----:|:-------:|:------:|
| View vendors/buyers | ✓ | ✓ | ✓ | ✓ |
| Edit vendor/client details | ✓ | ✓ | ✓ | — |
| Approve storefront | ✓ | ✓ | ✓ | — |
| Set gold/verified tier | ✓ | ✓ | ✓ | — |
| Approve factory/godown images | ✓ | ✓ | ✓ | — |
| Set vendor commission (≥ min, default 5%) | ✓ | ✓ | ✓ | — |
| Approve commission below minimum | ✓ | delegated* | — | — |
| Change platform default/min commission | ✓ | — | — | — |
| Grant below-min commission permission | ✓ | — | — | — |
| Suspend/delete vendor | ✓ | ✓ | — | — |
| Manage staff | ✓ | ✓ | — | — |
| Platform settings | ✓ | — | — | — |
| View audit log | ✓ | ✓ | ✓ | ✓ |

\* **Delegated:** staff with `staff_members.can_set_below_min_commission = true` (set by super_admin only).

**Commission defaults:** 5% (500 bps). Manager+ sets per vendor at onboarding. See [commission.md](../sourcebyjay-payments/references/commission.md).

**Enforce in RLS + server actions.** UI hiding alone is not enough.

## Ops routes (target)

```
/login
/dashboard
/vendors, /vendors/[id]
/vendors/[id]/onboarding
/vendors/[id]/verification
/vendors/[id]/gallery
/storefront-queue
/buyers
/orders (disputes)
/staff (admin+)
/audit-log
```

## Audit log (required for write actions)

```typescript
await supabase.from('audit_logs').insert({
  actor_id: userId,
  action: 'supplier.verify_gold',
  entity_type: 'supplier',
  entity_id: supplierId,
  metadata: { tier: 'gold', notes },
});
```

Log: approve/reject storefront, tier changes, gallery approval, **commission changes**, staff changes, suspensions.

## Vendor approval flows

1. **Storefront queue** — vendor completes onboarding → pending → ops approves → public
2. **Verification** — docs submitted → manager+ sets tier (basic/verified/gold/assessed)
3. **Gallery** — images `pending` → approved → visible on supplier profile

## Reference repos (patterns only)

- [Mercur admin](https://github.com/mercurjs/mercur) — moderation queues
- [Refine](https://github.com/refinedev/refine) — CRUD admin UX
- [Directus](https://github.com/directus/directus) — role model design

## First staff user (bootstrap)

After migration, super_admin inserts self (one-time SQL or seed):

```sql
INSERT INTO staff_members (user_id, role) VALUES ('<auth-user-uuid>', 'super_admin');
```

Never commit real UUIDs. Document in runbook only.

## Marketplace vs staff roles

| Table | Roles |
|-------|-------|
| `profiles.role` | `buyer` \| `seller` \| `admin` (legacy; migrate to staff_members for ops) |
| `staff_members.role` | ops portal only |

Prefer `staff_members` for all ops portal auth checks in Phase 2+.
