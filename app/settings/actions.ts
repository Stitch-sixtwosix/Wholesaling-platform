"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ApolloError, enrichProspect } from "@/lib/apollo";

export async function updateOrgName(formData: FormData) {
  const { orgId } = await requireAdmin();
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) throw new Error("Organization name is required.");
  await prisma.organization.update({ where: { id: orgId }, data: { name } });
  revalidatePath("/settings");
}

export async function saveApolloKey(formData: FormData) {
  const { orgId } = await requireAdmin();
  const apiKey = ((formData.get("apiKey") as string) || "").trim();
  if (!apiKey) throw new Error("An Apollo API key is required.");
  await prisma.organization.update({ where: { id: orgId }, data: { apolloApiKey: apiKey } });
  revalidatePath("/settings");
  revalidatePath("/buyers/discover");
}

export async function disconnectApollo() {
  const { orgId } = await requireAdmin();
  await prisma.organization.update({ where: { id: orgId }, data: { apolloApiKey: null } });
  revalidatePath("/settings");
  revalidatePath("/buyers/discover");
}

// Verify the saved key by making a lightweight Apollo call.
export async function testApolloKey(): Promise<{ ok: boolean; message: string }> {
  const { orgId } = await requireAdmin();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { apolloApiKey: true },
  });
  if (!org?.apolloApiKey) return { ok: false, message: "No API key saved yet." };
  try {
    // A minimal enrichment call; returns null/empty rather than erroring on a valid key.
    await enrichProspect(org.apolloApiKey, { firstName: "Test", lastName: "Connection" });
    return { ok: true, message: "Apollo connection is working." };
  } catch (e) {
    const message = e instanceof ApolloError ? e.message : "Could not reach Apollo.";
    return { ok: false, message };
  }
}
