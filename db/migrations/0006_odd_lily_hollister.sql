CREATE TABLE "customers_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"zohoCustomerId" text NOT NULL,
	"customerName" text NOT NULL,
	"companyName" text,
	"primaryContactPersonId" text,
	"primaryPhone" text,
	"primaryEmail" text,
	"contactPersons" text DEFAULT '[]' NOT NULL,
	"zohoLastModifiedAt" timestamp,
	"localLastSyncedAt" timestamp,
	"syncHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_metadata" ADD COLUMN "lastCustomerSyncAt" timestamp;--> statement-breakpoint
ALTER TABLE "customers_cache" ADD CONSTRAINT "customers_cache_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_cache_user_id_idx" ON "customers_cache" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "customers_cache_zoho_customer_id_idx" ON "customers_cache" USING btree ("zohoCustomerId");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_cache_user_zoho_customer_idx" ON "customers_cache" USING btree ("userId","zohoCustomerId");