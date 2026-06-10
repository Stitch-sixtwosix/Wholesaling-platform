"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enrichProspect, ApolloError } from "@/lib/apollo";
import { requireUser, getOrgApolloKey } from "@/lib/auth";

// Import an Apollo prospect into the buyers list as a new cash-buyer lead.
export async function importProspect(formData: FormData) {
  const { orgId } = await requireUser();
  const firstName = (formData.get("firstName") as string)?.trim() || "Unknown";
  const lastName = (formData.get("lastName") as string)?.trim() || null;
  const company = (formData.get("company") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
  const companyDomain = (formData.get("companyDomain") as string)?.trim() || null;

  const noteParts = ["Imported from Apollo.io."];
  if (title) noteParts.push(`Title: ${title}`);
  if (companyDomain) noteParts.push(`Domain: ${companyDomain}`);
  if (linkedinUrl) noteParts.push(linkedinUrl);

  const buyer = await prisma.buyer.create({
    data: {
      orgId,
      firstName,
      lastName,
      company,
      buyerType: "flipper",
      status: "active",
      cashBuyer: true,
      proofOfFunds: false,
      markets: location,
      notes: noteParts.join("\n"),
    },
  });

  await prisma.activity.create({
    data: { type: "system", body: "Buyer imported from Apollo.io discovery.", buyerId: buyer.id },
  });

  revalidatePath("/buyers");
  redirect(`/buyers/${buyer.id}`);
}

// Enrich an existing buyer with Apollo (reveals verified email + phone).
// NOTE: this consumes 1 Apollo credit per matched person (the app user's credits).
export async function enrichBuyer(buyerId: string) {
  const { orgId } = await requireUser();
  const apolloKey = await getOrgApolloKey(orgId);
  const buyer = await prisma.buyer.findFirst({ where: { id: buyerId, orgId } });
  if (!buyer) throw new Error("Buyer not found");

  // Derive a domain hint from notes if present (Domain: ...).
  const domainMatch = buyer.notes?.match(/Domain:\s*(\S+)/i);
  const linkedinMatch = buyer.notes?.match(/(https?:\/\/[^\s]*linkedin[^\s]*)/i);

  try {
    const result = await enrichProspect(apolloKey, {
      firstName: buyer.firstName,
      lastName: buyer.lastName ?? undefined,
      name: buyer.lastName ? undefined : buyer.firstName,
      organizationName: buyer.company ?? undefined,
      domain: domainMatch?.[1],
      linkedinUrl: linkedinMatch?.[1],
    });

    if (!result || (!result.email && !result.phone)) {
      await prisma.activity.create({
        data: { type: "system", body: "Apollo enrichment ran — no new contact info found.", buyerId },
      });
      revalidatePath(`/buyers/${buyerId}`);
      return { ok: false, message: "No match found in Apollo." };
    }

    await prisma.buyer.update({
      where: { id: buyerId },
      data: {
        email: buyer.email ?? result.email ?? undefined,
        phone: buyer.phone ?? result.phone ?? undefined,
        company: buyer.company ?? result.company ?? undefined,
      },
    });

    const found = [result.email && "email", result.phone && "phone"].filter(Boolean).join(" + ");
    await prisma.activity.create({
      data: { type: "system", body: `Apollo enrichment added ${found || "contact data"}.`, buyerId },
    });

    revalidatePath(`/buyers/${buyerId}`);
    return { ok: true, message: `Enriched: ${found}` };
  } catch (e) {
    const message = e instanceof ApolloError ? e.message : "Apollo enrichment failed.";
    return { ok: false, message };
  }
}
