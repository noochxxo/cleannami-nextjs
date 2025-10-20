CREATE TYPE "public"."availability_status" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."on_call_availability" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."on_call_status" AS ENUM('available', 'unavailable', 'on_job');--> statement-breakpoint
CREATE TYPE "public"."evidence_packet_status" AS ENUM('complete', 'incomplete', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."job_cleaner_role" AS ENUM('primary', 'backup', 'on-call', 'laundry_lead');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('unassigned', 'assigned', 'in-progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'released', 'held');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"date" date NOT NULL,
	"availability_status" "availability_status" NOT NULL,
	"on_call_status" "on_call_availability" NOT NULL,
	"is_grace_period" boolean DEFAULT false,
	"submitted_timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_files_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
CREATE TABLE "cleaners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"address" text,
	"profile_photo_url" text,
	"experience_years" integer,
	"has_hot_tub_cert" boolean DEFAULT false,
	"reliability_score" numeric(5, 2),
	"on_call_status" "on_call_status" DEFAULT 'unavailable',
	"stripe_account_id" text,
	"legal_docs_signed" jsonb DEFAULT '{"w9Url":null,"liabilityWaiverUrl":null,"gpsConsentUrl":null}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cleaners_email_unique" UNIQUE("email"),
	CONSTRAINT "cleaners_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "evidence_packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"photo_urls" text[],
	"is_checklist_complete" boolean DEFAULT false,
	"checklist_log" jsonb,
	"gps_check_in_timestamp" timestamp with time zone,
	"gps_check_out_timestamp" timestamp with time zone,
	"cleaner_notes" text,
	"status" "evidence_packet_status" DEFAULT 'pending_review',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_packets_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid,
	"property_id" uuid,
	"status" "job_status" DEFAULT 'unassigned',
	"check_in_time" timestamp with time zone,
	"check_out_time" timestamp with time zone,
	"is_urgent_bonus" boolean DEFAULT false,
	"calendar_event_uid" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs_to_cleaners" (
	"job_id" uuid NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"role" "job_cleaner_role" NOT NULL,
	CONSTRAINT "jobs_to_cleaners_job_id_cleaner_id_role_pk" PRIMARY KEY("job_id","cleaner_id","role")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"cleaner_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"urgent_bonus_amount" numeric(10, 2),
	"laundry_bonus_amount" numeric(10, 2),
	"stripe_payout_id" text,
	"status" "payout_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"address" text NOT NULL,
	"sq_ft" integer,
	"bed_count" integer NOT NULL,
	"bath_count" numeric(3, 1) NOT NULL,
	"has_hot_tub" boolean DEFAULT false NOT NULL,
	"laundry_type" varchar NOT NULL,
	"laundry_loads" integer,
	"hot_tub_service_level" varchar,
	"hot_tub_drain_cadence" varchar,
	"ical_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"stripe_subscription_id" text,
	"duration_months" integer NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"first_clean_payment_id" text,
	"is_first_clean_prepaid" boolean DEFAULT false NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id"),
	CONSTRAINT "subscriptions_first_clean_payment_id_unique" UNIQUE("first_clean_payment_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_user_id" uuid NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_user_id_unique" UNIQUE("supabase_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_files" ADD CONSTRAINT "checklist_files_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_packets" ADD CONSTRAINT "evidence_packets_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD CONSTRAINT "jobs_to_cleaners_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_cleaners" ADD CONSTRAINT "jobs_to_cleaners_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_cleaner_id_cleaners_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."cleaners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_date_cleaner_idx" ON "availability" USING btree ("date","cleaner_id");--> statement-breakpoint
CREATE INDEX "cleaners_reliability_idx" ON "cleaners" USING btree ("reliability_score");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_stripe_idx" ON "customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "evidence_packets_status_idx" ON "evidence_packets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_event_uid_idx" ON "jobs" USING btree ("calendar_event_uid");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_customer_idx" ON "properties" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_customer_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_property_idx" ON "subscriptions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_name_idx" ON "users" USING btree ("name");