CREATE TYPE "trial_request_status" AS ENUM('PENDING', 'GRANTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "appointment_type" AS ENUM('CONSULTATION', 'TRIAL');--> statement-breakpoint
CREATE TABLE "advisor_global_availability" (
	"advisor_id" uuid PRIMARY KEY,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"booking_horizon_days" integer DEFAULT 60 NOT NULL,
	"minimum_booking_notice_minutes" integer DEFAULT 0 NOT NULL,
	"daily_consultation_limit_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_global_availability_interval_fixed" CHECK ("slot_interval_minutes" = 30),
	CONSTRAINT "advisor_global_availability_buffer_nonnegative" CHECK ("buffer_minutes" >= 0),
	CONSTRAINT "advisor_global_availability_horizon_positive" CHECK ("booking_horizon_days" > 0),
	CONSTRAINT "advisor_global_availability_notice_nonnegative" CHECK ("minimum_booking_notice_minutes" >= 0),
	CONSTRAINT "advisor_global_availability_daily_limit_positive" CHECK ("daily_consultation_limit_minutes" IS NULL OR "daily_consultation_limit_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "availability_blocked_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"availability_profile_id" uuid NOT NULL,
	"blocked_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_blocked_periods_time_range_valid" CHECK (("start_time" IS NULL AND "end_time" IS NULL) OR ("start_time" IS NOT NULL AND "end_time" IS NOT NULL AND "end_time" > "start_time"))
);
--> statement-breakpoint
CREATE TABLE "availability_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_specific_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"availability_profile_id" uuid NOT NULL,
	"available_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "availability_specific_windows_end_after_start" CHECK ("end_time" > "start_time")
);
--> statement-breakpoint
CREATE TABLE "availability_weekly_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"availability_profile_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "availability_weekly_windows_day_of_week_range" CHECK ("day_of_week" BETWEEN 1 AND 7),
	CONSTRAINT "availability_weekly_windows_end_after_start" CHECK ("end_time" > "start_time")
);
--> statement-breakpoint
CREATE TABLE "trial_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_id" uuid NOT NULL,
	"advisee_id" uuid NOT NULL,
	"status" "trial_request_status" DEFAULT 'PENDING'::"trial_request_status" NOT NULL,
	"decision_reason" text,
	"granted_by_advisor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "refund_case_evidence" (
	"refund_case_id" uuid,
	"object_key" varchar,
	"original_file_name" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_case_evidence_pkey" PRIMARY KEY("refund_case_id","object_key")
);
--> statement-breakpoint
ALTER TABLE "service_appointments" DROP CONSTRAINT "service_appointments_timeslot_id_service_timeslots_id_fk";--> statement-breakpoint
ALTER TABLE "screening_requests" DROP CONSTRAINT "screening_requests_chat_room_id_chat_rooms_id_fk";--> statement-breakpoint
ALTER TABLE "screening_requests" DROP CONSTRAINT "screening_requests_trial_window_valid";--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "availability_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "advisor_id" uuid;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "type" "appointment_type" DEFAULT 'CONSULTATION'::"appointment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "unavailable_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "blocks_availability" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "cancelled_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD COLUMN "bank_name" varchar;--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD COLUMN "account_name" varchar;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "transfer_fee_satang" integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "payout_eligible_at" timestamp with time zone;--> statement-breakpoint
INSERT INTO "advisor_global_availability" ("advisor_id")
SELECT "user_id" FROM "advisor_profiles"
ON CONFLICT ("advisor_id") DO NOTHING;--> statement-breakpoint
UPDATE "service_appointments" AS appointment
SET
	"service_id" = timeslot."service_id",
	"advisor_id" = service."advisor_id",
	"start_time" = timeslot."start_time",
	"end_time" = timeslot."end_time",
	"unavailable_until" = timeslot."end_time"
FROM "service_timeslots" AS timeslot
JOIN "services" AS service ON service."id" = timeslot."service_id"
WHERE appointment."timeslot_id" = timeslot."id";--> statement-breakpoint
ALTER TABLE "service_appointments" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ALTER COLUMN "advisor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ALTER COLUMN "start_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ALTER COLUMN "end_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" ALTER COLUMN "unavailable_until" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_appointments" DROP COLUMN "timeslot_id";--> statement-breakpoint
ALTER TABLE "screening_requests" DROP COLUMN "chat_room_id";--> statement-breakpoint
ALTER TABLE "screening_requests" DROP COLUMN "trial_started_at";--> statement-breakpoint
ALTER TABLE "screening_requests" DROP COLUMN "trial_expires_at";--> statement-breakpoint
CREATE UNIQUE INDEX "trial_requests_advisee_service_key" ON "trial_requests" ("advisee_id","service_id");--> statement-breakpoint
ALTER TABLE "advisor_global_availability" ADD CONSTRAINT "advisor_global_availability_kHCatgchnNdt_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id");--> statement-breakpoint
ALTER TABLE "availability_blocked_periods" ADD CONSTRAINT "availability_blocked_periods_9DsywitDbae8_fkey" FOREIGN KEY ("availability_profile_id") REFERENCES "availability_profiles"("id");--> statement-breakpoint
ALTER TABLE "availability_profiles" ADD CONSTRAINT "availability_profiles_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id");--> statement-breakpoint
ALTER TABLE "availability_specific_windows" ADD CONSTRAINT "availability_specific_windows_k2Y19X0dAR9p_fkey" FOREIGN KEY ("availability_profile_id") REFERENCES "availability_profiles"("id");--> statement-breakpoint
ALTER TABLE "availability_weekly_windows" ADD CONSTRAINT "availability_weekly_windows_ZwmGUuT5HJfw_fkey" FOREIGN KEY ("availability_profile_id") REFERENCES "availability_profiles"("id");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_availability_profile_id_availability_profiles_id_fkey" FOREIGN KEY ("availability_profile_id") REFERENCES "availability_profiles"("id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_advisee_id_user_id_fkey" FOREIGN KEY ("advisee_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_KzJ69aikoSvI_fkey" FOREIGN KEY ("granted_by_advisor_id") REFERENCES "advisor_profiles"("user_id");--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id");--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_advisor_id_advisor_profiles_user_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id");--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_cancelled_by_user_id_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "refund_case_evidence" ADD CONSTRAINT "refund_case_evidence_refund_case_id_refund_cases_id_fkey" FOREIGN KEY ("refund_case_id") REFERENCES "refund_cases"("id");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_duration_minutes_interval_aligned" CHECK ("duration_minutes" % 30 = 0);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_trial_duration_interval_aligned" CHECK ("trial_duration_minutes" IS NULL OR "trial_duration_minutes" % 30 = 0);--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_end_after_start" CHECK ("end_time" > "start_time");--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_unavailable_after_end" CHECK ("unavailable_until" >= "end_time");--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_cancellation_metadata_consistent" CHECK (("cancelled_at" IS NULL AND "cancelled_by_user_id" IS NULL) OR ("cancelled_at" IS NOT NULL AND "cancelled_by_user_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_transfer_fee_satang_nonnegative" CHECK ("transfer_fee_satang" >= 0);
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_advisor_unavailable_no_overlap"
EXCLUDE USING gist (
	"advisor_id" WITH =,
	tstzrange("start_time", "unavailable_until", '[)') WITH &&
)
WHERE ("blocks_availability");
