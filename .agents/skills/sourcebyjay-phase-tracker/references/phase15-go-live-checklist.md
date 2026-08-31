# Phase 15 — MVP go-live checklist

**Phase:** Infrastructure GO-LIVE  
**Owner signs each row when it is truly done in production.**

Use this after code is merged and you have created accounts for Vercel, Supabase (prod), Sentry, PostHog, Inngest, and Resend.

---

## 1. Production URLs (three Vercel projects)

| # | Portal | Suggested URL | Vercel root directory | Signed |
|---|--------|---------------|----------------------|--------|
| 1 | Buyer | `https://www.sourcebyjay.com` | `apps/web` | ☐ |
| 2 | Seller | `https://sell.sourcebyjay.com` | `apps/vendor` | ☐ |
| 3 | Ops | `https://ops.sourcebyjay.com` | `apps/ops` | ☐ |

**ELI5 — Vercel (repeat 3 times, one per app):**

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your GitHub repo.
2. Set **Root Directory** to `apps/web` (then `apps/vendor`, then `apps/ops` for the other two projects).
3. Framework = **Next.js** (auto-detected). Build command = `pnpm build` (or leave default if Turbo works).
4. Add env vars from `.env.local.example` (prod values only — no local `localhost` URLs).
5. Click **Deploy**. When green, attach your domain in **Settings → Domains**.

**Health check after deploy:** open `https://<your-buyer-domain>/api/health` — should return JSON with `"ok": true`.

---

## 2. Production Supabase

| # | Task | Signed |
|---|------|--------|
| 1 | Create **prod** Supabase project (separate from local) | ☐ |
| 2 | Run migrations: from `apps/database`, link prod and `supabase db push` | ☐ |
| 3 | Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on all 3 Vercel projects | ☐ |
| 4 | Set `SUPABASE_SERVICE_ROLE_KEY` only on server env (never `NEXT_PUBLIC_*`) | ☐ |
| 5 | Enable 2FA on Supabase + GitHub (S0 manual) | ☐ |

---

## 3. Cross-portal env (all three apps)

| Variable | Example (prod) |
|----------|----------------|
| `NEXT_PUBLIC_BUYER_URL` | `https://www.sourcebyjay.com` |
| `NEXT_PUBLIC_VENDOR_ORIGIN` | `https://sell.sourcebyjay.com` |

---

## 4. Sentry (error tracking)

| # | Task | Signed |
|---|------|--------|
| 1 | Create Sentry project (or one project with `portal` tag) | ☐ |
| 2 | Set `SENTRY_DSN` on web, vendor, ops Vercel env | ☐ |
| 3 | Trigger a test error in staging → appears in Sentry | ☐ |

**Local dev check:** keys unset = Sentry silently off (safe).

---

## 5. PostHog (analytics)

| # | Task | Signed |
|---|------|--------|
| 1 | Create PostHog project | ☐ |
| 2 | Set `NEXT_PUBLIC_POSTHOG_KEY` on all 3 apps | ☐ |
| 3 | Optional: `NEXT_PUBLIC_POSTHOG_HOST` (default US cloud) | ☐ |
| 4 | Search once on buyer site → `search_submitted` event in PostHog | ☐ |

**Local dev check:** `http://localhost:3000/api/dev/observability-check` shows which keys are set.

---

## 6. Inngest (background jobs — buyer app only)

| # | Task | Signed |
|---|------|--------|
| 1 | Create Inngest app, connect to `apps/web` deploy URL | ☐ |
| 2 | Set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` on **web** Vercel env | ☐ |
| 3 | Sync functions at `/api/inngest` | ☐ |
| 4 | Dashboard shows `refresh-trend-scores` (daily stub) registered | ☐ |

---

## 7. Resend (transactional email)

| # | Task | Signed |
|---|------|--------|
| 1 | Verify sending domain in Resend | ☐ |
| 2 | Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` on web (and vendor if seller emails) | ☐ |
| 3 | Send one test email from staging | ☐ |

Code: `@sourcebyjay/observability/email` — skips safely when key missing in dev.

---

## 8. Security & CI (S0 leftovers)

| # | Task | Signed |
|---|------|--------|
| 1 | GitHub branch protection on `main` | ☐ |
| 2 | No `service_role` in client bundles | ☐ |
| 3 | CI green on `main` (CodeQL, lint, tests) | ☐ |

---

## 9. Visual demo (Phase 15 bar)

| # | Deliverable | Signed |
|---|-------------|--------|
| 1 | Prod URLs live (web, vendor, ops) | ☐ |
| 2 | PostHog events firing | ☐ |
| 3 | Background jobs running (Inngest) | ☐ |
| 4 | Sentry connected | ☐ |
| 5 | This checklist signed | ☐ |

---

## Owner gate

When rows above are honestly checked, reply:

```text
GO — Phase 15 complete.
```

Next planned phase: **5B** (chat UX parity — post go-live).
