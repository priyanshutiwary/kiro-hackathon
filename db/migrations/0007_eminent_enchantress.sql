-- First, set all existing customerId values to NULL since they currently contain Zoho customer IDs
-- These will be backfilled later with proper foreign key references in task 13
UPDATE "invoices_cache" SET "customerId" = NULL WHERE "customerId" IS NOT NULL;

-- Now add the foreign key constraint
ALTER TABLE "invoices_cache" ADD CONSTRAINT "invoices_cache_customerId_customers_cache_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers_cache"("id") ON DELETE set null ON UPDATE no action;
