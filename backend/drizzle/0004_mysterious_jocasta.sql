CREATE TYPE "public"."connection_status" AS ENUM('ignored', 'interested', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "connectionRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"status" "connection_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connection_request_from_to_unique" UNIQUE("from_user_id","to_user_id"),
	CONSTRAINT "connection_request_no_self_requests_check" CHECK ("connectionRequest"."from_user_id" <> "connectionRequest"."to_user_id")
);
--> statement-breakpoint
ALTER TABLE "connectionRequest" ADD CONSTRAINT "connectionRequest_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connectionRequest" ADD CONSTRAINT "connectionRequest_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connection_request_from_user_id_idx" ON "connectionRequest" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "connection_request_to_user_id_idx" ON "connectionRequest" USING btree ("to_user_id");