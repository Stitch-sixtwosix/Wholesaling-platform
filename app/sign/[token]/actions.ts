"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Public action: a seller signs a contract via their unguessable link. No auth.
// Records the typed signature + audit trail, marks the contract signed, and
// auto-advances the deal to Under Contract so it lands in the dispo portfolio.
export async function signContract(formData: FormData) {
  const token = ((formData.get("token") as string) || "").trim();
  const signerName = ((formData.get("signerName") as string) || "").trim();
  const consent = formData.get("consent");

  if (!token) throw new Error("Missing signing token");
  if (!signerName || signerName.length < 2) throw new Error("Please type your full legal name to sign.");
  if (!consent) throw new Error("You must agree to sign electronically.");

  const contract = await prisma.contract.findUnique({
    where: { signToken: token },
    include: { deal: true },
  });
  if (!contract) throw new Error("This signing link is invalid.");
  if (contract.status === "signed" || contract.status === "executed") {
    redirect(`/sign/${token}?state=already`);
  }

  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") || "unknown";

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "signed",
      signedDate: new Date(),
      signerName,
      signerIp: ip,
      signerUserAgent: ua,
    },
  });

  // Auto-populate downstream: move the deal to Under Contract and log it.
  if (contract.dealId) {
    if (contract.deal && contract.deal.stage !== "closed" && contract.deal.stage !== "dead") {
      await prisma.deal.update({
        where: { id: contract.dealId },
        data: { stage: "under_contract", status: "active" },
      });
    }
    await prisma.activity.create({
      data: {
        type: "system",
        body: `Contract "${contract.title}" e-signed by ${signerName}. Deal moved to Under Contract — ready for dispositions.`,
        dealId: contract.dealId,
      },
    });
    revalidatePath(`/pipeline/${contract.dealId}`);
  }

  revalidatePath("/dispositions");
  revalidatePath(`/contracts/${contract.id}`);
  redirect(`/sign/${token}?state=signed`);
}
