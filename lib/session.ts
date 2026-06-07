// Edge-safe session token signing/verification using Web Crypto (HMAC-SHA256).
// Used by both the Node server (server actions / layout) and the Edge middleware,
// so it must NOT import node:crypto or next/headers.

export interface SessionData {
  uid: string;
  role: string;
  name: string;
  email: string;
  exp: number; // epoch ms
}

export const SESSION_COOKIE = "wos_session";

const encoder = new TextEncoder();

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me-in-production";
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(encoder.encode(str));
}

function stringFromB64url(str: string): string {
  return new TextDecoder().decode(bytesFromB64url(str));
}

// crypto.subtle wants BufferSource; the DOM lib's generic Uint8Array typing
// trips strict mode even though these are valid byte views at runtime.
const buf = (b: Uint8Array): BufferSource => b as unknown as BufferSource;

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    buf(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(data: SessionData, secret: string): Promise<string> {
  const payload = b64urlFromString(JSON.stringify(data));
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, buf(encoder.encode(payload)));
  return `${payload}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionData | null> {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await importKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      buf(bytesFromB64url(sig)),
      buf(encoder.encode(payload))
    );
    if (!valid) return null;
    const data = JSON.parse(stringFromB64url(payload)) as SessionData;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// --- Role-based access control --------------------------------------------

export type Role = "admin" | "acquisitions" | "dispositions" | "manager";

// Top-level route prefixes each role may access. Admin & manager see everything.
const ROLE_ROUTES: Record<string, string[]> = {
  acquisitions: ["/", "/leads", "/pipeline", "/properties", "/analyzer", "/tasks", "/contracts"],
  dispositions: ["/", "/buyers", "/dispositions", "/marketing", "/contracts", "/tasks", "/pipeline"],
};

export function canAccess(role: string, pathname: string): boolean {
  if (role === "admin" || role === "manager") return true;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  return allowed.some(
    (prefix) => pathname === prefix || (prefix !== "/" && pathname.startsWith(prefix + "/")) || (prefix !== "/" && pathname.startsWith(prefix))
  );
}
