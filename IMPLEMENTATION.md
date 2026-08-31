# SourceByJay — Implementation Phases

Master plan for building the B2B marketplace. Work **in order** — each phase has acceptance criteria before moving on.

**Stack:** Next.js 16 + Supabase (Postgres, Auth, Storage, Realtime) · Turborepo monorepo  
**Strategy:** Steal patterns from reference repos · implement in our stack · security baked into every phase

---

## Architecture (target)

| Portal | Domain | App | Users |
|--------|--------|-----|-------|
| **Buyer** | `sourcebyjay.com` | `apps/web` | Customers, buyers |
| **Vendor** | `sell.sourcebyjay.com` | `apps/vendor` | Suppliers (Seller Central) |
| **Ops** | `ops.sourcebyjay.com` | `apps/ops` | Backend team (super_admin → viewer) |

One Supabase project · shared `packages/ui`, `packages/types`, `packages/auth`.

---

## Reference repos (steal patterns, don’t migrate stack)

| Need | Reference |
|------|-----------|
| Starter / auth / Supabase | [Nextbase](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) (this repo’s upstream) |
| Order lifecycle, role dashboards | [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) |
| Marketplace + vendor/admin ops | [Mercur](https://github.com/mercurjs/mercur) |
| B2B quote/order states | [Medusa B2B recipes](https://docs.medusajs.com/resources/recipes/b2b) |
| Ops admin + RBAC UI | [Refine](https://github.com/refinedev/refine) + Mercur admin |
| Chat | [Supabase Realtime demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) |
| AI search | [Supabase vector search](https://supabase.com/docs/guides/ai/examples/nextjs-vector-search) |
| UI layout | Figma (sourcebyjay) + Alibaba (UX patterns only) |

---

## Phase map (overview)

```
S0  Security hardening          ← START HERE (before customers)
 1  Trust & supplier media
 2  Three portals + buyer account
 3  B2B order flow (RFQ → pay track)
 4  Chat
 5  Reviews & request listing
 6  AI search
 8  Figma (3 design files)
 7  Payments (when business-ready)
```

---

## Phase S0 — Security hardening (1–2 weeks)

**Goal:** Safe to onboard real customers as solo founder.

**Status:** CI/CodeQL/e2e configured locally — **push + finish hardening before Phase 1.**

### Deliverables

| # | Task | App / area |
|---|------|------------|
| S0.1 | Push `.github/workflows/*`, `.coderabbit.yaml`, `SECURITY.md`, Dependabot | GitHub |
| S0.2 | Enable branch protection on `main` (CI + CodeQL required) | GitHub Settings |
| S0.3 | RLS audit migration — remove conflicting policies; public reads only `published` products | `apps/database` |
| S0.4 | `staff_members` + `audit_logs` tables + RLS | `apps/database` |
| S0.5 | Security headers (CSP, HSTS, X-Frame-Options) | `apps/web` |
| S0.6 | Rate limiting on auth + inquiry server actions | `apps/web` |
| S0.7 | Supabase prod project + env separation (never dev data in prod) | Supabase + Vercel |
| S0.8 | Auth hardening: email confirm, leaked-password protection | Supabase Dashboard |
| S0.9 | `/privacy` + `/terms` placeholder pages | `apps/web` |
| S0.10 | 2FA on GitHub, Supabase, Vercel accounts | Manual |

### Acceptance criteria

- [ ] CI, CodeQL, Playwright green on `main` in GitHub Actions
- [ ] No `service_role` key in client bundle or `NEXT_PUBLIC_*`
- [ ] Anonymous user cannot read draft products via API
- [ ] Every new table has RLS enabled
- [ ] Production Supabase separate from local

### References

- Supabase RLS docs · OWASP ASVS (lite) · existing `SECURITY.md`

---

## Phase 0 — Foundation ✅ DONE

**Goal:** Marketplace scaffold on Nextbase.

### Done

- [x] Buyer storefront: home, search, product, supplier
- [x] Mock data + Supabase fallback
- [x] Seller listings CMS (temporary in `apps/web`)
- [x] RFQ / inquiries
- [x] Admin supplier verify (basic)
- [x] Full-text search, category tree, image upload
- [x] Git remote → `project-mtfbwu/sourcebyjay`

---

## Phase 1 — Trust & supplier media (2 weeks)

**Goal:** Alibaba-style trust on public supplier pages.

**Depends on:** S0 complete

### Schema (`apps/database/schemas/` → migration)

```sql
suppliers.verification_tier  -- none | basic | verified | gold | assessed
supplier_gallery             -- type: factory | showroom | warehouse | godown | team | certificate
supplier_certificates        -- name, file_url, expires_at
supplier_verification_requests -- tier_requested, status, reviewer_id, notes
```

Storage bucket: `supplier-media` (RLS: seller upload → ops approve → public read)

### Buyer app (`apps/web`)

| Route / UI | Work |
|------------|------|
| Supplier profile | “Factory tour” tab, gallery carousel |
| Product/supplier cards | Gold / verified badge |
| `/search` | Filter: Gold suppliers only |

### Ops (temporary in `apps/web/dashboard/admin` until Phase 2)

| Route | Work |
|-------|------|
| `/dashboard/admin/suppliers` | Set tier, review gallery, approve/reject images |

### Acceptance criteria

- [ ] Gold badge visible on approved suppliers only
- [ ] Unapproved gallery images not visible on public site
- [ ] Ops action written to `audit_logs`

### References

Mercur verification · Alibaba supplier page layout

---

## Phase 2 — Three portals + buyer account (3 weeks)

**Goal:** Split buyer / vendor / ops · move seller CMS off buyer site.

**Depends on:** Phase 1

### Monorepo

```
apps/vendor/     → sell.sourcebyjay.com
apps/ops/        → ops.sourcebyjay.com
packages/ui/
packages/types/
packages/auth/   → hasStaffRole(), permission matrix
```

### Buyer (`apps/web`)

| Route | Work |
|-------|------|
| `/account/profile` | Company, country, industry, phone |
| `/account/inquiries` | Sent RFQs |
| Header | “Sell on SourceByJay” → vendor domain |
| Remove | Seller listing CMS from buyer nav |

### Vendor (`apps/vendor`) — **new app**

| Route | Work |
|-------|------|
| `/register` | Seller signup |
| `/onboarding` | Company, categories, docs |
| `/dashboard` | Overview KPIs |
| `/listings`, `/listings/new`, `/listings/[id]/edit` | Move from web |
| `/gallery`, `/settings` | Factory photos, company profile |

### Ops (`apps/ops`) — **new app**

| Route | Work |
|-------|------|
| `/login` | Staff only (must exist in `staff_members`) |
| `/dashboard` | Pending approvals count |
| `/vendors`, `/vendors/[id]` | Client records (team fills details) |
| `/vendors/[id]/verification` | Gold tier workflow |
| `/vendors/[id]/gallery` | Approve factory/godown images |
| `/storefront-queue` | Approve vendor going live |
| `/staff` | super_admin + admin: manage team |
| `/audit-log` | All staff actions |

### Staff RBAC

| Role | Scope |
|------|-------|
| super_admin | All + platform settings |
| admin | Vendors, verification, staff (no platform settings) |
| manager | Edit clients, approve storefront/gold/media |
| viewer | Read-only |

### Acceptance criteria

- [ ] Buyer cannot access vendor app without seller role
- [ ] Vendor cannot access ops app
- [ ] Each staff role enforced in **RLS + server**, not UI only
- [ ] Listings CRUD only on vendor domain

### References

Ruang Usaha Kita · Mercur admin/vendor panels · Refine

---

## Phase 3 — B2B order flow (3 weeks)

**Goal:** RFQ → quote → confirm → track (payment stub).

**Depends on:** Phase 2

### Schema

```sql
quotes        -- inquiry_id, price, qty, lead_time, valid_until, status
orders        -- quote_id, buyer_id, supplier_id, total, status
order_events  -- timeline entries
payments      -- stripe_intent_id (nullable stub)
```

**Order statuses:** `pending_confirmation` → `confirmed` → `awaiting_payment` → `paid` → `in_production` → `shipped` → `delivered` → `completed` | `cancelled`

### Apps

| App | Routes |
|-----|--------|
| web | `/account/orders`, confirm quote UI on inquiry thread |
| vendor | `/quotes`, `/orders`, status updates |
| ops | `/orders` (read + dispute flag), viewer read-only |

### Acceptance criteria

- [ ] Full flow works: inquiry → quote → accept → order → status timeline
- [ ] Buyer/seller see only their orders (RLS)
- [ ] Order events append-only in audit trail

### References

Mercur order groups · Medusa B2B · Ruang Usaha Kita

---

## Phase 4 — Chat (2 weeks)

**Goal:** Buyer ↔ supplier messaging.

**Depends on:** Phase 3 (link to inquiry/order)

### Schema

```sql
conversations  -- buyer_id, supplier_id, inquiry_id?, order_id?
messages         -- body, attachments, read_at
```

Supabase Realtime · private channels · RLS

### Apps

| App | UI |
|-----|-----|
| web | Chat drawer on product/supplier; `/account/messages` |
| vendor | `/messages` inbox |
| ops | Optional read-only for disputes |

### Acceptance criteria

- [ ] Real-time message delivery
- [ ] Users only see their conversations

### References

Supabase Realtime nextjs-authorization-demo

---

## Phase 5 — Reviews & request listing (2 weeks)

**Goal:** Social proof + buyer-posted sourcing requests.

**Depends on:** Phase 3 (verified purchase reviews)

### Schema

```sql
supplier_reviews, product_reviews  -- verified_order_id required for “verified” badge
review_replies
listing_requests                   -- buyer posts need
listing_request_offers             -- supplier bids
```

### Apps

| App | Routes |
|-----|--------|
| web | Reviews on pages; `/request-listing` |
| vendor | `/opportunities`; review replies |
| ops | Moderation queue for flagged content |

### Acceptance criteria

- [ ] Only completed-order buyers can leave verified reviews
- [ ] Buyer can post request; vendors can offer

### References

Ruang Usaha Kita reviews · Mercur offers

---

## Phase 6 — AI search (2 weeks)

**Goal:** Semantic product discovery.

**Depends on:** Phase 1+ (product catalog stable)

### Schema

- Enable `pgvector` on Supabase
- `products.embedding` (1536 dims)
- RPC `match_products(query_embedding, threshold, count)`
- Trigger/edge job to embed on product save

### Apps

| App | Work |
|-----|------|
| web | “AI Mode” on hero search; hybrid tsvector + vector |

### Acceptance criteria

- [ ] Natural language queries return relevant products
- [ ] Fallback to keyword search if embedding fails

### References

supabase-community/nextjs-openai-doc-search

---

## Phase 7 — Payments (when business-ready)

**Goal:** Deposits, milestones, seller payouts.

**Depends on:** Phase 3, legal review

- Stripe Connect seller onboarding
- Webhook signature verification
- Idempotent order payment state machine
- Platform commission (optional)

**Do not store card data** — Stripe only.

### References

Stripe Connect docs · B2B Wholesale OS article

---

## Phase 8 — Figma personalization (after Phases 1–6)

**Goal:** Lock palette on **built** screens, not guesses.

### Three Figma files

1. **SourceByJay Buyer** — web app screens  
2. **SourceByJay Seller** — vendor app (Seller Central density)  
3. **SourceByJay Ops** — ops app (tables, queues)

### Workflow

1. Build phases in code  
2. Screenshot key flows  
3. Figma with palette (`#76EE59`, Roboto, gold badge tokens)  
4. Sync tokens → `packages/ui` + CSS variables  

---

## Per-phase workflow (always)

1. **Schema first** — edit `apps/database/supabase/schemas/*.sql`  
2. **Generate migration** — `cd apps/database && supabase db diff -f <name>`  
3. **RLS + pgTap tests** for every new table  
4. **Server actions** with Zod validation  
5. **UI** in correct app (web / vendor / ops)  
6. **Playwright e2e** for critical paths  
7. **PR** → CI + CodeQL + CodeRabbit  

Never edit migration files manually (see `AGENTS.md`).

---

## Post go-live phases (not in MVP bar)

### Phase 5B — Chat UX parity + seller notifications (~2–3 weeks)

**Goal:** Alibaba Message Center UX on existing Supabase chat + optional seller PWA.

**Depends on:** Phase 5 (done), Phase 15 (infra for push/email).

| Slice | Deliverables |
|-------|----------------|
| A | Multi-thread sidebar, quick questions, product pin, attachments, unread badges |
| B | Seller PWA + web push (or email fallback) for messages/RFQs |

**Spec:** `.agents/skills/sourcebyjay-b2b-workflows/references/chat-ux-parity.md`

**Not in scope:** Stream/Sendbird, voice/video calls (defer).

---

### Phase 18 — Supplier factory mini-site (~2–3 weeks)

**Goal:** Alibaba-style company storefront from product detail company card.

**Depends on:** Phase 1 (gallery), Phase 14 (video tab optional).

| Slice | Deliverables |
|-------|----------------|
| A | Mobile-first `/suppliers/[slug]`, PDP company card, `?productId=` banner, sticky contact bar |
| B | Business+ `/factory/{slug}` mini-site mode |
| C | Vendor storefront preview + edit in `:3001` |

**Spec:** `.agents/skills/sourcebyjay-b2b-workflows/references/supplier-factory-minisite.md`

---

## CI / security (runs every phase)

| Check | When |
|-------|------|
| `pnpm typecheck` | Every PR |
| `pnpm lint` | Every PR |
| `pnpm test` | Every PR |
| CodeQL | Every PR + weekly |
| Playwright e2e | Every PR to `main` |
| CodeRabbit | Every PR |
| Dependabot | Weekly PRs |

---

## Git & deployment milestones

| Milestone | When |
|-----------|------|
| Push S0 security workflows | End of S0 |
| Production Supabase + Vercel | Before first real customer |
| `sell.*` + `ops.*` DNS | Phase 2 |
| Stripe live mode | Phase 7 |

**Remotes**

- `origin` → https://github.com/project-mtfbwu/sourcebyjay.git  
- `upstream` → nextbase starter (updates only)

---

## Time estimate (solo, part-time)

| Phase | Duration |
|-------|----------|
| S0 Security | 1–2 weeks |
| 1 Trust | 2 weeks |
| 2 Three portals | 3 weeks |
| 3 Orders | 3 weeks |
| 4 Chat | 2 weeks |
| 5 Reviews + requests | 2 weeks |
| 6 AI search | 2 weeks |
| 8 Figma | 1 week |
| 7 Payments | 2–3 weeks |

**~4–5 months** part-time to full MVP with ops portal and orders.

---

## Start command

```bash
# Phase S0 — first task
git add .github .coderabbit.yaml SECURITY.md
git commit -m "chore: security CI, CodeQL, CodeRabbit, Dependabot"
git push origin main
```

Then say: **“Start Phase S0”** or **“Start Phase S0.3 RLS audit”** to implement in the repo.
