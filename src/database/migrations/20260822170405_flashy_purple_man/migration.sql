ALTER TABLE "omise_bank_accounts" DROP CONSTRAINT "omise_bank_accounts_bank_account_id_unique";--> statement-breakpoint
ALTER TABLE "omise_cards" DROP CONSTRAINT "omise_cards_card_id_unique";--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" DROP CONSTRAINT "omise_bank_accounts_pkey";--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD PRIMARY KEY ("bank_account_id");--> statement-breakpoint
ALTER TABLE "omise_cards" DROP CONSTRAINT "omise_cards_pkey";--> statement-breakpoint
ALTER TABLE "omise_cards" ADD PRIMARY KEY ("card_id");--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "omise_cards" ALTER COLUMN "user_id" DROP NOT NULL;