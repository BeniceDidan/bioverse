# BioVerse — Project Context for Claude

## Read this first if you're a new Claude Code session

The user is moving from a Windows laptop to a MacBook (Apple Silicon)
and cloning this repo there. You may be starting this conversation
with no memory of this project's history. Unlike some of the user's
other repos, BioVerse wasn't built in one long single session with a
running narrative — it's been developed commit-by-commit over time, so
**`git log` (full messages, not just `--oneline`) is the authoritative
source for "what happened and why,"** more so than any static summary
here. This file exists to cover the structural stuff that isn't
obvious from reading code cold: the monorepo shape, the deployment
topology, and gotchas that were genuinely non-obvious when first hit.

The user directs *what* and *why* in plain language and expects the
assistant to handle *how* — same working style as their other
projects. Do the setup work yourself via the terminal; don't ask the
user to run commands unless something needs their manual action
(account creation on a third-party service, etc.).

## What this project is

**BioVerse** — an interactive biology learning platform (Bahasa
Indonesia UI) covering "Jaringan Hewan" (Animal Tissue) material for
Indonesian SMA (high school) students. Combines text/image/diagram
content, a Virtual Microscope viewer, an AI Tutor (Gemini-backed),
instructional videos, interactive quizzes, and student/teacher
dashboards.

Two roles: **STUDENT** and **TEACHER**. Public registration always
creates a STUDENT account; the server re-derives the role from
`TEACHER_ALLOWLIST_EMAILS` regardless of what the client sends, so
teacher access can't be self-granted by calling the API directly.

**The README's module checklist is stale** — it shows only "Fondasi:
auth, layout, home" as done, but the codebase already has working
routes for materi, quiz (+ kelola-kuis), virtual-microscope (+
kelola-mikroskop), video (+ kelola-video), ai-tutor, dashboard,
search, and upload-materi. Trust the actual code and `git log`, not
that checklist, when assessing what's built.

## Stack & structure

npm-workspaces monorepo:
- `apps/web` — Next.js 16 (App Router, Turbopack), React 19,
  TypeScript, Tailwind v4, shadcn/ui. Deployed on **Vercel**.
- `apps/api` — Express + TypeScript + Prisma ORM + PostgreSQL,
  run by `tsx watch` in dev. Deployed on **Render** (free tier,
  Singapore region — see `render.yaml`).
- `packages/shared` — TypeScript types & Zod schemas shared between
  web and api. **Must be built before the API can start** — see the
  gotcha below.

Node.js is pinned to **exactly 22.14.0** (`.node-version`) — see the
gotcha below before loosening this.

## Architecture — how web and api actually talk

- Auth: the short-lived JWT access token lives **in memory only**
  (zustand, `apps/web/src/lib/auth-store.ts`) — never localStorage,
  never a cookie. Only the rotating refresh token (httpOnly, path
  `/api/auth`) and the CSRF token (non-httpOnly, double-submit via the
  `x-csrf-token` header) are cookies. A consequence worth knowing
  before debugging it: every full page load fires one
  `POST /api/auth/refresh`, so a **401 from that call while logged out
  is normal, not a bug**. `apiClient` retries once through a shared,
  de-duplicated refresh promise when any call returns 401.
- Every teacher-authored entity — materi section, quiz, microscope
  slide, video — is created unpublished via `/api/teacher/*`
  (`requireAuth` + `requireRole("TEACHER")` + `csrfProtection`) and
  only reaches the public `/api/*` routes students read after an
  explicit publish. When something "was created but doesn't show up
  for students," check that flag before anything else — that was the
  bug in "Fix published quizzes not appearing on the student quiz
  list."
- **The web app proxies all `/api/*` calls through its own origin to
  the Render API** (Next.js rewrite in `apps/web/next.config.ts`)
  instead of the browser calling the API's domain directly — this is
  deliberate, not incidental (see gotcha below). Don't "simplify" this
  back to direct cross-origin calls.
- File uploads (teacher-uploaded PDFs, microscope images) go through a
  storage module that uses **Cloudflare R2** (S3-compatible) when
  `R2_*` env vars are set, falling back to local disk otherwise — fine
  for local dev, NOT fine in production on Render's free tier, whose
  filesystem is ephemeral and wiped on every redeploy.

## Known gotchas (learned the hard way — check here before re-debugging these)

- **`packages/shared` must be built before the API will start.** It is
  resolved through `main: dist/index.js`, not its TypeScript source,
  so on a fresh clone `npm run dev` dies immediately with
  `Cannot find module '@bioverse/shared/dist/index.js'` — the web side
  comes up fine, which makes it look like an API-only problem. Run
  `npm run build --workspace=packages/shared` once after installing.
  Rebuild it whenever shared types change: `tsx watch` follows the
  API's own sources, not `shared/dist`, so the API keeps running
  against a stale build otherwise.
- **npm 12 refuses to run package install scripts** unless they're
  listed in the root `package.json`'s `allowScripts`. Prisma needs its
  postinstall to download the query/schema engine binaries, so without
  `@prisma/engines` in that list `prisma generate` and every migration
  fail on a fresh install — and the only clue is a warning buried in
  npm's output. Add new packages there rather than disabling the
  check.
- **`.env.example`'s `DATABASE_URL` uses `postgres:postgres`**, a role
  Homebrew's PostgreSQL doesn't create. On macOS the working value is
  usually `postgresql://<your-mac-username>@localhost:5432/bioverse`.

- **Cross-origin cookies silently break on Safari / strict
  cookie-blocking browsers.** Calling the API directly from the
  browser (a different domain than the web app) made the auth/CSRF
  cookies third-party — `SameSite=None` satisfies Chrome, but Safari
  drops third-party cookies unconditionally regardless of SameSite,
  silently breaking login persistence and every CSRF-protected action
  (AI Tutor messages, uploads, quiz attempts) for those users. Fixed
  by proxying `/api/*` through the web app's own origin so cookies are
  always first-party. Because requests now pass through two proxy hops
  (Vercel edge, then Render's own load balancer), Express's
  `trust proxy` is set to `2`, not `1` — if the deployment topology
  ever gains/loses a proxy hop, this number has to change too or
  per-client rate limiting breaks.
- **Render's free-tier instance sleeps after ~15 min idle**, and cold
  start takes 30-60s+. Server-rendered pages that `fetch()` the API
  with no timeout used to hang or fail outright during a cold start,
  making the whole site look down. Server fetches now time out after
  5s with a graceful fallback UI — don't remove those timeouts. A
  scheduled GitHub Actions workflow also pings the API's health
  endpoint every 10 min during typical WIB school hours to keep it
  warm during real usage.
- **Render auto-selects the newest Node satisfying `engines`**
  (`>=20`), which pulled in Node 26 — a version that resolved
  TypeScript types differently than the locally-tested Node 22,
  surfacing type errors that didn't reproduce locally. Node is now
  pinned to exactly `22.14.0` via `.node-version` — don't loosen the
  engines range without re-testing the build on Render itself, not
  just locally.
- **R2 was wired up on 2026-08-10** — bucket `bioverse-uploads`,
  Asia-Pacific (APAC), on a Cloudflare account that is deliberately
  temporary (see the handover note below). All five `R2_*` vars are
  set in Render, and the proof it took effect is *negative*: the
  `[storage] R2_* env vars are not fully set — falling back to local
  disk` line that used to sit right before `BioVerse API listening` is
  gone from the deploy log. If it ever comes back, a var was dropped.
  The API token is an **Account** API token, not a User one — a User
  token dies when its creator leaves the account, which is exactly
  what the handover plan does. It is scoped to Object Read & Write on
  that one bucket, TTL forever.
- **`r2.dev` is DNS-blocked by Indonesian ISPs — the public bucket URL
  does not reach the students this app is for.** Measured on 2026-08-10
  from a Biznet connection: `pub-<hash>.r2.dev` resolves through a
  CNAME to `rpz.biznet` → `202.169.44.80`, which refuses the
  connection. It is a blanket block on the domain, not on our bucket —
  an invented `pub-abc123.r2.dev` resolves to the same address. RPZ
  blocking like this usually tracks the national blocklist, so assume
  other Indonesian ISPs behave the same until proven otherwise.
  What still works: `*.r2.cloudflarestorage.com` (the S3 endpoint the
  API writes through, resolving to real Cloudflare IPs) and
  `cloudflare.com` itself. So **teacher uploads succeed while student
  reads fail** — files land in the bucket, then every `<img>` and PDF
  link pointing at `r2.dev` is dead for anyone on a blocking ISP.
  The fix is a **custom domain** on the bucket, which Cloudflare
  recommends for production anyway (r2.dev is also rate-limited and
  uncached). Attach the domain, then change `R2_PUBLIC_URL` to it.
  Do this while the bucket is still empty if at all possible — once
  teachers have uploaded, changing the public URL means rewriting
  stored URLs, per the handover note below.
  A Render persistent disk is not the way out either — disks aren't
  offered on the free instance type. Fixing this means creating a
  Cloudflare R2 bucket and setting all five `R2_*` vars;
  `isCloudStorageConfigured()` only switches over when every one of
  them is non-empty, so a partial fill silently changes nothing.
- **Never migrate the R2 bucket to a different Cloudflare account —
  hand the account over instead.** Whichever account R2 gets enabled
  on is meant to be temporary (it starts on the developer's personal
  account, to be handed to the real teacher later), and the tempting
  move is to make a bucket in the new account and copy the objects
  across. Don't. `uploadBuffer` returns `${R2_PUBLIC_URL}/${key}` and
  that **absolute** URL is what gets persisted — in
  `material_uploads."fileUrl"`, `microscope_slides."slideImageUrl"`
  and `questions."imageUrl"`. Change the public URL and every existing
  link breaks at once; worse, `deleteByUrl` only recognizes a file
  whose URL starts with the *current* prefix, so the old objects also
  stop being deletable through the app and linger as orphans.
  The agreed plan is therefore: invite the teacher's email under
  Cloudflare's Manage Account → Members, promote them to Super
  Administrator, and step down. The bucket never moves, the URLs never
  change, no data migration happens. If a real migration ever becomes
  unavoidable, it is: copy objects (`rclone sync` between the two S3
  endpoints), update the five env vars, then rewrite the stored
  prefixes with three `UPDATE ... replace(...)` statements over the
  columns listed above. A custom domain in front of the bucket would
  sidestep the whole problem, and is worth doing if a Cloudflare-managed
  domain ever exists.
- **`express-rate-limit` collapses everyone behind the same reverse
  proxy into one bucket** unless `app.set('trust proxy', N)` matches
  the actual number of proxy hops — get this wrong and an entire
  school's shared network IP gets rate-limited as if it were one
  client.
- **The Gemini SDK (`@google/genai`) is ESM-only** and is lazy-loaded
  inside the API rather than imported at the top level, to avoid
  breaking the CommonJS/TS build. Follow that pattern for other
  ESM-only packages instead of a top-level `import`.
- **TypeScript module resolution matters for the build specifically on
  Render, not just locally** — past fixes here included switching to
  `module`/`moduleResolution: node16` and removing a deprecated
  `baseUrl` in favor of relative paths. If a build fails on Render but
  passes locally, suspect a TS/module-resolution mismatch first.
- **The API and its database sit on opposite sides of the planet.**
  Production Postgres is **Neon** (`neondb`, host
  `ep-soft-silence-auaq59ca.c-10.us-east-1.aws.neon.tech`) in
  **us-east-1**, while the Render service runs in **Singapore** — read
  off the deploy log on 2026-08-10. Every query pays a cross-Pacific
  round trip, so an endpoint issuing a handful of sequential queries
  spends most of its time waiting on the network, not on Postgres.
  Worth knowing before optimizing anything query-shaped: batching
  round trips helps far more than tuning individual queries, and
  moving one of the two regions would help most of all.
- **Neon's free tier suspends the compute when idle**, which shows up
  in the API log as
  `prisma:error ... terminating connection due to administrator command`.
  It is the database going to sleep, not a crash or a Prisma bug — but
  it stacks with Render's own 15-minute spin-down, so the first
  request after a quiet spell can be waiting on *two* cold starts.

## Environment variables

`apps/api/.env` (copy from `apps/api/.env.example`):
- `DATABASE_URL` — local Postgres for dev. **Production value is set
  directly in Render's dashboard**, not in `render.yaml`
  (`sync: false`) — which Postgres provider hosts it hasn't been
  verified from this repo; check Render's dashboard.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `GEMINI_API_KEY` — optional; without it, AI Expand / AI Tutor reply
  with a graceful "not configured" message instead of crashing. Free
  key at aistudio.google.com/apikey.
- `TEACHER_ALLOWLIST_EMAILS` — comma-separated; empty in local dev
  allows self-registering as either role (old behavior), must be set
  in production.
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
  `R2_BUCKET_NAME` / `R2_PUBLIC_URL` — optional locally, all five or
  nothing; without the full set, uploads fall back to local disk. All
  five are set in production as of 2026-08-10. `R2_PUBLIC_URL`
  currently points at the `r2.dev` development URL, which Indonesian
  ISPs block — see the gotcha above before assuming student-facing
  files actually load.

`apps/web/.env.local` — **not needed locally, and there is no
`apps/web/.env.example` in the repo to copy** despite what the setup
steps below used to say. `NEXT_PUBLIC_API_URL` already defaults to
`http://localhost:4000` in both `next.config.ts` and
`src/lib/api-server.ts`; only set it for deployed environments.

## Deployment

- **Web:** Vercel, built from this repo's `apps/web` (the monorepo
  root directory setting in the Vercel project tripped up an earlier
  deploy — see the commit titled "Trigger Vercel deploy with corrected
  monorepo root directory" if a deploy looks like it's building the
  wrong thing).
- **API:** Render, blueprint in `render.yaml`, free tier, Singapore
  region. Service `bioverse-api`, id `srv-d9qkvg3m8hqs738ltkhg`, live
  at `https://bioverse-api.onrender.com`. The dashboard lists it under
  **Ungrouped Services** on the workspace Overview, not under Projects
  — easy to miss. Its env vars are two clicks deep, or directly at
  `dashboard.render.com/web/srv-d9qkvg3m8hqs738ltkhg/env` (that page
  opens with a "Create environment group" button, which is *not* what
  you want — the variable table is below it).
- **Database:** **Neon** serverless Postgres (`neondb`, us-east-1),
  not a Render-hosted database — identified from the deploy log, since
  the connection string lives only in Render's dashboard env vars and
  is not version-controlled here. See the latency and idle-suspend
  gotchas above.
- **Pushing to `main` does auto-deploy the API** — confirmed on
  2026-08-10, when a push showed up as "Deploy live for `<sha>`" in the
  service's Events tab without anyone touching the dashboard. The same
  has not been confirmed for the Vercel side.

## First-time setup on a new machine

1. Homebrew, then `brew install node` — but pin to the exact version
   this repo expects (check `.node-version`, currently `22.14.0`).
   Consider `nvm`/`fnm` if you'll also work on other Node projects
   with different version needs on the same machine.
2. `brew install postgresql@16` (or current),
   `brew services start postgresql@16`.
3. Clone: `git clone https://github.com/BeniceDidan/bioverse.git`
4. `npm install` at the repo root — npm workspaces installs
   `apps/web`, `apps/api`, and `packages/shared` deps together.
5. `cp apps/api/.env.example apps/api/.env`, then fill in
   `DATABASE_URL` (your local Postgres — mind the `postgres:postgres`
   trap in the gotchas) and generate the JWT secrets (see above).
   `apps/web` needs no env file locally.
6. `npm run build --workspace=packages/shared` — required before the
   API will start at all.
7. `createdb bioverse` (or whatever matches your local `DATABASE_URL`).
8. `npm run db:migrate` then `npm run db:seed` — seeds demo accounts:
   student `siswa.demo@bioverse.id` / `Demo1234!`, teacher
   `guru.demo@bioverse.id` / `Demo1234!`.
9. `npm run dev` — runs web (`:3000`) and api (`:4000`) together via
   `concurrently`.
10. Verify: register/login as both roles, open a materi page, try the
    AI Tutor (works even without `GEMINI_API_KEY` — just replies with a
    "not configured" message instead of erroring).

Seeding only creates the empty "Jaringan Hewan" **container** plus the
two demo accounts — no sections, quizzes, slides, or videos. A freshly
seeded install showing "Belum ada …" on every page is correct, not a
broken seed; content is authored through the teacher account.
