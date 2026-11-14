// TEMPORARY seed data for eyeballing the Discover feed.
// Inserts fully onboarded profiles with a real Audius track each.
//
//   pnpm -C backend exec tsx scripts/seed-discover.ts          # insert
//   pnpm -C backend exec tsx scripts/seed-discover.ts --delete # remove
//
// Everything it creates matches seed.discover*@vybe.local, and deleting those
// users cascades their songs and any connection requests. Safe to delete this
// whole file once the data is gone.
import { eq, inArray, like } from "drizzle-orm";
import db from "../src/index.js";
import { user } from "../src/db/auth-schema.js";
import { connectionRequest } from "../src/db/connectionRequest-schema.js";
import { profileSong } from "../src/db/profileSong-schema.js";
import { mapAudiusTrack, searchAudiusTracks, type AudiusTrack } from "../src/lib/audius.js";

const SEED_PREFIX = "seed.discover";

type SeedPerson = {
  name: string;
  lastName: string;
  gender: "male" | "female" | "others";
  age: number;
  city: string;
  about: string;
  favSingers: string[];
  image: string;
  songQuery: string;
  story: string;
};

const PEOPLE: SeedPerson[] = [
  {
    name: "Ananya",
    lastName: "Sharma",
    gender: "female",
    age: 26,
    city: "Mumbai",
    about: "Indie gigs on weekends, filter coffee on weekdays. I judge people by their playlists, gently.",
    favSingers: ["Prateek Kuhad", "The Local Train", "Coldplay"],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop",
    songQuery: "Prateek Kuhad",
    story: "Played this on loop the night I moved to a city where I knew nobody. It made the empty flat feel less empty.",
  },
  {
    name: "Rohan",
    lastName: "Iyer",
    gender: "male",
    age: 28,
    city: "Bengaluru",
    about: "Producer by night, product manager by day. Ask me about the bassline, not the roadmap.",
    favSingers: ["Bonobo", "Four Tet", "Nujabes"],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
    songQuery: "Bonobo",
    story: "This one got me through a 6 a.m. airport run that turned into the best day of that year.",
  },
  {
    name: "Meera",
    lastName: "Nair",
    gender: "female",
    age: 24,
    city: "Delhi",
    about: "Will cry at a chorus. Loud in auto-rickshaws, quiet in libraries.",
    favSingers: ["Lorde", "Taylor Swift", "Gracie Abrams"],
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&fit=crop",
    songQuery: "Lorde",
    story: "My hostel roommate and I had one shared pair of earphones. This was our 2 a.m. song.",
  },
  {
    name: "Kabir",
    lastName: "Menon",
    gender: "male",
    age: 30,
    city: "Pune",
    about: "Old guitars, older records. I will absolutely make you listen to a 9-minute song.",
    favSingers: ["Pink Floyd", "Radiohead", "The Beatles"],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
    songQuery: "Radiohead",
    story: "Learned this on guitar during a monsoon power cut. Still can't play it all the way through.",
  },
  {
    name: "Ishita",
    lastName: "Fernandes",
    gender: "female",
    age: 27,
    city: "Goa",
    about: "Beach shacks, salt in my hair, and a playlist for every sunset. R&B is a personality.",
    favSingers: ["SZA", "Frank Ocean", "Jorja Smith"],
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&fit=crop",
    songQuery: "SZA",
    story: "The soundtrack to a very slow, very good summer. I still text my friends when it comes on.",
  },
  {
    name: "Arjun",
    lastName: "Verma",
    gender: "male",
    age: 25,
    city: "Jaipur",
    about: "Grew up on Bollywood and it shows. Will sing the second verse, badly, with full confidence.",
    favSingers: ["Arijit Singh", "A. R. Rahman", "Coldplay"],
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
    songQuery: "Arijit Singh",
    story: "The song from the first long drive I ever took without my parents. I still know every word.",
  },
  {
    name: "Zoya",
    lastName: "Khan",
    gender: "female",
    age: 29,
    city: "Hyderabad",
    about: "Soft rock, black coffee, and a balcony full of plants. Looking for someone who shares the aux.",
    favSingers: ["Hozier", "Fleetwood Mac", "Norah Jones"],
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&fit=crop",
    songQuery: "Hozier",
    story: "I heard this live in a crowd of strangers and everyone sang the same line at the same time. Still get chills.",
  },
  {
    name: "Deven",
    lastName: "Chatterjee",
    gender: "male",
    age: 31,
    city: "Kolkata",
    about: "Synth nerd, occasional DJ, full-time overthinker of setlists.",
    favSingers: ["Tame Impala", "Daft Punk", "Fred again.."],
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
    songQuery: "Tame Impala",
    story: "The track I always use to test new headphones. It has never once failed me.",
  },
  {
    name: "Naina",
    lastName: "Kapoor",
    gender: "female",
    age: 23,
    city: "Chandigarh",
    about: "Whisper-pop supremacy. Big headphones, small apartment, very dramatic walks.",
    favSingers: ["Billie Eilish", "Olivia Rodrigo", "Lana Del Rey"],
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&fit=crop",
    songQuery: "Billie Eilish",
    story: "First song I ever played loud enough for the neighbours to complain. Worth it.",
  },
  {
    name: "Aditya",
    lastName: "Singh",
    gender: "male",
    age: 26,
    city: "Mumbai",
    about: "Punjabi on the way to work, jazz on the way back. Balanced, like a well-mixed playlist.",
    favSingers: ["Diljit Dosanjh", "AP Dhillon", "Karan Aujla"],
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
    songQuery: "Diljit Dosanjh",
    story: "Chaos song. Windows down, traffic ignored, everyone in the car yelling the hook.",
  },
  {
    name: "Sara",
    lastName: "Oliveira",
    gender: "female",
    age: 30,
    city: "Berlin",
    about: "Moved cities for techno and stayed for the bread. Melodic house is my love language.",
    favSingers: ["Rüfüs Du Sol", "Lane 8", "Ben Böhmer"],
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&fit=crop",
    songQuery: "Rüfüs Du Sol",
    story: "Heard it at sunrise in a warehouse. Someone handed me water and I almost cried. Classic.",
  },
  {
    name: "Nikhil",
    lastName: "Rao",
    gender: "male",
    age: 24,
    city: "Lisbon",
    about: "Garage rock and bad tattoos. Says I'm in a band; says that a lot.",
    favSingers: ["Arctic Monkeys", "The Strokes", "Cage the Elephant"],
    image:
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=80&fit=crop",
    songQuery: "Arctic Monkeys",
    story: "Learned this riff in one night to impress someone. It worked for about a week.",
  },
];

// Which Audius genre shelf each person picks their track from.
const GENRE_BY_NAME: Record<string, string> = {
  Ananya: "Alternative",
  Rohan: "Electronic",
  Meera: "Pop",
  Kabir: "Rock",
  Ishita: "R&B/Soul",
  Arjun: "Pop",
  Zoya: "Alternative",
  Deven: "Electronic",
  Naina: "Pop",
  Aditya: "Hip-Hop/Rap",
  Sara: "Electronic",
  Nikhil: "Rock",
};

const trendingCache = new Map<string, AudiusTrack[]>();

// Audius trending is full of promos, remixes and sub-2-minute snippets. These
// would read badly on a profile card, so skip them when a better option exists.
const UNPRESENTABLE =
  /(^|\b)(ads?|commercial|promo|mix|flip|remint|bootleg|cover|remix|sped|slowed|reverb|snippet|playlist|vol\.?\s*\d|exclusive|freestyle|type beat|beat)(\b|$)/i;

function isPresentable(track: AudiusTrack): boolean {
  return Boolean(track.artworkUrl) && !UNPRESENTABLE.test(track.title);
}

async function trendingTracks(genre: string): Promise<AudiusTrack[]> {
  const cached = trendingCache.get(genre);
  if (cached) return cached;

  const url = `https://api.audius.co/v1/tracks/trending?genre=${encodeURIComponent(genre)}&limit=25&app_name=Vybe`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Audius trending ${genre} failed (${response.status}).`);
  const body = (await response.json()) as { data?: unknown[] };
  const tracks = (body.data ?? [])
    .map(mapAudiusTrack)
    .filter((track): track is AudiusTrack => track !== null);

  trendingCache.set(genre, tracks);
  return tracks;
}

async function seed() {
  const existing = await db
    .select({ email: user.email })
    .from(user)
    .where(like(user.email, `${SEED_PREFIX}%`));

  if (existing.length > 0) {
    console.log(`${existing.length} seeded users already exist.`);
    console.log("Run with --delete first if you want to rebuild them.");
    return;
  }

  const usedSongIds = new Set<string>();

  for (const [index, person] of PEOPLE.entries()) {
    const id = crypto.randomUUID();
    const email = `${SEED_PREFIX}${String(index + 1).padStart(2, "0")}@vybe.local`;
    // Spaced out so the feed's (created_at DESC) order is stable and matches this list.
    const createdAt = new Date(Date.now() - index * 60_000);

    await db.insert(user).values({
      id,
      name: person.name,
      lastName: person.lastName,
      email,
      emailVerified: true,
      image: person.image,
      gender: person.gender,
      age: person.age,
      city: person.city,
      about: person.about,
      favSingers: person.favSingers,
      onboardingCompletedAt: createdAt,
      createdAt,
    });

    let song: AudiusTrack | undefined;
    try {
      const pool = await trendingTracks(GENRE_BY_NAME[person.name] ?? "Electronic");
      const unused = pool.filter((track) => !usedSongIds.has(track.id));
      song = unused.find(isPresentable) ?? unused[0];
    } catch (error) {
      console.warn(`  ! Audius trending failed for ${person.name}:`, error);
    }

    // Fallback: a search hit, still avoiding anything that looks like a cover.
    if (!song) {
      try {
        const tracks = await searchAudiusTracks(person.songQuery, 20);
        const unused = tracks.filter((track) => !usedSongIds.has(track.id));
        song = unused.find(isPresentable) ?? unused[0];
      } catch (error) {
        console.warn(`  ! Audius search failed for ${person.name}:`, error);
      }
    }

    if (song) usedSongIds.add(song.id);

    if (song) {
      await db.insert(profileSong).values({
        userId: id,
        provider: "audius",
        providerTrackId: song.id,
        title: song.title,
        artist: song.artist,
        artworkUrl: song.artworkUrl,
        durationSeconds: song.durationSeconds,
        story: person.story,
      });
    } else {
      console.warn(`  ! no song saved for ${person.name}`);
    }

    console.log(`+ ${person.name} ${person.lastName} (${person.city}) — ${song ? `${song.title} / ${song.artist}` : "no song"}`);
  }

  console.log(`\nSeeded ${PEOPLE.length} profiles. Refresh /discover to see them.`);
}

async function remove() {
  const deleted = await db
    .delete(user)
    .where(like(user.email, `${SEED_PREFIX}%`))
    .returning({ email: user.email });
  console.log(`Deleted ${deleted.length} seeded profiles (songs and requests cascade).`);
}

async function check() {
  const rows = await db
    .select({
      name: user.name,
      city: user.city,
      completed: user.onboardingCompletedAt,
      song: profileSong.title,
    })
    .from(user)
    .leftJoin(profileSong, eq(profileSong.userId, user.id))
    .where(like(user.email, `${SEED_PREFIX}%`));

  console.log(`${rows.length} seeded profiles:`);
  for (const row of rows) {
    console.log(
      `  ${row.name} (${row.city}) — song: ${row.song ?? "none"} — complete: ${row.completed ? "yes" : "NO"}`,
    );
  }

  const ids = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `${SEED_PREFIX}%`));
  const requests = await db
    .select({ id: connectionRequest.id })
    .from(connectionRequest)
    .where(inArray(connectionRequest.fromUserId, ids.map((row) => row.id)));

  console.log(`connection requests involving them: ${requests.length} (0 means all show in Discover)`);
}

const wantDelete = process.argv.includes("--delete");
const wantCheck = process.argv.includes("--check");

if (wantDelete) {
  await remove();
} else if (wantCheck) {
  await check();
} else {
  await seed();
}
