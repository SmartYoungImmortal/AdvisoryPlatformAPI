CREATE TYPE "language_proficiency" AS ENUM('NATIVE', 'FLUENT', 'PROFESSIONAL', 'BASIC');--> statement-breakpoint
CREATE TABLE "advisor_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"issuer" varchar(160),
	"year" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_educations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"institution" varchar(160) NOT NULL,
	"degree" varchar(160),
	"start_year" integer,
	"end_year" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_educations_ends_after_start" CHECK ("start_year" IS NULL OR "end_year" IS NULL OR "end_year" >= "start_year")
);
--> statement-breakpoint
CREATE TABLE "advisor_experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"organization" varchar(120) NOT NULL,
	"start_year" integer NOT NULL,
	"start_month" integer,
	"end_year" integer,
	"end_month" integer,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_experiences_months_in_range" CHECK (("start_month" IS NULL OR "start_month" BETWEEN 1 AND 12) AND ("end_month" IS NULL OR "end_month" BETWEEN 1 AND 12)),
	CONSTRAINT "advisor_experiences_ends_after_start" CHECK ("end_year" IS NULL OR "end_year" >= "start_year")
);
--> statement-breakpoint
CREATE TABLE "advisor_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"language" varchar(60) NOT NULL,
	"proficiency" "language_proficiency" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "advisor_credentials_advisor_order_idx" ON "advisor_credentials" ("advisor_id","sort_order");--> statement-breakpoint
CREATE INDEX "advisor_educations_advisor_order_idx" ON "advisor_educations" ("advisor_id","sort_order");--> statement-breakpoint
CREATE INDEX "advisor_experiences_advisor_order_idx" ON "advisor_experiences" ("advisor_id","sort_order");--> statement-breakpoint
CREATE INDEX "advisor_languages_advisor_order_idx" ON "advisor_languages" ("advisor_id","sort_order");--> statement-breakpoint
ALTER TABLE "advisor_credentials" ADD CONSTRAINT "advisor_credentials_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "advisor_educations" ADD CONSTRAINT "advisor_educations_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "advisor_experiences" ADD CONSTRAINT "advisor_experiences_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "advisor_languages" ADD CONSTRAINT "advisor_languages_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;