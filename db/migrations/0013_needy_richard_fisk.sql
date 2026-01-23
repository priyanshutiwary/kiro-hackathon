ALTER TABLE "payment_reminders" ADD COLUMN "channel" text DEFAULT 'voice' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD COLUMN "externalId" text;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "smartMode" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "manualChannel" text DEFAULT 'voice';--> statement-breakpoint
CREATE INDEX "payment_reminders_external_id_idx" ON "payment_reminders" USING btree ("externalId");