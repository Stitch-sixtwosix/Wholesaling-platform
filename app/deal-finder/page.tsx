import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, StatCard, Section, DataTable, EmptyState } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { PROPERTY_TYPES } from "@/lib/constants";
import { currency } from "@/lib/format";
import { suggestContractPrice, DOM_TIERS } from "@/lib/analyzer";
import { rentcastConfigured } from "@/lib/rentcast";
import {
  createListing,
  importListingsCsv,
  pullFromRentcast,
  convertListing,
  dismissListing,
  restoreListing,
  deleteListing,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_BADGES = [
  { value: "watching", label: "Watching", color: "bg-blue-100 text-blue-700" },
  { value: "converted", label: "Converted", color: "bg-emerald-100 text-emerald-700" },
  { value: "dismissed", label: "Dismissed", color: "bg-slate-100 text-slate-500" },
];

function domBadge(dom: number) {
  if (dom >= 180) return "bg-rose-100 text-rose-700";
  if (dom >= 120) return "bg-orange-100 text-orange-700";
  if (dom >= 90) return "bg-amber-100 text-amber-700";
  if (dom >= 60) return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

export default async function DealFinderPage({
  searchParams,
}: {
  searchParams: { show?: string; minDom?: string; imported?: string; pullError?: string };
}) {
  const { orgId } = await requireUser();
  const show = searchParams.show ?? "watching";
  const minDom = Math.max(0, Number(searchParams.minDom) || 0);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { rentcastApiKey: true },
  });
  const rentcastReady = rentcastConfigured(org?.rentcastApiKey);

  const listings = await prisma.listing.findMany({
    where: { orgId, ...(show === "all" ? {} : { status: show }) },
    orderBy: { listDate: "asc" }, // oldest on market first
  });

  const analyzed = listings
    .map((l) => ({ listing: l, offer: suggestContractPrice(l) }))
    .filter((x) => x.offer.dom >= minDom);

  const watching = await prisma.listing.count({ where: { orgId, status: "watching" } });
  const allWatching = await prisma.listing.findMany({
    where: { orgId, status: "watching" },
    select: { listDate: true },
  });
  const staleCount = allWatching.filter(
    (l) => (Date.now() - new Date(l.listDate).getTime()) / 86_400_000 >= 60
  ).length;
  const converted = await prisma.listing.count({ where: { orgId, status: "converted" } });

  return (
    <div>
      <PageHeader
        title="Deal Finder"
        subtitle="Track on-market listings, flag the stale ones, and convert them into deals at the right price."
      />

      {searchParams.imported && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imported {searchParams.imported} listing{searchParams.imported === "1" ? "" : "s"}.
        </div>
      )}
      {searchParams.pullError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.pullError}
        </div>
      )}

      {/* Automated pull (RentCast free tier) */}
      <Section title="🔄 Pull Listings Automatically (RentCast)" className="mb-6">
        {rentcastReady ? (
          <form action={pullFromRentcast} className="flex flex-wrap items-end gap-3 p-5">
            <Field label="City" className="min-w-[160px] flex-1">
              <Input name="city" placeholder="Memphis" />
            </Field>
            <Field label="State" className="w-24">
              <Input name="state" placeholder="TN" />
            </Field>
            <span className="pb-2 text-xs text-slate-400">or</span>
            <Field label="Zip code" className="w-32">
              <Input name="zip" placeholder="38109" />
            </Field>
            <SubmitButton>Pull Active Listings</SubmitButton>
            <p className="w-full text-xs text-slate-400">
              Pulls up to 50 active on-market listings with days-on-market. Free tier allows ~50
              lookups/month.
            </p>
          </form>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            Connect a free <strong>RentCast</strong> API key in{" "}
            <Link href="/settings" className="text-brand-600 hover:underline">
              Settings → Integrations
            </Link>{" "}
            to pull listings automatically by city or zip. Get a key free at{" "}
            <span className="font-medium text-slate-600">rentcast.io</span>. Meanwhile, you can add
            listings or import a Redfin CSV below.
          </div>
        )}
      </Section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Watching" value={String(watching)} />
        <StatCard label="Stale (60+ days)" value={String(staleCount)} accent="text-amber-600" />
        <StatCard label="Converted to Deals" value={String(converted)} accent="text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["watching", "converted", "dismissed", "all"].map((s) => (
          <Link
            key={s}
            href={`/deal-finder?show=${s}${minDom ? `&minDom=${minDom}` : ""}`}
            className={`badge border ${
              show === s
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
        <span className="mx-2 text-slate-300">|</span>
        {[0, 60, 90, 120, 180].map((d) => (
          <Link
            key={d}
            href={`/deal-finder?show=${show}${d ? `&minDom=${d}` : ""}`}
            className={`badge border ${
              minDom === d
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {d === 0 ? "Any DOM" : `${d}+ days`}
          </Link>
        ))}
      </div>

      {analyzed.length === 0 ? (
        <EmptyState
          title="No listings here yet"
          description="Add a listing below, or paste a Redfin 'Download All' CSV export to bring in a whole market at once."
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Address</th>
              <th className="th">List Price</th>
              <th className="th">Days on Market</th>
              <th className="th">Suggested Offer</th>
              <th className="th">Discount</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analyzed.map(({ listing: l, offer }) => {
              const convert = convertListing.bind(null, l.id);
              const dismiss = dismissListing.bind(null, l.id);
              const restore = restoreListing.bind(null, l.id);
              const del = deleteListing.bind(null, l.id);
              return (
                <tr key={l.id} className="align-top hover:bg-slate-50">
                  <td className="td">
                    <span className="font-medium text-slate-800">{l.address}</span>
                    <div className="text-xs text-slate-400">
                      {[l.city, l.state, l.zip].filter(Boolean).join(", ")}
                      {l.beds != null && ` · ${l.beds}bd`}
                      {l.baths != null && `/${l.baths}ba`}
                      {l.sqft != null && ` · ${l.sqft.toLocaleString()} sqft`}
                      {l.url && (
                        <>
                          {" · "}
                          <a href={l.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                            listing ↗
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="td">{currency(l.listPrice)}</td>
                  <td className="td">
                    <span className={`badge ${domBadge(offer.dom)}`}>{offer.dom} days</span>
                  </td>
                  <td className="td font-semibold text-emerald-700">
                    {currency(offer.suggested)}
                    <div className="text-xs font-normal text-slate-400">
                      {offer.basis === "mao" ? "70% rule MAO" : `list − ${offer.discountPct}%`}
                    </div>
                  </td>
                  <td className="td text-slate-500">
                    {Math.round((1 - offer.suggested / l.listPrice) * 100)}% under list
                  </td>
                  <td className="td">
                    <Badge options={STATUS_BADGES} value={l.status} />
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      {l.status === "watching" && (
                        <>
                          <form action={convert}>
                            <button type="submit" className="btn-secondary text-xs">
                              → Make Deal
                            </button>
                          </form>
                          <form action={dismiss}>
                            <button type="submit" className="btn-ghost text-xs">
                              Dismiss
                            </button>
                          </form>
                        </>
                      )}
                      {l.status === "converted" && l.leadId && (
                        <Link href={`/leads/${l.leadId}`} className="btn-ghost text-xs">
                          View Lead
                        </Link>
                      )}
                      {l.status === "dismissed" && (
                        <form action={restore}>
                          <button type="submit" className="btn-ghost text-xs">
                            Restore
                          </button>
                        </form>
                      )}
                      <form action={del}>
                        <button type="submit" className="btn-ghost text-xs text-rose-600">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Add a Listing">
          <form action={createListing} className="grid grid-cols-2 gap-4 p-5">
            <Field label="Address" className="col-span-2">
              <Input name="address" required placeholder="123 Main St" />
            </Field>
            <Field label="City">
              <Input name="city" placeholder="Memphis" />
            </Field>
            <Field label="State">
              <Input name="state" placeholder="TN" />
            </Field>
            <Field label="Zip">
              <Input name="zip" placeholder="38109" />
            </Field>
            <Field label="Property Type">
              <Select name="propertyType" options={PROPERTY_TYPES} defaultValue="single_family" />
            </Field>
            <Field label="List Price">
              <Input name="listPrice" required placeholder="$150,000" />
            </Field>
            <Field label="Days on Market" hint="Or pick a list date →">
              <Input name="dom" placeholder="95" />
            </Field>
            <Field label="List Date">
              <Input name="listDate" type="date" />
            </Field>
            <Field label="Listing URL">
              <Input name="url" placeholder="https://www.zillow.com/…" />
            </Field>
            <Field label="ARV (optional)" hint="Sharpens the suggested offer">
              <Input name="arv" placeholder="$220,000" />
            </Field>
            <Field label="Repair Estimate (optional)">
              <Input name="repairEstimate" placeholder="$35,000" />
            </Field>
            <div className="col-span-2">
              <SubmitButton className="w-full">Add Listing</SubmitButton>
            </div>
          </form>
        </Section>

        <Section title="Import CSV (Redfin export or any CSV)">
          <form action={importListingsCsv} className="space-y-4 p-5">
            <p className="text-xs text-slate-500">
              On <strong>redfin.com</strong>, run a search (filter by days on market!), scroll to
              the bottom of the results, and click <strong>“Download All”</strong>. Open the file
              and paste its contents here. Columns for address, price, and days on market are
              detected automatically — Zillow/other CSVs work too if they include those columns.
            </p>
            <Field label="CSV data">
              <Textarea
                name="csv"
                required
                rows={8}
                placeholder={"ADDRESS,CITY,STATE,ZIP,PRICE,DAYS ON MARKET\n123 Main St,Memphis,TN,38109,150000,95"}
                className="font-mono text-xs"
              />
            </Field>
            <SubmitButton className="w-full">Import Listings</SubmitButton>
          </form>
        </Section>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p className="mb-2 font-semibold text-slate-600">How the suggested offer works</p>
        <ul className="space-y-1">
          {DOM_TIERS.filter((t) => t.discount > 0).map((t) => (
            <li key={t.minDays}>
              • {t.label}: start {Math.round(t.discount * 100)}% under list
            </li>
          ))}
          <li>
            • If ARV &amp; repairs are known, the 70%-rule MAO (less a $10k assignment fee) caps
            the offer — you never offer above what the deal math supports.
          </li>
        </ul>
      </div>
    </div>
  );
}
