import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * SMTP configuration — loaded from environment variables.
 * All fields are required for email functionality to work.
 */
interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/**
 * Reads and validates SMTP env vars.
 * Returns null if any required var is missing (email feature disabled).
 */
function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port: Number(port), user, pass, from };
}

/** Cached transporter + sender address — created once per process. */
interface CachedMailer {
  transporter: Transporter;
  from: string;
}

let cachedMailer: CachedMailer | null = null;

/**
 * Returns a reusable Nodemailer transporter with the sender address.
 * Returns null if SMTP is not configured (graceful degradation).
 */
function getMailer(): CachedMailer | null {
  if (cachedMailer) return cachedMailer;

  const config = getSmtpConfig();
  if (!config) {
    console.warn("[mailer] SMTP not configured — email sending is disabled.");
    return null;
  }

  cachedMailer = {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
    from: config.from,
  };

  return cachedMailer;
}

interface SendMailOptions {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** Plain-text body (fallback). */
  text: string;
  /** HTML body (rich content). */
  html: string;
}

/**
 * Sends a single email via the configured SMTP transporter.
 * Silently skips if SMTP is not configured.
 * @returns true if sent successfully, false otherwise.
 */
export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[mailer] Failed to send to ${options.to}: ${msg}`);
    return false;
  }
}

/**
 * Sends emails to multiple recipients in parallel.
 * Each recipient gets an individual email (not CC/BCC).
 * @returns Count of successfully sent emails.
 */
export async function sendBulkMail(recipients: SendMailOptions[]): Promise<number> {
  const mailer = getMailer();
  if (!mailer || recipients.length === 0) return 0;

  const results = await Promise.allSettled(recipients.map((r) => sendMail(r)));

  return results.filter((r) => r.status === "fulfilled" && r.value === true).length;
}
