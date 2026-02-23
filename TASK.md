# TraceX Backend — Task List (Production)

Personal expense management API. Tasks grouped by feature. Use Node.js, Express, Docker, and GitHub.

---

## Phase 0: Project foundation

### 0.1 Repository & tooling
- [x] Create GitHub repo (e.g. `tracex-backend`); add README, .gitignore (Node, env, IDE, OS)
- [x] Init Node project: `package.json`, lockfile, `engines.node` (e.g. >=20)
- [x] TypeScript: `tsconfig.json` (strict, ESM), `src/` layout
- [x] ESLint + Prettier; add `lint`, `format`, `typecheck` scripts
- [x] Env: `.env.example` with placeholders; never commit `.env`

### 0.2 Express app skeleton
- [x] Minimal Express app (JSON body parser, CORS config)
- [x] Health route: `GET /health` → `{ status, timestamp }`
- [x] Central error middleware (4xx/5xx, consistent JSON `{ success, error }`)
- [x] Request ID middleware (e.g. `X-Request-ID`); log with request ID
- [x] Structured logger (e.g. Pino or Winston); log level from env

### 0.3 Docker
- [x] `Dockerfile`: multi-stage build (builder: install + build, runner: node image, non-root user)
- [x] `docker-compose.yml`: app service + PostgreSQL; env from `.env`; healthchecks
- [x] `.dockerignore`: node_modules, .git, .env, tests, docs
- [x] Document: run with `docker compose up`; DB URL for app

### 0.4 Database
- [x] Add PostgreSQL (local + in Docker); choose ORM (e.g. Prisma). **Storage: Supabase (PostgreSQL).**
- [x] Prisma: `schema.prisma`, `datasource` + `generator`; init migration
- [x] DB client singleton; graceful connect/disconnect on app start/stop
- [x] Seed script (optional): predefined categories or demo data

---

## Phase 1: Authentication & users

### 1.1 User model & auth
- [x] User model: `id`, `email` (unique), `passwordHash`, `name?`, timestamps
- [x] Sign up: `POST /api/auth/signup` — body `email`, `password`; validate (e.g. Zod); hash (bcrypt); create user; return user + JWT
- [x] Sign in: `POST /api/auth/signin` — validate; compare password; return user + JWT
- [x] JWT: sign with secret from env; optional expiry; payload e.g. `sub` (userId), `email`
- [x] Auth middleware: verify JWT; attach `req.user` (id, email); 401 if invalid/missing

### 1.2 Protected “me” and security
- [x] `GET /api/auth/me` — require auth; return current user (id, email, name)
- [x] Rate limit auth routes (e.g. 20 req/15 min per IP) to reduce brute-force risk
- [x] Validation: password min length; email format; return clear 400 messages

---

## Phase 2: Categories

### 2.1 Category model & API
- [x] Category model: `id`, `name`, `userId?` (null = predefined), `color?`, `icon?`, timestamps
- [x] `GET /api/categories` — list predefined + current user’s; require auth
- [x] `GET /api/categories/:id` — one category; require auth; 404 if not found or not allowed
- [x] `POST /api/categories` — create user category (name, color?, icon?); require auth; reject duplicate name per user
- [x] `PATCH /api/categories/:id` — update user category only; require auth
- [x] `DELETE /api/categories/:id` — delete user category only; require auth
- [x] Seed: predefined categories (e.g. Food, Transport, Bills, Shopping, Entertainment, Health, Other)

---

## Phase 3: Expenses

### 3.1 Expense model & CRUD
- [x] Expense model: `id`, `date`, `amount`, `category` (string), `description?`, `userId`, `deletedAt?`, timestamps
- [x] `GET /api/expenses` — list current user’s (exclude soft-deleted); pagination (`page`, `limit`); filters: `from`, `to`, `category`, `minAmount`, `maxAmount`, `search` (description); sort/order
- [x] `GET /api/expenses/:id` — one expense; require auth; 404 if not owner
- [x] `POST /api/expenses` — create (date, amount, category, description?); validate category exists (predefined or user); require auth
- [x] `PATCH /api/expenses/:id` — partial update; require auth; validate category if changed
- [x] `DELETE /api/expenses/:id` — soft delete (`deletedAt`); require auth
- [x] `POST /api/expenses/:id/restore` — clear `deletedAt`; require auth
- [x] Validation: amount > 0; date; category name length; description max length

### 3.2 Bulk & summaries
- [x] `POST /api/expenses/bulk` — body `{ expenses: [{ date, amount, category, description? }, ...] }`; max 100; same validation as single create
- [x] `GET /api/expenses/summary` — query `from`, `to`, optional `groupBy` (day|week|month); response: `total`, `count`, optional `byPeriod`
- [x] `GET /api/expenses/summary/by-category` — query `from`, `to`; response: `total`, `count`, `byCategory: [{ category, total, count }]`
- [x] `GET /api/expenses/export` — query `format=csv`, `from`, `to`; return CSV attachment (date, amount, category, description)

---

## Phase 4: API quality & production readiness

### 4.1 API design
- [x] Versioning: mount routes under `/api/v1` (and optionally `/api` for compatibility)
- [x] Consistent response shape: success `{ success: true, data }`; error `{ success: false, error }`; use HTTP status correctly
- [x] OpenAPI (Swagger): spec for all routes; serve UI at e.g. `GET /api-docs`
- [x] Rate limiting: global API limit (e.g. 200 req/15 min per IP); auth routes stricter

### 4.2 Security & config
- [x] CORS: configurable origins from env; restrict in production
- [x] Helmet (or equivalent) for security headers
- [x] No secrets in code; all config from env (DATABASE_URL, JWT_SECRET, PORT, NODE_ENV)
- [x] Validate env at startup; fail fast if required vars missing

### 4.3 Observability & errors
- [x] Logging: request (method, path, status, duration, requestId); errors with stack in non-production
- [x] Prisma/DB errors: map P2025 → 404; unique violations → 409 or 400 with clear message
- [x] No stack traces or internal details in production error response body

### 4.4 Testing
- [x] Unit tests for validation schemas (Zod) and pure utils
- [x] Integration tests: health, auth (signup/signin/me), at least one expense CRUD flow
- [x] Test DB: separate DB or schema for tests; run migrations in test setup
- [x] Script: `npm run test`; optional CI step later

---

## Phase 5: Docker & deployment

### 5.1 Docker production-ready
- [x] Dockerfile: use official Node image; build step runs `npm ci` and `prisma generate` + app build; runtime stage copies only needed artifacts; non-root user; `PORT` from env
- [x] docker-compose: app depends on Postgres; Postgres volume for data; env file; app restarts on failure
- [x] Entrypoint or start command: run DB migrations (e.g. `prisma migrate deploy`) before starting app, or document one-off migration step
- [x] Healthcheck in Docker: curl `/health`; Postgres `pg_isready`

### 5.2 GitHub & repo hygiene
- [x] README: quick start (install, env, run, Docker), main env vars, how to run tests
- [x] .gitignore: node_modules, .env, dist, coverage, IDE, OS files
- [x] Branch strategy: e.g. `main` protected; feature branches; optional GitHub Actions (lint, test, build)
- [x] Optional: GitHub Actions workflow — lint + test on push/PR; optional build Docker image

---

## Phase 6: Optional enhancements

- [x] Budgets: model (e.g. category + period + limit); endpoints to set/read budget and compare to spending
- [x] Recurring expenses: model + cron or job to create entries
- [x] Pagination metadata: `totalPages`, `hasNext`, `hasPrev` in list responses
- [x] Request validation: centralized Zod (or similar) for body/query/params; reuse in OpenAPI
- [ ] API key or admin role for future internal tools (if needed)
- [x] Structured API docs for frontend (e.g. export OpenAPI or maintain a dedicated API-FRONTEND.md)

---

## Phase 7: Suggested next tasks

*Pick what fits your roadmap; reorder or skip as needed.*

### 7.1 User & auth improvements
- [x] **Update profile:** `PATCH /api/auth/me` — update `name`; optional: avatar URL or profile fields
- [x] **Change password:** `POST /api/auth/change-password` — body `currentPassword`, `newPassword`; require auth; invalidate other sessions optionally
- [ ] **Refresh token:** optional refresh token flow (short-lived access + long-lived refresh); store refresh tokens in DB or allowlist
- [ ] **Password reset (email):** request reset link via email; token in link; endpoint to set new password (requires email provider or Supabase Auth)

### 7.2 Data & UX
- [x] **Expense–category link:** optional `categoryId` on expense (FK to categories) for consistency; keep `category` string (denormalized from category name)
- [x] **Soft-delete categories:** add `deletedAt` to categories; filter in list; allow restore (`POST /api/categories/:id/restore`)
- [x] **Bulk edit/delete expenses:** `PATCH /api/expenses/bulk` (ids + optional payload), `DELETE /api/expenses/bulk` (ids in body)
- [x] **List budgets with compare:** `GET /api/budgets?includeSpending=true` to return each budget with current spending in one call

### 7.3 DevEx & quality
- [ ] **E2E tests:** Playwright or Supertest against a real server; smoke test critical flows
- [ ] **OpenAPI from Zod:** generate OpenAPI spec from Zod schemas (e.g. zod-to-openapi) so docs stay in sync
- [ ] **DB indexes:** add indexes for common filters (e.g. expenses: `userId`, `date`, `deletedAt`; budgets: `userId`, `year`, `month`)
- [ ] **Request validation tests:** unit tests that invalid payloads return 400 with expected messages

### 7.4 Security & ops
- [ ] **API key or admin role:** optional `X-API-Key` or role on user for internal/cron (e.g. call `/api/recurring/run` with key instead of user JWT)
- [ ] **Audit log:** optional table for sensitive actions (login, password change, bulk delete); write from controllers
- [ ] **Deploy docs:** document deploy to Railway, Render, Fly.io, or VPS (env, migrations, healthcheck)
- [ ] **Staging env:** separate staging DB and env; optional branch deploy or manual staging URL

### 7.5 Optional product ideas
- [x] **Multi-currency:** `currency` on user (PATCH /auth/me) and on expense (create/update); display only
- [x] **Receipts/attachments:** optional `receiptUrl` on expense (create/update); store URL only
- [x] **Sharing:** optional `shareSlug` on budget; `GET /api/v1/public/budgets/:slug` (no auth) returns budget + spending
- [x] **Notifications:** optional `webhookUrl` on user (PATCH /auth/me); POST to URL when recurring run creates expenses

---

## Phase 8: More feature ideas

*Suggested features to consider next; pick by priority and effort.*

### 8.1 Analytics & reporting
- [ ] **Trends API:** `GET /api/v1/expenses/trends` — compare periods (e.g. this month vs last month, YoY); return totals and % change
- [ ] **Spending insights:** `GET /api/v1/expenses/insights` — top categories by spend, average per category, “unusual” spikes (optional simple heuristics)
- [ ] **Export to PDF/JSON:** extend export with `format=json` or generate a simple PDF report (e.g. summary + by category) via a library
- [ ] **Date presets:** support query params like `preset=this_month` | `last_month` | `this_quarter` | `this_year` on summary/export/list for convenience

### 8.2 Budgets & goals
- [ ] **Budget alerts:** when `percentUsed` crosses a threshold (e.g. 80%), optionally extend webhook payload or add a dedicated “alerts” log table for the frontend to poll
- [ ] **Savings goals:** model (e.g. target amount, deadline, optional category); endpoint to track progress (saved vs target)
- [ ] **Copy budget:** `POST /api/v1/budgets/:id/copy` — duplicate a budget to another month/year
- [ ] **Budget templates:** save a “template” (category + default limit) and apply to a given month/year in one call

### 8.3 Expenses & categories
- [ ] **Expense tags/labels:** optional many-to-many tags (e.g. `#work`, `#reimbursable`); filter list by tag; CRUD for tag names
- [ ] **Split expense:** split one expense across multiple categories or “payers” (e.g. shared dinner); store as one record with split breakdown or child records
- [ ] **Recurring template from history:** “Create recurring from this expense” — suggest frequency from past similar expenses
- [ ] **Category rules:** e.g. auto-assign category from description (keyword rules or simple ML); run on create or via a “suggest category” endpoint
- [ ] **Trash/archived view:** `GET /api/v1/expenses?deleted=true` (or `includeDeleted`) for admin/restore UI; paginated

### 8.4 Auth & account
- [ ] **Refresh token:** short-lived access token + long-lived refresh token; store refresh tokens in DB; rotate on use; revoke all on password change
- [ ] **Password reset (email):** request token via email (Resend, SendGrid, or Supabase); `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` with token
- [ ] **Email verification:** optional verify email on signup; send link; `GET /api/auth/verify-email?token=...`
- [ ] **Delete account:** `DELETE /api/auth/me` — require password; soft-delete or anonymize user and data (GDPR-style)
- [ ] **Sessions / device list:** store sessions (e.g. refresh token or device id); `GET /api/auth/sessions`, revoke by id

### 8.5 Integrations & automation
- [ ] **Import from bank/CSV:** `POST /api/v1/expenses/import` — upload CSV with configurable column mapping; validate and create in bulk (with optional “dry run”)
- [ ] **Calendar feed:** `GET /api/v1/expenses/feed.ics` — iCal feed of expenses (or recurring due dates) for calendar apps
- [ ] **Slack/Discord bot or webhook:** post daily/weekly summary to a channel when webhookUrl is a Slack incoming webhook
- [ ] **API key for cron:** optional `X-API-Key` or service role to call `POST /api/v1/recurring/run` without user JWT (for scheduled jobs)

### 8.6 Performance & scale
- [ ] **DB indexes:** composite indexes for common queries (e.g. `(user_id, date)`, `(user_id, deleted_at)` on expenses; `(user_id, year, month)` on budgets)
- [ ] **Cursor-based pagination:** optional `?cursor=...&limit=20` for expenses list for very large datasets
- [ ] **Caching:** cache category list or summary for a short TTL (e.g. Redis or in-memory) for high read traffic
- [ ] **Read replicas:** use Prisma’s read replica for list/summary if DB supports it

### 8.7 Developer & ops
- [ ] **OpenAPI from Zod:** generate OpenAPI 3 spec from Zod schemas (zod-to-openapi or similar); single source of truth for validation and docs
- [ ] **E2E tests:** Playwright or Supertest; smoke test signup → create expense → list → export
- [ ] **Audit log table:** log sensitive actions (login, password change, bulk delete, export) with userId, action, timestamp, optional IP
- [ ] **Deploy runbook:** document deploy to Railway, Render, Fly.io, or VPS (env, migrations, health, rollback)
- [ ] **Staging environment:** separate staging DB + env; optional branch-based or manual deploy

### 8.8 Optional product
- [ ] **Household/group:** multi-user “workspace”; shared categories and budgets; expenses per user within workspace
- [ ] **Subscriptions:** track recurring subscriptions (name, amount, interval, next billing); link to expenses or treat as special recurring
- [ ] **Cash flow view:** income (optional model) vs expenses by period; simple projection (e.g. next 3 months)
- [ ] **Receipt OCR:** optional pipeline (e.g. external service) to extract amount/date/merchant from receipt image and suggest expense fields

---

## Summary checklist

| Area           | Key deliverables                                      |
|----------------|--------------------------------------------------------|
| Foundation     | Node, TS, Express, Docker, Postgres, Prisma, env       |
| Auth           | Signup, signin, JWT, /me, rate limit on auth           |
| Categories     | CRUD, predefined + user, seed                          |
| Expenses       | CRUD, soft delete, restore, bulk, summary, export      |
| Production     | Versioning, OpenAPI, rate limit, CORS, Helmet, logging |
| Docker         | Dockerfile, docker-compose, migrations, healthchecks    |
| GitHub         | README, .gitignore, optional CI (lint/test)            |

---

*Update checkboxes as you complete each task. Reorder or split tasks to match your workflow.*
