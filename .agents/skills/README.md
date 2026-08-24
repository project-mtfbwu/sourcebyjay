# SourceByJay Agent Skills

All skills live here. **Do not duplicate** in `.cursor`, `.codex`, or other runner dirs.

## Orchestration (read first)

| Order | Skill | When |
|-------|-------|------|
| 1 | [sourcebyjay-phase-tracker](sourcebyjay-phase-tracker/SKILL.md) | Every implementation session |
| 2 | [sourcebyjay-architecture](sourcebyjay-architecture/SKILL.md) | Where code lives, three portals |
| 3 | Phase-specific skill below | Current phase work |
| 4 | [sourcebyjay-security-review](sourcebyjay-security-review/SKILL.md) | Before visual demo |
| 5 | [sourcebyjay-visual-demo](sourcebyjay-visual-demo/SKILL.md) | End of each phase |
| 6 | [sourcebyjay-ci-quality](sourcebyjay-ci-quality/SKILL.md) | Tests + CI before demo |

**User GO/HOLD/CHANGE is final** — see phase-tracker.

## By phase

| Phase | Skills to load |
|-------|----------------|
| S0 | security-review, ci-quality |
| 1 | trust-media, ops-rbac, reference-repos |
| 2 | architecture, ops-rbac, reference-repos |
| 3 | b2b-workflows, security-review, reference-repos |
| 4 | b2b-workflows, reference-repos |
| 5 | b2b-workflows, reference-repos |
| 6 | reference-repos, b2b-workflows |
| 8 | figma-handoff, visual-demo |
| 7 | payments, security-review |

## Domain skills

| Skill | Purpose |
|-------|---------|
| [sourcebyjay-b2b-workflows](sourcebyjay-b2b-workflows/SKILL.md) | RFQ, quotes, orders, statuses |
| [sourcebyjay-trust-media](sourcebyjay-trust-media/SKILL.md) | Gold badge, factory gallery |
| [sourcebyjay-ops-rbac](sourcebyjay-ops-rbac/SKILL.md) | Staff roles, audit, approvals |
| [sourcebyjay-reference-repos](sourcebyjay-reference-repos/SKILL.md) | Steal patterns from OSS |
| [sourcebyjay-payments](sourcebyjay-payments/SKILL.md) | Stripe Connect (Phase 7) |
| [sourcebyjay-figma-handoff](sourcebyjay-figma-handoff/SKILL.md) | Design tokens (Phase 8) |

## Platform / stack skills

| Skill | Purpose |
|-------|---------|
| [supabase-schema-migrations](supabase-schema-migrations/SKILL.md) | DB schema-first workflow |
| [nextjs-cache-components](nextjs-cache-components/SKILL.md) | PPR, use cache, anon client |
| [nextbase-frontend-smoke-test](nextbase-frontend-smoke-test/SKILL.md) | Quick UI smoke |
| [shadcn-expert](shadcn-expert/SKILL.md) | UI components |
| [component-to-shadcn-component-converter](component-to-shadcn-component-converter/SKILL.md) | UI migration |
| [pgtap-test-generator](pgtap-test-generator/SKILL.md) | RLS tests |

## Project docs

- [IMPLEMENTATION.md](../IMPLEMENTATION.md) — full phase tasks
- [DECISIONS.md](sourcebyjay-architecture/references/DECISIONS.md) — locked architecture & process decisions
- [SECURITY.md](../SECURITY.md) — security policy
- [phase-state.json](sourcebyjay-phase-tracker/phase-state.json) — current phase
