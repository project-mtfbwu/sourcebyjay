# SourceByJay Agent Skills

All skills live here. **Do not duplicate** in `.cursor`, `.codex`, or other runner dirs.

**Vision:** Alibaba alternative for India — [ALIBABA-INDIA-MVP.md](sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md)

## Orchestration (read first)

| Order | Skill | When |
|-------|-------|------|
| 0 | [sourcebyjay-beginner-eli5](sourcebyjay-beginner-eli5/SKILL.md) | **Every session.** Founder is a beginner. All manual steps = What / Why / How / How to process. |
| 0b | [sourcebyjay-vomit-protocol](sourcebyjay-vomit-protocol/SKILL.md) | **Before coding.** Scout + Amazon/Alibaba compare + Mermaid ELI5 proposal → wait for Owner **APPROVE**. |
| 1 | [sourcebyjay-phase-tracker](sourcebyjay-phase-tracker/SKILL.md) | Every implementation session |
| 2 | [sourcebyjay-architecture](sourcebyjay-architecture/SKILL.md) | Where code lives, three portals |
| 3 | Phase-specific skill below | Current phase work |
| 4 | [sourcebyjay-security-review](sourcebyjay-security-review/SKILL.md) | Before visual demo |
| 5 | [sourcebyjay-visual-demo](sourcebyjay-visual-demo/SKILL.md) | End of each phase |
| 6 | [sourcebyjay-ci-quality](sourcebyjay-ci-quality/SKILL.md) | Tests + CI before demo |

**User GO/HOLD/CHANGE is final** — see phase-tracker. **Go-live = Phase 15 complete.**  
**No feature code without Vomit Protocol APPROVE** (unless Owner said implement now).

## By phase

| Phase | Skills to load |
|-------|----------------|
| S0 | security-review, ci-quality |
| 1 | trust-media, ops-rbac, reference-repos |
| 2 | architecture, ops-rbac, reference-repos |
| 17 | payments, reference-repos, [vendor-listing-plans.md](sourcebyjay-b2b-workflows/references/vendor-listing-plans.md) |
| 3 | b2b-workflows, security-review, reference-repos |
| 4 | b2b-workflows, security-review, reference-repos |
| 5 | b2b-workflows, reference-repos |
| 6 | b2b-workflows, reference-repos |
| 7 | reference-repos, b2b-workflows, [feature-reference-checklist](sourcebyjay-reference-repos/references/feature-reference-checklist.md) |
| 8 | reference-repos, b2b-workflows |
| 9 | b2b-workflows, security-review, reference-repos, [sourcebyjay-guarantee.md](sourcebyjay-b2b-workflows/references/sourcebyjay-guarantee.md) |
| 10 | payments, security-review |
| 11 | b2b-workflows, reference-repos |
| 12 | architecture, reference-repos, [i18n-languages.md](sourcebyjay-b2b-workflows/references/i18n-languages.md) |
| 13 | reference-repos, payments, b2b-workflows, [ad-campaigns.md](sourcebyjay-b2b-workflows/references/ad-campaigns.md) |
| 14 | trust-media, reference-repos |
| 18 | trust-media, b2b-workflows, reference-repos, [supplier-factory-minisite.md](sourcebyjay-b2b-workflows/references/supplier-factory-minisite.md) |
| 15 | ci-quality, security-review, reference-repos |
| 5B | b2b-workflows, reference-repos, [chat-ux-parity.md](sourcebyjay-b2b-workflows/references/chat-ux-parity.md) |
| 16 | figma-handoff, visual-demo |

## Domain skills

| Skill | Purpose |
|-------|---------|
| [sourcebyjay-beginner-eli5](sourcebyjay-beginner-eli5/SKILL.md) | Founder is a beginner — ELI5 every manual step |
| [sourcebyjay-b2b-workflows](sourcebyjay-b2b-workflows/SKILL.md) | RFQ, quotes, orders, statuses |
| [sourcebyjay-trust-media](sourcebyjay-trust-media/SKILL.md) | Gold badge, factory gallery, video |
| [sourcebyjay-ops-rbac](sourcebyjay-ops-rbac/SKILL.md) | Staff roles, audit, approvals |
| [sourcebyjay-reference-repos](sourcebyjay-reference-repos/SKILL.md) | **Mandatory OSS reference before new features** |
| [sourcebyjay-payments](sourcebyjay-payments/SKILL.md) | Stripe Connect (Phase 10) |
| [sourcebyjay-figma-handoff](sourcebyjay-figma-handoff/SKILL.md) | Design tokens (Phase 16) |

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

- [IMPLEMENTATION.md](../IMPLEMENTATION.md) — full phase tasks (S0–16)
- [ALIBABA-INDIA-MVP.md](sourcebyjay-architecture/references/ALIBABA-INDIA-MVP.md) — gap analysis → phases
- [alibaba-parallels.md](sourcebyjay-architecture/references/alibaba-parallels.md) — Alibaba/IndiaMART feature map
- [DECISIONS.md](sourcebyjay-architecture/references/DECISIONS.md) — locked architecture & process decisions
- [SECURITY.md](../SECURITY.md) — security policy
- [phase-state.json](sourcebyjay-phase-tracker/phase-state.json) — current phase
