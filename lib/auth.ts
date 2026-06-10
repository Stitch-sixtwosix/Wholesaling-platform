// Node-only auth helpers (cookies + DB). Server components / actions only.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword } from "./password";
import { signSession, verifySession, sessionSecret, SESSION_COOKIE, type SessionData } from "./session";

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function authenticate(email: string, password: string): Promise<SessionData | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  const data: SessionData = {
    uid: user.id,
    orgId: user.orgId,
    role: user.role,
    name: user.name,
    email: user.email,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const token = await signSession(data, sessionSecret());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return data;
}

export async function getSession(): Promise<SessionData | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token, sessionSecret());
}

export async function requireUser(): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/");
  return session;
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

// Per-organization Apollo.io API key (set in Settings → Integrations).
export async function getOrgApolloKey(orgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { apolloApiKey: true },
  });
  return org?.apolloApiKey ?? null;
}
