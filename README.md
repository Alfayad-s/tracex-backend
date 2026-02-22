# TraceX Backend

Personal expense management API — Node.js, Express, TypeScript. **Data storage: Supabase (PostgreSQL).**

## Repo

- **GitHub:** [Alfayad-s/tracex-backend](https://github.com/Alfayad-s/tracex-backend)
- **Tasks:** See [TASK.md](./TASK.md) for feature checklist and phases.

## Quick start

```bash
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, etc.
npm run prisma:generate
npm run prisma:migrate   # or prisma:push for dev
npm run dev
```

Server runs at `http://localhost:3000`. Health: `GET /health` → `{ status, timestamp }`.

## Scripts

| Script                 | Description                |
|------------------------|----------------------------|
| `npm run dev`          | Run dev server (tsx watch)  |
| `npm run build`        | Compile TypeScript         |
| `npm run start`        | Run built app              |
| `npm run lint`         | ESLint                     |
| `npm run format`       | Prettier                   |
| `npm run typecheck`    | TypeScript (no emit)       |
| `npm run prisma:generate` | Generate Prisma client  |
| `npm run prisma:migrate`  | Run migrations (dev)     |
| `npm run prisma:push`     | Push schema (no migrations) |
| `npm run prisma:studio`   | Prisma Studio UI          |
| `npm run prisma:seed`     | Seed predefined categories |

## Environment

Copy `.env.example` to `.env`. Required:

- **DATABASE_URL** — **Supabase:** Use the **pooler** URI (port 6543); Project Settings → Database → Connection pooling. For local Postgres or Docker, use e.g. `postgresql://user:pass@localhost:5432/tracex`.
- **DIRECT_URL** — **Supabase:** Use the **direct** URI (port 5432) for migrations so `prisma migrate` doesn’t hang behind the pooler. **Local/Docker:** Set to the same value as `DATABASE_URL`.
- **JWT_SECRET** — Secret for signing JWTs (long random string in production). Not the same as Supabase JWT secret; this is for your own API auth.
- **PORT** — Server port (default 3000)
- **NODE_ENV** — `development` or `production`
- **LOG_LEVEL** — `trace` | `debug` | `info` | `warn` | `error`
- **CORS_ORIGIN** — Allowed origin(s); `*` for all (dev only)

## Docker

Run app + PostgreSQL with Docker Compose:

```bash
docker compose up -d --build
```

- **App:** http://localhost:3000 (health: http://localhost:3000/health)
- **Postgres:** internal on port 5432; credentials in `docker-compose.yml` (user `tracex`, db `tracex`)
- The app uses `DATABASE_URL=postgresql://tracex:tracexdev@postgres:5432/tracex` inside the stack. Migrations run on startup via `docker-entrypoint.sh`.
- To seed categories: `docker compose run --rm app npm run prisma:seed`
- To run only Postgres (use local Node for app): `docker compose up -d postgres` and set `DATABASE_URL` in `.env` to `postgresql://tracex:tracexdev@localhost:5432/tracex`

## Project layout

```
src/
  app.ts           # Express app (middleware, routes)
  server.ts        # Entry: connect DB, start server, graceful shutdown
  config/db.ts     # Prisma client, connect/disconnect
  middleware/      # requestId, error
  routes/          # health, (auth, categories, expenses in later phases)
  utils/logger.ts
  types/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Using Supabase

This backend uses **Supabase only for PostgreSQL** (data storage). Auth is custom (email + password, JWT) — see Phase 1 in [TASK.md](./TASK.md).

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → Database**, use the **Connection pooling** section and copy the **URI** (port **6543**). The direct URI (port 5432) often can’t be reached from your machine — use the pooler URL (e.g. `aws-0-<region>.pooler.supabase.com:6543`).
3. Set `DATABASE_URL` in `.env` to the pooler URI; replace the password.
4. **Migrations:** Set **DIRECT_URL** in `.env` to the Supabase **direct** connection (port 5432). Then `npm run migrate` uses it and won’t hang.
5. **If you get "Can't reach database server" on migrate:**  
   - **Banned IP:** Two wrong database passwords in a row can ban your IP for ~30 minutes. In Supabase go to **Database Settings → Banned IPs** and click **Unban** for your IP, then try again.  
   - **Port 5432 blocked:** Some networks block outbound 5432. Use the manual workaround: in Supabase **SQL Editor**, run the SQL from `prisma/migrations/20250221000000_init/migration.sql` (or any new migration). Then run `npx prisma migrate resolve --applied 20250221000000_init` and `npx prisma generate`. For new migrations, create the migration locally with `npx prisma migrate dev --create-only`, copy the generated SQL into the SQL Editor, run it, then `npx prisma migrate resolve --applied <migration_name>`.
6. Optional: seed categories with `npm run prisma:seed`.
7. **If the app errors with "table `public.users` does not exist"** — the database has no schema yet. **Supabase:** run **`prisma/supabase-apply-init.sql`** in the Supabase SQL Editor (paste the whole file, then Run). **Docker with local Postgres:** ensure `DIRECT_URL` is set (see `docker-compose.yml`) and restart the app so the entrypoint can run migrations.

See [TASK.md](./TASK.md) for the full roadmap.
