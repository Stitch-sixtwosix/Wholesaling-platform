"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function createUser(formData: FormData) {
  await requireAdmin();
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
    data: { name, email, role, passwordHash: hashPassword(password), active: true },
  });
  revalidatePath("/team");
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const password = (formData.get("password") as string) ?? "";
  if (!userId || password.length < 6) throw new Error("Password must be at least 6 characters.");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
  revalidatePath("/team");
}

export async function setUserActive(userId: string, active: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/team");
}

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/team");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.uid === userId) throw new Error("You cannot delete your own account.");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/team");
}
