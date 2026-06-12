"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { suggestContractPrice } from "@/lib/analyzer";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const n = Number(s.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export async function createListing(formData: FormData) {
  const { orgId } = await requireUser();
  const address = str(formData.get("address"));
  const listPrice = num(formData.get("listPrice"));
  if (!address || listPrice === undefined) throw new Error("Address and list price are required");

  // Accept either a list date or days-on-market (converted to a date).
  let listDate: Date | undefined;
  const rawDate = str(formData.get("listDate"));
  const domInput = num(formData.get("dom"));
  if (rawDate) {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) listDate = d;
  } else if (domInput !== undefined) {
    listDate = new Date(Date.now() - domInput * 86_400_000);
  }
  if (!listDate) throw new Error("Provide a list date or days on market");

  await prisma.listing.create({
    data: {
      orgId,
      address,
      city: str(formData.get("city")) ?? "",
      state: str(formData.get("state")) ?? "",
      zip: str(formData.get("zip")) ?? "",
      source: str(formData.get("source")) ?? "manual",
      url: str(formData.get("url")),
      listPrice,
      listDate,
      beds: num(formData.get("beds")),
      baths: num(formData.get("baths")),
      sqft: num(formData.get("sqft")),
      propertyType: str(formData.get("propertyType")) ?? "single_family",
      arv: num(formData.get("arv")),
      repairEstimate: num(formData.get("repairEstimate")),
      notes: str(formData.get("notes")),
    },
  });

  revalidatePath("/deal-finder");
}

// --- CSV import -------------------------------------------------------------
// Understands Redfin's "Download All" export natively, plus any CSV with
// recognizable columns (address, price, days on market / list date, ...).

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

function findCol(headers: string[], ...candidates: string[]): number {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const cand of candidates) {
    const idx = norm.findIndex((h) => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function importListingsCsv(formData: FormData) {
  const { orgId } = await requireUser();
  const csv = ((formData.get("csv") as string) || "").trim();
  if (!csv) throw new Error("Paste CSV data to import");

  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one listing");

  const headers = rows[0];
  const col = {
    address: findCol(headers, "address"),
    city: findCol(headers, "city"),
    state: findCol(headers, "stateorprovince", "state"),
    zip: findCol(headers, "zipcode", "zippostalcode", "zip", "postal"),
    price: findCol(headers, "price"),
    dom: findCol(headers, "daysonmarket", "dom"),
    listDate: findCol(headers, "listdate", "datelisted", "listingdate"),
    beds: findCol(headers, "beds", "bedrooms"),
    baths: findCol(headers, "baths", "bathrooms"),
    sqft: findCol(headers, "squarefeet", "sqft", "livingarea"),
    type: findCol(headers, "propertytype", "type"),
    url: findCol(headers, "urlseehttp", "url", "link"),
  };
  if (col.address === -1 || col.price === -1) {
    throw new Error("CSV must include at least an address column and a price column");
  }

  const cell = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : "");
  const numCell = (r: string[], i: number) => {
    const n = Number(cell(r, i).replace(/[$,]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  let imported = 0;
  for (const r of rows.slice(1)) {
    const address = cell(r, col.address);
    const listPrice = numCell(r, col.price);
    if (!address || !listPrice) continue;

    // Days on market (Redfin) or an explicit list date; default to fresh.
    let listDate = new Date();
    const dom = numCell(r, col.dom);
    const rawDate = cell(r, col.listDate);
    if (dom !== undefined) {
      listDate = new Date(Date.now() - dom * 86_400_000);
    } else if (rawDate) {
      const d = new Date(rawDate);
      if (!Number.isNaN(d.getTime())) listDate = d;
    }

    // Skip duplicates (same address already tracked in this org).
    const dupe = await prisma.listing.findFirst({ where: { orgId, address } });
    if (dupe) continue;

    const rawType = cell(r, col.type).toLowerCase();
    const propertyType = rawType.includes("condo")
      ? "condo"
      : rawType.includes("town")
      ? "townhouse"
      : rawType.includes("multi")
      ? "multi_family"
      : rawType.includes("land") || rawType.includes("lot")
      ? "land"
      : rawType.includes("mobile")
      ? "mobile"
      : "single_family";

    await prisma.listing.create({
      data: {
        orgId,
        address,
        city: cell(r, col.city),
        state: cell(r, col.state),
        zip: cell(r, col.zip),
        source: "csv",
        url: cell(r, col.url) || undefined,
        listPrice,
        listDate,
        beds: numCell(r, col.beds),
        baths: numCell(r, col.baths),
        sqft: numCell(r, col.sqft),
        propertyType,
      },
    });
    imported++;
  }

  revalidatePath("/deal-finder");
  redirect(`/deal-finder?imported=${imported}`);
}

// Pull active on-market listings from RentCast (free tier) by city/state or zip
// and import any new ones into the Deal Finder.
export async function pullFromRentcast(formData: FormData) {
  const { orgId } = await requireUser();
  const city = str(formData.get("city"));
  const state = str(formData.get("state"));
  const zipCode = str(formData.get("zip"));

  if (!zipCode && !(city && state)) {
    redirect(`/deal-finder?pullError=${encodeURIComponent("Enter a zip code, or both a city and state.")}`);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { rentcastApiKey: true },
  });
  if (!org?.rentcastApiKey) {
    redirect(`/deal-finder?pullError=${encodeURIComponent("Connect a RentCast API key in Settings → Integrations first.")}`);
  }

  const { fetchSaleListings, RentcastError } = await import("@/lib/rentcast");
  let listings;
  try {
    listings = await fetchSaleListings(org!.rentcastApiKey!, { city, state, zipCode, limit: 50 });
  } catch (e) {
    const msg = e instanceof RentcastError ? e.message : "RentCast request failed.";
    redirect(`/deal-finder?pullError=${encodeURIComponent(msg)}`);
  }

  let imported = 0;
  for (const l of listings!) {
    const dupe = await prisma.listing.findFirst({ where: { orgId, address: l.address } });
    if (dupe) continue;
    const listDate =
      l.listedDate && !Number.isNaN(new Date(l.listedDate).getTime())
        ? new Date(l.listedDate)
        : new Date(Date.now() - l.daysOnMarket * 86_400_000);
    await prisma.listing.create({
      data: {
        orgId,
        address: l.address,
        city: l.city,
        state: l.state,
        zip: l.zip,
        source: "rentcast",
        url: l.url ?? undefined,
        listPrice: l.price,
        listDate,
        beds: l.beds ?? undefined,
        baths: l.baths ?? undefined,
        sqft: l.sqft ?? undefined,
        propertyType: l.propertyType,
      },
    });
    imported++;
  }

  revalidatePath("/deal-finder");
  redirect(`/deal-finder?imported=${imported}`);
}

// Convert a stale listing into a Property + Lead + Deal pre-filled with the
// suggested contract price, ready to work in the pipeline.
export async function convertListing(listingId: string) {
  const { orgId, uid } = await requireUser();
  const listing = await prisma.listing.findFirst({ where: { id: listingId, orgId } });
  if (!listing) throw new Error("Listing not found");
  if (listing.status === "converted" && listing.leadId) redirect(`/leads/${listing.leadId}`);

  const offer = suggestContractPrice(listing);

  const property = await prisma.property.create({
    data: {
      orgId,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      propertyType: listing.propertyType,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      arv: listing.arv,
      repairEstimate: listing.repairEstimate,
      estimatedValue: listing.listPrice,
      notes: `From Deal Finder. ${offer.dom} days on market at import.${listing.url ? ` Listing: ${listing.url}` : ""}`,
    },
  });

  const lead = await prisma.lead.create({
    data: {
      orgId,
      firstName: "Owner of",
      lastName: listing.address,
      status: "new",
      source: "list",
      motivation: "other",
      temperature: offer.isStale ? "warm" : "cold",
      askingPrice: listing.listPrice,
      notes: `Stale on-market listing (${offer.dom} DOM). Suggested opening offer: $${offer.suggested.toLocaleString()}.`,
      propertyId: property.id,
      ownerId: uid,
    },
  });

  const deal = await prisma.deal.create({
    data: {
      orgId,
      title: `${listing.address} — ${listing.city || "Deal Finder"}`,
      stage: "lead",
      leadId: lead.id,
      propertyId: property.id,
      arv: listing.arv,
      repairEstimate: listing.repairEstimate,
      contractPrice: offer.suggested,
      ownerId: uid,
    },
  });

  await prisma.activity.create({
    data: {
      type: "system",
      body: `Created from Deal Finder — ${offer.dom} days on market, suggested offer $${offer.suggested.toLocaleString()} (${
        offer.basis === "mao" ? "70% rule MAO" : `list price − ${offer.discountPct}% staleness discount`
      }).`,
      leadId: lead.id,
      dealId: deal.id,
    },
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: "converted", leadId: lead.id },
  });

  revalidatePath("/deal-finder");
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  redirect(`/pipeline/${deal.id}`);
}

export async function dismissListing(listingId: string) {
  const { orgId } = await requireUser();
  await prisma.listing.updateMany({ where: { id: listingId, orgId }, data: { status: "dismissed" } });
  revalidatePath("/deal-finder");
}

export async function restoreListing(listingId: string) {
  const { orgId } = await requireUser();
  await prisma.listing.updateMany({ where: { id: listingId, orgId }, data: { status: "watching" } });
  revalidatePath("/deal-finder");
}

export async function deleteListing(listingId: string) {
  const { orgId } = await requireUser();
  await prisma.listing.deleteMany({ where: { id: listingId, orgId } });
  revalidatePath("/deal-finder");
}
