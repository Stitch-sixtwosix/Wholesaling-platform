"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { fullName } from "@/lib/format";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}

export async function assignBuyerToDeal(dealId: string, buyerId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { buyerId } });
  await prisma.activity.create({
    data: { type: "system", body: "Assigned to buyer via dispositions.", dealId, buyerId },
  });
  revalidatePath("/dispositions");
  revalidatePath("/pipeline");
}

export async function blastDeal(formData: FormData) {
  const dealId = str(formData.get("dealId"));
  if (!dealId) return;

  const buyerIds = formData
    .getAll("buyerIds")
    .map((v) => (v as string).trim())
    .filter(Boolean);
  if (buyerIds.length === 0) return;

  const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds } } });

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
