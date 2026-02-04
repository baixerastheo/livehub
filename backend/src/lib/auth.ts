import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Create a dedicated Prisma instance for Better Auth
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4001",

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // User configuration - name is already in schema, just add statut
  user: {
    additionalFields: {
      statut: {
        type: "string",
        required: false,
        defaultValue: "EN_LIGNE",
        input: false,
      },
    },
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  // Advanced settings
  advanced: {
    cookiePrefix: "livehub",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Trust frontend origin
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
  ],
});

// Export types for use in guards
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
