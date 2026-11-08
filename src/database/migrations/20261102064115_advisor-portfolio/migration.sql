CREATE TABLE "advisor_portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"advisor_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" varchar(1000),
	"link" varchar(500),
	"image_keys" text[] DEFAULT '{}'::text[] NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_portfolio_items_image_limit" CHECK (coalesce(array_length("image_keys", 1), 0) <= 4)
);
--> statement-breakpoint
CREATE INDEX "advisor_portfolio_items_advisor_order_idx" ON "advisor_portfolio_items" ("advisor_id","sort_order");--> statement-breakpoint
ALTER TABLE "advisor_portfolio_items" ADD CONSTRAINT "advisor_portfolio_items_XIntPgxC9HHh_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor_profiles"("user_id") ON DELETE CASCADE;