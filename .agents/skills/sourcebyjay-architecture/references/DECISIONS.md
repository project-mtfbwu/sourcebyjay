# SourceByJay — Locked Decisions

**Status:** Final. Do not revisit without explicit user request.

Agents must follow these when implementing any phase.

---

## Stack & strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary stack | Next.js 16 + Supabase | User requirement; Nextbase starter base |
| Do NOT migrate to | Medusa, Refine, Directus as primary | Steal patterns only; build in our stack |
| Monorepo | pnpm + Turborepo | From Nextbase starter |
| Reference approach | Copy workflows/schema ideas from OSS | See `sourcebyjay-reference-repos` skill |

---

## Branding & UX

| Decision | Choice |
|----------|--------|
| Layout reference | Alibaba.com B2B marketplace patterns |
| Brand | SourceByJay — green `#76EE59`, Roboto (storefront), Inter (dashboard) |
| Figma timing | **Build first, Figma Phase 8** — not blocking Phases 1–6 |
| Initial scope (Phase 0) | Full buyer flow with mock data → Supabase fallback |

---

## Architecture

| Decision | Choice |
|----------|--------|
| Portals | 3 apps: `apps/web` (buyer), `apps/vendor` (seller), `apps/ops` (staff) |
| Domains | `sourcebyjay.com`, `sell.sourcebyjay.com`, `ops.sourcebyjay.com` |
| Backend | One Supabase project for all portals |
| Seller CMS location | Temporary in `apps/web` until Phase 2 vendor app ships |
| Public data layer | `createSupabaseAnonServerClient` + `"use cache"` — no cookies on public pages |
| Auth on public pages | Client-side only where needed (e.g. InquiryDialog login check) |

---

## Security (Phase S0)

| Decision | Choice |
|----------|--------|
| RLS | Required on every table |
| Staff RBAC | `super_admin`, `admin`, `manager`, `viewer` via `staff_members` |
| Audit | `audit_logs` for ops actions |
| Rate limiting | RFQ/inquiries + auth endpoints |
| Security headers | `next.config.ts` |
| Legal pages | `/privacy`, `/terms` with footer links |
| CI scanning | CodeQL + Dependabot + CodeRabbit |
| Schema workflow | `schemas/*.sql` → `supabase db diff` — never hand-edit migrations |
| Copilot subscription | **Not required** for CI/CodeQL/CodeRabbit |

---

## Delivery process

| Decision | Choice |
|----------|--------|
| Phase order | S0 → 1 → 2 → 3 → 4 → 5 → 6 → 8 (Figma) → 7 (Payments) |
| Visual gate | Mandatory Phase Review Card after each phase |
| User authority | **GO / HOLD / CHANGE is final** — agent never auto-advances |
| Commits | Only when user asks |
| Push | Only when user asks |

---

## Payments (Phase 7 — deferred)

| Decision | Choice |
|----------|--------|
| Provider | Stripe Connect |
| Card storage | Never — Stripe handles PCI |
| Platform commission | **5% default**, min 5%, per-vendor rate at ops onboarding |
| Below 5% | super_admin only, or staff with delegated permission |
| Fee collection | Stripe `application_fee_amount` on each order payment |
| Go-live | Requires explicit user approval + legal terms |

Implementation references: **Stripe Connect marketplace docs** (primary), Mercur + Medusa marketplace recipe (patterns only). See `sourcebyjay-payments/references/commission.md`.

---

## Git

| Remote | URL |
|--------|-----|
| `origin` | `project-mtfbwu/sourcebyjay` |
| `upstream` | `imbhargav5/nextbase-nextjs-supabase-starter` |

CI runs on `project-mtfbwu/sourcebyjay` (not upstream repo name).

---

## Skills location

All project skills in `.agents/skills/` only. Index: [README.md](../../README.md).

Never duplicate to `.cursor`, `.codex`, or `.claude`.
