ALTER TABLE "service_invoices" DROP CONSTRAINT "service_invoices_appointment_id_service_appointments_id_fkey";--> statement-breakpoint
ALTER TABLE "service_invoices" DROP COLUMN "appointment_id";