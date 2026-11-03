ALTER TABLE "services" ADD COLUMN "extra_category_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
CREATE INDEX "services_extra_category_ids_idx" ON "services" USING gin ("extra_category_ids");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_extra_category_limit" CHECK (coalesce(array_length("extra_category_ids", 1), 0) <= 2);