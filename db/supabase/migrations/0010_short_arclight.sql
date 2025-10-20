CREATE TYPE "public"."availability_type" AS ENUM('vacation_rental', 'residential');--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "availability_type" "availability_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "start_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "end_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "on_call_eligible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "open_pool_eligible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "submitted_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" DROP COLUMN "availability_status";--> statement-breakpoint
ALTER TABLE "availability" DROP COLUMN "on_call_status";--> statement-breakpoint
ALTER TABLE "availability" DROP COLUMN "submitted_timestamp";--> statement-breakpoint
DROP TYPE "public"."availability_status";--> statement-breakpoint
DROP TYPE "public"."on_call_availability";