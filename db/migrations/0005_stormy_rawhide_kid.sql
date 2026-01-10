ALTER TABLE "holidays" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "holidays" CASCADE;--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP CONSTRAINT "payment_reminders_invoice_id_invoices_cache_id_fk";
--> statement-breakpoint
DROP INDEX "invoices_cache_user_invoice_idx";--> statement-breakpoint
DROP INDEX "invoices_cache_user_due_date_idx";--> statement-breakpoint
DROP INDEX "payment_reminders_user_scheduled_status_idx";--> statement-breakpoint
DROP INDEX "payment_reminders_invoice_id_idx";--> statement-breakpoint
DROP INDEX "payment_reminders_scheduled_date_idx";--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "zohoInvoiceId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "customerId" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "customerName" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "customerPhone" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "customerCountryCode" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "customerTimezone" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "invoiceNumber" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "amountTotal" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "amountDue" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "dueDate" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "zohoLastModifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "localLastSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "syncHash" text;--> statement-breakpoint
ALTER TABLE "invoices_cache" ADD COLUMN "remindersCreated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "invoiceId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "reminderType" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "scheduledDate" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "attemptCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "lastAttemptAt" timestamp;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "callOutcome" text;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "skipReason" text;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder30DaysBefore" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder15DaysBefore" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder7DaysBefore" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder5DaysBefore" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder3DaysBefore" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder1DayBefore" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminderOnDueDate" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder1DayOverdue" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder3DaysOverdue" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "reminder7DaysOverdue" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "customReminderDays" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "callTimezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "callStartTime" text DEFAULT '09:00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "callEndTime" text DEFAULT '18:00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "callDaysOfWeek" text DEFAULT '[1,2,3,4,5]' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "maxRetryAttempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "retryDelayHours" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_metadata" ADD COLUMN "lastFullSyncAt" timestamp;--> statement-breakpoint
ALTER TABLE "sync_metadata" ADD COLUMN "lastIncrementalSyncAt" timestamp;--> statement-breakpoint
ALTER TABLE "sync_metadata" ADD COLUMN "syncWindowDays" integer;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_invoiceId_invoices_cache_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices_cache"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_cache_user_zoho_invoice_idx" ON "invoices_cache" USING btree ("userId","zohoInvoiceId");--> statement-breakpoint
CREATE INDEX "invoices_cache_user_due_date_idx" ON "invoices_cache" USING btree ("userId","dueDate");--> statement-breakpoint
CREATE INDEX "payment_reminders_user_scheduled_status_idx" ON "payment_reminders" USING btree ("userId","scheduledDate","status");--> statement-breakpoint
CREATE INDEX "payment_reminders_invoice_id_idx" ON "payment_reminders" USING btree ("invoiceId");--> statement-breakpoint
CREATE INDEX "payment_reminders_scheduled_date_idx" ON "payment_reminders" USING btree ("scheduledDate");--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "zoho_invoice_id";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "customer_name";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "customer_phone";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "customer_country_code";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "customer_timezone";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "invoice_number";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "amount_total";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "amount_due";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "due_date";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "zoho_last_modified_at";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "local_last_synced_at";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "sync_hash";--> statement-breakpoint
ALTER TABLE "invoices_cache" DROP COLUMN "reminders_created";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "invoice_id";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "reminder_type";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "scheduled_date";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "attempt_count";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "last_attempt_at";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "call_outcome";--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP COLUMN "skip_reason";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_30_days_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_15_days_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_7_days_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_5_days_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_3_days_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_1_day_before";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_on_due_date";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_1_day_overdue";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_3_days_overdue";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "reminder_7_days_overdue";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "custom_reminder_days";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "call_timezone";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "call_start_time";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "call_end_time";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "call_days_of_week";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "country_code";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "skip_holidays";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "max_retry_attempts";--> statement-breakpoint
ALTER TABLE "reminder_settings" DROP COLUMN "retry_delay_hours";--> statement-breakpoint
ALTER TABLE "sync_metadata" DROP COLUMN "last_full_sync_at";--> statement-breakpoint
ALTER TABLE "sync_metadata" DROP COLUMN "last_incremental_sync_at";--> statement-breakpoint
ALTER TABLE "sync_metadata" DROP COLUMN "sync_window_days";