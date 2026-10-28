CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'others');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "image" SET DEFAULT 'https://in.pinterest.com/pin/916341855432288019/';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "about" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "fav_singers" text[];