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
function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true";
}

export async function createBuyer(formData: FormData) {
  const firstName = str(formData.get("firstName"));
  if (!firstName) throw new Error("First name is required");

  const propertyTypes = formData.getAll("propertyTypes").map((v) => (v as string).trim()).filter(Boolean).join(", ");

  const buyer = await prisma.buyer.create({
    data: {
      firstName,
      lastName: str(formData.get("lastName")),
      company: str(formData.get("company")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      buyerType: str(formData.get("buyerType")) ?? "flipper",
      status: str(formData.get("status")) ?? "active",
      proofOfFunds: bool(formData.get("proofOfFunds")),
      cashBuyer: bool(formData.get("cashBuyer")),
      markets: str(formData.get("markets")),
      propertyTypes: propertyTypes || undefined,
      minPrice: num(formData.get("minPrice")),
      maxPrice: num(formData.get("maxPrice")),
      minBeds: num(formData.get("minBeds")),
      maxRehab: num(formData.get("maxRehab")),
      notes: str(formData.get("notes")),
    },
  });

  await prisma.activity.create({
    data: { type: "system", body: "Buyer created.", buyerId: buyer.id },
  });

  revalidatePath("/buyers");
  redirect(`/buyers/${buyer.id}`);
}

export async function updateBuyer(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) throw new Error("Buyer id is required");
  const firstName = str(formData.get("firstName"));
  if (!firstName) throw new Error("First name is required");

  const propertyTypes = formData.getAll("propertyTypes").map((v) => (v as string).trim()).filter(Boolean).join(", ");

  await prisma.buyer.update({
    where: { id },
    data: {
      firstName,
      lastName: str(formData.get("lastName")) ?? null,
      company: str(formData.get("company")) ?? null,
      email: str(formData.get("email")) ?? null,
      phone: str(formData.get("phone")) ?? null,
      buyerType: str(formData.get("buyerType")) ?? "flipper",
      status: str(formData.get("status")) ?? "active",
      proofOfFunds: bool(formData.get("proofOfFunds")),
      cashBuyer: bool(formData.get("cashBuyer")),
      markets: str(formData.get("markets")) ?? null,
      propertyTypes: propertyTypes || null,
      minPrice: num(formData.get("minPrice")) ?? null,
      maxPrice: num(formData.get("maxPrice")) ?? null,
      minBeds: num(formData.get("minBeds")) ?? null,
      maxRehab: num(formData.get("maxRehab")) ?? null,
      notes: str(formData.get("notes")) ?? null,
    },
  });

  revalidatePath(`/buyers/${id}`);
  revalidatePath("/buyers");
}

export async function updateBuyerStatus(buyerId: string, status: string) {
  await prisma.buyer.update({ where: { id: buyerId }, data: { status } });
  await prisma.activity.create({
    data: { type: "status_change", body: `Status changed to ${status.replace(/_/g, " ")}.`, buyerId },
  });
  revalidatePath(`/buyers/${buyerId}`);
  revalidatePath("/buyers");
}

export async function addBuyerActivity(formData: FormData) {
  const buyerId = str(formData.get("buyerId"));
  const body = str(formData.get("body"));
  const type = str(formData.get("type")) ?? "note";
  if (!buyerId || !body) return;
  await prisma.activity.create({ data: { buyerId, body, type } });
  revalidatePath(`/buyers/${buyerId}`);
}

export async function deleteBuyer(buyerId: string) {
  await prisma.buyer.delete({ where: { id: buyerId } });
  revalidatePath("/buyers");
  redirect("/buyers");
}
