---
name: sourcebyjay-security-review
description: >-
  Security checklist and hardening for SourceByJay before customer onboarding.
  Use when implementing features, completing a phase, reviewing PRs, or when the
  user mentions security, RLS, secrets, auth, rate limits, or production readiness.
---

# SourceByJay Security Review

Apply on **every phase** before visual review. Read current phase in [phase-state.json](../sourcebyjay-phase-tracker/phase-state.json).

## Non-negotiables

- RLS enabled on **every** new table
- No `service_role` key in client or `NEXT_PUBLIC_*`
- Auth checks in server actions **and** RLS (never UI-only)
- Zod validation on all server action inputs
- Rate limit auth, RFQ, and signup endpoints
- Audit log for ops actions (staff writes)

## Pre-customer checklist (Phase S0+)

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Draft products hidden from anon | Query as anon; only `status=published` |
| 2 | Seller sees only own listings | RLS + test as seller user |
| 3 | Buyer sees only own inquiries/orders | RLS |
| 4 | Staff roles enforced in DB | `staff_has_min_role()` policies |
| 5 | Storage buckets scoped | User folder prefix in path; RLS on bucket |
| 6 | Security headers | DevTools → Network → response headers |
| 7 | CI green | GitHub Actions: CI, CodeQL, Playwright |
| 8 | No secrets in git | Gitleaks / CodeRabbit / manual grep |
| 9 | Prod Supabase separate | Never real customer data on local |
| 10 | Privacy + Terms live | `/privacy`, `/terms` |

Full policy: [SECURITY.md](../../../SECURITY.md)

## Per-phase security focus

| Phase | Extra checks |
|-------|--------------|
| S0 | Headers, rate limits, staff/audit schema |
| 1 | Unapproved gallery images not public; gold tier RLS |
| 2 | Cross-portal auth isolation; staff RBAC on ops app |
| 3 | Order access scoped buyer/seller; idempotent state changes |
| 4 | Chat RLS; private Realtime channels only |
| 5 | Verified-purchase reviews only; moderation queue |
| 6 | Embedding API key server-only |
| 7 | Stripe webhooks verified; no card data stored |

## Schema security pattern

```sql
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
-- Always add SELECT/INSERT/UPDATE policies explicitly
-- Never rely on "security through obscurity"
```

Use [supabase-schema-migrations](../supabase-schema-migrations/SKILL.md) for workflow.

## Server action pattern

```typescript
// 1. authActionClient or explicit getLoggedInUserId
// 2. assertRateLimit(key, limit, windowMs)
// 3. Zod parse input
// 4. Supabase with user client (not service role unless ops job)
```

## When to block phase completion

Stop and fix before visual demo if:

- Any new table lacks RLS
- Service role used in `apps/web` client bundle
- Admin-only action lacks server-side role check
- CodeQL or CI failing on security findings (high/critical)

## Reporting in Phase Review Card

Include section:

```markdown
### Security status
- [x] RLS on new tables
- [x] No new secrets exposed
- [ ] [any open items]
```

See [ci-quality](../sourcebyjay-ci-quality/SKILL.md) for automated checks.
