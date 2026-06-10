"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const n = Number(s.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
function dateOrUndef(v: FormDataEntryValue | null): Date | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createDeal(formData: FormData) {
  const { orgId } = await requireUser();
  const title = str(formData.get("title"));
  if (!title) throw new Error("Title is required");

  const deal = await prisma.deal.create({
    data: {
      orgId,
      title,
      stage: str(formData.get("stage")) ?? "lead",
      arv: num(formData.get("arv")),
      repairEstimate: num(formData.get("repairEstimate")),
      contractPrice: num(formData.get("contractPrice")),
      resalePrice: num(formData.get("resalePrice")),
      assignmentFee: num(formData.get("assignmentFee")),
      expectedCloseDate: dateOrUndef(formData.get("expectedCloseDate")),
      notes: str(formData.get("notes")),
    },
  });

  await prisma.activity.create({
    data: { type: "system", body: "Deal created.", dealId: deal.id },
  });

  revalidatePath("/pipeline");
  redirect(`/pipeline/${deal.id}`);
}

export async function updateDealStage(dealId: string, stage: string) {
  const { orgId } = await requireUser();
  const status = stage === "closed" ? "won" : stage === "dead" ? "lost" : "active";
  const updated = await prisma.deal.updateMany({
    where: { id: dealId, orgId },
    data: {
      stage,
      status,
      ...(stage === "closed" ? { closedDate: new Date() } : {}),
    },
  });
  if (updated.count === 0) throw new Error("Deal not found");
  await prisma.activity.create({
    data: {
      type: "status_change",
      body: `Stage changed to ${stage.replace(/_/g, " ")}.`,
      dealId,
    },
  });
  revalidatePath(`/pipeline/${dealId}`);
  revalidatePath("/pipeline");
}

export async function assignBuyer(dealId: string, buyerId: string) {
  const { orgId } = await requireUser();
  const id = buyerId.trim() || null;
  // Ensure the buyer (if any) is in the same org before linking.
  if (id) {
    const buyer = await prisma.buyer.findFirst({ where: { id, orgId } });
    if (!buyer) throw new Error("Buyer not found");
  }
  const updated = await prisma.deal.updateMany({
    where: { id: dealId, orgId },
    data: { buyerId: id },
  });
  if (updated.count === 0) throw new Error("Deal not found");
  await prisma.activity.create({
    data: {
      type: "system",
      body: id ? "Buyer assigned to deal." : "Buyer removed from deal.",
      dealId,
    },
  });
  revalidatePath(`/pipeline/${dealId}`);
  revalidatePath("/pipeline");
}

export async function updateDealEconomics(formData: FormData) {
  const { orgId } = await requireUser();
  const dealId = str(formData.get("dealId"));
  if (!dealId) return;
  await prisma.deal.updateMany({
    where: { id: dealId, orgId },
    data: {
      arv: num(formData.get("arv")) ?? null,
      repairEstimate: num(formData.get("repairEstimate")) ?? null,
      contractPrice: num(formData.get("contractPrice")) ?? null,
      resalePrice: num(formData.get("resalePrice")) ?? null,
      assignmentFee: num(formData.get("assignmentFee")) ?? null,
      closingCosts: num(formData.get("closingCosts")) ?? null,
      expectedCloseDate: dateOrUndef(formData.get("expectedCloseDate")) ?? null,
      notes: str(formData.get("notes")) ?? null,
    },
  });
  revalidatePath(`/pipeline/${dealId}`);
  revalidatePath("/pipeline");
}

export async function addDealActivity(formData: FormData) {
  const { orgId } = await requireUser();
  const dealId = str(formData.get("dealId"));
  const body = str(formData.get("body"));
  const type = str(formData.get("type")) ?? "note";
  if (!dealId || !body) return;
  const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId } });
  if (!deal) throw new Error("Deal not found");
  await prisma.activity.create({ data: { dealId, body, type } });
  revalidatePath(`/pipeline/${dealId}`);
}
