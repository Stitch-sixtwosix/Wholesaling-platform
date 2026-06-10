"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const ALLOWED_ROLES = ["admin", "acquisitions", "dispositions", "manager"];

export async function createUser(formData: FormData) {
  const { orgId } = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string)?.trim() || "acquisitions";
  const password = (formData.get("password") as string) ?? "";

  if (!name || !email || password.length < 6) {
    throw new Error("Name, email, and a password of at least 6 characters are required.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists.");

  await prisma.user.create({
    data: { orgId, name, email, role, passwordHash: hashPassword(password), active: true },
  });
  revalidatePath("/team");
}

// Create a shareable invitation. The admin sends the returned link to the
// teammate, who sets their own password to join THIS organization.
export async function createInvitation(formData: FormData) {
  const admin = await requireAdmin();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string)?.trim() || "acquisitions";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("A valid email is required to send an invite.");
  }
  if (!ALLOWED_ROLES.includes(role)) throw new Error("Invalid role.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("That email already belongs to a user.");

  // Replace any prior pending invite for this email in this org.
  await prisma.invitation.deleteMany({ where: { orgId: admin.orgId, email, accepted: false } });
  await prisma.invitation.create({
    data: { orgId: admin.orgId, email, role, invitedBy: admin.name },
  });
  revalidatePath("/team");
}

export async function deleteInvitation(invitationId: string) {
  const { orgId } = await requireAdmin();
  await prisma.invitation.deleteMany({ where: { id: invitationId, orgId } });
  revalidatePath("/team");
}

export async function resetPassword(formData: FormData) {
  const { orgId } = await requireAdmin();
  const userId = formData.get("userId") as string;
  const password = (formData.get("password") as string) ?? "";
  if (!userId || password.length < 6) throw new Error("Password must be at least 6 characters.");
  await prisma.user.updateMany({
    where: { id: userId, orgId },
    data: { passwordHash: hashPassword(password) },
  });
  revalidatePath("/team");
}

export async function setUserActive(userId: string, active: boolean) {
  const { orgId } = await requireAdmin();
  await prisma.user.updateMany({ where: { id: userId, orgId }, data: { active } });
  revalidatePath("/team");
}

export async function setUserRole(formData: FormData) {
  const { orgId } = await requireAdmin();
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  await prisma.user.updateMany({ where: { id: userId, orgId }, data: { role } });
  revalidatePath("/team");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.uid === userId) throw new Error("You cannot delete your own account.");
  await prisma.user.deleteMany({ where: { id: userId, orgId: admin.orgId } });
  revalidatePath("/team");
}
