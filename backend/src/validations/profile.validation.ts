import { z } from "zod";

// Fields that a user is never allowed to modify through this API.
// "email" gets its own explicit schema below so the error message is clear;
// the rest (including "image", which is only written by the photo upload
// endpoint) are rejected as unknown keys by `.strict()`.
const FORBIDDEN_FIELDS = ["id", "email", "emailVerified", "createdAt", "updatedAt", "image"] as const;

const nameSchema = z
  .string("Name must be a string")
  .trim()
  .min(4, "Name must be at least 4 characters")
  .max(50, "Name must be at most 50 characters");

const lastNameSchema = z
  .string("Last name must be a string")
  .trim()
  .min(1, "Last name cannot be empty")
  .max(50, "Last name must be at most 50 characters");

const genderSchema = z.enum(["male", "female", "others"], {
  error: "Gender must be one of: male, female, others",
});

const ageSchema = z
  .number("Age must be a number")
  .int("Age must be a whole number")
  .min(18, "Age must be at least 18")
  .max(120, "Age must be at most 120");

const aboutSchema = z
  .string("About must be a string")
  .trim()
  .min(1, "About cannot be empty")
  .max(500, "About must be at most 500 characters");

const favSingersSchema = z.array(
  z.string("Favorite singers must be an array of strings").trim().min(1, "Singer name cannot be empty").max(100, "Singer name must be at most 100 characters"),
  {
    error: "Favorite singers must be an array of strings",
  },
).max(30, "You can add at most 30 favorite singers");

const citySchema = z
  .string("City must be a string")
  .trim()
  .min(1, "City is required")
  .max(100, "City must be at most 100 characters");

const storySchema = z
  .string("Song story must be a string")
  .trim()
  .min(1, "Song story is required")
  .max(500, "Song story must be at most 500 characters");

const songSchema = z
  .object({
    trackId: z
      .string("Track id must be a string")
      .trim()
      .regex(/^[A-Za-z0-9]+$/, "Invalid Audius track id"),
    story: storySchema,
  })
  .strict();

export const completeProfileSchema = z
  .object({
    name: nameSchema,
    lastName: lastNameSchema,
    gender: genderSchema,
    age: ageSchema,
    city: citySchema,
    about: aboutSchema,
    favSingers: favSingersSchema.min(1, "Add at least one favorite singer"),
    song: songSchema,
  })
  .strict();

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const editProfileSchema = z
  .object({
    // A user can never change their email once the account is created.
    email: z.undefined({ error: "Email cannot be changed once added" }).optional(),
    name: nameSchema.nullable().optional(),
    lastName: lastNameSchema.nullable().optional(),
    gender: genderSchema.nullable().optional(),
    age: ageSchema.nullable().optional(),
    city: citySchema.nullable().optional(),
    about: aboutSchema.nullable().optional(),
    favSingers: favSingersSchema.nullable().optional(),
    song: songSchema.optional(),
  })
  .strict();

export type EditProfileInput = z.infer<typeof editProfileSchema>;
export { FORBIDDEN_FIELDS };
