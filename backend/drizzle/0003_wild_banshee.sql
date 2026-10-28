ALTER TABLE "user" ALTER COLUMN "name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_name_length_check" CHECK (char_length("user"."name") >= 4);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_age_min_check" CHECK ("user"."age" >= 18);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_fav_singers_max_check" CHECK (array_length("user"."fav_singers", 1) <= 30);