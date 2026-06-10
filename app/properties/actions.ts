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

export async function createProperty(formData: FormData) {
  const { orgId } = await requireUser();
  const address = str(formData.get("address"));
  if (!address) throw new Error("Address is required");

  const property = await prisma.property.create({
    data: {
      orgId,
      address,
      city: str(formData.get("city")) ?? "",
      state: str(formData.get("state")) ?? "",
      zip: str(formData.get("zip")) ?? "",
      county: str(formData.get("county")),
      propertyType: str(formData.get("propertyType")) ?? "single_family",
      beds: num(formData.get("beds")),
      baths: num(formData.get("baths")),
      sqft: num(formData.get("sqft")),
      lotSizeSqft: num(formData.get("lotSizeSqft")),
      yearBuilt: num(formData.get("yearBuilt")),
      condition: str(formData.get("condition")) ?? "unknown",
      occupancy: str(formData.get("occupancy")) ?? "unknown",
      arv: num(formData.get("arv")),
      repairEstimate: num(formData.get("repairEstimate")),
      estimatedValue: num(formData.get("estimatedValue")),
      taxAssessed: num(formData.get("taxAssessed")),
      annualTaxes: num(formData.get("annualTaxes")),
      notes: str(formData.get("notes")),
    },
  });

  revalidatePath("/properties");
  redirect(`/properties/${property.id}`);
}

export async function updateProperty(formData: FormData) {
  const { orgId } = await requireUser();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Property id is required");
  const address = str(formData.get("address"));
  if (!address) throw new Error("Address is required");

  await prisma.property.updateMany({
    where: { id, orgId },
    data: {
      address,
      city: str(formData.get("city")) ?? "",
      state: str(formData.get("state")) ?? "",
      zip: str(formData.get("zip")) ?? "",
      county: str(formData.get("county")) ?? null,
      propertyType: str(formData.get("propertyType")) ?? "single_family",
      beds: num(formData.get("beds")) ?? null,
      baths: num(formData.get("baths")) ?? null,
      sqft: num(formData.get("sqft")) ?? null,
      lotSizeSqft: num(formData.get("lotSizeSqft")) ?? null,
      yearBuilt: num(formData.get("yearBuilt")) ?? null,
      condition: str(formData.get("condition")) ?? "unknown",
      occupancy: str(formData.get("occupancy")) ?? "unknown",
      arv: num(formData.get("arv")) ?? null,
      repairEstimate: num(formData.get("repairEstimate")) ?? null,
      estimatedValue: num(formData.get("estimatedValue")) ?? null,
      taxAssessed: num(formData.get("taxAssessed")) ?? null,
      annualTaxes: num(formData.get("annualTaxes")) ?? null,
      notes: str(formData.get("notes")) ?? null,
    },
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
}

export async function addComp(formData: FormData) {
  const { orgId } = await requireUser();
  const propertyId = str(formData.get("propertyId"));
  const address = str(formData.get("address"));
  const salePrice = num(formData.get("salePrice"));
  if (!propertyId || !address || salePrice === undefined) {
    throw new Error("Property, address, and sale price are required");
  }

  // Comps have no orgId — guard via the parent property's org.
  const property = await prisma.property.findFirst({ where: { id: propertyId, orgId } });
  if (!property) throw new Error("Property not found");

  const saleDateRaw = str(formData.get("saleDate"));

  await prisma.comp.create({
    data: {
      propertyId,
      address,
      salePrice,
      saleDate: saleDateRaw ? new Date(saleDateRaw) : null,
      beds: num(formData.get("beds")) ?? null,
      baths: num(formData.get("baths")) ?? null,
      sqft: num(formData.get("sqft")) ?? null,
      distanceMi: num(formData.get("distanceMi")) ?? null,
      notes: str(formData.get("notes")) ?? null,
    },
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function deleteComp(compId: string, propertyId: string) {
  const { orgId } = await requireUser();
  // Only allow deleting comps belonging to a property in this org.
  const property = await prisma.property.findFirst({ where: { id: propertyId, orgId } });
  if (!property) throw new Error("Property not found");
  await prisma.comp.deleteMany({ where: { id: compId, propertyId } });
  revalidatePath(`/properties/${propertyId}`);
}
