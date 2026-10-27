CREATE TYPE "content_locale" AS ENUM('th', 'en');--> statement-breakpoint
CREATE TABLE "advisor_profile_translations" (
	"advisor_id" uuid,
	"locale" "content_locale",
	"headline" varchar NOT NULL,
	"bio" text,
	CONSTRAINT "advisor_profile_translations_pkey" PRIMARY KEY("advisor_id","locale")
);
--> statement-breakpoint
CREATE TABLE "notification_translations" (
	"notification_id" uuid,
	"locale" "content_locale",
	"title" varchar NOT NULL,
	"content" text,
	CONSTRAINT "notification_translations_pkey" PRIMARY KEY("notification_id","locale")
);
--> statement-breakpoint
CREATE TABLE "screening_question_translations" (
	"question_id" uuid,
	"locale" "content_locale",
	"question" text NOT NULL,
	CONSTRAINT "screening_question_translations_pkey" PRIMARY KEY("question_id","locale")
);
--> statement-breakpoint
CREATE TABLE "service_category_translations" (
	"category_id" uuid,
	"locale" "content_locale",
	"name" varchar NOT NULL,
	"description" text,
	CONSTRAINT "service_category_translations_pkey" PRIMARY KEY("category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "service_translations" (
	"service_id" uuid,
	"locale" "content_locale",
	"name" varchar NOT NULL,
	"description" text,
	CONSTRAINT "service_translations_pkey" PRIMARY KEY("service_id","locale")
);
--> statement-breakpoint
CREATE TABLE "skill_translations" (
	"skill_id" uuid,
	"locale" "content_locale",
	"name" varchar NOT NULL,
	"description" text,
	CONSTRAINT "skill_translations_pkey" PRIMARY KEY("skill_id","locale")
);
--> statement-breakpoint
ALTER TABLE "advisor_profile_translations" ADD CONSTRAINT "advisor_profile_translations_nJpvMo6JADeS_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_translations" ADD CONSTRAINT "notification_translations_notification_id_notifications_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "screening_question_translations" ADD CONSTRAINT "screening_question_translations_UajHeOlBIu9w_fkey" FOREIGN KEY ("question_id") REFERENCES "service_screening_questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "service_category_translations" ADD CONSTRAINT "service_category_translations_7ebdyX5hD2nd_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "service_translations" ADD CONSTRAINT "service_translations_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "skill_translations" ADD CONSTRAINT "skill_translations_skill_id_skills_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Every row written so far is Thai: its text becomes its `th` translation. The
-- parent keeps its columns as the fallback for a locale with no row.
INSERT INTO "service_category_translations" ("category_id", "locale", "name", "description")
SELECT "id", 'th', "name", "description" FROM "service_categories";--> statement-breakpoint
INSERT INTO "skill_translations" ("skill_id", "locale", "name", "description")
SELECT "id", 'th', "name", "description" FROM "skills";--> statement-breakpoint
INSERT INTO "service_translations" ("service_id", "locale", "name", "description")
SELECT "id", 'th', "name", "description" FROM "services";--> statement-breakpoint
INSERT INTO "advisor_profile_translations" ("advisor_id", "locale", "headline", "bio")
SELECT "user_id", 'th', "headline", "bio" FROM "advisor_profiles";--> statement-breakpoint
INSERT INTO "screening_question_translations" ("question_id", "locale", "question")
SELECT "id", 'th', "question" FROM "service_screening_questions";--> statement-breakpoint
INSERT INTO "notification_translations" ("notification_id", "locale", "title", "content")
SELECT "id", 'th', "title", "content" FROM "notifications";--> statement-breakpoint
-- Same defence in depth as 20260907141856_lock-down-postgrest-exposure: RLS with no
-- policy keeps these closed to PostgREST even if a grant is ever restored.
ALTER TABLE "service_category_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skill_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "service_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "advisor_profile_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "screening_question_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_translations" ENABLE ROW LEVEL SECURITY;