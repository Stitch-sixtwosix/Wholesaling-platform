// Server-side email sending. Supports two providers, resolved per organization
// in Settings → Integrations:
//
//   1. Gmail / Google Workspace via App Password (SMTP). Sends as your real
//      address (e.g. info@fastflip.co); replies come back to that inbox — ideal
//      for the disposition buyer blast. Workspace allows ~2,000 sends/day.
//   2. Resend (HTTP API) — needs a verified domain.
//
// Gmail takes precedence when both are configured. All calls are server-only.

import nodemailer from "nodemailer";

export class EmailError extends Error {}

export type EmailConfig =
  | { provider: "gmail"; user: string; appPassword: string }
  | { provider: "resend"; apiKey: string; from: string };

type OrgEmailFields = {
  gmailUser?: string | null;
  gmailAppPassword?: string | null;
  resendApiKey?: string | null;
  fromEmail?: string | null;
};

/** Pick the configured provider for an org (Gmail wins), or null if none. */
export function resolveEmailConfig(org: OrgEmailFields | null | undefined): EmailConfig | null {
  if (org?.gmailUser?.trim() && org?.gmailAppPassword?.trim()) {
    return { provider: "gmail", user: org.gmailUser.trim(), appPassword: org.gmailAppPassword.trim() };
  }
  if (org?.resendApiKey?.trim() && org?.fromEmail?.trim()) {
    return { provider: "resend", apiKey: org.resendApiKey.trim(), from: org.fromEmail.trim() };
  }
  return null;
}

export function emailConfigured(org: OrgEmailFields | null | undefined): boolean {
  return resolveEmailConfig(org) !== null;
}

/** The address mail will be sent from, for display. */
export function fromAddress(cfg: EmailConfig): string {
  return cfg.provider === "gmail" ? cfg.user : cfg.from;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(cfg: EmailConfig, msg: OutboundEmail): Promise<{ id: string }> {
  return cfg.provider === "gmail" ? sendViaGmail(cfg, msg) : sendViaResend(cfg, msg);
}

async function sendViaGmail(
  cfg: Extract<EmailConfig, { provider: "gmail" }>,
  msg: OutboundEmail
): Promise<{ id: string }> {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: cfg.user, pass: cfg.appPassword },
  });
  try {
    const info = await transport.sendMail({
      from: cfg.user,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
    return { id: info.messageId ?? "" };
  } catch (e: any) {
    const code = e?.responseCode ?? e?.code;
    if (code === 535 || code === "EAUTH") {
      throw new EmailError(
        "Gmail rejected the login. Use a 16-character App Password (not your normal password), and make sure 2-Step Verification is on and App Passwords are allowed for the account."
      );
    }
    throw new EmailError(`Gmail send failed: ${e?.message ?? "unknown error"}`);
  }
}

async function sendViaResend(
  cfg: Extract<EmailConfig, { provider: "resend" }>,
  msg: OutboundEmail
): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({ from: cfg.from, to: [msg.to], subject: msg.subject, text: msg.text }),
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.message || j?.error || JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401 || res.status === 403) {
      throw new EmailError("Resend rejected the API key. Check it in Settings → Integrations.");
    }
    throw new EmailError(`Email send failed (${res.status}). ${detail}`.trim());
  }
  const data = (await res.json()) as { id?: string };
  return { id: data.id ?? "" };
}
