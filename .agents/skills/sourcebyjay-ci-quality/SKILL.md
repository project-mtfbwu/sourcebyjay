---
name: sourcebyjay-ci-quality
description: >-
  CI, CodeQL, Playwright e2e, CodeRabbit, and Dependabot quality gates for
  SourceByJay. Use when fixing CI, adding tests, configuring GitHub Actions, or
  before marking a phase complete.
---

# SourceByJay CI & Quality Gates

Repo: `project-mtfbwu/sourcebyjay` — workflows must target this repo (not upstream nextbase only).

## Automated stack

| Tool | Config | Runs |
|------|--------|------|
| CI | `.github/workflows/ci.yml` | lint, typecheck, unit test, build |
| CodeQL | `.github/workflows/codeql.yml` | security scan |
| Playwright | `.github/workflows/integration-tests.yml` | e2e + Supabase in CI |
| CodeRabbit | `.coderabbit.yaml` | PR review, Semgrep, Gitleaks |
| Dependabot | `.github/dependabot.yml` | weekly deps |

**Copilot Agent validation is optional** — not required for CI.

## Before phase visual demo

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e    # locally with Supabase running
```

## Playwright conventions

- Specs: `apps/web/e2e/`
- Marketplace anon tests: `e2e/anon/marketplace.spec.ts`
- Update tests when rebranding or new public routes
- Config: `apps/web/playwright.config.ts`

## E2e for new phases

| Phase | Add tests for |
|-------|---------------|
| 1 | Gold badge, gallery tab |
| 2 | Buyer account, vendor login smoke |
| 3 | Quote accept flow (with auth setup) |
| 4 | Message send/receive |
| 5 | Request listing form |

## Branch protection (manual)

GitHub → Settings → Branches → `main`:

- Require CI workflow
- Require CodeQL
- Optional: CodeRabbit approval

## Push checklist

```bash
git status
git add <files>
git commit -m "feat(phase-X): ..."
git push origin main
```

Only push when user asks.

## Failure protocol

1. Read failed job logs on GitHub Actions
2. Reproduce locally
3. Fix — do not skip hooks
4. Re-run before requesting user GO

Security findings: see [security-review](../sourcebyjay-security-review/SKILL.md)
