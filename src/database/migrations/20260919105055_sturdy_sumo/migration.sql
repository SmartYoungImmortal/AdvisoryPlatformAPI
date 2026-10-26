CREATE TABLE "service_appointments_on_service_invoices" (
	"serviceAppointmentId" uuid UNIQUE,
	"serviceInvoiceId" uuid,
	CONSTRAINT "service_appointments_on_service_invoices_pkey" PRIMARY KEY("serviceAppointmentId","serviceInvoiceId")
);
--> statement-breakpoint
ALTER TABLE "service_invoices" DROP CONSTRAINT "service_invoices_appointment_id_service_appointments_id_fk";--> statement-breakpoint
ALTER TABLE "service_invoices" DROP CONSTRAINT "service_invoices_appointment_id_unique";--> statement-breakpoint
ALTER TABLE "service_invoices" DROP COLUMN "appointment_id";--> statement-breakpoint
ALTER TABLE "service_appointments_on_service_invoices" ADD CONSTRAINT "service_appointments_on_service_invoices_9NhPYze3lLwc_fkey" FOREIGN KEY ("serviceAppointmentId") REFERENCES "service_appointments"("id");--> statement-breakpoint
ALTER TABLE "service_appointments_on_service_invoices" ADD CONSTRAINT "service_appointments_on_service_invoices_pRCtTV4hpQKM_fkey" FOREIGN KEY ("serviceInvoiceId") REFERENCES "service_invoices"("id");