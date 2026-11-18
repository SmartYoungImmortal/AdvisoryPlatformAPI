CREATE TYPE "trial_request_status" AS ENUM('PENDING', 'GRANTED', 'DECLINED');--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'TRIAL_REQUESTED';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'TRIAL_DECIDED';--> statement-breakpoint
CREATE TABLE "trial_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_id" uuid NOT NULL,
	"advisee_id" uuid NOT NULL,
	"chat_room_id" uuid NOT NULL,
	"status" "trial_request_status" DEFAULT 'PENDING'::"trial_request_status" NOT NULL,
	"decision_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "trial_requests_service_advisee_key" ON "trial_requests" ("service_id","advisee_id");--> statement-breakpoint
CREATE INDEX "trial_requests_chat_room_id_idx" ON "trial_requests" ("chat_room_id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_advisee_id_user_id_fkey" FOREIGN KEY ("advisee_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_chat_room_id_chat_rooms_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id");--> statement-breakpoint
-- Same defence in depth as 20260907141856_lock-down-postgrest-exposure: RLS with no policy keeps the
-- table closed to PostgREST even if a grant is ever restored.
ALTER TABLE "trial_requests" ENABLE ROW LEVEL SECURITY;