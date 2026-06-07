# WholesaleOS — Virtual Wholesaling Platform

An all-in-one operating system for a virtual real estate wholesaling business.
It covers the full deal lifecycle: **acquisitions CRM → analysis → pipeline →
dispositions → contracts → close**, with marketing, tasks, and analytics layered
on top.

> ⚠️ The contract templates included are **educational examples, not legal
> advice**. Have a licensed attorney review any document before use.

## Features

### 📊 Dashboard
KPI overview — realized revenue, pipeline value, lead conversion, active buyers,
a pipeline funnel, a 6-month revenue chart, tasks due, newest leads, and a live
activity feed.

### 🎯 Acquisitions
- **Seller Leads CRM** — capture motivated sellers with contact + property info,
  lead source, motivation, temperature, status pipeline, notes, and a full
  activity timeline. One-click **convert lead → deal**.
- **Deal Pipeline** — Kanban board across stages (Lead → Contacted →
  Appointment → Offer → Under Contract → Assigned → Closed), per-deal P&L,
  inline economics editing, buyer assignment, and activity log.
- **Properties** — property records with valuation, **ARV-from-comps**
  estimation, comparable sales management, and links to leads/deals.
- **Deal Analyzer** — interactive **MAO / 70%-rule calculator**: Buyer MAO,
  your max offer to the seller, assignment fee, estimated flipper profit, and a
  rehab estimator by cost-per-sqft tier. Deep-links from any property.

### 💰 Dispositions
- **Cash Buyers CRM** — buyer profiles with a structured **buy box** (markets,
  property types, price range, min beds, max rehab, proof of funds).
- **Deal Matching** — pick a deal and see buyers **ranked by buy-box fit score**,
  assign with one click, and **blast** the deal to top-matching buyers.
- **Apollo.io integration** — **Discover Buyers** searches Apollo for investor
  prospects by market/keyword and imports them as buyers; **Enrich** reveals a
  buyer's verified email & phone (1 Apollo credit per match). Set `APOLLO_API_KEY`
  to enable. (Apollo targets businesses/professionals — not homeowner skip tracing.)

### 🔐 Authentication & roles
- Cookie-session login (HMAC-signed, scrypt-hashed passwords — no external deps).
- Three account types: **Master Admin** (everything + Team management),
  **Acquisition Manager** (leads, pipeline, properties, analyzer), and
  **Disposition Manager** (buyers, matching, marketing). Both managers share the
  dashboard, contracts, and tasks.
- Route protection via middleware; admins manage logins on the **Team & Access**
  page. Demo logins are shown on the sign-in screen.

### 📣 Operations
- **Marketing** — multi-channel campaigns (SMS, email, direct mail, cold call,
  RVM, PPC) with performance tracking (sent / delivered / responses / leads /
  cost / cost-per-lead) and reusable message **templates** with merge tags.
- **Contracts** — auto-generated purchase, assignment, JV, and option agreements
  from deal fields, with status tracking and a printable document view.
- **Tasks** — follow-ups with priority, due dates, overdue tracking, and links
  to leads/deals.

## Tech stack

- **Next.js 14** (App Router, React Server Components + Server Actions)
- **TypeScript** (strict)
- **Prisma** ORM with **SQLite** (zero external services — swap `DATABASE_URL`
  for Postgres in production)
- **Tailwind CSS**
- **Recharts** for analytics

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create the database, generate the client, and seed demo data
cp .env.example .env        # or: echo 'DATABASE_URL="file:./dev.db"' > .env
npm run setup               # prisma generate + db push + seed

# 3. Run the dev server
npm run dev                 # http://localhost:3000
```

Useful scripts:

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate`) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Wipe + re-push schema + reseed |
| `npm run setup` | One-shot generate + push + seed |

The seed creates a realistic demo workspace: 3 users, 8 properties, 9 seller
leads, 6 cash buyers, 8 deals across the pipeline, 5 marketing campaigns, 3
contracts, and 7 tasks.

## Deploy a public login URL (Vercel)

Local/Codespaces run on SQLite with zero setup. For a permanent, browser-accessible
URL with working logins, deploy to **Vercel** with a free **Neon** Postgres database.
The repo is already wired for this — production uses a generated Postgres schema
(`scripts/prod-schema.mjs`) so the source of truth stays in `prisma/schema.prisma`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FStitch-sixtwosix%2Fwholesaling-platform&env=SESSION_SECRET&envDescription=A%20long%20random%20string%20used%20to%20sign%20login%20sessions)

Steps:

1. Click **Deploy** (or go to vercel.com/new and import this repo).
2. In **Storage**, add a **Neon Postgres** database — Vercel auto-sets `DATABASE_URL`.
3. Set **`SESSION_SECRET`** to any long random string.
4. Deploy. The build (`vercel-build`) generates the Postgres schema, pushes it,
   seeds the demo logins, and builds the app.
5. Open the Vercel URL and sign in with the demo accounts below.

> The build seeds demo data only on the first deploy (it skips if the DB already
> has data). Change the demo passwords before sharing the URL widely.

## Project structure

```
app/
  page.tsx            # Dashboard
  leads/              # Acquisitions CRM (reference module)
  pipeline/           # Deal pipeline (Kanban)
  properties/         # Properties + comps + ARV
  analyzer/           # MAO / deal calculator
  buyers/             # Cash buyers CRM
  dispositions/       # Deal-to-buyer matching & blasting
  marketing/          # Campaigns + templates
  contracts/          # Contract generation
  tasks/              # Tasks & follow-ups
components/           # Shared UI, forms, charts, nav
lib/
  db.ts               # Prisma client
  constants.ts        # Domain vocabulary (statuses, stages, colors)
  format.ts           # Currency / date / number formatting
  analyzer.ts         # MAO math, ARV from comps, buyer match scoring
  contracts.ts        # Contract template generation
prisma/
  schema.prisma       # Data model
  seed.ts             # Demo data
```

## Architecture notes

- **Server Actions** handle all mutations (create/update/delete) — no separate
  REST layer. Each module owns its `actions.ts`.
- **Server Components** read directly from Prisma; small **client components**
  handle interactive controls (status selects, calculators).
- Domain vocabulary (statuses, stages, channels) and their display colors live
  in `lib/constants.ts` so labels/badges stay consistent everywhere.

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Master Admin | jordan@wholesaleos.com | admin123 |
| Acquisitions Manager | maya@wholesaleos.com | acq123 |
| Dispositions Manager | devon@wholesaleos.com | dispo123 |

> Change these and set a strong `SESSION_SECRET` before any real deployment.

## Roadmap / extension points

- Multi-tenant teams / organizations
- Homeowner skip-tracing via a property-data provider (BatchData, PropStream)
- Live SMS/email sending (Twilio / SendGrid) wired into campaigns
- E-signature integration for contracts (DocuSign / HelloSign)
- Document storage for property photos and signed docs
- Automated comps via an MLS/data provider
```
