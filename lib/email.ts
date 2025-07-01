import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSignInEmail(
  email: string,
  otp: string,
  serviceName: string,
  emailAddress: string,
) {
  const { data, error } = await resend.emails.send({
    from: `${serviceName} <${emailAddress}>`,
    to: [email],
    subject: `${serviceName}の認証コード`,
    text: `認証コード: ${otp}`,
  });

  if (error) {
    console.error({ error });
    throw new Error("Failed to send sign-in email");
  }

  console.log({ data });
}
