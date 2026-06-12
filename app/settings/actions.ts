"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ApolloError, enrichProspect } from "@/lib/apollo";

// In demo mode (ephemeral /tmp SQLite) a registered org may not exist on the
// instance handling this request, so updateMany returns count 0 rather than
// throwing a 500. Surface a clear message instead.
const NEEDS_DB =
  "Couldn't save — your organization isn't in this server's temporary storage. " +
  "Connect a persistent database (Settings → see the deploy guide) so organizations and settings save permanently.";

export async function updateOrgName(formData: FormData) {
  const { orgId } = await requireAdmin();
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) throw new Error("Organization name is required.");
  const res = await prisma.organization.updateMany({ where: { id: orgId }, data: { name } });
  if (res.count === 0) throw new Error(NEEDS_DB);
  revalidatePath("/settings");
}

export async function saveApolloKey(formData: FormData) {
  const { orgId } = await requireAdmin();
  const apiKey = ((formData.get("apiKey") as string) || "").trim();
  if (!apiKey) throw new Error("An Apollo API key is required.");
  const res = await prisma.organization.updateMany({
    where: { id: orgId },
    data: { apolloApiKey: apiKey },
  });
  if (res.count === 0) throw new Error(NEEDS_DB);
  revalidatePath("/settings");
  revalidatePath("/buyers/discover");
}

export async function saveEmailSettings(formData: FormData) {
  const { orgId } = await requireAdmin();
  const apiKey = ((formData.get("resendApiKey") as string) || "").trim();
  const fromEmail = ((formData.get("fromEmail") as string) || "").trim();
  if (!apiKey || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    throw new Error("A Resend API key and a valid from-address are required.");
  }
  const res = await prisma.organization.updateMany({
    where: { id: orgId },
    data: { resendApiKey: apiKey, fromEmail },
  });
  if (res.count === 0) throw new Error(NEEDS_DB);
  revalidatePath("/settings");
  revalidatePath("/contracts");
}

export async function disconnectEmail() {
  const { orgId } = await requireAdmin();
  await prisma.organization.updateMany({
    where: { id: orgId },
    data: { resendApiKey: null, fromEmail: null },
  });
  revalidatePath("/settings");
}

export async function saveRentcastKey(formData: FormData) {
  const { orgId } = await requireAdmin();
  const apiKey = ((formData.get("rentcastApiKey") as string) || "").trim();
  if (!apiKey) throw new Error("A RentCast API key is required.");
  const res = await prisma.organization.updateMany({
    where: { id: orgId },
    data: { rentcastApiKey: apiKey },
  });
  if (res.count === 0) throw new Error(NEEDS_DB);
  revalidatePath("/settings");
  revalidatePath("/deal-finder");
}

export async function disconnectRentcast() {
  const { orgId } = await requireAdmin();
  await prisma.organization.updateMany({ where: { id: orgId }, data: { rentcastApiKey: null } });
  revalidatePath("/settings");
  revalidatePath("/deal-finder");
}

export async function disconnectApollo() {
  const { orgId } = await requireAdmin();
  await prisma.organization.updateMany({ where: { id: orgId }, data: { apolloApiKey: null } });
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
