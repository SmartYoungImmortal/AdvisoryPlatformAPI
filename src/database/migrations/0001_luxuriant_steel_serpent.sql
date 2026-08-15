ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "modified_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_appointment_id_unique" UNIQUE("appointment_id");--> statement-breakpoint
ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_penalty_points_nonnegative" CHECK ("advisor_profiles"."penalty_points" >= 0);--> statement-breakpoint
ALTER TABLE "service_images" ADD CONSTRAINT "service_images_carousel_index_nonnegative" CHECK ("service_images"."carousel_index" >= 0);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_price_satang_nonnegative" CHECK ("services"."price_satang" >= 0);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_duration_minutes_positive" CHECK ("services"."duration_minutes" > 0);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_trial_duration_consistent" CHECK (("services"."trial_enabled" AND "services"."trial_duration_minutes" > 0) OR (NOT "services"."trial_enabled" AND "services"."trial_duration_minutes" IS NULL));--> statement-breakpoint
ALTER TABLE "screening_requests" ADD CONSTRAINT "screening_requests_trial_window_valid" CHECK (("screening_requests"."trial_started_at" IS NULL AND "screening_requests"."trial_expires_at" IS NULL) OR ("screening_requests"."trial_started_at" IS NOT NULL AND "screening_requests"."trial_expires_at" IS NOT NULL AND "screening_requests"."trial_expires_at" > "screening_requests"."trial_started_at"));--> statement-breakpoint
ALTER TABLE "service_screening_questions" ADD CONSTRAINT "service_screening_questions_display_order_nonnegative" CHECK ("service_screening_questions"."display_order" >= 0);--> statement-breakpoint
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_stars_range" CHECK ("service_reviews"."stars" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "service_timeslots" ADD CONSTRAINT "service_timeslots_end_after_start" CHECK ("service_timeslots"."end_time" > "service_timeslots"."start_time");--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_amount_satang_positive" CHECK ("payouts"."amount_satang" > 0);--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_amount_satang_nonnegative" CHECK ("service_invoices"."amount_satang" >= 0);--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_platform_fee_range" CHECK ("service_invoices"."platform_fee_satang" BETWEEN 0 AND "service_invoices"."amount_satang");--> statement-breakpoint
ALTER TABLE "chat_files" ADD CONSTRAINT "chat_files_size_range" CHECK ("chat_files"."file_size_bytes" BETWEEN 1 AND 52428800);--> statement-breakpoint
ALTER TABLE "off_platform_flags" ADD CONSTRAINT "off_platform_flags_penalty_points_nonnegative" CHECK ("off_platform_flags"."penalty_points_applied" >= 0);
