import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { BUYER_TYPES, BUYER_STATUSES, PROPERTY_TYPES, ACTIVITY_TYPES, labelOf } from "@/lib/constants";
import { currency, dateTime, fullName, relativeTime } from "@/lib/format";
import { addBuyerActivity, updateBuyer, deleteBuyer } from "../actions";
import { StatusControl } from "./StatusControl";
import { EnrichButton } from "./EnrichButton";
import { apolloConfigured } from "@/lib/apollo";
import { requireUser, getOrgApolloKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BuyerDetailPage({ params }: { params: { id: string } }) {
  const { orgId } = await requireUser();
  const apolloKey = await getOrgApolloKey(orgId);
  const buyer = await prisma.buyer.findFirst({
    where: { id: params.id, orgId },
    include: {
      deals: { include: { property: true }, orderBy: { updatedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!buyer) notFound();

  const remove = deleteBuyer.bind(null, buyer.id);

  const selectedTypes = (buyer.propertyTypes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceRange =
    buyer.minPrice === null && buyer.maxPrice === null
      ? "—"
      : `${currency(buyer.minPrice)} – ${currency(buyer.maxPrice)}`;

  return (
    <div>
      <PageHeader
        title={fullName(buyer.firstName, buyer.lastName)}
        subtitle={buyer.company ?? buyer.email ?? buyer.phone ?? "No company"}
        action={
          <div className="flex gap-2">
            <LinkButton href="/buyers">Back</LinkButton>
            <form action={remove}>
              <button type="submit" className="btn-secondary text-rose-600">
                Delete
              </button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Buyer Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="Status">
                <StatusControl buyerId={buyer.id} status={buyer.status} />
              </Info>
              <Info label="Type">{labelOf(BUYER_TYPES, buyer.buyerType)}</Info>
              <Info label="Proof of Funds">{buyer.proofOfFunds ? "Yes" : "No"}</Info>
              <Info label="Cash Buyer">{buyer.cashBuyer ? "Yes" : "No"}</Info>
              <Info label="Email">{buyer.email ?? "—"}</Info>
              <Info label="Phone">{buyer.phone ?? "—"}</Info>
              <Info label="Company">{buyer.company ?? "—"}</Info>
              <Info label="Created">{relativeTime(buyer.createdAt)}</Info>
            </div>
            {buyer.notes && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{buyer.notes}</p>
              </div>
            )}
          </Section>

          <Section title="Buy Box">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="Markets" className="sm:col-span-3">
                {buyer.markets ?? "—"}
              </Info>
              <Info label="Property Types" className="sm:col-span-3">
                {selectedTypes.length > 0
                  ? selectedTypes.map((t) => labelOf(PROPERTY_TYPES, t)).join(", ")
                  : "—"}
              </Info>
              <Info label="Price Range">{priceRange}</Info>
              <Info label="Min Beds">{buyer.minBeds ?? "—"}</Info>
              <Info label="Max Rehab">{currency(buyer.maxRehab)}</Info>
            </div>
          </Section>

          {/* Activity timeline */}
          <Section title="Activity & Notes">
            <form action={addBuyerActivity} className="flex gap-2 border-b border-slate-100 p-4">
              <input type="hidden" name="buyerId" value={buyer.id} />
              <Select name="type" options={ACTIVITY_TYPES} defaultValue="note" className="max-w-[130px]" />
              <Input name="body" placeholder="Log a call, note, or text…" required />
              <SubmitButton>Add</SubmitButton>
            </form>
            <ul className="divide-y divide-slate-100">
              {buyer.activities.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No activity yet.</li>
              )}
              {buyer.activities.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-3">
                  <Badge options={ACTIVITY_TYPES} value={a.type} className="bg-slate-100 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{a.body}</p>
                    <p className="text-xs text-slate-400">{dateTime(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {/* Edit */}
          <Section title="Edit Buyer">
            <form action={updateBuyer} className="space-y-4 p-5">
              <input type="hidden" name="id" value={buyer.id} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First Name *">
                  <Input name="firstName" required defaultValue={buyer.firstName} />
                </Field>
                <Field label="Last Name">
                  <Input name="lastName" defaultValue={buyer.lastName ?? ""} />
                </Field>
                <Field label="Company">
                  <Input name="company" defaultValue={buyer.company ?? ""} />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" defaultValue={buyer.email ?? ""} />
                </Field>
                <Field label="Phone">
                  <Input name="phone" defaultValue={buyer.phone ?? ""} />
                </Field>
                <Field label="Buyer Type">
                  <Select name="buyerType" options={BUYER_TYPES} defaultValue={buyer.buyerType} />
                </Field>
                <Field label="Status">
                  <Select name="status" options={BUYER_STATUSES} defaultValue={buyer.status} />
                </Field>
                <Field label="Proof of Funds">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="proofOfFunds"
                      defaultChecked={buyer.proofOfFunds}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Has proof of funds on file
                  </label>
                </Field>
                <Field label="Cash Buyer">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="cashBuyer"
                      defaultChecked={buyer.cashBuyer}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Buys with cash
                  </label>
                </Field>
                <Field label="Markets" className="sm:col-span-2" hint="Comma separated cities/zips">
                  <Input name="markets" defaultValue={buyer.markets ?? ""} />
                </Field>
                <Field label="Property Types" className="sm:col-span-2" hint="Hold Ctrl/Cmd to select multiple">
                  <select name="propertyTypes" multiple defaultValue={selectedTypes} className="input h-36">
                    {PROPERTY_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Min Price">
                  <Input name="minPrice" defaultValue={buyer.minPrice ?? ""} />
                </Field>
                <Field label="Max Price">
                  <Input name="maxPrice" defaultValue={buyer.maxPrice ?? ""} />
                </Field>
                <Field label="Min Beds">
                  <Input name="minBeds" defaultValue={buyer.minBeds ?? ""} />
                </Field>
                <Field label="Max Rehab">
                  <Input name="maxRehab" defaultValue={buyer.maxRehab ?? ""} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea name="notes" rows={4} defaultValue={buyer.notes ?? ""} />
              </Field>
              <div className="flex justify-end">
                <SubmitButton>Save Changes</SubmitButton>
              </div>
            </form>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {apolloConfigured(apolloKey) && (!buyer.email || !buyer.phone) && (
            <Section title="Apollo Enrichment">
              <EnrichButton buyerId={buyer.id} />
            </Section>
          )}

          <Section title="Quick Add Activity">
            <div className="p-5">
              <form action={addBuyerActivity} className="space-y-3">
                <input type="hidden" name="buyerId" value={buyer.id} />
                <Field label="Type">
                  <Select name="type" options={ACTIVITY_TYPES} defaultValue="call" />
                </Field>
                <Field label="Details">
                  <Textarea name="body" rows={3} placeholder="What happened?" required />
                </Field>
                <SubmitButton className="w-full">Log Activity</SubmitButton>
              </form>
            </div>
          </Section>

          <Section title="Deals Assigned">
            {buyer.deals.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No deals assigned yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {buyer.deals.map((d) => (
                  <li key={d.id} className="px-5 py-3 text-sm">
                    <Link href={`/pipeline/${d.id}`} className="font-medium text-brand-700 hover:underline">
                      {d.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {d.property
                        ? `${d.property.address}, ${d.property.city}`
                        : "No property"}
                      {" · "}
                      Fee {currency(d.assignmentFee)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
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
