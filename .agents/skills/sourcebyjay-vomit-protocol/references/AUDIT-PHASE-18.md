# Retrospective scout — Phase 18 Factory mini-site (2026-08-30)

**Owner decision:** **APPROVE catch-up** (2026-08-30)

**Why:** Close Phase 18 honestly before Phase 15 (Infrastructure GO-LIVE). List what shipped, what we fixed in the polish week, and what remains.

**Alibaba reference:** Company card on PDP → factory storefront (`from=detail_company_card`); Business+ share URL `/factory/{slug}`.

**Spec:** [supplier-factory-minisite.md](../../sourcebyjay-b2b-workflows/references/supplier-factory-minisite.md)

---

## Verdict

Phase 18 **core slices work** for demo:

| Slice | Status |
|-------|--------|
| **A** Enhanced factory / supplier page | Done enough — hero, tabs, sticky Chat/RFQ, product context |
| **B** `/factory/{slug}` for Business+ | Done (path-based; no custom subdomain) |
| **C** Seller storefront studio + ops queue | Done — editor + live preview + versions + ops approve |

Buyer happy-path (PDP company card → factory page → Chat/RFQ) and seller happy-path (edit draft → preview → submit → ops approve) are real.

Remaining items are **polish / data / infra**, not “feature never built.” Safe to advance to Phase 15 after Owner **APPROVE**s that phase’s vomit proposal.

---

## What matches Alibaba (keep)

| Area | Match |
|------|--------|
| PDP company card | `SupplierMiniCard` → `?productId=&from=detail_company_card` |
| Factory / supplier page | Hero, badges, stats strip, tabs (Home / Products / Factory / Videos / Certificates / About) |
| Sticky actions | Chat · RFQ on mobile bar |
| Business+ mini-site URL | `/factory/{slug}` with lighter chrome |
| Seller marketing editor | Banner, logo, featured products, about, main product lines |
| Version → ops → publish | Draft / pending_review / published; ops `/storefront-queue` |
| Live preview | Meta-style iframe draft sync (postMessage) |

---

## Updates shipped this session (polish week)

| Update | Why it mattered |
|--------|-----------------|
| Unified `/storefront` studio (settings redirect) | One place for marketing edits + preview |
| Version toolbar: Save draft / New version / Submit | Alibaba-style draft workflow |
| Locked-version banner → **Edit draft** / **New version** | Fixed “everything greyed out / nope” |
| Redirect after New version / Save to correct `?version=` | Stopped landing on locked pending URL |
| Auto-create editable draft if only pending exists | Seller never stuck with zero drafts |
| Thumbnail grid instead of Chonky modal for banner/logo | Image pick less confusing |
| Same-origin media proxy (`/api/media/serve`, `/api/supplier-media`) | Preview/thumbs don’t depend on brittle `localhost:54321` img loads |
| Filter tiny / corrupt uploads; reject bad `test-2mb.png` | Stopped 404 / broken banner |
| Removed Unsplash from seed, mocks, configs, live DB | No more next/image hostname crashes |
| `safeMarketplaceImageSrc` for sponsored ads | Ad sidebar can’t crash on legacy Unsplash |
| Placeholder copied to **vendor** `public/mockups/` | Featured listing thumbs work on `:3001` |
| Preview READY handshake keeps pinging + iframe onLoad fallback | Fewer “Loading forever” false negatives |
| Dev CSP `frame-ancestors` relaxed for local embed | Seller can iframe buyer preview |

---

## Gaps vs Alibaba / acceptance criteria

### Blockers (none for Phase 18 advance)

No Phase-18-specific blockers remaining for go-live **feature** bar. Infra blockers live in **Phase 15** (prod DNS, Sentry, etc.).

### Should-fix (before or during Phase 15 / early ops)

| # | Gap | Alibaba / spec | Ours today | Suggested fix |
|---|-----|----------------|------------|---------------|
| 1 | Real product / banner photos | Real factory media | Many demos use `/mockups/placeholder.jpeg` | Owner uploads via Media library; update listings |
| 2 | Preview requires two processes | N/A | Needs `:3000` + `:3001` | Document in README; Phase 15 single deploy helps |
| 3 | Ops approve → live publish end-to-end demo | Approve goes live | Code exists; session didn’t fully click through | Owner click: submit draft → ops approve → public page |
| 4 | Corrupt media still in library until deleted | Clean assets | Rejected status hides from picker; file still in storage | Seller deletes rejected junk in Media library |
| 5 | Relative placeholder URLs in DB | Absolute CDN | `/mockups/...` works per-app public folder | Prefer storage URLs after real uploads |
| 6 | Subdomain mini-site `{slug}.sourcebyjay.com` | Alibaba subdomain | Path `/factory/{slug}` only | Defer to Enterprise / Phase 15+ DNS |
| 7 | Featured product thumbs on buyer if image missing | Always image | Placeholder / broken until upload | Upload real listing images |

### Later-ok (scheduled elsewhere)

| Gap | Where |
|-----|--------|
| Chat Message Center full UX + seller PWA | Phase **5B** (post go-live) |
| Custom domain `factory.com` | Enterprise later |
| VR / 360 factory | Future |
| Figma polish of storefront | Phase **16** |
| Prod stack, jobs, analytics | Phase **15** |

---

## Acceptance criteria scorecard (spec)

### Slice A

| Criterion | Status |
|-----------|--------|
| PDP company card Alibaba pattern | ✅ |
| Tap opens factory + optional product context | ✅ |
| Mobile sticky Chat/RFQ | ✅ |
| Factory tab approved gallery only | ✅ (existing Phase 1/14) |
| Chat + RFQ from factory page | ✅ |

### Slice B

| Criterion | Status |
|-----------|--------|
| Business+ `/factory/{slug}` | ✅ |
| Free/Starter `/suppliers/{slug}` | ✅ |
| Wildcard subdomain | ❌ deferred (later-ok) |

### Slice C

| Criterion | Status |
|-----------|--------|
| Seller preview from vendor portal | ✅ (live iframe) |
| Edit banner / about / featured / categories | ✅ |
| Ops storefront queue for versions | ✅ |

---

## Owner actions (ELI5 — optional polish)

### Step 1 — Put real photos on demo listings

**What this is:** Replace grey placeholders with your own JPGs.

**Why:** Buyers and featured-product checkboxes look empty without them.

**How:**
1. Open http://localhost:3001/media — upload images  
2. Open http://localhost:3001/listings — set product images  
3. Open http://localhost:3001/storefront — pick banner/logo thumbnails → **Save draft** → **Submit for review**

### Step 2 — Prove ops publish once

**How:**
1. Ops http://localhost:3002 → Storefront queue  
2. Approve pending version  
3. Buyer http://localhost:3000/factory/sparkads-factory — confirm live banner

---

## Next phase

**Phase 15 — Infrastructure GO-LIVE** (Inngest, PostHog, Sentry, Resend, prod DNS × 3).

Vomit proposal already shown. **Do not code Phase 15 until Owner replies `APPROVE` on that proposal** (catch-up APPROVE alone does not start infra work).
