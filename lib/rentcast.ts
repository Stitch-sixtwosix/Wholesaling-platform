// Server-side RentCast client (https://rentcast.io).
//
// RentCast is a licensed property-data API with a free tier (~50 requests/mo).
// We use its sale-listings endpoint to pull active on-market listings (with
// days-on-market) into the Deal Finder. Key is configured per organization in
// Settings → Integrations. All calls are server-only.

const RENTCAST_BASE = "https://api.rentcast.io/v1";

export class RentcastError extends Error {}

export function rentcastConfigured(apiKey?: string | null): boolean {
  return Boolean(apiKey && apiKey.trim());
}

export interface RentcastListing {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  daysOnMarket: number;
  listedDate: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  propertyType: string;
  url: string | null;
}

function mapPropertyType(raw: unknown): string {
  const t = String(raw ?? "").toLowerCase();
  if (t.includes("condo")) return "condo";
  if (t.includes("town")) return "townhouse";
  if (t.includes("multi") || t.includes("apartment")) return "multi_family";
  if (t.includes("land") || t.includes("lot")) return "land";
  if (t.includes("manufactured") || t.includes("mobile")) return "mobile";
  return "single_family";
}

function normalize(l: any): RentcastListing {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    address: l.formattedAddress ?? l.addressLine1 ?? "",
    city: l.city ?? "",
    state: l.state ?? "",
    zip: l.zipCode ?? "",
    price: num(l.price) ?? 0,
    daysOnMarket: num(l.daysOnMarket) ?? 0,
    listedDate: l.listedDate ?? null,
    beds: num(l.bedrooms),
    baths: num(l.bathrooms),
    sqft: num(l.squareFootage),
    propertyType: mapPropertyType(l.propertyType),
    url: l.listingUrl ?? null,
  };
}

export async function fetchSaleListings(
  apiKey: string,
  params: { city?: string; state?: string; zipCode?: string; limit?: number }
): Promise<RentcastListing[]> {
  const qs = new URLSearchParams();
  if (params.zipCode) qs.set("zipCode", params.zipCode);
  if (params.city) qs.set("city", params.city);
  if (params.state) qs.set("state", params.state);
  qs.set("status", "Active");
  qs.set("limit", String(Math.min(params.limit ?? 50, 100)));

  const res = await fetch(`${RENTCAST_BASE}/listings/sale?${qs.toString()}`, {
    headers: { "X-Api-Key": apiKey.trim(), Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.message || j?.error || JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401 || res.status === 403) {
      throw new RentcastError("RentCast rejected the API key. Check it in Settings → Integrations.");
    }
    if (res.status === 429) {
      throw new RentcastError(
        "RentCast rate/quota limit reached (the free tier allows ~50 requests/month)."
      );
    }
    throw new RentcastError(`RentCast request failed (${res.status}). ${detail}`.trim());
  }

  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  return rows.map(normalize).filter((l) => l.address && l.price > 0);
}
