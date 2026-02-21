# Expense Tracker Backend — Features & Tasks

Overview of implemented work and planned tasks for the TraceX expense tracking API.

---

## Completed

- [x] **Project setup** — Node 22, TypeScript (strict), ESM, Express, Prisma, Zod, ESLint, Prettier
- [x] **Database** — PostgreSQL (Supabase), Prisma schema with `Expense` model (id, date, amount, category, description, userId, timestamps)
- [x] **Health check** — `GET /health` returns status and timestamp
- [x] **Expenses CRUD**
  - `GET /api/expenses` — list all (newest first)
  - `GET /api/expenses/:id` — get one
  - `POST /api/expenses` — create (Zod-validated)
  - `PATCH /api/expenses/:id` — partial update (Zod-validated)
  - `DELETE /api/expenses/:id` — delete
- [x] **Validation** — Zod schemas for create/update; middleware for body validation
- [x] **Error handling** — Central middleware; `AppError`; Prisma P2025 → 404
- [x] **Response format** — Consistent JSON `{ success, data? }` / `{ success: false, error }`; Decimal serialized as number
- [x] **Config** — dotenv, CORS, Prisma client, logger
- [x] **Docs** — README Quick Start, env notes (Supabase), npm scripts

---

## Planned / To Do

### Auth & multi-user

- [x] **Authentication** — Sign up / sign in via Supabase Auth; JWT verification middleware; protect routes
- [x] **User model** — Prisma `User` (id, email, name?); relation to `Expense`; upsert on first auth
- [x] **Scope by user** — All expense queries filter by `userId` from token; no client-set `userId`
- [ ] **Optional:** Password reset, email verification, OAuth (Google/GitHub)

### Expenses

- [x] **Pagination** — `GET /api/expenses?page=1&limit=20`; response includes `pagination: { page, limit, total, totalPages }`
- [x] **Filtering** — Query params: `from`, `to` (date range), `category`, `minAmount`, `maxAmount`
- [x] **Sorting** — `sort=date|amount|createdAt`, `order=asc|desc` (default: `date`, `desc`)
- [x] **Search** — `search` (case-insensitive match on `description`)

### Categories

- [x] **Category model** — `Category` table (id, name, userId?, color?, icon?); predefined have `userId` null
- [x] **Categories CRUD** — `GET/POST/PATCH/DELETE /api/categories` (list = predefined + user's; create/update/delete = user's only)
- [x] **Predefined categories** — Seed: Food, Transport, Bills, Shopping, Entertainment, Health, Other (`npm run prisma:seed`). Expense create/update validates `category` against predefined + user categories

### Analytics & reporting

- [x] **Summary by period** — `GET /api/expenses/summary?from=&to=` — `total`, `count`; optional `groupBy=day|week|month` returns `byPeriod: [{ period, total, count }]`
- [x] **Summary by category** — `GET /api/expenses/summary/by-category?from=&to=` — `total`, `count`, `byCategory: [{ category, total, count }]`
- [ ] **Optional:** Budgets (target per category/month) and endpoints to check vs actuals

### Data & export

- [x] **Export** — `GET /api/expenses/export?format=csv&from=&to=` — CSV download (date, amount, category, description); optional date range
- [x] **Bulk create** — `POST /api/expenses/bulk` — body `{ expenses: [{ date, amount, category, description? }, ...] }` (max 100); categories validated
- [x] **Soft delete** — `deletedAt` on `Expense`; all reads/summaries/exports exclude deleted; `DELETE /api/expenses/:id` sets `deletedAt`; `POST /api/expenses/:id/restore` clears `deletedAt`

### API quality & ops

- [x] **Rate limiting** — `express-rate-limit`: 200 req/15 min on `/api`, 20 req/15 min on `/api/auth`
- [x] **Request ID** — Middleware sets/forwards `X-Request-ID` (req.id + response header)
- [x] **API versioning** — Routes at `/api/v1/*`; `/api/*` also mounted for backward compat
- [x] **OpenAPI/Swagger** — Spec in `src/openapi.ts`; UI at `GET /api-docs`
- [x] **Tests** — Vitest: unit tests for expense schemas; integration tests for health, request ID, versioned routes (supertest). Run: `npm run test`

### Infrastructure & deployment

- [ ] **CI** — Lint, test, build on push (e.g. GitHub Actions)
- [ ] **Deploy** — e.g. Railway, Render, Fly.io; env-based config
- [ ] **Logging** — Structured logger (e.g. Pino) and log levels
- [ ] **Optional:** Caching for summary/analytics (e.g. Redis) if needed later

---

## Suggested order

1. **Auth + User + scope by user** — Required for multi-user.
2. **Pagination + filtering + sorting** — Improves list endpoint.
3. **Summary by period / by category** — Core value for an expense app.
4. **Categories (predefined or CRUD)** — Better data quality.
5. **Export + tests + rate limiting** — Polish and production readiness.
6. **API docs (OpenAPI) + CI + deploy** — Team and production use.

---

## Notes

- Single-user mode is supported today: `userId` is optional on `Expense`.
- When adding auth, switch to required `userId` and derive it from the authenticated user on create/update and in all reads.
