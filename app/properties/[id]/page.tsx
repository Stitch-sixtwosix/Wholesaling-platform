import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import {
  PROPERTY_TYPES,
  PROPERTY_CONDITIONS,
  OCCUPANCY,
  labelOf,
} from "@/lib/constants";
import { currency, number, date, relativeTime } from "@/lib/format";
import { arvFromComps } from "@/lib/analyzer";
import { addComp, deleteComp, updateProperty } from "../actions";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { orgId } = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: params.id, orgId },
    include: {
      comps: { orderBy: { createdAt: "desc" } },
      leads: true,
      deals: true,
    },
  });
  if (!property) notFound();

  const comps = property.comps;
  const estimated = arvFromComps(property.sqft ?? 0, comps);
  const delta =
    estimated.arv !== null && property.arv !== null && property.arv !== undefined
      ? estimated.arv - property.arv
      : null;

  // Build the analyzer link, only including params that are present.
  const analyzerParams = new URLSearchParams();
  if (property.arv !== null && property.arv !== undefined) {
    analyzerParams.set("arv", String(property.arv));
  }
  if (property.repairEstimate !== null && property.repairEstimate !== undefined) {
    analyzerParams.set("repairs", String(property.repairEstimate));
  }
  const analyzerQs = analyzerParams.toString();
  const analyzerHref = analyzerQs ? `/analyzer?${analyzerQs}` : "/analyzer";

  return (
    <div>
      <PageHeader
        title={property.address}
        subtitle={[property.city, property.state].filter(Boolean).join(", ") + (property.zip ? ` ${property.zip}` : "")}
        action={
          <div className="flex gap-2">
            <LinkButton href="/properties">Back</LinkButton>
            <LinkButton href={analyzerHref} variant="primary">
              Analyze This Deal →
            </LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Property Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="Type">{labelOf(PROPERTY_TYPES, property.propertyType)}</Info>
              <Info label="Condition">{labelOf(PROPERTY_CONDITIONS, property.condition)}</Info>
              <Info label="Occupancy">{labelOf(OCCUPANCY, property.occupancy)}</Info>
              <Info label="Beds / Baths">
                {property.beds ?? "—"} / {property.baths ?? "—"}
              </Info>
              <Info label="SqFt">{number(property.sqft)}</Info>
              <Info label="Lot Size (SqFt)">{number(property.lotSizeSqft)}</Info>
              <Info label="Year Built">{property.yearBuilt ?? "—"}</Info>
              <Info label="County">{property.county ?? "—"}</Info>
              <Info label="Estimated Value">{currency(property.estimatedValue)}</Info>
              <Info label="ARV">{currency(property.arv)}</Info>
              <Info label="Repairs">{currency(property.repairEstimate)}</Info>
              <Info label="Tax Assessed">{currency(property.taxAssessed)}</Info>
              <Info label="Annual Taxes">{currency(property.annualTaxes)}</Info>
              <Info label="Updated">{relativeTime(property.updatedAt)}</Info>
            </div>
            {property.notes && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{property.notes}</p>
              </div>
            )}
          </Section>

          <Section title="ARV from Comps">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="Estimated ARV (comps)">
                {estimated.arv !== null ? currency(estimated.arv) : "—"}
              </Info>
              <Info label="Avg $/SqFt">
                {estimated.pricePerSqft !== null ? currency(estimated.pricePerSqft) : "—"}
              </Info>
              <Info label="Stored ARV">{currency(property.arv)}</Info>
            </div>
            {delta !== null && delta !== 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
                Comp estimate is{" "}
                <span className={delta > 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                  {currency(Math.abs(delta))} {delta > 0 ? "higher" : "lower"}
                </span>{" "}
                than the stored ARV.
              </div>
            )}
            {estimated.arv === null && (
              <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-400">
                Add comps with sale price and sqft (and set the subject sqft) to estimate ARV.
              </div>
            )}
          </Section>

          <Section title="Comparable Sales">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Address</th>
                    <th className="th">Sale Price</th>
                    <th className="th">Sale Date</th>
                    <th className="th">Beds / Baths</th>
                    <th className="th">SqFt</th>
                    <th className="th">$/SqFt</th>
                    <th className="th">Distance</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comps.length === 0 && (
                    <tr>
                      <td colSpan={8} className="td text-center text-slate-400">
                        No comps yet. Add one below.
                      </td>
                    </tr>
                  )}
                  {comps.map((c) => {
                    const ppsf = c.sqft && c.sqft > 0 ? Math.round(c.salePrice / c.sqft) : null;
                    const removeComp = deleteComp.bind(null, c.id, property.id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-700">{c.address}</td>
                        <td className="td">{currency(c.salePrice)}</td>
                        <td className="td text-slate-500">{date(c.saleDate)}</td>
                        <td className="td">
                          {c.beds ?? "—"} / {c.baths ?? "—"}
                        </td>
                        <td className="td">{number(c.sqft)}</td>
                        <td className="td">{ppsf !== null ? currency(ppsf) : "—"}</td>
                        <td className="td text-slate-500">
                          {c.distanceMi !== null && c.distanceMi !== undefined
                            ? `${c.distanceMi} mi`
                            : "—"}
                        </td>
                        <td className="td text-right">
                          <form action={removeComp}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form action={addComp} className="grid grid-cols-1 gap-3 border-t border-slate-100 p-5 sm:grid-cols-3">
              <input type="hidden" name="propertyId" value={property.id} />
              <Field label="Address *" className="sm:col-span-3">
                <Input name="address" required placeholder="456 Oak Ave" />
              </Field>
              <Field label="Sale Price *">
                <Input name="salePrice" required placeholder="$180,000" />
              </Field>
              <Field label="Sale Date">
                <Input name="saleDate" type="date" />
              </Field>
              <Field label="Distance (mi)">
                <Input name="distanceMi" placeholder="0.4" />
              </Field>
              <Field label="Beds">
                <Input name="beds" placeholder="3" />
              </Field>
              <Field label="Baths">
                <Input name="baths" placeholder="2" />
              </Field>
              <Field label="SqFt">
                <Input name="sqft" placeholder="1480" />
              </Field>
              <div className="sm:col-span-3 flex justify-end">
                <SubmitButton>Add Comp</SubmitButton>
              </div>
            </form>
          </Section>

          <Section title="Edit Property">
            <form action={updateProperty} className="space-y-6 p-5">
              <input type="hidden" name="id" value={property.id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Address *" className="sm:col-span-2">
                  <Input name="address" required defaultValue={property.address} />
                </Field>
                <Field label="City">
                  <Input name="city" defaultValue={property.city} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="State">
                    <Input name="state" defaultValue={property.state} />
                  </Field>
                  <Field label="ZIP">
                    <Input name="zip" defaultValue={property.zip} />
                  </Field>
                </div>
                <Field label="County">
                  <Input name="county" defaultValue={property.county ?? ""} />
                </Field>
                <Field label="Property Type">
                  <Select
                    name="propertyType"
                    options={PROPERTY_TYPES}
                    defaultValue={property.propertyType}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Beds">
                  <Input name="beds" defaultValue={property.beds ?? ""} />
                </Field>
                <Field label="Baths">
                  <Input name="baths" defaultValue={property.baths ?? ""} />
                </Field>
                <Field label="SqFt">
                  <Input name="sqft" defaultValue={property.sqft ?? ""} />
                </Field>
                <Field label="Lot Size (SqFt)">
                  <Input name="lotSizeSqft" defaultValue={property.lotSizeSqft ?? ""} />
                </Field>
                <Field label="Year Built">
                  <Input name="yearBuilt" defaultValue={property.yearBuilt ?? ""} />
                </Field>
                <Field label="Condition">
                  <Select
                    name="condition"
                    options={PROPERTY_CONDITIONS}
                    defaultValue={property.condition}
                  />
                </Field>
                <Field label="Occupancy">
                  <Select name="occupancy" options={OCCUPANCY} defaultValue={property.occupancy} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Estimated Value">
                  <Input name="estimatedValue" defaultValue={property.estimatedValue ?? ""} />
                </Field>
                <Field label="ARV">
                  <Input name="arv" defaultValue={property.arv ?? ""} />
                </Field>
                <Field label="Repair Estimate">
                  <Input name="repairEstimate" defaultValue={property.repairEstimate ?? ""} />
                </Field>
                <Field label="Tax Assessed">
                  <Input name="taxAssessed" defaultValue={property.taxAssessed ?? ""} />
                </Field>
                <Field label="Annual Taxes">
                  <Input name="annualTaxes" defaultValue={property.annualTaxes ?? ""} />
                </Field>
              </div>

              <Field label="Notes">
                <Textarea name="notes" rows={4} defaultValue={property.notes ?? ""} />
              </Field>

              <div className="flex justify-end">
                <SubmitButton>Save Changes</SubmitButton>
              </div>
            </form>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Linked Leads">
            <ul className="divide-y divide-slate-100">
              {property.leads.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No linked leads.</li>
              )}
              {property.leads.map((l) => (
                <li key={l.id} className="px-5 py-3 text-sm">
                  <Link
                    href={`/leads/${l.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {[l.firstName, l.lastName].filter(Boolean).join(" ")}
                  </Link>
                  <p className="text-xs text-slate-400">{l.phone ?? l.email ?? "no contact"}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Linked Deals">
            <ul className="divide-y divide-slate-100">
              {property.deals.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No linked deals.</li>
              )}
              {property.deals.map((d) => (
                <li key={d.id} className="px-5 py-3 text-sm">
                  <Link
                    href={`/pipeline/${d.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {d.stage} · {currency(d.contractPrice)}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}
