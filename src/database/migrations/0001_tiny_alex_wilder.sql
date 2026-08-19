CREATE TABLE "omise_bank_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bank_account_id" varchar PRIMARY KEY NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "omise_cards" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"card_id" varchar PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "omise_customers" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"customer_id" varchar PRIMARY KEY NOT NULL,
	CONSTRAINT "omise_customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "omise_bank_accounts" ADD CONSTRAINT "omise_bank_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "omise_cards" ADD CONSTRAINT "omise_cards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "omise_customers" ADD CONSTRAINT "omise_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;