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
- `apps/web` — Next.js 14 (App Router), TypeScript, Tailwind CSS,
  shadcn/ui. Deployed on **Vercel**.
- `apps/api` — Express + TypeScript + Prisma ORM + PostgreSQL.
  Deployed on **Render** (free tier, Singapore region — see
  `render.yaml`).
- `packages/shared` — TypeScript types & Zod schemas shared between
  web and api.

Node.js is pinned to **exactly 22.14.0** (`.node-version`) — see the
gotcha below before loosening this.

## Architecture — how web and api actually talk

- Auth: JWT access + refresh tokens in httpOnly cookies, issued by the
  API.
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
- **Uploaded files are lost on every Render redeploy** unless the
  `R2_*` env vars are set (ephemeral disk on the free tier). As of the
  commit that wired up R2 support, it was **not yet configured in
  production** — verify current state (e.g. check Render's dashboard
  env vars) before assuming uploads persist live.
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
  `R2_BUCKET_NAME` / `R2_PUBLIC_URL` — optional; without them, uploads
  fall back to local disk.

`apps/web/.env.local` (copy from `apps/web/.env.example`):
- `NEXT_PUBLIC_API_URL` — `http://localhost:4000` locally.

## Deployment

- **Web:** Vercel, built from this repo's `apps/web` (the monorepo
  root directory setting in the Vercel project tripped up an earlier
  deploy — see the commit titled "Trigger Vercel deploy with corrected
  monorepo root directory" if a deploy looks like it's building the
  wrong thing).
- **API:** Render, blueprint in `render.yaml`, free tier, Singapore
  region.
- **Database:** PostgreSQL, connection string set directly in Render's
  dashboard env vars, not version-controlled in this repo.
- Whether pushing to `main` auto-deploys both, or needs a manual
  trigger on one/both platforms, hasn't been confirmed from the repo
  alone — check each platform's dashboard the first time.

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
5. `cp apps/api/.env.example apps/api/.env` and
   `cp apps/web/.env.example apps/web/.env.local`, then fill in
   `DATABASE_URL` (your local Postgres) and generate the JWT secrets
   (see above).
6. `createdb bioverse` (or whatever matches your local `DATABASE_URL`).
7. `npm run db:migrate` then `npm run db:seed` — seeds demo accounts:
   student `siswa.demo@bioverse.id` / `Demo1234!`, teacher
   `guru.demo@bioverse.id` / `Demo1234!`.
8. `npm run dev` — runs web (`:3000`) and api (`:4000`) together via
   `concurrently`.
9. Verify: register/login as both roles, open a materi page, try the
   AI Tutor (works even without `GEMINI_API_KEY` — just replies with a
   "not configured" message instead of erroring).
