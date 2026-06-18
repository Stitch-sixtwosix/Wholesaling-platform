"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fullName } from "@/lib/format";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}

export async function assignBuyerToDeal(dealId: string, buyerId: string) {
  const { orgId } = await requireUser();
  const buyer = await prisma.buyer.findFirst({ where: { id: buyerId, orgId } });
  if (!buyer) throw new Error("Buyer not found");
  const updated = await prisma.deal.updateMany({ where: { id: dealId, orgId }, data: { buyerId } });
  if (updated.count === 0) throw new Error("Deal not found");
  await prisma.activity.create({
    data: { type: "system", body: "Assigned to buyer via dispositions.", dealId, buyerId },
  });
  revalidatePath("/dispositions");
  revalidatePath("/pipeline");
}

function dealSheet(
  deal: {
    title: string;
    arv: number | null;
    repairEstimate: number | null;
    resalePrice: number | null;
    contractPrice: number | null;
    notes: string | null;
  },
  property:
    | {
        address: string;
        city: string;
        state: string;
        zip: string;
        propertyType: string;
        beds: number | null;
        baths: number | null;
        sqft: number | null;
      }
    | null,
  senderName: string
): string {
  const money = (n: number | null | undefined) =>
    n != null ? `$${Math.round(n).toLocaleString()}` : "—";
  const price = deal.resalePrice ?? deal.contractPrice ?? null;
  const addr = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip}`
    : deal.title;
  const lines = [
    `New wholesale deal available — ${addr}`,
    ``,
    `Price to you:      ${money(price)}`,
    `ARV:               ${money(deal.arv)}`,
    `Estimated repairs: ${money(deal.repairEstimate)}`,
  ];
  if (property) {
    lines.push(
      `Type:              ${property.propertyType.replace(/_/g, " ")}`,
      `Beds / Baths:      ${property.beds ?? "—"} / ${property.baths ?? "—"}`,
      `Sqft:              ${property.sqft != null ? property.sqft.toLocaleString() : "—"}`
    );
  }
  if (deal.arv && price) {
    const spread = deal.arv - price - (deal.repairEstimate ?? 0);
    lines.push(``, `Estimated equity after repairs: ${money(spread)}`);
  }
  if (deal.notes) lines.push(``, deal.notes);
  lines.push(
    ``,
    `Interested? Reply to this email — first to commit with proof of funds locks it up.`,
    ``,
    senderName
  );
  return lines.join("\n");
}

export async function blastDeal(formData: FormData) {
  const { orgId, name } = await requireUser();
  const dealId = str(formData.get("dealId"));
  if (!dealId) return;

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, orgId },
    include: { property: true },
  });
  if (!deal) throw new Error("Deal not found");

  const buyerIds = formData
    .getAll("buyerIds")
    .map((v) => (v as string).trim())
    .filter(Boolean);
  if (buyerIds.length === 0) return;

  // Scope to buyers in this org only.
  const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds }, orgId } });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { resendApiKey: true, fromEmail: true, gmailUser: true, gmailAppPassword: true },
  });
  const { resolveEmailConfig, sendEmail, EmailError } = await import("@/lib/email");
  const cfg = resolveEmailConfig(org);

  const subject = `New wholesale deal — ${deal.property?.city ?? deal.title}`;
  const body = dealSheet(deal, deal.property, name);

  let sent = 0;
  let noEmail = 0;
  let failed = 0;

  for (const buyer of buyers) {
    const buyerName = buyer.company || fullName(buyer.firstName, buyer.lastName);
    if (!buyer.email) {
      noEmail++;
      await prisma.activity.create({
        data: { type: "email", body: `Skipped ${buyerName} — no email on file.`, dealId, buyerId: buyer.id },
      });
      continue;
    }
    if (!cfg) {
      await prisma.activity.create({
        data: {
          type: "email",
          body: `Deal queued for ${buyerName} (no email service connected — connect Gmail in Settings to send).`,
          dealId,
          buyerId: buyer.id,
        },
      });
      continue;
    }
    try {
      await sendEmail(cfg, { to: buyer.email, subject, text: body });
      sent++;
      await prisma.activity.create({
        data: { type: "email", body: `Deal emailed to ${buyerName} (${buyer.email}).`, dealId, buyerId: buyer.id },
      });
    } catch (e) {
      failed++;
      const msg = e instanceof EmailError ? e.message : "send failed";
      await prisma.activity.create({
        data: { type: "email", body: `Failed to email ${buyerName}: ${msg}`, dealId, buyerId: buyer.id },
      });
    }
  }

  const summary = cfg
    ? `Blasted deal sheet: ${sent} emailed${noEmail ? `, ${noEmail} skipped (no email)` : ""}${
        failed ? `, ${failed} failed` : ""
      }.`
    : `Blast queued for ${buyers.length} buyers — connect Gmail in Settings to actually send.`;
  await prisma.activity.create({ data: { type: "system", body: summary, dealId } });

  revalidatePath("/dispositions");
  redirect(`/dispositions?deal=${dealId}&blasted=${sent}`);
}
