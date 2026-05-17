# Cast

> The AI character casting agency. Browse, cast, dress, stage, and export production-ready characters for AI video pipelines.

Live at **[castability.ai](https://www.castability.ai)**.

Cast is a Next.js application that pairs a curated marketplace of AI-generated characters with a creator suite (Create + Workshop) that takes a character from concept → portrait → reference sheet → outfits/scenes → export package — handed off to whichever AI video tool the filmmaker prefers.

---

## What's in the box

- **Marketplace** (`/`) — filterable roster of characters with three license tiers (Single Project, Studio, Exclusive).
- **Create** (`/create`) — multi-step wizard to design a brand-new custom character from a description.
- **Workshop** (`/workshop/[slug]`) — dress a character in new outfits, stage them in cinematic scenes, and export a zip package (profile + reference sheet + every variant + usage guide).
- **Subscriptions + credits** (`/pricing`, `/account`) — Free, Starter, Studio, Pro plans plus one-time top-up packs. Daily credit drip for Free, prorated in-app plan switching, customer portal.
- **Admin** (`/admin`) — character upload + management, credit grants.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Storage | Vercel Blob (no SQL database) |
| Payments | Stripe (subscriptions + one-time, customer portal, webhooks) |
| Email | Resend (7 transactional templates in `emails/`) |
| Hosting | Vercel |
| Runtime | Node.js 25 |

There is no relational database. All persistent state lives in Vercel Blob as JSON documents (one per user, plus a global characters roster). Subscription truth comes from Stripe via webhooks; the user blob is the projection.

---

## Project structure

```
app/
  page.tsx                 Home page composition
  layout.tsx               Root layout — Nav + Footer, metadata
  account/                 Signed-in user dashboard (subscription, credits, history)
  admin/                   Admin tools (auth-gated by cookie)
  api/
    billing/               Subscribe, switch, cancel, portal, state, preview-switch
    characters/            Roster CRUD
    create/                Custom character creation pipeline
    media/                 Blob proxy + download
    webhooks/stripe/       Source of truth for billing state
    workshop/              Outfit, shot, package, upload routes
  characters/[slug]/       Character profile pages
  create/                  Custom character wizard
  pricing/                 Plans + top-up packs
  success/                 Post-Stripe-checkout receipt page
  workshop/[slug]/         Workshop client (real)
  workshop/custom/[id]/    Workshop for user-created characters
components/                React components (Nav, TalentCard, TalentModal, AspectRatioPicker, …)
  home/                    Homepage sections (Hero, ExportReel, …)
  create/                  Wizard steps
  admin/                   Admin UI
emails/                    React-email templates rendered server-side and sent via Resend
lib/
  characters.server.ts     Roster read/write (blob + local fallback)
  user-data.server.ts      User state, credit ledger, subscription projection
  stripe.server.ts         Stripe SDK helpers
  credit-costs.ts          Single source of truth for per-action credit costs
  generation.server.ts     Image generation pipeline (vendor abstracted)
  talent.ts                Roster types + filter logic
  launches.ts              /launches changelog entries
data/characters.json       Roster fallback (blob is the prod source of truth)
scripts/                   One-off ops (migrations, audits, grants, Stripe setup)
public/                    Static assets (logos, sample frames, fonts via next/font)
```

---

## Getting started

### Prerequisites

- Node.js 24+ (25 recommended)
- npm
- A Clerk app (auth keys)
- A Stripe account in test mode (secret + webhook signing key, Price IDs for each plan/pack)
- A Vercel Blob store (`BLOB_READ_WRITE_TOKEN`)
- A Resend API key (transactional email)
- An image-generation provider key (configured in `lib/generation.server.ts`)

### Install

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

App boots at [http://localhost:3000](http://localhost:3000).

### Required environment variables

```bash
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# Price IDs (one per plan + pack), all NEXT_PUBLIC_ for client-side checkout:
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL=
# …same for STUDIO, PRO, BOOST, POWER

# Email
RESEND_API_KEY=
RESEND_FROM=Cast <hello@castability.ai>

# Generation
# (image generation provider keys live here — see lib/generation.server.ts)

# Admin
ADMIN_PASSWORD=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Local Stripe webhook testing

Stripe can't reach `localhost`. When testing checkout flows locally, forward webhooks in a separate shell:

```bash
npm run stripe:listen
```

The signing secret it prints is deterministic per API key and matches `STRIPE_WEBHOOK_SECRET` in `.env.local` — no extra setup required.

Without this, `?billing=success` redirects work but the user blob never picks up the subscription (the webhook is the source of truth, not the redirect).

---

## Credit model

Per-action costs are centralized in [`lib/credit-costs.ts`](lib/credit-costs.ts). Never hardcode credit numbers in UI or routes — read from `CREDIT_COSTS`.

| Action | Credits |
|---|---|
| Outfit generation | 5 |
| Scene generation | 5 |
| Custom character creation | 25 |
| Voice (planned) | 100 |

| Plan | Monthly credits | Notes |
|---|---|---|
| Free | 10/day (cap 25) + 35 signup bonus | Lazy-granted on read |
| Starter | 400 | |
| Studio | 1,200 | |
| Pro | 4,000 | |

| Top-up pack | Credits | |
|---|---|---|
| Boost | 500 | One-time |
| Power | 1,500 | One-time |

Credit changes (debits, top-ups, monthly drops, signup bonus, drip) are recorded in a per-user ledger inside the user blob. Every entry includes a `sessionId` so Stripe webhook replays are idempotent.

---

## Useful scripts

All under `scripts/`. Run with `npx tsx` (TypeScript) or `node` (mjs).

| Script | Purpose |
|---|---|
| `backend-verify.mjs` | 55-assertion E2E test against test-mode Stripe + real blob |
| `migrate-credits-to-subs.mjs` | One-shot legacy → subscriptions migration (×50 conversion) |
| `resync-from-stripe.mjs` | Rebuild a user's subscription state from Stripe (recovery) |
| `audit-credits.mjs` | Sanity-check the ledger across all users |
| `reset-credits.mjs` | Zero a user's credits (local/test) |
| `grant-credits.ts` | Manually grant credits with a note |
| `setup-stripe-products.mjs` | One-shot create plans + prices in Stripe |
| `setup-stripe-portal.mjs` | Configure the customer billing portal |
| `promote-drafts.ts` | Promote `/create` user drafts to the public roster |
| `update-tier-price.ts` | Bulk-update a license tier price across the roster |
| `auto-cast.ts` | Generate new roster characters for monthly expansion |
| `import-characters.ts` | Import characters from an external output folder |

Most write to both the local file and Vercel Blob; many take `--dry-run`.

---

## Architecture notes

- **Stripe is the source of truth for billing.** The user blob is a projection — `/api/webhooks/stripe` is what writes it. Never derive subscription state from anything else.
- **The user blob has a `schemaVersion` field.** Migrations bump it; helpers refuse to write a downgraded version.
- **Daily credit drip is lazy-granted on read** via `ensureDripApplied()` — no cron job. Race-safe via re-read-before-write inside the helper.
- **Webhook idempotency** uses `tryClaimNotificationEvent()` with the Stripe event ID, so replays are no-ops.
- **The characters roster** is in Vercel Blob as `characters.json` with `data/characters.json` as the dev fallback. Both are kept in sync by `writeCharacters()` in `lib/characters.server.ts`.

---

## Dev commands

```bash
npm run dev            # Turbopack dev server on :3000
npm run build          # Production build
npm run lint           # Next.js / ESLint
npx tsc --noEmit       # Type-check only
node scripts/backend-verify.mjs   # End-to-end backend tests
```

---

## Deploy

Auto-deploys on push to `main` via Vercel. The `hero-experiments` branch is the staging branch.

Production env vars are managed in the Vercel dashboard. After changing a price, plan, or webhook endpoint in Stripe live mode, mirror the change in `vercel env` (or via the dashboard) and redeploy.

---

## Changelog

User-facing changelog lives at [`/launches`](https://www.castability.ai/launches). Add a new entry at the top of [`lib/launches.ts`](lib/launches.ts) when shipping anything user-visible.

---

## License

Proprietary. All character artwork, brand assets, and roster content are © Castability, Inc. Code is not currently licensed for reuse.
