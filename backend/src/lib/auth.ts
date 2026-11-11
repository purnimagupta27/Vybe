import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "../index.js";
import * as authSchema from "../db/auth-schema.js";
import { trustedOrigins } from "./origins.js";
import "dotenv/config";

const validateUserFields = (data: {
  name?: string;
  age?: number | null;
  favSingers?: string[] | null;
}) => {
  if (data.name !== undefined && (data.name.length < 4 || data.name.length > 50)) {
    throw new APIError("BAD_REQUEST", {
      message: "Name must be between 4 and 50 characters",
    });
  }
  if (data.age !== undefined && data.age !== null && data.age < 18) {
    throw new APIError("BAD_REQUEST", { message: "Age must be at least 18" });
  }
  if (
    data.favSingers !== undefined &&
    data.favSingers !== null &&
    data.favSingers.length > 30
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "You can add at most 30 favorite singers",
    });
  }
};

export const auth = betterAuth({
  /* Public origin of this API. Better Auth uses it to build the OAuth
     redirect URI: <baseURL>/api/auth/callback/google */
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  user: {
    additionalFields: {
      lastName: { type: "string", required: false, fieldName: "lastName" },
      gender: { type: ["male", "female", "others"], required: false, fieldName: "gender" },
      age: { type: "number", required: false, fieldName: "age" },
      about: { type: "string", required: false, fieldName: "about" },
      favSingers: { type: "string[]", required: false, fieldName: "favSingers" },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Google sends its own profile picture. The only writer of
          // `user.image` is POST /api/profile/photo, so drop it here and
          // start every new account without a photo.
          const { image: _ignoredImage, ...profileData } = user;
          validateUserFields(profileData);
          return {
            data: { ...profileData, image: null, email: profileData.email?.toLowerCase() },
          };
        },
      },
      update: {
        before: async (data) => {
          // Omit `image` instead of setting it to null so a Better Auth
          // update never wipes the photo uploaded through the API.
          const { image: _ignoredImage, ...profileData } = data;
          validateUserFields(profileData);
          return {
            data: {
              ...profileData,
              ...(profileData.email ? { email: profileData.email.toLowerCase() } : {}),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  /* Google verifies the email address, so an existing email/password user
     who later signs in with Google is linked to the same account instead of
     hitting "account not linked". */
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  /* Origins allowed to hit /api/auth cross-origin (Vite dev server) —
     without this the browser blocks the sign-in fetch with CORS. */
  trustedOrigins,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
