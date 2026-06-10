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

export async function createLead(formData: FormData) {
  const { orgId } = await requireUser();
  const firstName = str(formData.get("firstName"));
  if (!firstName) throw new Error("First name is required");

  // Optionally create an attached property in one step.
  let propertyId: string | undefined;
  const address = str(formData.get("address"));
  if (address) {
    const property = await prisma.property.create({
      data: {
        orgId,
        address,
        city: str(formData.get("city")) ?? "",
        state: str(formData.get("state")) ?? "",
        zip: str(formData.get("zip")) ?? "",
        propertyType: str(formData.get("propertyType")) ?? "single_family",
        beds: num(formData.get("beds")),
        baths: num(formData.get("baths")),
        sqft: num(formData.get("sqft")),
        condition: str(formData.get("condition")) ?? "unknown",
        occupancy: str(formData.get("occupancy")) ?? "unknown",
        arv: num(formData.get("arv")),
        repairEstimate: num(formData.get("repairEstimate")),
      },
    });
    propertyId = property.id;
  }

  const lead = await prisma.lead.create({
    data: {
      orgId,
      firstName,
      lastName: str(formData.get("lastName")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      altPhone: str(formData.get("altPhone")),
      status: str(formData.get("status")) ?? "new",
      source: str(formData.get("source")) ?? "other",
      motivation: str(formData.get("motivation")),
      temperature: str(formData.get("temperature")) ?? "warm",
      askingPrice: num(formData.get("askingPrice")),
      notes: str(formData.get("notes")),
      propertyId,
      lastContact: new Date(),
    },
  });

  await prisma.activity.create({
    data: { type: "system", body: "Lead created.", leadId: lead.id },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { orgId } = await requireUser();
  const updated = await prisma.lead.updateMany({
    where: { id: leadId, orgId },
    data: { status, lastContact: new Date() },
  });
  if (updated.count === 0) throw new Error("Lead not found");
  await prisma.activity.create({
    data: { type: "status_change", body: `Status changed to ${status.replace(/_/g, " ")}.`, leadId },
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
}

export async function addLeadActivity(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = str(formData.get("leadId"));
  const body = str(formData.get("body"));
  const type = str(formData.get("type")) ?? "note";
  if (!leadId || !body) return;
  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) throw new Error("Lead not found");
  await prisma.activity.create({ data: { leadId, body, type } });
  await prisma.lead.update({ where: { id: leadId }, data: { lastContact: new Date() } });
  revalidatePath(`/leads/${leadId}`);
}

export async function convertLeadToDeal(leadId: string) {
  const { orgId } = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, orgId },
    include: { property: true },
  });
  if (!lead) throw new Error("Lead not found");

  const existing = await prisma.deal.findFirst({ where: { leadId, orgId } });
  if (existing) redirect(`/pipeline/${existing.id}`);

  const deal = await prisma.deal.create({
    data: {
      orgId,
      title: lead.property
        ? `${lead.property.address} — ${lead.property.city}`
        : `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
      stage: "lead",
      leadId: lead.id,
      propertyId: lead.propertyId,
      arv: lead.property?.arv,
      repairEstimate: lead.property?.repairEstimate,
      contractPrice: lead.askingPrice,
    },
  });
  await prisma.activity.create({
    data: { type: "system", body: "Converted to pipeline deal.", leadId, dealId: deal.id },
  });
  revalidatePath("/pipeline");
  redirect(`/pipeline/${deal.id}`);
}

export async function deleteLead(leadId: string) {
  const { orgId } = await requireUser();
  await prisma.lead.deleteMany({ where: { id: leadId, orgId } });
  revalidatePath("/leads");
  redirect("/leads");
}
