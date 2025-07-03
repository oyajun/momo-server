import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
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
