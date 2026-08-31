# Mac setup — Node 24 + Colima (ELI5)

Use this whenever the user boots the project on this Mac.

---

## Picture of the machine

```
You (Cursor / browser)
        │
        ▼
   Node 24  ── runs the website (Next.js)
        │
        ▼
   pnpm     ── installs libraries
        │
        ▼
   Colima   ── tiny Linux computer in the background
        │
        ▼
   Docker boxes ── Postgres + Auth + Storage (local Supabase)
```

Without Colima, `pnpm database#start` fails. Without Node 24, `pnpm i` / `pnpm dev` can fail.

---

## A. Node 24

### What this is

**Node** is the program that runs our JavaScript website on the Mac.

**nvm** is already on this Mac. It can install many Node versions. The repo file `.nvmrc` says **24**.

Right now Terminal often shows **22** because Homebrew put Node 22 first on PATH. That is like two TVs; the wrong one is in front.

### Why we need it

This project’s `package.json` says `node: >=24`. Node 22 is too old. Builds and some packages will error.

### How (agent should do this)

```bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
cd "/Users/24potatoes/Documents/source project"
nvm install 24
nvm use
node -v    # must start with v24
```

In `.zprofile`, **do not** keep `node@22` ahead of nvm:

```bash
# BAD (hides nvm):
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

Keep the nvm block. After that, new Terminal tabs should report v24 inside this folder.

### How to process

- Success: `node -v` → `v24.something`
- If `v22...`: nvm did not load; paste `which node` and `echo $PATH`
- If `v26...`: nvm default is 26; still run `nvm use` in this folder (`.nvmrc` pins 24)

---

## B. Colima (not Docker Desktop)

### What this is

Our database does not install like a normal Mac app. It runs in **containers** (sealed mini-computers).

**Docker** is the tool that starts those containers.

**Docker Desktop** is a big GUI app from Docker Inc. You do **not** need it.

**Colima** is already installed via Homebrew. It is a lightweight engine that makes Docker work on Apple Silicon. Think: Docker Desktop’s engine, without the extra app.

### Why we need it

Local Supabase = Postgres + Auth + Storage. Those run in Colima. Phase 1 trust/media tables cannot be applied until this is up.

### How (first time / after reboot)

```bash
colima start --cpu 4 --memory 8
```

Wait 1–2 minutes. Then:

```bash
docker info
```

### How to process

- Success: `docker info` prints Server Version, no error
- `colima is not running` → run `colima start` again
- `cannot connect to docker.sock` → Colima not started, or wrong socket
- Fan loud / slow Mac → we used 4 CPU / 8 GB; we can lower later

Stop later (optional): `colima stop`  
Status: `colima status`

### Other projects on this Mac

**PGS v3 is parked indefinitely** (handed to another developer). Do **not** run `supabase start` in `Documents/GitHub/pgs-v3`. It used the same ports as SourceByJay and will collide. Only start PGS if the user explicitly reopens that project.

---

## C. After Node 24 + Colima are healthy

From the repo folder:

```bash
cd "/Users/24potatoes/Documents/source project"
pnpm i
```

If `.env.local` is missing, copy examples (never overwrite secrets):

```bash
test -f .env.local || cp .env.local.example .env.local
test -f .env.development.local || cp .env.development.local.example .env.development.local
```

Start database, wait until it prints API URL, then sync keys and run the site:

```bash
pnpm database#start
pnpm supabase:sync-env
pnpm web#dev
```

Open **http://localhost:3000** in the browser.

### How to process

- Site loads → Mac boot is done; continue Phase 1
- `pnpm: command not found` → `corepack enable` then `corepack prepare pnpm@11.1.2 --activate`
- Database start hangs / Docker errors → Colima is not running
- Port 3000 in use → say so; we pick another port
