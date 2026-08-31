# Visual demo checklist — per phase

Run dev server: `pnpm dev` → http://localhost:3000

Use browser tools or manual browsing. Capture screenshots for key screens.

Full acceptance criteria: [IMPLEMENTATION.md](../../../../IMPLEMENTATION.md)  
Gap map: [ALIBABA-INDIA-MVP.md](../../sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md)

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
| 5 | Home past searches + personalized grid | `/` |

---

## Phase 2 — Three portals

| # | App | URL |
|---|-----|-----|
| 1 | Buyer profile + GSTIN | `/account/profile` |
| 2 | Vendor dashboard | `sell.*` / `:3001` |
| 3 | Ops login + vendor list | `ops.*` / `:3002` |
| 4 | Buyer cannot see seller CMS | verify nav on web |
| 5 | Buyer signup OTP | `/sign-up` — Send OTP → code `123456` local |
| 6 | Seller signup OTP | `:3001/signup` — phone first, then form |
| 7 | Ops form field toggles | `:3002/form-fields` (staff manager+) |

---

## Phase 17 — Vendor listing plans

| # | Flow |
|---|------|
| 1 | Free tier — 5 listing cap |
| 2 | `/plans` pricing compare |
| 3 | Pro upgrade → Guarantee eligible |
| 4 | Ops assign Enterprise / comp months |

---

## Phase 3 — B2B orders + fake payment slab

| # | Flow |
|---|------|
| 1 | Buyer RFQ → seller `/quotes` → Send quote |
| 2 | Buyer `/account/quotes` → Accept → order |
| 3 | Buyer `/account/orders` → **Mark paid (test)** (fake slab, not Stripe) |
| 4 | Seller `/orders` → production → shipped → delivered |
| 5 | Ops `/orders` → can also Mark paid (test) |

---

## Phase 4 — Multi-supplier RFQ (select from search)

| # | Flow |
|---|------|
| 1 | `/search?rfq=1` → slider picks suppliers (one RFQ per factory) |
| 2 | RFQ cart (top-right) → Request quotes → `/rfq/new` → Send |
| 3 | Seller `/quotes` shows broadcast RFQ + can quote |
| 4 | Buyer accepts quote → Phase 3 order path |

---

## Phase 5 — Chat

| # | Flow |
|---|------|
| 1 | Product page → **Chat** → **right-side panel** (stay on product; Alibaba-style) |
| 2 | Buyer sends message in panel; seller sees it on `:3001/messages` |
| 3 | Seller replies; buyer sees it live in the panel |
| 4 | Header **Messages** → full inbox at `/account/messages` |

---

## Phase 6 — Reviews, favorites, compare

| # | URL / flow |
|---|------------|
| 1 | `/request-listing` |
| 2 | Reviews on product/supplier |
| 3 | Save favorite product/supplier |
| 4 | Compare tray (2–4 suppliers) |

---

## Phase 7 — Search engine

| # | URL / flow |
|---|------------|
| 1 | `/search?mode=products` + facets |
| 2 | `/search?mode=suppliers` |
| 3 | Autocomplete typeahead |
| 4 | Sort + search-within-results |
| 5 | Trending reflected on home |

---

## Phase 8 — AI + image search

| # | URL |
|---|-----|
| 1 | AI mode natural language query |
| 2 | Image upload search |
| 3 | Fallback to keyword search |

---

## Phase 9 — SourceByJay Guarantee + disputes

| # | Flow |
|---|------|
| 1 | Guarantee badge on Pro+ listing |
| 2 | Search filter “SourceByJay Guarantee” |
| 3 | On-platform checkout shows Guarantee terms |
| 4 | Open dispute from order (30-day window) |
| 5 | Ops dispute queue + resolution |

---

## Phase 10 — Payments

| # | Flow |
|---|------|
| 1 | Stripe test checkout + Guarantee escrow |
| 2 | Order marked paid + 5% fee |
| 3 | Vendor Connect onboarding |
| 4 | Listing plan subscription renewal |

---

## Phase 11 — Logistics

| # | Flow |
|---|------|
| 1 | Freight estimate on quote/order |
| 2 | FOB/CIF display |
| 3 | India pincode zone estimate |

---

## Phase 12 — Global i18n + compliance

| # | Flow |
|---|------|
| 1 | Language switcher (en ↔ hi) |
| 2 | INR (India) / USD (international buyer) |
| 3 | Guarantee copy in Hindi |
| 4 | HS code + GST on product; GSTIN on profiles |
| 5 | Export vendor visible to intl buyer segment |

---

## Phase 13 — Ad campaigns (CPC + sponsored search)

| # | Flow |
|---|------|
| 1 | Vendor creates campaign: keywords + max CPC + daily budget |
| 2 | Sponsored results at top of `/search` with “Sponsored” label |
| 3 | Click debits ad wallet (CPC) |
| 4 | Ops creates campaign on behalf of vendor |
| 5 | Ops pauses fraudulent campaign |
| 6 | Spend/impression/click report on vendor dashboard |

---

## Phase 14 — Video media

| # | Flow |
|---|------|
| 1 | Business+ seller: factory video on supplier **Videos** tab (separate from Factory photo tour) |
| 2 | Pro+ seller: product video URL + **Show on product page** toggle → PDP play icon |
| 3 | Ops gallery queue: **Photos / Videos** filter + approve/reject |
| 4 | Free seller blocked at video slot limit (upsell) |
| 5 | Mobile 375px: video grid + PDP play works |

**Demo seed:** `sparkads-factory` (Business plan) + `spark-anc-earbuds-pro` product video — login `ads-demo-seller@sourcebyjay.test` / `Password123!`

---

## Phase 18 — Supplier factory mini-site

| # | Flow |
|---|------|
| 1 | Product page → **company card** → factory page (Alibaba `from=detail_company_card`) |
| 2 | Factory page mobile (375px): hero, badges, sticky Chat/RFQ |
| 3 | `?productId=` shows “You viewed this product” banner |
| 4 | Factory tour tab + product grid + certificates |
| 5 | Business+ supplier: `/factory/{slug}` share URL (optional subdomain scout) |

---

## Phase 15 — Infrastructure GO-LIVE

| # | Deliverable |
|---|-------------|
| 1 | Prod URLs live (web, vendor, ops) |
| 2 | PostHog events firing |
| 3 | Background jobs running |
| 4 | Sentry connected |
| 5 | MVP go-live checklist signed |

---

## Phase 5B — Chat UX parity + seller PWA (post go-live)

**Not in MVP bar.** Run after Phase 15 GO-LIVE. Spec: [chat-ux-parity.md](../../sourcebyjay-b2b-workflows/references/chat-ux-parity.md)

| # | Flow |
|---|------|
| 1 | Buyer: multi-thread **Messages** sidebar with unread badge |
| 2 | Quick question chips send one-tap (price, MOQ, sample, etc.) |
| 3 | Product context bar pinned above composer on product-page chat |
| 4 | Image/file attachment in thread (Supabase Storage) |
| 5 | Seller PWA: install → receive push on new message/RFQ → open thread |

---

## Phase 16 — Figma

| # | Deliverable |
|---|-------------|
| 1 | Three Figma file links |
| 2 | Token sync confirmation |
