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

// Email the contract to the property owner/seller. Uses the organization's
// Resend key (Settings → Integrations). Without one, the send is logged in the
// deal timeline and the contract is still marked Sent, so the flow keeps moving.
export async function sendContractToOwner(formData: FormData) {
  const { orgId, name } = await requireUser();
  const contractId = str(formData.get("contractId"));
  const to = str(formData.get("to"));
  if (!contractId) throw new Error("Contract id is required");
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    throw new Error("A valid recipient email is required");
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, orgId },
    include: { deal: true },
  });
  if (!contract) throw new Error("Contract not found");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, resendApiKey: true, fromEmail: true },
  });

  let delivery: string;
  if (org?.resendApiKey && org.fromEmail) {
    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      apiKey: org.resendApiKey,
      from: org.fromEmail,
      to,
      subject: `${contract.title} — for your review`,
      text:
        `Hello,\n\nPlease find the contract for ${contract.propertyAddress ?? "the property"} below.\n` +
        `Reply to this email with any questions.\n\n` +
        `------------------------------------------------------------\n\n` +
        `${contract.body ?? "(contract body not generated)"}\n\n` +
        `------------------------------------------------------------\n` +
        `Sent by ${name} · ${org.name}`,
    });
    delivery = `Contract emailed to ${to}.`;
  } else {
    delivery = `Contract marked sent to ${to} (no email service connected — add a Resend key in Settings to actually deliver it).`;
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "sent", sentDate: contract.sentDate ?? new Date() },
  });

  if (contract.dealId) {
    await prisma.activity.create({
      data: { type: "email", body: delivery, dealId: contract.dealId },
    });
    // Sending a contract means we're at least at the offer stage.
    if (contract.deal && ["lead", "contacted", "appointment"].includes(contract.deal.stage)) {
      await prisma.deal.update({
        where: { id: contract.dealId },
        data: { stage: "offer", status: "active" },
      });
    }
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contract.id}`);
  if (contract.dealId) revalidatePath(`/pipeline/${contract.dealId}`);
  redirect(`/contracts/${contract.id}?sent=${encodeURIComponent(to)}`);
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
