-- Run this entire file once in Supabase: SQL Editor → New query → Paste → Run
-- Then run in terminal: npx prisma generate

-- App tables (init migration)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "user_id" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_user_id_fkey";
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_user_id_fkey";
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma migration history (so Prisma knows init is applied)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
SELECT gen_random_uuid()::text, '16a99918546e0b14b473440425928cd6350b517cfa2f13ea158b4023ff36d529', now(), '20250221000000_init', 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20250221000000_init');
