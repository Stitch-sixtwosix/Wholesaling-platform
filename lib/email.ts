// Server-side email via the Resend REST API (https://resend.com).
//
// Configured per organization in Settings → Integrations: a Resend API key and
// a verified "from" address. Used to send contracts to property owners. All
// calls are server-only.

export class EmailError extends Error {}

export function emailConfigured(apiKey?: string | null, fromEmail?: string | null): boolean {
  return Boolean(apiKey?.trim() && fromEmail?.trim());
}

export async function sendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey.trim()}`,
    },
    body: JSON.stringify({
      from: params.from.trim(),
      to: [params.to.trim()],
      subject: params.subject,
      text: params.text,
    }),
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
    if (res.status === 422 && /domain/i.test(detail)) {
      throw new EmailError(
        "Resend rejected the sender address — verify your domain (or use onboarding@resend.dev for testing). " + detail
      );
    }
    throw new EmailError(`Email send failed (${res.status}). ${detail}`.trim());
  }

  const data = (await res.json()) as { id?: string };
  return { id: data.id ?? "" };
}
