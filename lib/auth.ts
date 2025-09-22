import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP, openAPI } from "better-auth/plugins";
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
          insert_Activity(newSession.user.id);
        }
      }
    }),
  },
  plugins: [
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

async function insert_Activity(userId: string) {
  const activity_low = await prisma.activity.findUnique({
    where: {
      userId,
    },
  });

  if (activity_low) {
    // User already has an activity record, no need to insert a new one
    return;
  }

  try {
    await prisma.activity.create({
      data: {
        userId,
      },
    });
  } catch (error) {
    console.error("Error inserting activity low:", error);
  }
}
