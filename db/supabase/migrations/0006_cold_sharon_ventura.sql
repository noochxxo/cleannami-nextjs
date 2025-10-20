ALTER TYPE "public"."payment_status" ADD VALUE 'capture_failed';--> statement-breakpoint
CREATE TABLE "base_pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bedrooms" integer NOT NULL,
	"price_1_bath_cents" integer NOT NULL,
	"price_2_bath_cents" integer NOT NULL,
	"price_3_bath_cents" integer NOT NULL,
	"price_4_bath_cents" integer NOT NULL,
	"price_5_bath_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_pricing_rules_bedrooms_unique" UNIQUE("bedrooms")
);
--> statement-breakpoint
CREATE TABLE "hot_tub_pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type" varchar NOT NULL,
	"customer_revenue_cents" integer NOT NULL,
	"time_add_hours" numeric(4, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hot_tub_pricing_rules_service_type_unique" UNIQUE("service_type")
);
--> statement-breakpoint
CREATE TABLE "laundry_pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type" varchar NOT NULL,
	"customer_revenue_base_cents" integer NOT NULL,
	"customer_revenue_per_load_cents" integer NOT NULL,
	"cleaner_bonus_per_load_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "laundry_pricing_rules_service_type_unique" UNIQUE("service_type")
);
--> statement-breakpoint
CREATE TABLE "pricing_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"status" varchar DEFAULT 'processing' NOT NULL,
	"notes" text,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sqft_surcharge_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"range_start" integer NOT NULL,
	"range_end" integer NOT NULL,
	"surcharge_cents" integer NOT NULL,
	"is_custom_quote" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "pricing_uploads" ADD CONSTRAINT "pricing_uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;