"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateContractBody } from "@/lib/contracts";
import { labelOf, CONTRACT_TYPES } from "@/lib/constants";
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
function dateVal(v: FormDataEntryValue | null): Date | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Only accept a dealId that belongs to this org; otherwise drop it.
async function safeDealId(orgId: string, dealId: string | undefined): Promise<string | undefined> {
  if (!dealId) return undefined;
  const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId } });
  return deal ? dealId : undefined;
}

export async function createContract(formData: FormData) {
  const { orgId } = await requireUser();
  const type = str(formData.get("type")) ?? "purchase";
  const propertyAddress = str(formData.get("propertyAddress"));
  const buyerName = str(formData.get("buyerName"));
  const sellerName = str(formData.get("sellerName"));
  const purchasePrice = num(formData.get("purchasePrice"));
  const assignmentFee = num(formData.get("assignmentFee"));
  const earnestMoney = num(formData.get("earnestMoney"));
  const closingDate = dateVal(formData.get("closingDate"));
  const inspectionDays = num(formData.get("inspectionDays"));

  const title =
    str(formData.get("title")) ??
    `${labelOf(CONTRACT_TYPES, type)} — ${propertyAddress ?? "Untitled Property"}`;

  const body = generateContractBody({
    type,
    buyerName,
    sellerName,
    propertyAddress,
    purchasePrice,
    assignmentFee,
    earnestMoney,
    closingDate,
    inspectionDays,
  });

  const contract = await prisma.contract.create({
    data: {
      orgId,
      type,
      title,
      status: str(formData.get("status")) ?? "draft",
      dealId: await safeDealId(orgId, str(formData.get("dealId"))),
      buyerName,
      sellerName,
      propertyAddress,
      purchasePrice,
      assignmentFee,
      earnestMoney,
      closingDate,
      inspectionDays,
      body,
    },
  });

  revalidatePath("/contracts");
  redirect(`/contracts/${contract.id}`);
}

export async function updateContract(formData: FormData) {
  const { orgId } = await requireUser();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Contract id is required");

  const type = str(formData.get("type")) ?? "purchase";
  const propertyAddress = str(formData.get("propertyAddress"));
  const buyerName = str(formData.get("buyerName"));
  const sellerName = str(formData.get("sellerName"));
  const purchasePrice = num(formData.get("purchasePrice"));
  const assignmentFee = num(formData.get("assignmentFee"));
  const earnestMoney = num(formData.get("earnestMoney"));
  const closingDate = dateVal(formData.get("closingDate"));
  const inspectionDays = num(formData.get("inspectionDays"));

  const title =
    str(formData.get("title")) ??
    `${labelOf(CONTRACT_TYPES, type)} — ${propertyAddress ?? "Untitled Property"}`;

  // If the form explicitly provides a non-empty body, keep it; otherwise regenerate.
  const explicitBody = str(formData.get("body"));
  const body =
    explicitBody ??
    generateContractBody({
      type,
      buyerName,
      sellerName,
      propertyAddress,
      purchasePrice,
      assignmentFee,
      earnestMoney,
      closingDate,
      inspectionDays,
    });

  await prisma.contract.updateMany({
    where: { id, orgId },
    data: {
      type,
      title,
      status: str(formData.get("status")) ?? "draft",
      dealId: (await safeDealId(orgId, str(formData.get("dealId")))) ?? null,
      buyerName: buyerName ?? null,
      sellerName: sellerName ?? null,
      propertyAddress: propertyAddress ?? null,
      purchasePrice: purchasePrice ?? null,
      assignmentFee: assignmentFee ?? null,
      earnestMoney: earnestMoney ?? null,
      closingDate: closingDate ?? null,
      inspectionDays: inspectionDays ?? null,
      body,
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
}

export async function updateContractStatus(contractId: string, status: string) {
  const { orgId } = await requireUser();
  const existing = await prisma.contract.findFirst({ where: { id: contractId, orgId } });
  if (!existing) throw new Error("Contract not found");

  const data: { status: string; sentDate?: Date; signedDate?: Date } = { status };
  if (status === "sent" && !existing.sentDate) data.sentDate = new Date();
  if ((status === "signed" || status === "executed") && !existing.signedDate) {
    data.signedDate = new Date();
  }

  await prisma.contract.update({ where: { id: contractId }, data });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
}

export async function deleteContract(contractId: string) {
  const { orgId } = await requireUser();
  await prisma.contract.deleteMany({ where: { id: contractId, orgId } });
  revalidatePath("/contracts");
  redirect("/contracts");
}
