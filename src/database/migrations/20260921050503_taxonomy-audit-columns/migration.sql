ALTER TABLE "skills" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "updated_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "updated_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_updated_by_user_id_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_updated_by_user_id_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id");