// Server-side Apollo.io REST client.
//
// Apollo is a B2B sales-intelligence platform. In a wholesaling context it is
// best used on the DISPOSITIONS side: discovering and enriching investor /
// cash-buyer prospects (fix-and-flip companies, buy-and-hold LLCs, funds).
// It is NOT a homeowner skip-tracing service.
//
// The Apollo API key is configured per organization (Settings → Integrations)
// and passed into each call. All calls are server-only.

const APOLLO_BASE = "https://api.apollo.io/api/v1";

export class ApolloError extends Error {}

export function apolloConfigured(apiKey?: string | null): boolean {
  return Boolean(apiKey && apiKey.trim());
}

async function apolloPost<T = any>(
  apiKey: string | null | undefined,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const key = apiKey?.trim();
  if (!key) {
    throw new ApolloError(
      "Apollo is not connected. Add your Apollo API key in Settings → Integrations to enable buyer discovery & enrichment."
    );
  }
  const res = await fetch(`${APOLLO_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": key,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error || j?.message || JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401 || res.status === 403) {
      throw new ApolloError("Apollo rejected the API key (401/403). Check your key in Settings → Integrations.");
    }
    if (res.status === 429) {
      throw new ApolloError("Apollo rate limit reached. Try again shortly.");
    }
    throw new ApolloError(`Apollo request failed (${res.status}). ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}

// --- Normalized shapes used by the UI -------------------------------------

export interface ApolloProspect {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string | null;
  company: string | null;
  companyDomain: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  linkedinUrl: string | null;
  emailStatus: string | null; // verified | unavailable | ...
  hasEmail: boolean;
}

export interface ApolloEnrichment {
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  companyDomain: string | null;
  city: string | null;
  state: string | null;
  linkedinUrl: string | null;
}

function joinLocation(city?: string | null, state?: string | null): string | null {
  return [city, state].filter(Boolean).join(", ") || null;
}

// --- People (investor) search ---------------------------------------------

export interface ProspectSearchParams {
  keywords?: string; // e.g. "real estate investor", "we buy houses"
  titles?: string[];
  locations?: string[]; // person locations / markets
  page?: number;
  perPage?: number;
}

export async function searchProspects(
  apiKey: string | null | undefined,
  params: ProspectSearchParams
): Promise<{ prospects: ApolloProspect[]; total: number; page: number }> {
  const body: Record<string, unknown> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 10,
  };
  if (params.keywords) body.q_keywords = params.keywords;
  if (params.titles?.length) body.person_titles = params.titles;
  if (params.locations?.length) body.person_locations = params.locations;

  const data = await apolloPost<{
    people?: any[];
    pagination?: { total_entries?: number; page?: number };
  }>(apiKey, "/mixed_people/search", body);

  const prospects = (data.people ?? []).map(normalizePerson);
  return {
    prospects,
    total: data.pagination?.total_entries ?? prospects.length,
    page: data.pagination?.page ?? (params.page ?? 1),
  };
}

function normalizePerson(p: any): ApolloProspect {
  const org = p.organization ?? {};
  return {
    id: String(p.id ?? ""),
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    name: p.name ?? [p.first_name, p.last_name].filter(Boolean).join(" "),
    title: p.title ?? null,
    company: org.name ?? p.organization_name ?? null,
    companyDomain: org.primary_domain ?? org.website_url ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    location: joinLocation(p.city, p.state),
    linkedinUrl: p.linkedin_url ?? null,
    emailStatus: p.email_status ?? null,
    hasEmail: p.email_status === "verified" || Boolean(p.email),
  };
}

// --- People enrichment (reveals email / phone) ----------------------------

export interface EnrichParams {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  domain?: string;
  linkedinUrl?: string;
  revealPersonalEmails?: boolean;
}

export async function enrichProspect(
  apiKey: string | null | undefined,
  params: EnrichParams
): Promise<ApolloEnrichment | null> {
  const body: Record<string, unknown> = {};
  if (params.id) body.id = params.id;
  if (params.name) body.name = params.name;
  if (params.firstName) body.first_name = params.firstName;
  if (params.lastName) body.last_name = params.lastName;
  if (params.organizationName) body.organization_name = params.organizationName;
  if (params.domain) body.domain = params.domain;
  if (params.linkedinUrl) body.linkedin_url = params.linkedinUrl;
  if (params.revealPersonalEmails) body.reveal_personal_emails = true;

  const data = await apolloPost<{ person?: any }>(apiKey, "/people/match", body);
  const p = data.person;
  if (!p) return null;

  const org = p.organization ?? {};
  const phone =
    p.phone_numbers?.[0]?.sanitized_number ??
    p.phone_numbers?.[0]?.raw_number ??
    org.primary_phone?.number ??
    p.sanitized_phone ??
    null;

  return {
    email: p.email ?? null,
    phone,
    title: p.title ?? null,
    company: org.name ?? null,
    companyDomain: org.primary_domain ?? org.website_url ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    linkedinUrl: p.linkedin_url ?? null,
  };
}
