import { index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const profileSong = pgTable(
  "profileSong",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("audius"),
    providerTrackId: text("provider_track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artworkUrl: text("artwork_url"),
    durationSeconds: integer("duration_seconds"),
    story: text("story").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("profile_song_user_unique").on(table.userId),
    index("profile_song_provider_track_idx").on(table.providerTrackId),
  ],
);

export type ProfileSong = typeof profileSong.$inferSelect;
export type NewProfileSong = typeof profileSong.$inferInsert;
