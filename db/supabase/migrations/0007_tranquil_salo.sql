CREATE TYPE "public"."swap_request_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('w9', 'contractor_agreement', 'liability_waiver', 'privacy_consent');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('arrival', 'working', 'departure');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('job_reminder', 'photo_reminder', 'completion_reminder', 'urgent_job', 'payment_ready', 'reliability_check');--> statement-breakpoint
CREATE TYPE "public"."reliability_event_type" AS ENUM('late_arrival', 'no_show', 'call_out', 'on_time', 'early_arrival');--> statement-breakpoint
CREATE TYPE "public"."expected_lateness" AS ENUM('on_time', 'under_10', 'under_30', 'hour_plus');--> statement-breakpoint
CREATE TYPE "public"."badge_category" AS ENUM('reliability', 'performance', 'specialization', 'achievement');--> statement-breakpoint
CREATE TABLE "reserve_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"payment_intent_id" text NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"reserve_amount_cents" integer NOT NULL,
	"net_amount_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swap_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"original_cleaner_id" uuid NOT NULL,
	"replacement_cleaner_id" uuid,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "swap_request_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"signed" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp with time zone,
	"document_url" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capability_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"hot_tub_capable" boolean DEFAULT false NOT NULL,
	"laundry_lead_eligible" boolean DEFAULT false NOT NULL,
	"team_leader_eligible" boolean DEFAULT false NOT NULL,
	"owns_vehicle" boolean DEFAULT false NOT NULL,
	"background_check_passed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capability_flags_cleaner_unique" UNIQUE("cleaner_id")
);
--> statement-breakpoint
CREATE TABLE "gps_tracking_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"accuracy" numeric(8, 2),
	"activity_type" "activity_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"job_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"scheduled_for" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "reliability_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"event_type" "reliability_event_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"penalty_points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reliability_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"notification_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_received_at" timestamp with time zone,
	"expected_lateness" "expected_lateness",
	"actual_arrival_delay_minutes" integer,
	"manual_checkin_at" timestamp with time zone,
	"gps_arrival_at" timestamp with time zone,
	"manual_checkout_at" timestamp with time zone,
	"gps_departure_at" timestamp with time zone,
	"job_cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" "badge_category" NOT NULL,
	"requirements" jsonb NOT NULL,
	"points_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cleaner_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "cleaner_badges_cleaner_badge_unique" UNIQUE("cleaner_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "job_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"rating" integer,
	"has_hot_tub" boolean DEFAULT false NOT NULL,
	"is_team_leader" boolean DEFAULT false NOT NULL,
	"is_laundry_lead" boolean DEFAULT false NOT NULL,
	"is_on_call" boolean DEFAULT false NOT NULL,
	"bonus_earned_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_stats_cleaner_job_unique" UNIQUE("cleaner_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" DROP CONSTRAINT "jobs_to_cleaners_job_id_cleaner_id_role_pk";--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD CONSTRAINT "jobs_to_cleaners_job_id_cleaner_id_pk" PRIMARY KEY("job_id","cleaner_id");--> statement-breakpoint
ALTER TABLE "cleaners" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD COLUMN "urgent_bonus" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reserve_transactions" ADD CONSTRAINT "reserve_transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_original_cleaner_id_cleaners_id_fk" FOREIGN KEY ("original_cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_replacement_cleaner_id_cleaners_id_fk" FOREIGN KEY ("replacement_cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_flags" ADD CONSTRAINT "capability_flags_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_events" ADD CONSTRAINT "reliability_events_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_events" ADD CONSTRAINT "reliability_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_checks" ADD CONSTRAINT "reliability_checks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_checks" ADD CONSTRAINT "reliability_checks_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_badges" ADD CONSTRAINT "cleaner_badges_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_badges" ADD CONSTRAINT "cleaner_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_stats" ADD CONSTRAINT "job_stats_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_stats" ADD CONSTRAINT "job_stats_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "swap_requests_job_idx" ON "swap_requests" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "swap_requests_original_cleaner_idx" ON "swap_requests" USING btree ("original_cleaner_id");--> statement-breakpoint
CREATE INDEX "swap_requests_status_idx" ON "swap_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gps_tracking_logs_job_cleaner_idx" ON "gps_tracking_logs" USING btree ("job_id","cleaner_id");--> statement-breakpoint
CREATE INDEX "gps_tracking_logs_created_at_idx" ON "gps_tracking_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_scheduled_idx" ON "notifications" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_type_job_idx" ON "notifications" USING btree ("type","job_id");--> statement-breakpoint
ALTER TABLE "cleaners" ADD CONSTRAINT "cleaners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "is_urgent_bonus";--> statement-breakpoint
ALTER TABLE "cleaners" ADD CONSTRAINT "cleaners_user_id_unique" UNIQUE("user_id");