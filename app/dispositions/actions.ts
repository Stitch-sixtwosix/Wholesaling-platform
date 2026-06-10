"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
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

export async function blastDeal(formData: FormData) {
  const { orgId } = await requireUser();
  const dealId = str(formData.get("dealId"));
  if (!dealId) return;

  const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId } });
  if (!deal) throw new Error("Deal not found");

  const buyerIds = formData
    .getAll("buyerIds")
    .map((v) => (v as string).trim())
    .filter(Boolean);
  if (buyerIds.length === 0) return;

  // Scope to buyers in this org only.
  const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds }, orgId } });

  for (const buyer of buyers) {
    const name = buyer.company || fullName(buyer.firstName, buyer.lastName);
    await prisma.activity.create({
      data: { type: "email", body: `Deal blasted to ${name}.`, dealId, buyerId: buyer.id },
    });
  }

  await prisma.activity.create({
    data: { type: "system", body: `Blasted to ${buyers.length} buyers.`, dealId },
  });

  revalidatePath("/dispositions");
}
