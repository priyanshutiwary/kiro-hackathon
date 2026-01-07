CREATE TABLE "livekit_dispatch_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"dispatch_rule_id" text NOT NULL,
	"name" text NOT NULL,
	"trunk_ids" text[] NOT NULL,
	"room_prefix" text DEFAULT 'call_' NOT NULL,
	"hide_phone_number" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livekit_trunks" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"trunk_id" text NOT NULL,
	"name" text NOT NULL,
	"auth_username" text NOT NULL,
	"auth_password" text NOT NULL,
	"phone_numbers" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twilio_trunks" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"trunk_sid" text NOT NULL,
	"friendly_name" text NOT NULL,
	"origination_url_sid" text,
	"sip_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"voice_setup_id" text NOT NULL,
	"call_sid" text NOT NULL,
	"room_name" text,
	"phone_number" text,
	"duration" integer,
	"status" text NOT NULL,
	"direction" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"endedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "voice_setups" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"twilio_subaccount_sid" text,
	"twilio_auth_token" text,
	"livekit_trunk_id" text,
	"livekit_dispatch_rule_id" text,
	"phone_numbers" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"friendly_name" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "livekit_dispatch_rules" ADD CONSTRAINT "livekit_dispatch_rules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livekit_trunks" ADD CONSTRAINT "livekit_trunks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twilio_trunks" ADD CONSTRAINT "twilio_trunks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_voice_setup_id_voice_setups_id_fk" FOREIGN KEY ("voice_setup_id") REFERENCES "public"."voice_setups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_setups" ADD CONSTRAINT "voice_setups_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;