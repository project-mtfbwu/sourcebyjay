---
name: sourcebyjay-figma-handoff
description: >-
  Figma design handoff after built UI for SourceByJay Phase 16. Use when
  syncing palette, tokens, and three portal design files from running app
  screenshots.
---

# SourceByJay Figma Handoff (Phase 16)

Build first → Figma second → sync tokens back to code.

## Three Figma files

1. **SourceByJay Buyer** — `apps/web` screens
2. **SourceByJay Seller** — `apps/vendor` (Seller Central density)
3. **SourceByJay Ops** — `apps/ops` (tables, queues)

## Palette anchors

- Primary green: `#76EE59`
- Font: Roboto (marketplace), Inter (dashboard)
- Gold verified badge: dedicated token

## Workflow

1. Complete Phases 1–6 in code
2. Screenshot every key flow (see [visual-demo-checklist](../sourcebyjay-phase-tracker/references/visual-demo-checklist.md))
3. Import screenshots to Figma as reference frames
4. Apply palette to components
5. Export design tokens → update `packages/ui` and `marketplace.css`

## Token sync targets

```
packages/ui/src/tokens.css   (create if needed)
apps/web/src/styles/marketplace.css
```

## Do not

- Block Phase 1–6 waiting for Figma
- Treat Figma as source of truth before first build

## User approval

Phase 16 ends with visual demo of Figma links + token diff. Optional after Phase 15 GO-LIVE.
