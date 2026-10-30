CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(32) NOT NULL UNIQUE,
	"percent_off" integer,
	"amount_off_satang" integer,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"max_redemptions" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_one_kind_of_discount" CHECK (("percent_off" IS NULL) <> ("amount_off_satang" IS NULL)),
	CONSTRAINT "coupons_percent_off_range" CHECK ("percent_off" IS NULL OR "percent_off" BETWEEN 1 AND 100),
	CONSTRAINT "coupons_amount_off_positive" CHECK ("amount_off_satang" IS NULL OR "amount_off_satang" > 0),
	CONSTRAINT "coupons_code_upper" CHECK ("code" = upper("code"))
);
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "discount_satang" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_coupon_id_coupons_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id");