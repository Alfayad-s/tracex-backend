# TraceX Backend — Personal Expense Tracker API

Node.js 22+ / TypeScript / Express / Prisma / PostgreSQL backend for a personal expense tracker. **Custom authentication** (email + password, JWT); Supabase is used only for PostgreSQL storage. All expense routes are scoped to the authenticated user.

## Quick Start

```bash
# Install dependencies
npm install

# Copy .env.example to .env and set DATABASE_URL (e.g. Supabase Postgres) and JWT_SECRET

# Generate Prisma client and sync schema to DB
npm run prisma:generate
npm run prisma:push
# Seed predefined categories (Food, Transport, Bills, etc.)
npm run prisma:seed

# Run dev server
npm run dev
```

Server runs at `http://localhost:3000`. Health check: `GET http://localhost:3000/health`.

**API docs:** `GET http://localhost:3000/api-docs` (Swagger UI).

**Versioning:** Use `/api/v1` (e.g. `/api/v1/expenses`). `/api` is still supported for backward compatibility.

**Request ID:** Send `X-Request-ID` or receive one in the response for tracing.

**Rate limits:** 200 req/15 min on API; 20 req/15 min on auth (signup/signin).

## API Base

All API routes are under `/api` or `/api/v1`.

**Auth (custom; no token required for signup/signin):**

- `POST /api/auth/signup` — register (body: `email`, `password`); returns `{ user: { id, email, name }, access_token }`
- `POST /api/auth/signin` — sign in (body: `email`, `password`); returns `{ user, access_token }`
- `GET /api/auth/me` — current user (requires `Authorization: Bearer <access_token>`)

**Expenses (require `Authorization: Bearer <access_token>`):**

- `GET /api/categories` — list predefined + current user's categories
- `GET /api/categories/:id` — get one category
- `POST /api/categories` — create (body: `name`, `color?`, `icon?`); user-defined only
- `PATCH /api/categories/:id` — update (user's only)
- `DELETE /api/categories/:id` — delete (user's only)
- `GET /api/expenses/summary` — summary for date range. Query: `from`, `to` (optional). Optional `groupBy=day|week|month` returns `byPeriod`. Response: `{ total, count, byPeriod? }`.
- `GET /api/expenses/summary/by-category` — totals per category. Query: `from`, `to` (optional). Response: `{ total, count, byCategory: [{ category, total, count }] }`.
- `GET /api/expenses/export` — CSV export. Query: `format=csv`, `from`, `to` (optional). Returns attachment.
- `GET /api/expenses` — list current user's expenses (excludes soft-deleted). Query: `page`, `limit`, `from`, `to`, `category`, `minAmount`, `maxAmount`, `search`, `sort` (date|amount|createdAt), `order` (asc|desc). Response includes `data` and `pagination: { page, limit, total, totalPages }`.
- `GET /api/expenses/:id` — get one expense (must belong to user; excludes deleted)
- `POST /api/expenses` — create (body: `date`, `amount`, `category`, `description?`); `category` must be a predefined or user category name
- `POST /api/expenses/bulk` — bulk create (body: `{ expenses: [{ date, amount, category, description? }, ...] }`, max 100)
- `PATCH /api/expenses/:id` — update (partial body)
- `POST /api/expenses/:id/restore` — restore a soft-deleted expense
- `DELETE /api/expenses/:id` — soft delete (sets `deletedAt`; exclude from lists/summaries)

Responses are JSON: `{ success: true, data }` or `{ success: false, error }`. DELETE returns 204 No Content.

## Scripts

| Script            | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Run with tsx watch              |
| `npm run start`   | Run built app (after `npm run build`) |
| `npm run prisma:generate` | Generate Prisma client     |
| `npm run prisma:push`     | Push schema to DB (no migrations) |
| `npm run prisma:migrate`  | Create and run migrations   |
| `npm run prisma:studio`   | Open Prisma Studio          |
| `npm run prisma:seed`     | Seed predefined categories   |
| `npm run test`    | Run Vitest (unit + integration) |
| `npm run lint`    | Run ESLint                   |
| `npm run format`  | Format with Prettier         |

## Environment

Copy `.env.example` to `.env` and set all required variables.

- **DATABASE_URL:** PostgreSQL connection string (e.g. Supabase: Project Settings → Database → URI).
- **JWT_SECRET:** Secret used to sign JWTs; use a long random string in production.

## Tech Stack

- Node.js 22+, TypeScript (strict), ESM
- Express, CORS, dotenv
- Prisma + PostgreSQL
- Zod for validation; bcryptjs for passwords; jose for JWT

---

## Next steps

After the Quick Start:

1. **Copy env** — `cp .env.example .env` (edit if your DB URL differs).
2. **Open Prisma Studio** — `npm run prisma:studio` to view and edit data in the browser.
3. **Test the API** — Use Postman (import `postman/TraceX-API.postman_collection.json`; see `postman.md`), Thunder Client, Insomnia, or curl:
   - `GET http://localhost:3000/health`
   - `POST http://localhost:3000/api/auth/signup` with body `{ "email": "you@example.com", "password": "secret123" }`, then use the returned `access_token`.
   - `GET http://localhost:3000/api/auth/me` with header `Authorization: Bearer <access_token>`
   - `GET /api/expenses`, `POST /api/expenses` (body: date, amount, category, description?) with the same header.
4. **Use migrations** — When you change the schema, run `npm run prisma:migrate` for versioned migrations instead of `prisma db push`.
