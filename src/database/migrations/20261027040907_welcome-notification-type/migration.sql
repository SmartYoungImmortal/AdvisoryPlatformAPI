-- `notification_type` gains WELCOME. The type is recreated instead of taking the value through
-- `ALTER TYPE ... ADD VALUE`: Postgres refuses to use a value added that way until its transaction
-- commits, `drizzle-kit migrate` applies every pending migration in a single transaction, and both
-- the index at the end of this file and the welcome backfill after it use the value. The values of
-- a type created in the same transaction can be used at once.
ALTER TYPE "notification_type" RENAME TO "notification_type_old";--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('BOOKING_CONFIRMED', 'PAYMENT_SUCCEEDED', 'SESSION_REMINDER', 'NEW_MESSAGE', 'SCREENING_REQUESTED', 'SCREENING_DECIDED', 'VERIFICATION_DECIDED', 'POLICY_WARNING', 'BOOKING_RECEIVED', 'PAYOUT_SENT', 'REVIEW_RECEIVED', 'WELCOME');--> statement-breakpoint
-- The chat-room index's predicate compares against the old type, so it is rebuilt around the change.
DROP INDEX "notifications_unread_message_owner_resource_key";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "notification_type" USING "type"::text::"notification_type";--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_unread_message_owner_resource_key" ON "notifications" ("owner_id","resource_id") WHERE "type" = 'NEW_MESSAGE' AND "is_read" = false;--> statement-breakpoint
DROP TYPE "notification_type_old";--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_welcome_owner_key" ON "notifications" ("owner_id") WHERE "type" = 'WELCOME';
