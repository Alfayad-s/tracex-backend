-- AlterTable: User - currency, webhook_url
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "webhook_url" VARCHAR(500);

-- AlterTable: Category - soft delete
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- AlterTable: Expense - categoryId FK, receiptUrl, currency
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "category_id" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "receipt_url" VARCHAR(500);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10);

-- AlterTable: Budget - share slug for public sharing
ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "share_slug" VARCHAR(64);

-- CreateIndex (unique share_slug)
CREATE UNIQUE INDEX IF NOT EXISTS "budgets_share_slug_key" ON "budgets"("share_slug");

-- AddForeignKey: expenses.category_id -> categories.id (ON DELETE SET NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_category_id_fkey'
  ) THEN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
