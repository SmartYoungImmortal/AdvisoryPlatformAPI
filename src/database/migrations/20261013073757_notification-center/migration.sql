ALTER TYPE "notification_type" ADD VALUE 'BOOKING_RECEIVED';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'PAYOUT_SENT';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'REVIEW_RECEIVED';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
CREATE INDEX "notifications_owner_created_id_idx" ON "notifications" ("owner_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_unread_message_owner_resource_key" ON "notifications" ("owner_id","resource_id") WHERE "type" = 'NEW_MESSAGE' AND "is_read" = false;