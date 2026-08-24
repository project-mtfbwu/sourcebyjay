# Phase S0 — Manual checklist (you must do these)

Code deliverables are in the repo. These steps require your GitHub / Supabase / Vercel accounts.

---

## S0.1 — Push CI to GitHub

When ready, commit and push all S0 files:

```bash
git add .github/ .coderabbit.yaml SECURITY.md IMPLEMENTATION.md AGENTS.md .agents/
git add apps/web/next.config.ts apps/web/src/lib/rate-limit.ts apps/web/src/data/
git add apps/database/supabase/schemas/marketplace_security.sql
git commit -m "feat(phase-S0): security hardening, CI, skills, legal pages"
git push origin main
```

Verify at: https://github.com/project-mtfbwu/sourcebyjay/actions

Expected workflows: **CI**, **CodeQL**, **Integration Tests** (on PR/push).

---

## S0.2 — Branch protection on `main`

GitHub → **Settings** → **Branches** → **Add rule** for `main`:

- [ ] Require a pull request before merging (optional for solo — or require PR for safety)
- [ ] Require status checks: **CI** (lint/typecheck/build)
- [ ] Require status checks: **CodeQL** / **Analyze**
- [ ] Do not allow bypassing (except emergencies)
- [ ] Require branches to be up to date

---

## S0.3 + S0.4 — Run security migration (needs Docker)

1. Start **Docker Desktop**
2. From repo root:

```bash
pnpm database#start
cd apps/database
pnpm supabase db diff -f marketplace_security
pnpm supabase migration up
cd ../..
pnpm supabase:sync-env
pnpm gen-types-local
```

3. Confirm:
   - `staff_members` and `audit_logs` tables exist in Studio
   - Anon cannot read draft products (only `status = published`)
   - `products_select_all` policy is gone

---

## S0.7 — Production Supabase project

- [ ] Create a **separate** Supabase project for production (not local)
- [ ] Link prod in Vercel env vars — never use local keys in prod
- [ ] Run migrations on prod: `supabase db push` (from linked prod project)
- [ ] Never copy real customer data into local dev

---

## S0.8 — Auth hardening (Supabase Dashboard)

Project → **Authentication** → **Providers** → Email:

- [ ] Enable **Confirm email** before first sign-in
- [ ] Enable **Leaked password protection** (Pro plan) or enforce strong passwords in app (min 8 chars — done in code)

Project → **Authentication** → **URL configuration**:

- [ ] Set Site URL to production domain when deployed
- [ ] Add redirect URLs for `sourcebyjay.com`, vendor, ops subdomains

---

## S0.10 — 2FA on accounts

Enable 2FA on:

- [ ] GitHub (`project-mtfbwu`)
- [ ] Supabase organization
- [ ] Vercel team
- [ ] Email provider for `privacy@sourcebyjay.com` / domain admin

---

## After manual steps

Reply **GO** on the Phase S0 review card to advance to Phase 1 (Trust & media).

If anything is blocked (e.g. Docker not installed), say **HOLD** and what you need help with.
