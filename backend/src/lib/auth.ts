import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "../index.js";
import * as authSchema from "../db/auth-schema.js";
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
          validateUserFields(user);
          return {
            data: { ...user, email: user.email?.toLowerCase() },
          };
        },
      },
      update: {
        before: async (data) => {
          validateUserFields(data);
          return {
            data: {
              ...data,
              ...(data.email ? { email: data.email.toLowerCase() } : {}),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
