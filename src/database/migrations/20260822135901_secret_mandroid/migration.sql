CREATE TABLE "trial_grants" (
	"service_id" uuid,
	"advisee_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trial_grants_pkey" PRIMARY KEY("service_id","advisee_id")
);
--> statement-breakpoint
DROP TABLE "trial_requests";--> statement-breakpoint
ALTER TABLE "advisor_skills" DROP COLUMN "proof_level";--> statement-breakpoint
ALTER TABLE "trial_grants" ADD CONSTRAINT "trial_grants_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id");--> statement-breakpoint
ALTER TABLE "trial_grants" ADD CONSTRAINT "trial_grants_advisee_id_user_id_fkey" FOREIGN KEY ("advisee_id") REFERENCES "user"("id");--> statement-breakpoint
DROP TYPE "skill_proof_level";--> statement-breakpoint
DROP TYPE "trial_request_status";