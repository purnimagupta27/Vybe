import { z } from "zod";

// Fields that a user is never allowed to modify through this API.
// "email" gets its own explicit schema below so the error message is clear;
// the rest are rejected as unknown keys by `.strict()`.
const FORBIDDEN_FIELDS = ["id", "email", "emailVerified", "createdAt", "updatedAt"] as const;

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

const imageSchema = z.url("Image must be a valid URL").max(2048, "Image URL is too long");

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

export const editProfileSchema = z
  .object({
    // A user can never change their email once the account is created.
    email: z.undefined({ error: "Email cannot be changed once added" }).optional(),
    name: nameSchema.nullable().optional(),
    lastName: lastNameSchema.nullable().optional(),
    image: imageSchema.nullable().optional(),
    gender: genderSchema.nullable().optional(),
    age: ageSchema.nullable().optional(),
    about: aboutSchema.nullable().optional(),
    favSingers: favSingersSchema.nullable().optional(),
  })
  .strict();

export type EditProfileInput = z.infer<typeof editProfileSchema>;
export { FORBIDDEN_FIELDS };
