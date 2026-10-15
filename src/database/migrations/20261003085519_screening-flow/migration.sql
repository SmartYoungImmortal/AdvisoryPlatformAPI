ALTER TYPE "screening_status" ADD VALUE 'EXPIRED';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'SCREENING_REQUESTED' BEFORE 'SCREENING_DECIDED';--> statement-breakpoint
DROP INDEX "screening_requests_advisee_service_key";--> statement-breakpoint
ALTER TABLE "screening_answers" ADD COLUMN "question_text" text;--> statement-breakpoint
-- Backfill answers written before the snapshot column existed, then require it.
UPDATE "screening_answers" a SET "question_text" = q."question" FROM "service_screening_questions" q WHERE q."id" = a."question_id";--> statement-breakpoint
ALTER TABLE "screening_answers" ALTER COLUMN "question_text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "screening_requests" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_screening_questions" ADD COLUMN "is_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "service_screening_questions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "screening_requests_pending_advisee_service_key" ON "screening_requests" ("advisee_id","service_id") WHERE "status" = 'PENDING';