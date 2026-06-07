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
function dateVal(v: FormDataEntryValue | null): Date | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createCampaign(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Campaign name is required");

  const campaign = await prisma.campaign.create({
    data: {
      name,
      channel: str(formData.get("channel")) ?? "sms",
      status: str(formData.get("status")) ?? "draft",
      audience: str(formData.get("audience")),
      sent: num(formData.get("sent")) ?? 0,
      delivered: num(formData.get("delivered")) ?? 0,
      responses: num(formData.get("responses")) ?? 0,
      leads: num(formData.get("leads")) ?? 0,
      cost: num(formData.get("cost")) ?? 0,
      templateId: str(formData.get("templateId")),
      startDate: dateVal(formData.get("startDate")),
      endDate: dateVal(formData.get("endDate")),
    },
  });

  revalidatePath("/marketing");
  redirect(`/marketing/${campaign.id}`);
}

export async function updateCampaign(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) throw new Error("Campaign id is required");
  const name = str(formData.get("name"));
  if (!name) throw new Error("Campaign name is required");

  await prisma.campaign.update({
    where: { id },
    data: {
      name,
      channel: str(formData.get("channel")) ?? "sms",
      status: str(formData.get("status")) ?? "draft",
      audience: str(formData.get("audience")) ?? null,
      sent: num(formData.get("sent")) ?? 0,
      delivered: num(formData.get("delivered")) ?? 0,
      responses: num(formData.get("responses")) ?? 0,
      leads: num(formData.get("leads")) ?? 0,
      cost: num(formData.get("cost")) ?? 0,
      templateId: str(formData.get("templateId")) ?? null,
      startDate: dateVal(formData.get("startDate")) ?? null,
      endDate: dateVal(formData.get("endDate")) ?? null,
    },
  });

  revalidatePath("/marketing");
  revalidatePath(`/marketing/${id}`);
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  await prisma.campaign.update({ where: { id: campaignId }, data: { status } });
  revalidatePath("/marketing");
  revalidatePath(`/marketing/${campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  await prisma.campaign.delete({ where: { id: campaignId } });
  revalidatePath("/marketing");
  redirect("/marketing");
}

export async function createTemplate(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Template name is required");

  await prisma.template.create({
    data: {
      name,
      channel: str(formData.get("channel")) ?? "sms",
      subject: str(formData.get("subject")),
      body: str(formData.get("body")) ?? "",
    },
  });

  revalidatePath("/marketing/templates");
  redirect("/marketing/templates");
}

export async function updateTemplate(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) throw new Error("Template id is required");
  const name = str(formData.get("name"));
  if (!name) throw new Error("Template name is required");

  await prisma.template.update({
    where: { id },
    data: {
      name,
      channel: str(formData.get("channel")) ?? "sms",
      subject: str(formData.get("subject")) ?? null,
      body: str(formData.get("body")) ?? "",
    },
  });

  revalidatePath("/marketing/templates");
}

export async function deleteTemplate(templateId: string) {
  await prisma.template.delete({ where: { id: templateId } });
  revalidatePath("/marketing/templates");
}
