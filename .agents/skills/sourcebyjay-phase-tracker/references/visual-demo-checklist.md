# Visual demo checklist — per phase

Run dev server: `pnpm dev` → http://localhost:3000

Use browser tools or manual browsing. Capture screenshots for key screens.

---

## Phase S0 — Security (no major UI; verify pages + CI)

| # | What to show | URL / action |
|---|--------------|--------------|
| 1 | Privacy page | `/privacy` |
| 2 | Terms page | `/terms` |
| 3 | Draft products hidden | API/RLS test summary in review card |
| 4 | GitHub Actions green | Link to Actions tab |
| 5 | Security headers | DevTools → Network → response headers |

---

## Phase 1 — Trust & supplier media

| # | What to show | URL |
|---|--------------|-----|
| 1 | Gold badge on supplier card | `/suppliers/jaytech-industries` |
| 2 | Factory tour tab | same |
| 3 | Gold filter in search | `/search?verified=gold` |
| 4 | Admin verification queue | `/dashboard/admin/suppliers` |
| 5 | Gallery upload (vendor temp) | dashboard gallery route |

---

## Phase 2 — Three portals

| # | App | URL |
|---|-----|-----|
| 1 | Buyer profile | `sourcebyjay.com/account/profile` |
| 2 | Vendor dashboard | `sell.localhost` or vendor port |
| 3 | Ops login + vendor list | `ops.localhost` |
| 4 | Buyer cannot see seller CMS | verify nav on web |

---

## Phase 3 — B2B orders

| # | Flow |
|---|------|
| 1 | RFQ → quote → accept → order timeline |
| 2 | Buyer `/account/orders` |
| 3 | Vendor `/orders` status update |

---

## Phase 4 — Chat

| # | Flow |
|---|------|
| 1 | Chat drawer on product page |
| 2 | Real-time message on both sides |

---

## Phase 5 — Reviews & request listing

| # | URL |
|---|-----|
| 1 | `/request-listing` |
| 2 | Reviews on product/supplier |
| 3 | Vendor opportunities |

---

## Phase 6 — AI search

| # | URL |
|---|-----|
| 1 | `/search?q=...` AI mode |
| 2 | Natural language query demo |

---

## Phase 8 — Figma

| # | Deliverable |
|---|-------------|
| 1 | Three Figma file links |
| 2 | Token sync confirmation |

---

## Phase 7 — Payments

| # | Flow |
|---|------|
| 1 | Stripe test checkout |
| 2 | Order marked paid |
