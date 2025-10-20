CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"push_notifications_enabled" boolean DEFAULT true NOT NULL,
	"on_call_alerts_enabled" boolean DEFAULT false NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true NOT NULL,
	"sms_notifications_enabled" boolean DEFAULT false NOT NULL,
	"location_tracking_enabled" boolean DEFAULT true NOT NULL,
	"auto_photo_upload_enabled" boolean DEFAULT false NOT NULL,
	"share_location_with_team" boolean DEFAULT false NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"preferred_region" text DEFAULT 'US' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_cleaner_id_unique" UNIQUE("cleaner_id")
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_preferences_cleaner_id" ON "user_preferences" USING btree ("cleaner_id");