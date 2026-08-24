---
name: sourcebyjay-visual-demo
description: >-
  Runs mandatory visual demos and Phase Review Cards after each SourceByJay phase.
  Use when completing a phase, before user GO/HOLD/CHANGE, or when the user asks
  to see, review, or demo the app visually.
---

# SourceByJay Visual Demo

**User decision is final.** Agent provides suggestions only. Never advance phase without explicit **GO**.

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

## Figma note (Phase 8)

Phase 8 demo = links to 3 Figma files + token export, not localhost only.

## Do not

- Skip demo because "it's backend only" — show affected UI or API proof
- Start next phase in same turn as demo
- Treat agent suggestions as approval
