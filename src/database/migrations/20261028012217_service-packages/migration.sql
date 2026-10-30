CREATE TABLE "service_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"price_satang" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_packages_price_satang_nonnegative" CHECK ("price_satang" >= 0),
	CONSTRAINT "service_packages_duration_minutes_positive" CHECK ("duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "package_id" uuid;--> statement-breakpoint
CREATE INDEX "service_packages_service_order_idx" ON "service_packages" ("service_id","sort_order");--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_package_id_service_packages_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "service_packages" ENABLE ROW LEVEL SECURITY;