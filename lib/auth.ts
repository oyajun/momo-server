import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { bearer, emailOTP, openAPI } from "better-auth/plugins";
import insertActivity from "@/lib/insertActivity";
import { prisma } from "@/lib/prisma";
import { sendSignInEmail } from "./email";

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const SERVICE_NAME = process.env.SERVICE_NAME;

if (!EMAIL_ADDRESS || !SERVICE_NAME) {
  throw new Error("Missing environment variables for email service");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-in/email-otp")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          insertActivity(newSession.user.id);
        }
      }
    }),
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    freshAge: 0,
  },
  plugins: [
    bearer(),
    openAPI(),
    emailOTP({
      allowedAttempts: 5,
      expiresIn: 10 * 60, // 10 minutes
      otpLength: 6,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          sendSignInEmail(email, otp, SERVICE_NAME, EMAIL_ADDRESS);
        } else {
          throw new Error("Unsupported OTP type");
        }
      },
    }),
  ],
});
