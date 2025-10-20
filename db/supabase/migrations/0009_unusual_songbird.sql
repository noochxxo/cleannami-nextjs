ALTER TABLE "cleaners" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cleaners" ADD COLUMN "onboarding_step" integer DEFAULT 1;