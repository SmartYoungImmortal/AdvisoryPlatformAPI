-- An invoice can pay for several appointments, so the link moves off
-- `service_invoices.appointment_id` into a junction table. The existing links are
-- copied across before the column is dropped: every invoice written so far keeps
-- the appointment it was issued for.
CREATE TABLE "service_appointments_on_service_invoices" (
	"serviceAppointmentId" uuid UNIQUE,
	"serviceInvoiceId" uuid,
	CONSTRAINT "service_appointments_on_service_invoices_pkey" PRIMARY KEY("serviceAppointmentId","serviceInvoiceId")
);
--> statement-breakpoint
INSERT INTO "service_appointments_on_service_invoices" ("serviceAppointmentId", "serviceInvoiceId")
SELECT "appointment_id", "id" FROM "service_invoices" WHERE "appointment_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "service_invoices" DROP CONSTRAINT "service_invoices_appointment_id_service_appointments_id_fk";--> statement-breakpoint
ALTER TABLE "service_invoices" DROP CONSTRAINT "service_invoices_appointment_id_unique";--> statement-breakpoint
ALTER TABLE "service_invoices" DROP COLUMN "appointment_id";--> statement-breakpoint
ALTER TABLE "service_appointments_on_service_invoices" ADD CONSTRAINT "service_appointments_on_service_invoices_9NhPYze3lLwc_fkey" FOREIGN KEY ("serviceAppointmentId") REFERENCES "service_appointments"("id");--> statement-breakpoint
ALTER TABLE "service_appointments_on_service_invoices" ADD CONSTRAINT "service_appointments_on_service_invoices_pRCtTV4hpQKM_fkey" FOREIGN KEY ("serviceInvoiceId") REFERENCES "service_invoices"("id");--> statement-breakpoint
-- Same defence in depth as 20260907141856_lock-down-postgrest-exposure: RLS with no
-- policy keeps the table closed to PostgREST even if a grant is ever restored.
ALTER TABLE "service_appointments_on_service_invoices" ENABLE ROW LEVEL SECURITY;
