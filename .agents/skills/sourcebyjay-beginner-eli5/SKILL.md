---
name: sourcebyjay-beginner-eli5
description: >-
  Owner communication style for SourceByJay. The founder is a beginner:
  some coding experience, no large project yet. Use on every session and
  whenever the agent asks the user to run a command, click GitHub / Supabase /
  Vercel, install tools, or confirm a result. Every manual step must be ELI5
  with what, why, how, and how to process the result.
---

# SourceByJay — Beginner ELI5 (always on)

## User (verbatim)

> i am noob but go somewhat coding experience but havent done any big project yet

Treat that as locked. Do **not** assume they know Docker, Colima, nvm, GitHub Settings, RLS, or “sync env”. They can follow clear steps. They cannot guess jargon.

## Communication rules

- Short sentences. One action per step. Numbered.
- Name the exact app: **Terminal**, **Cursor**, **Safari/Chrome**, **GitHub website**.
- Paste the **full command**. Never say “run the usual start command”.
- After a command: what the screen should look like, and what to paste back if it fails.
- The agent runs everything it can. Ask the user only for clicks, passwords, 2FA, or account settings.

## Every manual step uses this block

```markdown
### Step N — [plain title]

**What this is:** [one sentence, no jargon — or jargon then a kid analogy]

**Why we need it:** [what breaks in SourceByJay without this]

**How (do this):**
1. …
2. …

**How to process (done when):**
- You should see: …
- If you see an error: paste the full text here and stop.
```

Never dump 8 terminal commands with no What/Why.

## Mac machine facts (this computer)

| Thing | Reality |
|-------|---------|
| Node manager | **nvm** (already installed) |
| Project Node | **24** (see `.nvmrc`) |
| Do not use | Homebrew `node@22` on PATH — it hides nvm |
| Containers | **Colima** + Docker CLI — **not** Docker Desktop |
| Package manager | **pnpm** |
| Repo folder | `/Users/24potatoes/Documents/source project` |

Setup walkthrough: [mac-setup.md](references/mac-setup.md)

## Phase advance (user)

After a visual check, **GO / next / looks good / continue** all mean: approve current phase and start the next one in `phaseOrder`. Full copy-paste list: [phase-advance-prompts.md](../sourcebyjay-phase-tracker/references/phase-advance-prompts.md)

| Jargon | ELI5 |
|--------|------|
| Node | The engine that runs JavaScript on the Mac (Chrome runs it in the browser). |
| nvm | A remote control that switches Node versions. This repo wants 24. |
| pnpm | App Store for this project’s libraries. `pnpm i` downloads them once. |
| Docker | Shipping boxes for programs. Postgres lives in a box, not “installed like Word”. |
| Colima | The quiet Mac engine that runs those boxes. Docker Desktop is a heavier alternative. We use Colima. |
| Supabase local | A practice copy of the database on this Mac. Safe to break. |
| `.env.local` | A sticky note of secret keys. Never commit it. |
| GitHub `origin` | The cloud copy: `project-mtfbwu/sourcebyjay`. |

## Do not

- Say “just use Docker” on this Mac — say **Colima**.
- Ask them to install Docker Desktop unless Colima is impossible.
- Skip ELI5 because a step feels “basic”.
- Advance a phase because *you* think it looks fine.
