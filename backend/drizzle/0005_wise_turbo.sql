ALTER TABLE "connectionRequest" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."connection_status";--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('ignored', 'interested');--> statement-breakpoint
ALTER TABLE "connectionRequest" ALTER COLUMN "status" SET DATA TYPE "public"."connection_status" USING "status"::"public"."connection_status";