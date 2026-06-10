"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { authenticate, destroySession } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const next = ((formData.get("next") as string) || "/").trim();

  const session = await authenticate(email, password);
  if (!session) {
    redirect(`/login?error=1${next && next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  // Only allow internal redirect targets.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

// Registration creates a brand-new ORGANIZATION and makes the registrant its
// admin/owner. Their data is fully isolated from every other organization.
export async function register(formData: FormData) {
  const orgName = ((formData.get("orgName") as string) || "").trim();
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").toLowerCase().trim();
  const password = (formData.get("password") as string) || "";

  // Basic validation
  if (
    !orgName ||
    !name ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    password.length < 6
  ) {
    redirect(`/login?mode=register&rerror=invalid`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/login?mode=register&rerror=exists`);
  }

  const org = await prisma.organization.create({ data: { name: orgName } });
  await prisma.user.create({
    data: {
      orgId: org.id,
      name,
      email,
      role: "admin", // org owner
      passwordHash: hashPassword(password),
      active: true,
    },
  });

  // Sign the new owner in immediately.
  const session = await authenticate(email, password);
  if (!session) redirect(`/login?error=1`);

  redirect("/");
}

export async function logout() {
  destroySession();
  redirect("/login");
}
