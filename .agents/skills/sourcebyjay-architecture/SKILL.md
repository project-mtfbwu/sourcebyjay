---
name: sourcebyjay-architecture
description: >-
  Three-portal monorepo architecture for SourceByJay — buyer, vendor, and ops
  domains, shared packages, and Supabase backend. Use when scaffolding apps,
  routing, auth boundaries, or planning where code lives.
---

# SourceByJay Architecture

## Three portals · one backend

| Portal | Domain | App | Users |
|--------|--------|-----|-------|
| Buyer | `sourcebyjay.com` | `apps/web` | Customers |
| Vendor | `sell.sourcebyjay.com` | `apps/vendor` | Suppliers |
| Ops | `ops.sourcebyjay.com` | `apps/ops` | Backend team |

One Supabase project. Shared packages:

```
packages/ui/      — shadcn, badges, gold verified
packages/types/   — Product, Supplier, Order, Staff
packages/auth/    — hasStaffRole(), portal guards
```

## Target monorepo

```
sourcebyjay/
├── apps/web/           # buyer storefront + /account
├── apps/vendor/        # Seller Central
├── apps/ops/           # staff CMS
├── apps/database/      # Supabase
└── packages/{ui,types,auth}/
```

## Auth boundaries

| User | Can access |
|------|------------|
| Anonymous | Public storefront only |
| `buyer` | web + `/account/*` |
| `seller` | vendor app |
| `staff_members.*` | ops app (by role rank) |

Middleware on each app redirects wrong portal → correct signup/login.

## Data access layers

| Layer | Client | Use |
|-------|--------|-----|
| Public reads | `createSupabaseAnonServerClient` + `use cache` | Product search, supplier pages |
| User writes | `createSupabaseClient` (cookies) | RFQ, profile, listings |
| Ops writes | staff-checked server actions | Approvals, audit |

See [nextjs-cache-components](../nextjs-cache-components/SKILL.md) for cached public reads.

## What lives where (Phase 2 split)

| Feature | App |
|---------|-----|
| Home, search, product, supplier | web |
| Buyer profile, inquiries, orders | web `/account` |
| Listings CMS, quotes, vendor orders | vendor |
| Client records, verification, staff | ops |

Remove seller CMS from web when `apps/vendor` ships.

## Env files

- Root `.env.local` / `.env.development.local` (repo root per AGENTS.md)
- Never overwrite existing env files
- Prod keys only in Vercel/Supabase prod — never in git

## Git remotes

- `origin` → `project-mtfbwu/sourcebyjay`
- `upstream` → nextbase starter (updates only)

Full plan: [IMPLEMENTATION.md](../../../IMPLEMENTATION.md)

Locked decisions: [references/DECISIONS.md](references/DECISIONS.md) — **do not override without user approval**.
