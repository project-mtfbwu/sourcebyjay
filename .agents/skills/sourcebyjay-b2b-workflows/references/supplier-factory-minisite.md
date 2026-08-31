# Phase 18 — Supplier factory mini-site (Alibaba company storefront)

**Status:** Planned — **recommended before or at GO-LIVE** (core B2B buyer trust).  
**Depends on:** Phase 1 (trust/gallery — done), Phase 17 (plans — Business+ gets custom subdomain slice).  
**Alibaba reference:** Mobile factory storefront, e.g. `{company}.m.en.alibaba.com/?productId=…&from=detail_company_card`

---

## Why this phase exists

Buyers on Alibaba tap the **company card** on a product page and land on a **dedicated factory storefront** — not just a thin profile. SourceByJay already has:

| Today | Gap vs Alibaba |
|-------|----------------|
| `/suppliers/[slug]` with tabs (overview, products, factory, certs) | Mobile-first **mini-site** layout, richer company story |
| `SupplierMiniCard` on PDP → `/suppliers/{slug}` | **Company card** styling + `?productId=` context banner |
| Banner + stats + chat | Sticky **Contact / Chat / RFQ** bar, capabilities, production lines |
| Same URL for all plans | **Business+** optional subdomain mini-site |

This is **not** a third-party product — it is UX + routing on existing `suppliers` + gallery + products data.

---

## Scope (three slices)

### Slice A — Enhanced factory page (all verified suppliers)

**Route:** `/suppliers/[slug]` (upgrade in place)

| Block | Description |
|-------|-------------|
| Hero | Full-width banner, logo, badges (Verified, Gold, Guarantee), location |
| Company card strip | Years, response rate, main products, employee count (if set) |
| Sticky action bar | Chat · Contact supplier · Send RFQ · Favorite |
| Tabs | **Home** · **Products** · **Factory tour** · **Certificates** · **About** |
| Product grid | Category filters within supplier catalog |
| Factory tour | Gallery grid + lightbox (existing `supplier_gallery`) |
| Mobile layout | Alibaba-style stacked sections; 375px-first |
| SEO | `generateMetadata` with company name + main products |

**PDP company card (`SupplierMiniCard`):**

- Alibaba-style card: logo, name, badges, “View company profile →”
- Link: `/suppliers/{slug}?productId={id}&from=detail_company_card`
- Factory page shows **context banner** when `productId` present (“You viewed: {product title}”)

### Slice B — Standalone mini-site mode (Business+ plans)

**Route options (pick one at scout — default path-based):**

| Option | URL example | Notes |
|--------|-------------|-------|
| **Path (MVP default)** | `/factory/{slug}` | Same page, cleaner share URL; no DNS |
| **Subdomain (Business+)** | `{slug}.sourcebyjay.com` | Requires Vercel wildcard + plan gate |

Mini-site mode: minimal marketplace chrome (no global header clutter), factory branding, back link to marketplace search.

Gate: `listing_plans.features.custom_minisite` or Business+ slug check.

### Slice C — Seller editor (vendor portal)

| Feature | Route |
|---------|--------|
| Preview factory page | `:3001/storefront` or link from settings |
| Edit banner, about, main products blurb | `:3001/settings` (extend company settings) |
| Submit for ops review | ties to existing `/storefront-queue` |

---

## What we do NOT build in 18

| Defer | Where |
|-------|--------|
| Custom domain `factory.com` | Enterprise ops-assist later |
| VR / 360 factory tour | Phase 14 video + future |
| Stream/Sendbird chat UI | Phase 5B |
| Separate mobile app for buyers | Not needed |

---

## References

| What | Where |
|------|--------|
| UX | Alibaba `{company}.m.en.alibaba.com` (owner link) |
| Existing profile | `apps/web/src/components/marketplace/supplier/SupplierProfile.tsx` |
| PDP card | `SupplierMiniCard` in `ProductDetail.tsx` |
| Plan gate | [vendor-listing-plans.md](vendor-listing-plans.md) — custom mini-site Business+ |
| Trust media | [sourcebyjay-trust-media](../sourcebyjay-trust-media/SKILL.md) |
| Parallel row | [alibaba-parallels.md](../sourcebyjay-architecture/references/alibaba-parallels.md) |

---

## Acceptance criteria

### Slice A

- [ ] Product page company card matches Alibaba pattern (visual scout)
- [ ] Tap opens factory page with optional product context banner
- [ ] Mobile (375px): readable hero, sticky contact bar, product grid
- [ ] Factory tab shows approved gallery images only
- [ ] Chat + RFQ work from factory page

### Slice B

- [ ] Business+ supplier gets `/factory/{slug}` (or subdomain if approved)
- [ ] Free/Starter keep `/suppliers/{slug}` enhanced layout

### Slice C

- [ ] Seller previews storefront from vendor portal
- [ ] Ops storefront queue unchanged or extended for banner/about edits

---

## Process

1. Vomit Protocol scout + side-by-side screenshot vs current `/suppliers/*`
2. Owner **APPROVE**
3. Slice A → visual demo → **GO**
4. Slice B/C as plan-gated follow-ups in same phase or 18B

---

## Suggested phase order

Insert **after Phase 14 (video)** and **before Phase 15 (GO-LIVE)** so launch includes factory pages:

```
… → 13 → 14 → 18 → 15 (GO-LIVE) → 5B → 16
```

Owner may defer 18 to post-go-live if time-constrained — note in phase-state at gate.
