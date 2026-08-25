import nodemailer from "nodemailer";
import dns from "dns";

// Globally force Node.js to prefer IPv4 over IPv6 for DNS resolution.
// This fixes ETIMEDOUT errors when connecting to Gmail's SMTP servers
// on networks where IPv6 is broken, because sometimes tls.connect
// ignores the { family: 4 } option.
dns.setDefaultResultOrder("ipv4first");

import {
  verificationEmailHtml,
  verificationEmailText,
  welcomeEmailHtml,
  welcomeEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "./templates";

/**
 * Returns a Nodemailer transporter configured from environment variables.
 * Call this lazily (not at module load time) so missing env vars don't crash
 * the process before the user has set them up.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in .env to send emails.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    family: 4, // Force IPv4 to prevent ETIMEDOUT on IPv6 addresses
  } as any);
}

const FROM_ADDRESS =
  process.env.SMTP_FROM ?? "NotesBook <noreply@notesbook.app>";

/**
 * Sends a 6-digit verification code to the given email address.
 * Throws if SMTP credentials are missing or the send fails.
 * Callers should fire-and-forget (do not await in the request handler)
 * and log any thrown errors so a mail failure doesn't block signup.
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Your NotesBook verification code",
    text: verificationEmailText(code),
    html: verificationEmailHtml(code),
  });
}

/**
 * Sends a welcome email with a Discord invite to the given email address.
 * Throws if SMTP credentials are missing or the send fails.
 * Callers should fire-and-forget (do not await in the request handler)
 * and log any thrown errors so a mail failure doesn't block signup.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string | null,
): Promise<void> {
  const transporter = createTransporter();
  
  // Extract first name, fallback to "there"
  const firstName = name ? name.split(" ")[0] : "there";

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Welcome to NotesBook — Your notes deserve better 📓",
    text: welcomeEmailText(firstName),
    html: welcomeEmailHtml(firstName),
  });
}

/**
 * Sends a 6-digit password reset code to the given email address.
 * Callers should fire-and-forget (do not await in the request handler)
 * and log any thrown errors so a mail failure doesn't block the response.
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Your NotesBook password reset code",
    text: passwordResetEmailText(code),
    html: passwordResetEmailHtml(code),
  });
}
