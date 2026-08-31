---
name: sourcebyjay-phase-tracker
description: >-
  Tracks SourceByJay implementation phases (S0–16), enforces visual review gates
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
- `currentPhase` — active phase id: `S0`, `1`, `2`, … `16`
- `currentPhaseStatus` — `not_started` | `in_progress` | `awaiting_visual_review` | `approved` | `on_hold`
- `awaitingUserVisualApproval` — `true` when demo is ready; block next phase until user decides
- `userDecision` — `go` | `hold` | `change` | null
- `phaseHistory` — completed phases with dates and notes
- `phaseOrder` — full sequence; **go-live at phase 15**
- `roadmapDoc` — gap analysis: `ALIBABA-INDIA-MVP.md`

**Always read `phase-state.json` at the start of implementation work.**

## Phase order (do not reorder)

```
S0 → 1 → 2 → 17 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 18 → 15 (GO-LIVE) → 5B (chat UX + seller PWA) → 16 (Figma)
```

Phase `0` (foundation) is complete. **India MVP launch = through Phase 15 + Phase 17.**

## Agent rules

1. **Beginner ELI5** — Always load [sourcebyjay-beginner-eli5](../sourcebyjay-beginner-eli5/SKILL.md). User: some coding experience, no large project yet. Every manual step = What / Why / How / How to process.
2. **Scope** — Only implement tasks for `currentPhase` in IMPLEMENTATION.md.
3. **Skills** — Load skills per [.agents/skills/README.md](../README.md) for current phase.
4. **Reference repos** — [sourcebyjay-reference-repos](../sourcebyjay-reference-repos/SKILL.md); **gate before new features** ([checklist](../sourcebyjay-reference-repos/references/feature-reference-checklist.md)).
5. **Schema** — [supabase-schema-migrations](../supabase-schema-migrations/SKILL.md).
6. **Security** — [sourcebyjay-security-review](../sourcebyjay-security-review/SKILL.md) before demo.
7. **Visual demo** — [sourcebyjay-visual-demo](../sourcebyjay-visual-demo/SKILL.md); user GO is final.
8. **CI** — [sourcebyjay-ci-quality](../sourcebyjay-ci-quality/SKILL.md) before demo.

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
| Go / approve / next / looks good / continue | `go` | Advance phase |
| Hold / wait / not yet | `hold` | Stay on phase; fix if asked |
| Change X / tweak Y | `change` | Implement feedback; re-run visual demo |

**After a visual check, "next" = GO.** Prompts: [phase-advance-prompts.md](references/phase-advance-prompts.md)

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
| S0 | Security hardening | CI, RLS, staff tables, headers, legal |
| 1 | Trust & media | Gold badge, gallery, ops verify |
| 2 | Three portals | web + vendor + ops, buyer GSTIN profile |
| 17 | Vendor listing plans | Free → Enterprise, IndiaMART-style |
| 3 | B2B orders + samples | quotes, orders, sample path |
| 4 | Multi-supplier RFQ | broadcast RFQ, anti-spam |
| 5 | Chat | Realtime buyer ↔ seller |
| 6 | Reviews, favorites, compare | social proof, listing requests |
| 7 | Search engine | products + suppliers, facets, rank |
| 8 | AI + image search | pgvector hybrid |
| 9 | SourceByJay Guarantee | escrow, disputes, badge + filter |
| 10 | Payments | Stripe Connect + plans + 5% commission |
| 11 | Logistics | freight quotes, incoterms |
| 12 | Global i18n | Indian + intl languages, INR/USD, GST, HS |
| 13 | Ad campaigns (CPC) | vendor self-service + ops assist, sponsored search |
| 14 | Video media | factory video tours |
| 15 | Infrastructure GO-LIVE | jobs, analytics, prod deploy |
| 16 | Figma | design token sync (polish) |

Gap map: [ALIBABA-INDIA-MVP.md](../sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md)  
Full task lists: [IMPLEMENTATION.md](../../../IMPLEMENTATION.md)

## When user says "continue" or "what phase"

1. Read `phase-state.json`.
2. Report: current phase, status, what's left, whether visual approval is pending.
3. If `awaitingUserVisualApproval`, remind them to GO/HOLD/CHANGE — do not implement next phase.

## Commit guidance

- Commit at end of phase or logical chunk when user asks.
- Suggested message: `feat(phase-S0): …` or `feat(phase-1): …`
- Do not push unless user asks.
