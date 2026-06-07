"use server";

import { redirect } from "next/navigation";
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

export async function logout() {
  destroySession();
  redirect("/login");
}
