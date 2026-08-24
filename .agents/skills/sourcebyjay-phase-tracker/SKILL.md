---
name: sourcebyjay-phase-tracker
description: >-
  Tracks SourceByJay implementation phases (S0–8), enforces visual review gates
  before advancing, and records user go/no-go decisions. Use when implementing
  SourceByJay features, starting a new phase, continuing work, or when the user
  asks about project phase status, visual demo, or phase approval.
---

# SourceByJay Phase Tracker

Orchestrates phased delivery per [IMPLEMENTATION.md](../../../IMPLEMENTATION.md). **Never skip phases.** **Never start the next phase without explicit user approval after a visual demo.**

## State file (source of truth)

Read and update on every phase-related turn:

```
.agents/skills/sourcebyjay-phase-tracker/phase-state.json
```

Fields:
- `currentPhase` — active phase id: `S0`, `1`, `2`, … `8`, `7`
- `currentPhaseStatus` — `not_started` | `in_progress` | `awaiting_visual_review` | `approved` | `on_hold`
- `awaitingUserVisualApproval` — `true` when demo is ready; block next phase until user decides
- `userDecision` — `go` | `hold` | `change` | null
- `phaseHistory` — completed phases with dates and notes

**Always read `phase-state.json` at the start of implementation work.**

## Phase order (do not reorder)

```
S0 → 1 → 2 → 3 → 4 → 5 → 6 → 8 → 7
```

Phase `0` (foundation) is complete. **Start at S0** unless state says otherwise.

## Agent rules

1. **Scope** — Only implement tasks for `currentPhase` in IMPLEMENTATION.md.
2. **Skills** — Load skills per [.agents/skills/README.md](../README.md) for current phase.
3. **Reference repos** — [sourcebyjay-reference-repos](../sourcebyjay-reference-repos/SKILL.md).
4. **Schema** — [supabase-schema-migrations](../supabase-schema-migrations/SKILL.md).
5. **Security** — [sourcebyjay-security-review](../sourcebyjay-security-review/SKILL.md) before demo.
6. **Visual demo** — [sourcebyjay-visual-demo](../sourcebyjay-visual-demo/SKILL.md); user GO is final.
7. **CI** — [sourcebyjay-ci-quality](../sourcebyjay-ci-quality/SKILL.md) before demo.

## Workflow per phase

### A. Start phase

1. Read `phase-state.json`.
2. Set `currentPhaseStatus` → `in_progress`.
3. Copy acceptance criteria from IMPLEMENTATION.md into a todo list.
4. Implement deliverables for this phase only.

### B. Complete implementation (pre-demo)

1. Run: `pnpm typecheck`, `pnpm lint`, relevant tests.
2. Start dev server if needed: `pnpm dev`.
3. Set `currentPhaseStatus` → `awaiting_visual_review`.
4. Set `awaitingUserVisualApproval` → `true`.

### C. Visual demo (mandatory gate)

Follow [sourcebyjay-visual-demo](../sourcebyjay-visual-demo/SKILL.md).

Use [visual-demo-checklist.md](references/visual-demo-checklist.md) for the active phase.

### D. User decision

Wait for explicit user reply. Map to:

| User says | `userDecision` | Action |
|---------|----------------|--------|
| Go / approve / next phase / looks good | `go` | Advance phase |
| Hold / wait / not yet | `hold` | Stay on phase; fix if asked |
| Change X / tweak Y | `change` | Implement feedback; re-run visual demo |

On `go`:
1. Append to `phaseHistory`.
2. Set `currentPhase` to next phase.
3. Reset `awaitingUserVisualApproval` → false, `userDecision` → null.
4. Set `currentPhaseStatus` → `not_started` or `in_progress` if user says "continue".

On `hold` or `change`:
- Do not change `currentPhase`.
- Set `currentPhaseStatus` → `in_progress` or `on_hold`.

## Phase Review Card template

Always output this when a phase is ready for visual review:

```markdown
## Phase [X] ready for your review

**Phase:** [name from IMPLEMENTATION.md]
**Status:** Implementation complete — awaiting your decision

### What was built
- [bullet list of deliverables completed]

### Visual demo — please check
| # | Screen | URL | Screenshot |
|---|--------|-----|------------|
| 1 | ... | http://localhost:3000/... | [attached] |

### Acceptance criteria
- [x] or [ ] each criterion from IMPLEMENTATION.md

### My suggestions (non-binding)
- [1–3 concise recommendations: ship as-is / minor polish / risks]

### Your decision (final)
Reply with one of:
- **GO** — approve and move to Phase [next]
- **HOLD** — pause; I’ll wait
- **CHANGE: …** — describe what to adjust before approval
```

## Quick phase reference

| Phase | Name | App focus |
|-------|------|-----------|
| S0 | Security hardening | CI, RLS, staff tables, headers, legal pages |
| 1 | Trust & media | Gold badge, factory gallery, ops verify |
| 2 | Three portals | web + vendor + ops apps |
| 3 | B2B orders | quotes, orders, timeline |
| 4 | Chat | Realtime buyer ↔ seller |
| 5 | Reviews & requests | Social proof, request listing |
| 6 | AI search | pgvector hybrid search |
| 8 | Figma | 3 design files from built UI |
| 7 | Payments | Stripe Connect |

Full task lists: [IMPLEMENTATION.md](../../../IMPLEMENTATION.md)

## When user says "continue" or "what phase"

1. Read `phase-state.json`.
2. Report: current phase, status, what's left, whether visual approval is pending.
3. If `awaitingUserVisualApproval`, remind them to GO/HOLD/CHANGE — do not implement next phase.

## Commit guidance

- Commit at end of phase or logical chunk when user asks.
- Suggested message: `feat(phase-S0): …` or `feat(phase-1): …`
- Do not push unless user asks.
