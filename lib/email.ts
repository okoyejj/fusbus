import nodemailer from "nodemailer";
import type { EmailContent } from "@/lib/email-templates";

const emailFrom = '"FusBus" <info@fusbus.org>';

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isInteger(port) || port <= 0 || !user || !pass) {
    throw new Error("SMTP configuration is incomplete.");
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  };
}

export async function sendEmail(input: EmailContent & { to: string }) {
  const transporter = nodemailer.createTransport(smtpConfig());
  return transporter.sendMail({
    from: emailFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}
