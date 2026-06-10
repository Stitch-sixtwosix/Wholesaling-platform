"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { authenticate } from "@/lib/auth";

// Accept an invitation: create the user inside the inviting organization with
// the invited role, then sign them in.
export async function acceptInvite(formData: FormData) {
  const token = ((formData.get("token") as string) || "").trim();
  const name = ((formData.get("name") as string) || "").trim();
  const password = (formData.get("password") as string) || "";

  if (!token) redirect(`/login`);

  if (!name || password.length < 6) {
    redirect(`/invite/${token}?error=invalid`);
  }

  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite || invite.accepted) {
    redirect(`/invite/${token}?error=used`);
  }

  // If the email was claimed since the invite was sent, send them to login.
  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    redirect(`/login?next=/`);
  }

  await prisma.user.create({
    data: {
      orgId: invite.orgId,
      name,
      email: invite.email,
      role: invite.role,
      passwordHash: hashPassword(password),
      active: true,
    },
  });

  await prisma.invitation.update({ where: { token }, data: { accepted: true } });

  const session = await authenticate(invite.email, password);
  if (!session) redirect(`/login`);
  redirect("/");
}
