CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'captured', 'failed');--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "expected_hours" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "addons_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "payment_failed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "ical_sync_failed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_sync_attempt" timestamp;