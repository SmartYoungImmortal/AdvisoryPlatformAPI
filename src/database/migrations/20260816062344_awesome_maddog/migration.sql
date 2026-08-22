CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."identity_verification_status" AS ENUM('NONE', 'SUBMITTED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."skill_proof_level" AS ENUM('SELF_DECLARED', 'DOCUMENT_SUBMITTED', 'ADMIN_VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."skill_proof_review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."screening_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."appointment_state" AS ENUM('PENDING_PAYMENT', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."timeslot_status" AS ENUM('OPEN', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PAID', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."refund_case_status" AS ENUM('OPEN', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."off_platform_flag_status" AS ENUM('PENDING_REVIEW', 'CONFIRMED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."user_report_status" AS ENUM('OPEN', 'ACTIONED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BOOKING_CONFIRMED', 'PAYMENT_SUCCEEDED', 'SESSION_REMINDER', 'NEW_MESSAGE', 'SCREENING_DECIDED', 'VERIFICATION_DECIDED', 'POLICY_WARNING');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" varchar,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdpa_consents" (
	"user_id" uuid NOT NULL,
	"policy_version" varchar NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pdpa_consents_user_id_policy_version_pk" PRIMARY KEY("user_id","policy_version")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"display_name" varchar NOT NULL,
	"image" varchar,
	"full_name" varchar NOT NULL,
	"avatar_key" varchar,
	"timezone" varchar NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp (6) with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_identity" (
	"advisor_id" uuid PRIMARY KEY NOT NULL,
	"national_id_encrypted" "bytea",
	"national_id_hash" varchar,
	"document_object_key" varchar,
	"verification_status" "identity_verification_status" DEFAULT 'NONE' NOT NULL,
	"verified_by_admin_id" uuid,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	CONSTRAINT "advisor_identity_national_id_hash_unique" UNIQUE("national_id_hash")
);
--> statement-breakpoint
CREATE TABLE "advisor_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"headline" varchar NOT NULL,
	"bio" text,
	"penalty_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_profiles_penalty_points_nonnegative" CHECK ("advisor_profiles"."penalty_points" >= 0)
);
--> statement-breakpoint
CREATE TABLE "advisor_skills" (
	"advisor_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"proof_level" "skill_proof_level" DEFAULT 'SELF_DECLARED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_skills_advisor_id_skill_id_pk" PRIMARY KEY("advisor_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skill_proof_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advisor_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"object_key" varchar NOT NULL,
	"original_file_name" varchar NOT NULL,
	"review_status" "skill_proof_review_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_admin_id" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_images" (
	"service_id" uuid NOT NULL,
	"carousel_index" integer NOT NULL,
	"object_key" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_images_service_id_carousel_index_pk" PRIMARY KEY("service_id","carousel_index"),
	CONSTRAINT "service_images_carousel_index_nonnegative" CHECK ("service_images"."carousel_index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advisor_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price_satang" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"screening_required" boolean DEFAULT false NOT NULL,
	"trial_enabled" boolean DEFAULT false NOT NULL,
	"trial_duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_price_satang_nonnegative" CHECK ("services"."price_satang" >= 0),
	CONSTRAINT "services_duration_minutes_positive" CHECK ("services"."duration_minutes" > 0),
	CONSTRAINT "services_trial_duration_consistent" CHECK (("services"."trial_enabled" AND "services"."trial_duration_minutes" > 0) OR (NOT "services"."trial_enabled" AND "services"."trial_duration_minutes" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "screening_answers" (
	"screening_request_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_answers_screening_request_id_question_id_pk" PRIMARY KEY("screening_request_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "screening_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"advisee_id" uuid NOT NULL,
	"status" "screening_status" DEFAULT 'PENDING' NOT NULL,
	"decision_reason" text,
	"chat_room_id" uuid,
	"trial_started_at" timestamp with time zone,
	"trial_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "screening_requests_trial_window_valid" CHECK (("screening_requests"."trial_started_at" IS NULL AND "screening_requests"."trial_expires_at" IS NULL) OR ("screening_requests"."trial_started_at" IS NOT NULL AND "screening_requests"."trial_expires_at" IS NOT NULL AND "screening_requests"."trial_expires_at" > "screening_requests"."trial_started_at"))
);
--> statement-breakpoint
CREATE TABLE "service_screening_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"question" text NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_screening_questions_display_order_nonnegative" CHECK ("service_screening_questions"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "service_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeslot_id" uuid NOT NULL,
	"advisee_id" uuid NOT NULL,
	"chat_room_id" uuid,
	"jitsi_room_name" varchar,
	"state" "appointment_state" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_reviews" (
	"appointment_id" uuid PRIMARY KEY NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"advisor_reply" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_reviews_stars_range" CHECK ("service_reviews"."stars" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "service_timeslots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" timeslot_status DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_timeslots_end_after_start" CHECK ("service_timeslots"."end_time" > "service_timeslots"."start_time")
);
--> statement-breakpoint
CREATE TABLE "payout_invoices" (
	"payout_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	CONSTRAINT "payout_invoices_payout_id_invoice_id_pk" PRIMARY KEY("payout_id","invoice_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advisor_id" uuid NOT NULL,
	"amount_satang" integer NOT NULL,
	"provider_transfer_id" varchar,
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payouts_amount_satang_positive" CHECK ("payouts"."amount_satang" > 0)
);
--> statement-breakpoint
CREATE TABLE "refund_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"reviewed_by_admin_id" uuid,
	"reason" text NOT NULL,
	"status" "refund_case_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"amount_satang" integer NOT NULL,
	"platform_fee_satang" integer NOT NULL,
	"provider_charge_id" varchar,
	"status" "invoice_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_invoices_appointment_id_unique" UNIQUE("appointment_id"),
	CONSTRAINT "service_invoices_amount_satang_nonnegative" CHECK ("service_invoices"."amount_satang" >= 0),
	CONSTRAINT "service_invoices_platform_fee_range" CHECK ("service_invoices"."platform_fee_satang" BETWEEN 0 AND "service_invoices"."amount_satang")
);
--> statement-breakpoint
CREATE TABLE "chat_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_room_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"object_key" varchar NOT NULL,
	"original_file_name" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"expiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_files_size_range" CHECK ("chat_files"."file_size_bytes" BETWEEN 1 AND 52428800)
);
--> statement-breakpoint
CREATE TABLE "chat_members" (
	"chat_room_id" uuid NOT NULL,
	"member_user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_members_chat_room_id_member_user_id_pk" PRIMARY KEY("chat_room_id","member_user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_room_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "off_platform_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"matched_pattern" varchar NOT NULL,
	"status" "off_platform_flag_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reviewed_by_admin_id" uuid,
	"penalty_points_applied" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "off_platform_flags_penalty_points_nonnegative" CHECK ("off_platform_flags"."penalty_points_applied" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"chat_room_id" uuid,
	"reason" text NOT NULL,
	"status" "user_report_status" DEFAULT 'OPEN' NOT NULL,
	"reviewed_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdpa_consents" ADD CONSTRAINT "pdpa_consents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_identity" ADD CONSTRAINT "advisor_identity_advisor_id_advisor_profiles_user_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_identity" ADD CONSTRAINT "advisor_identity_verified_by_admin_id_admin_profiles_user_id_fk" FOREIGN KEY ("verified_by_admin_id") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_skills" ADD CONSTRAINT "advisor_skills_advisor_id_advisor_profiles_user_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_skills" ADD CONSTRAINT "advisor_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_proof_documents" ADD CONSTRAINT "skill_proof_documents_advisor_id_advisor_profiles_user_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_proof_documents" ADD CONSTRAINT "skill_proof_documents_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_proof_documents" ADD CONSTRAINT "skill_proof_documents_reviewed_by_admin_id_admin_profiles_user_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_images" ADD CONSTRAINT "service_images_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_advisor_id_advisor_profiles_user_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_screening_request_id_screening_requests_id_fk" FOREIGN KEY ("screening_request_id") REFERENCES "public"."screening_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_question_id_service_screening_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."service_screening_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_requests" ADD CONSTRAINT "screening_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_requests" ADD CONSTRAINT "screening_requests_advisee_id_user_id_fk" FOREIGN KEY ("advisee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_requests" ADD CONSTRAINT "screening_requests_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_screening_questions" ADD CONSTRAINT "service_screening_questions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_timeslot_id_service_timeslots_id_fk" FOREIGN KEY ("timeslot_id") REFERENCES "public"."service_timeslots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_advisee_id_user_id_fk" FOREIGN KEY ("advisee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_appointment_id_service_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_timeslots" ADD CONSTRAINT "service_timeslots_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_invoices" ADD CONSTRAINT "payout_invoices_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_invoices" ADD CONSTRAINT "payout_invoices_invoice_id_service_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."service_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_advisor_id_advisor_profiles_user_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_invoice_id_service_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."service_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_reviewed_by_admin_id_admin_profiles_user_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_appointment_id_service_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_files" ADD CONSTRAINT "chat_files_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_files" ADD CONSTRAINT "chat_files_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_member_user_id_user_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_platform_flags" ADD CONSTRAINT "off_platform_flags_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_platform_flags" ADD CONSTRAINT "off_platform_flags_reviewed_by_admin_id_admin_profiles_user_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewed_by_admin_id_admin_profiles_user_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "screening_requests_advisee_service_key" ON "screening_requests" USING btree ("advisee_id","service_id");--> statement-breakpoint
CREATE INDEX "chat_members_member_user_id_idx" ON "chat_members" USING btree ("member_user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_room_created_id_idx" ON "chat_messages" USING btree ("chat_room_id","created_at","id");