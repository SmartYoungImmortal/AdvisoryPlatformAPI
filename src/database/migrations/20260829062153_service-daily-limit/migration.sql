ALTER TABLE "services" ADD COLUMN "daily_consultation_limit_minutes" integer;--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" DROP CONSTRAINT "omise_bank_accounts_pkey";--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD CONSTRAINT "omise_bank_accounts_bank_account_id_key" UNIQUE("bank_account_id");--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" DROP CONSTRAINT "omise_bank_accounts_user_id_user_id_fkey", ADD CONSTRAINT "omise_bank_accounts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_daily_limit_positive" CHECK ("daily_consultation_limit_minutes" IS NULL OR "daily_consultation_limit_minutes" > 0);