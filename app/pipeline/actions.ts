"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const title = str(formData.get("title"));
  if (!title) throw new Error("Title is required");

  const deal = await prisma.deal.create({
    data: {
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
  const status = stage === "closed" ? "won" : stage === "dead" ? "lost" : "active";
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage,
      status,
      ...(stage === "closed" ? { closedDate: new Date() } : {}),
    },
  });
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
  const id = buyerId.trim() || null;
  await prisma.deal.update({ where: { id: dealId }, data: { buyerId: id } });
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
  const dealId = str(formData.get("dealId"));
  if (!dealId) return;
  await prisma.deal.update({
    where: { id: dealId },
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
  const dealId = str(formData.get("dealId"));
  const body = str(formData.get("body"));
  const type = str(formData.get("type")) ?? "note";
  if (!dealId || !body) return;
  await prisma.activity.create({ data: { dealId, body, type } });
  revalidatePath(`/pipeline/${dealId}`);
}
