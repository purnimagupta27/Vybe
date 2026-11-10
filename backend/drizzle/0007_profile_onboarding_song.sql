CREATE TABLE "profileSong" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'audius' NOT NULL,
	"provider_track_id" text NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"artwork_url" text,
	"duration_seconds" integer,
	"story" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_song_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "image" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "profileSong" ADD CONSTRAINT "profileSong_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_song_provider_track_idx" ON "profileSong" USING btree ("provider_track_id");
--> statement-breakpoint
UPDATE "user" SET "image" = NULL;