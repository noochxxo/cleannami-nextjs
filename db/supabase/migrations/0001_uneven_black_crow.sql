ALTER TABLE "cleaners" ADD COLUMN "latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "cleaners" ADD COLUMN "longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "cleaners" ADD COLUMN "geocoded_at" timestamp;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "geocoded_at" timestamp;--> statement-breakpoint
CREATE INDEX "cleaners_location_idx" ON "cleaners" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "properties_location_idx" ON "properties" USING btree ("latitude","longitude");