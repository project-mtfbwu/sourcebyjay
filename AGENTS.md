# Agent Rules



## Do not commit `.oneignore`



Never create a `.oneignore` file. Never `git add` or `git commit` a `.oneignore` file. It is a legacy artifact from the deprecated `one` CLI and must stay out of the repo.



## Skills



All agent skills live in `.agents/skills/`. Do not duplicate them in `.cursor`, `.codex`, `.claude`, or other runner-specific directories.



**Index:** [.agents/skills/README.md](.agents/skills/README.md)



### SourceByJay skills (always use for this project)



| Skill | Purpose |

|-------|---------|

| `sourcebyjay-phase-tracker` | Current phase, GO/HOLD/CHANGE gates |

| `sourcebyjay-visual-demo` | Mandatory visual review each phase |

| `sourcebyjay-security-review` | RLS, secrets, pre-customer checklist |

| `sourcebyjay-ci-quality` | CodeQL, Playwright, CodeRabbit, CI |

| `sourcebyjay-architecture` | 3 portals: web / vendor / ops |

| `sourcebyjay-ops-rbac` | Staff roles, audit, approvals |

| `sourcebyjay-b2b-workflows` | RFQ, quotes, orders, chat, reviews |

| `sourcebyjay-trust-media` | Gold badge, factory gallery (Phase 1) |

| `sourcebyjay-reference-repos` | Steal patterns from OSS repos |

| `sourcebyjay-payments` | Stripe Connect (Phase 7) |

| `sourcebyjay-figma-handoff` | Figma after build (Phase 8) |



### Stack skills



| Skill | Purpose |

|-------|---------|

| `supabase-schema-migrations` | Schema-first DB workflow |

| `nextjs-cache-components` | Next.js 16 caching |

| `nextbase-frontend-smoke-test` | UI smoke tests |

| `shadcn-expert` | shadcn/ui |

| `component-to-shadcn-component-converter` | UI conversion |

| `pgtap-test-generator` | RLS/pgTap tests |



### Workflow



1. Read [DECISIONS.md](.agents/skills/sourcebyjay-architecture/references/DECISIONS.md) — locked choices

2. Read `sourcebyjay-phase-tracker/phase-state.json`

3. Load phase-specific skills from README index

4. Implement current phase only ([IMPLEMENTATION.md](IMPLEMENTATION.md))

5. Run security-review + ci-quality before visual demo

6. Run visual-demo → wait for user **GO** before next phase



## Database Schema Workflow



- **Never** manually create or edit migration files in `apps/database/supabase/migrations`.

- Make schema changes in `apps/database/supabase/schemas/*.sql`.

- Generate migrations with `supabase db diff -f <name>` from `apps/database`.

- See `.agents/skills/supabase-schema-migrations/SKILL.md` for the full workflow.



# Setup



For automated setup, run `./setup.sh` from the repo root. The steps below describe what the script does.



Follow these steps to get the repo running locally end-to-end. This is a pnpm + Turborepo monorepo with a Next.js app (`apps/web`) and a Supabase local stack (`apps/database`).



1. From the repo root, install dependencies: `pnpm i`.

2. Check whether `.env.local` already exists at the repo root before creating it.

3. If `.env.local` does not exist, copy `.env.local.example` to `.env.local`. Never overwrite an existing `.env.local`.

4. Do the same for `.env.development.local` — if it does not exist, copy `.env.development.local.example` to `.env.development.local`. Never overwrite an existing file.

5. Env example files in this repo live at the repo root (not alongside `apps/web` or `apps/database`), so create the matching files at the repo root only.

6. Start the local Supabase stack: from the repo root run `pnpm database#start` (which proxies to `supabase start` inside `apps/database`). Alternatively, `cd apps/database && pnpm start`. If neither is available in your environment, run `pnpm supabase start` from `apps/database`.

7. Wait for Supabase to finish starting (the CLI prints `API URL`, `DB URL`, and keys) before moving on.

8. Return to the repo root and run `pnpm supabase:sync-env` to sync the local Supabase keys into your env files.

9. Start the dev server with `pnpm dev` (runs all apps in parallel) or `pnpm web#dev` for just the web app.

