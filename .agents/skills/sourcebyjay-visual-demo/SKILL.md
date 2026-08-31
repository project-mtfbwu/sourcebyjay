---
name: sourcebyjay-visual-demo
description: >-
  Runs mandatory visual demos and Phase Review Cards after each SourceByJay phase.
  Use when completing a phase, before user GO/HOLD/CHANGE, or when the user asks
  to see, review, or demo the app visually.
---

# SourceByJay Visual Demo

**User decision is final.** Agent provides suggestions only. Never advance phase without explicit **GO**.

## Never go lazy (Owner rule — permanent)

When one portal in the monorepo already has a **polished CRM shell** (sidebar, KPI dashboard, styled forms), **never ship another portal at MVP/plain HTML** if the Owner will use both. Match visual density across buyer / seller / ops before calling a phase “done” for visual review.

| If this exists… | Then new work must… |
|-----------------|---------------------|
| Ops `OpsShell` + dashboard widgets | Seller gets `VendorShell` + equivalent KPIs (green branding) |
| Searchable location pickers on seller signup | Same on buyer business profile + account profile |
| shadcn forms on buyer `:3000` | Seller forms use CRM `form-grid` + sections, not raw inline styles |

**Lazy = blocked.** Plain centered column + repeated nav links when a sidebar pattern exists in-repo is a process defect, not “we’ll polish later.”

When asking the user to look at the demo, use [beginner-eli5](../sourcebyjay-beginner-eli5/SKILL.md): what this screen is, why it matters, what to click, what “good” looks like.

## When to run

1. All phase deliverables implemented
2. `pnpm typecheck` and `pnpm lint` pass
3. Relevant e2e tests pass (or note failures)
4. Update [phase-state.json](../sourcebyjay-phase-tracker/phase-state.json): `awaitingUserVisualApproval: true`

## Demo setup

```bash
pnpm database#start          # if DB features needed
pnpm supabase:sync-env
pnpm dev                     # http://localhost:3000
```

For Phase 2+: also start vendor/ops apps on their ports when they exist.

## Execution steps

1. Read active phase checklist: [visual-demo-checklist.md](../sourcebyjay-phase-tracker/references/visual-demo-checklist.md)
2. Use browser MCP: navigate each URL, snapshot, screenshot
3. Test happy path **and** one denial (e.g. logged-out → dashboard redirect)
4. Fill **Phase Review Card** (template in [phase-tracker](../sourcebyjay-phase-tracker/SKILL.md))
5. **Stop** — wait for user

## Screenshot minimum

Capture at least:

- One full-page screenshot per major new screen
- Mobile width (375px) for buyer storefront changes
- Admin/ops dense tables at desktop width

## Phase Review Card — agent suggestions format

```markdown
### My suggestions (non-binding)
1. **Ship as-is** — [why]
2. **Polish before next phase** — [optional UX tweaks]
3. **Risk to watch** — [security/scale note]
```

Keep to 3 bullets max.

## User responses

| Reply | Action |
|-------|--------|
| `GO` | Update phase-state; advance phase |
| `HOLD` | Set `on_hold`; no new features |
| `CHANGE: …` | Implement feedback; re-run full demo |

## Figma note (Phase 16)

Phase 16 demo = links to 3 Figma files + token export, not localhost only.

## Do not

- Skip demo because "it's backend only" — show affected UI or API proof
- Start next phase in same turn as demo
- Treat agent suggestions as approval
