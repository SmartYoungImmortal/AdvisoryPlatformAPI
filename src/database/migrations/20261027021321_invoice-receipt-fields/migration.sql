-- Receipt fields on `service_invoices`: the invoice number a person quotes, when the charge
-- outcome was recorded, and the card it went to (brand and last four digits, nothing more).
--
-- `invoice_number` is assigned by Postgres, never by a client or the API: its default formats
-- the next value of `service_invoice_number_seq` as INV-<Bangkok year>-<six or more digits>.
-- drizzle-kit generated one `ADD COLUMN ... DEFAULT ... NOT NULL`, which would have numbered the
-- existing rows in whatever order the table rewrite happened to visit them. It is split by hand:
-- add the column bare, number the existing rows in `created_at` order with the year of their own
-- `created_at`, move the sequence past them, and only then attach the default, NOT NULL and
-- UNIQUE. The end state is exactly what snapshot.json records.
CREATE SEQUENCE "public"."service_invoice_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "invoice_number" varchar;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "card_brand" varchar;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "card_last_digits" varchar(4);--> statement-breakpoint
-- row_number() rather than nextval() here: a window's ORDER BY is guaranteed, the order in which
-- a SELECT list calls nextval() is not.
UPDATE "service_invoices" AS "invoice"
SET "invoice_number" = 'INV-' || to_char("invoice"."created_at" AT TIME ZONE 'Asia/Bangkok', 'YYYY') || '-' || to_char("numbered"."position", 'FM999999000000')
FROM (
	SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS "position"
	FROM "service_invoices"
) AS "numbered"
WHERE "numbered"."id" = "invoice"."id";--> statement-breakpoint
-- The next invoice continues after the last backfilled number. On an empty table the HAVING
-- returns no row, setval is never called, and the first invoice is 000001.
SELECT setval('service_invoice_number_seq', count(*)) FROM "service_invoices" HAVING count(*) > 0;--> statement-breakpoint
ALTER TABLE "service_invoices" ALTER COLUMN "invoice_number" SET DEFAULT ('INV-' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYYY') || '-' || to_char(nextval('service_invoice_number_seq'), 'FM999999000000'));--> statement-breakpoint
ALTER TABLE "service_invoices" ALTER COLUMN "invoice_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_invoice_number_key" UNIQUE("invoice_number");--> statement-breakpoint
-- An invoice that already left PENDING had its outcome written by the last update to the row, so
-- `modified_at` is the closest record of when that happened. PENDING rows have no outcome yet.
UPDATE "service_invoices" SET "paid_at" = "modified_at" WHERE "status" <> 'PENDING';
