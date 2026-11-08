CREATE TABLE "service_package_translations" (
	"package_id" uuid,
	"locale" "content_locale",
	"name" varchar NOT NULL,
	"description" text,
	CONSTRAINT "service_package_translations_pkey" PRIMARY KEY("package_id","locale")
);
--> statement-breakpoint
ALTER TABLE "service_package_translations" ADD CONSTRAINT "service_package_translations_AF04gSm2lDHq_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE;