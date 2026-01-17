ALTER TABLE "session" ADD COLUMN "lastAuthenticatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "failedLoginAttempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lockedUntil" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastLoginAttempt" timestamp;