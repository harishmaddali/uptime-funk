import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendAuthEmail } from "@/lib/resend";
import { databaseHooks } from "@/lib/auth-hooks";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.AUTH_URL ||
  "http://localhost:3000";

/** Set BETTER_AUTH_SECRET in production — fallback is for local dev / CI build only */
const secret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "local-dev-only-set-BETTER_AUTH_SECRET-in-production-32";

export const auth = betterAuth({
  baseURL,
  secret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  databaseHooks,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const subjects: Record<string, string> = {
          "sign-in": "Your Uptime Funk sign-in code",
          "email-verification": "Verify your Uptime Funk email",
          "forget-password": "Reset your Uptime Funk password",
        };
        const subject = subjects[type] ?? "Your verification code";
        const html = `
          <p>Your one-time code is:</p>
          <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p>
          <p style="color:#666">This code expires in a few minutes. If you didn't request it, you can ignore this email.</p>
        `;
        void sendAuthEmail({
          to: email,
          subject,
          html,
          text: `Your code: ${otp}`,
        });
      },
    }),
    nextCookies(),
  ],
});
