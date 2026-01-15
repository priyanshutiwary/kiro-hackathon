ALTER TABLE "reminder_settings" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD COLUMN "voiceGender" text DEFAULT 'female' NOT NULL;