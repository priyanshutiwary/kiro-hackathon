CREATE TABLE "agentIntegrations" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"integrationType" text NOT NULL,
	"provider" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"scope" text,
	"config" text,
	"status" text DEFAULT 'active' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"lastSyncAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentIntegrations" ADD CONSTRAINT "agentIntegrations_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;