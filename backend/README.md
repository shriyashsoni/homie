# FMH Backend — Find My Homie API

Node.js + Express + PostgreSQL + Prisma backend for the **Find My Homie** compatibility-first shared-living platform (Bengaluru pilot).

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running locally on port 5432
- Create a DB: `createdb fmh_db`

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, SMTP credentials, JWT secrets

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations (creates all tables)
npm run prisma:migrate

# 5. Seed demo data
npm run prisma:seed

# 6. Start dev server
npm run dev
```

Server runs at: **http://localhost:5000**

Health check: **GET /health**

---

## API Structure

```
/api/v1/
├── auth/           — Register, login, JWT refresh, email verify, password reset
├── users/          — Profile update, password change, block, social link
├── profiles/       — Seeker profile CRUD, quiz answers, publish/unpublish, privacy
├── listings/       — Host listing CRUD, publish lifecycle, slot management
├── connections/    — Connection requests, accept/decline, consent-based reveal
├── viewings/       — Viewing slots, request/confirm/cancel, outcome recording
├── matches/        — Three-stage matching engine results
├── conversations/  — Consent-gated messaging (accepted connections only)
├── buddy-groups/   — People-first discovery groups
├── notifications/  — In-app notifications
├── reports/        — Safety/moderation reports
├── admin/          — Dashboard, user management, reports queue, stale scanner
└── analytics/      — Event tracking
```

---

## Demo Credentials (after seeding)

| Role   | Email                    | Password     |
|--------|--------------------------|--------------|
| Admin  | admin@findmyhomie.in     | Admin@1234   |
| Host   | host@demo.in             | Host@1234    |
| Seeker | seeker@demo.in           | Seeker@1234  |

---

## Key Design Principles (from FMH handbook)

- **Privacy by default** — Religious practice, phone are private unless explicitly made public
- **Consent-based contact reveal** — Address and contact only visible after connection accepted server-side
- **No identity inference** — Diet, religion never inferred from name/region/appearance
- **Transparent costs** — All listing costs (rent + maintenance + deposit + brokerage) shown upfront
- **Three-stage matching** — Feasibility → Compatibility → Ranking with grounded explanations
- **Listing freshness** — Stale listings auto-flagged after 14 days; hosts get warning emails
- **Structured field provenance** — Every AI-extracted field has source, confidence, confirmation status
- **No raw audio/chat retention** — Only confirmed structured data persisted

---

## Matching Algorithm

Stage 1: **Feasibility** (hard eliminators) — city, budget ceiling, move-in date, room type, listing status  
Stage 2: **Compatibility** (weighted scoring) — food/diet, smoking, pets, guests, social level, budget fit  
Stage 3: **Ranking** — compatibility × 0.6 + coverage × 0.2 + freshness × 0.2  

Results include 2–3 grounded `explanationPositive` and `explanationTradeoffs` strings.

---

## Phase Roadmap (per FMH handbook)

| Phase | Scope |
|-------|-------|
| 0 | ✅ Repo, schema, auth, analytics, design system |
| 1 | ✅ Seeker/host onboarding, quiz, listing form, verification |
| 2 | ✅ Discovery, scoring, explanations |
| 3 | ✅ Connections, viewings, host calendar, report/block |
| 4 | 🚧 Homie AI extraction layer (multilingual NLP) |
| 5 | ⬜ Pilot optimisation, listing freshness automation |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `SMTP_*` | Email SMTP configuration |
| `FRONTEND_URL` | Allowed CORS origin |
