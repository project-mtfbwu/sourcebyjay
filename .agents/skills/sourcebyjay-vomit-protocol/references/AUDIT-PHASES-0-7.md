# Retrospective scout — Phases 0–7 (2026-08-26)

**Why:** Owner asked to scout *existing* work vs Alibaba with screenshots **before Phase 8**, because early phases skipped Alibaba fidelity.

**Rule going forward:** Do not advance `currentPhase` until this style of audit is shown and Owner replies **APPROVE catch-up** / **SKIP catch-up go Phase 8** / **CHANGE**.

Screenshots: [audit-p0-p7/](audit-p0-p7/)

| Shot | What it proves |
|------|----------------|
| `alibaba-search-earbuds.png` | Alibaba: Products/Suppliers tabs, left Filters (Trade Assurance, Verified), results grid |
| `ours-search-earbuds.png` | Ours: filters + RFQ box + heart overlay — **RFQ chrome on every product search**; Guarantee “Soon”; USD prices |
| `alibaba-pdp-heart.png` | Alibaba PDP: circular heart **on gallery**; CTAs = Send inquiry + Chat now |

---

## Verdict

Buyer **happy-path** (search → product → heart → chat drawer → RFQ cart → fake pay) works as a demo.

Three **blockers** mean we did not actually finish 0–2 / 17 as Seller/Ops:

1. **Seller listings CMS is a dead loop** (vendor → web → “moved” → vendor). Cannot publish a listing.
2. **Factory gallery: display only.** Vendor upload + ops approve are copy stubs.
3. **Ops has no login that sets `sb-sbj-ops-auth`.** “Sign in on buyer site” writes the **buyer** cookie. Ops queues are unreachable.

Do **not** start Phase 8 (AI/image) until Owner picks catch-up vs skip.

---

## What matches Alibaba (keep)

| Area | Match |
|------|--------|
| Chat | Right-side panel on product + Messages inbox |
| Favorites | Heart overlay top-right of image (after Owner correction) |
| Search modes | Products / Suppliers tabs (Phase 7) |
| RFQ | Multi-supplier select + one RFQ per factory (Phase 4) |
| Compare | Tray max 4 |
| Reviews | Verified after completed order (product page) |
| Portals split | Buyer / seller / ops **intended**; cookie names exist |

---

## Gaps vs Alibaba (claimed done, not done)

### Blockers (fix before next phase unless Owner skips)

| Gap | Phase claimed | Alibaba | Ours |
|-----|---------------|---------|------|
| Seller create/edit listings | 0 / 17 | Seller Central catalog | Dead loop; cap untestable |
| Factory photos upload + ops approve | 1 | Storefront media | Tabs show; **no upload/approve** |
| Ops staff login | 2 | Internal admin | No ops cookie login |

### Should-fix (Alibaba fidelity, this catch-up or next sprint)

| Gap | Alibaba | Ours |
|-----|---------|------|
| PDP CTAs | **Send inquiry** + **Chat now** (+ sample / start order) | Contact + Request Quote + Chat + Compare (overlapping invent) |
| Sample order | First-class on PDP | Seller checkbox only |
| Product search country | Left facet | Country only on **Suppliers** mode |
| Plan rank boost | Paid membership lifts rank | `rank_boost_bps` unused |
| Heart filled after reload | Persisted | `initialFavorited` never loaded |
| Buyer sees listing-request offers | RFQ quotes inbox | Vendor can offer; **buyer has no offer list** |
| Supplier page reviews | Store ratings | Product reviews only |
| RFQ as a **mode** | Dedicated RFQ / compare-sourcing | Checkboxes on **all** product results |
| Currency | Mix USD display vs INR orders | PDP `$`; orders `₹`; fake **Deliver to: US** |
| Dead chrome | — | Cart icon, English-USD, Messenger/Support/Survey, footer `#` |

### Later-ok (already scheduled)

| Gap | Phase |
|-----|--------|
| Guarantee escrow / disputes | 9–10 |
| AI Mode + image search | 8 |
| Video factory | 14 |
| i18n / INR-first | 12 |
| CPC ads | 13 |

---

## Catch-up proposal (if Owner APPROVE)

**Slice A — unblock seller/ops (must for a real marketplace)**  
1. Vendor listings: create/edit/publish on `:3001` (break the loop).  
2. Vendor gallery upload → ops approve (replace copy stubs).  
3. Ops login on `:3002` writing `sb-sbj-ops-auth`.

**Slice B — Alibaba PDP/search fidelity (should-fix)**  
1. PDP CTAs: Chat now + Send inquiry; Sample as optional.  
2. Country facet on **product** search.  
3. Use `rank_boost_bps` in relevance sort.  
4. Hydrate favorite hearts.  
5. Buyer listing-request offers inbox.  
6. RFQ chrome only when `rfq=1` (or Alibaba-style dedicated mode).

**Not in catch-up:** Phase 8 AI/image, Stripe, Guarantee escrow.

---

## Owner decision

Reply one of:

- **APPROVE A** — fix blockers only, then Phase 8  
- **APPROVE A+B** — blockers + Alibaba fidelity, then Phase 8  
- **SKIP catch-up** — accept gaps, start Phase 8  
- **CHANGE: …**
