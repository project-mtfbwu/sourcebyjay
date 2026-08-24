# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |

## Reporting a vulnerability

Please **do not** open public GitHub issues for security problems.

1. Email the maintainers privately (or use GitHub **Private vulnerability reporting** if enabled on the repo).
2. Include steps to reproduce, impact, and affected routes or tables.
3. Allow reasonable time to patch before public disclosure.

## Automated checks

This repository uses:

- **CodeQL** — static analysis on push, PR, and weekly schedule (`.github/workflows/codeql.yml`)
- **CodeRabbit** — AI review with Semgrep, Gitleaks, and ESLint (`.coderabbit.yaml`)
- **Playwright e2e** — integration tests on push and PR (`.github/workflows/integration-tests.yml`)
- **CI** — lint, typecheck, unit tests, build (`.github/workflows/ci.yml`)

## Secrets

Never commit:

- `.env.local`, `.env.development.local`, or any file containing Supabase service role keys
- Stripe keys, OpenAI keys, or other third-party credentials

Use GitHub Actions **secrets** for CI-only values.
