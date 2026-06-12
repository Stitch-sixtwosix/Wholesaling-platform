import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import {
  LEAD_SOURCES,
  MOTIVATIONS,
  TEMPERATURES,
  ACTIVITY_TYPES,
  labelOf,
} from "@/lib/constants";
import { currency, dateTime, fullName, relativeTime } from "@/lib/format";
import { addLeadActivity, convertLeadToDeal } from "../actions";
import { StatusControl } from "./StatusControl";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const { orgId } = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, orgId },
    include: {
      property: true,
      deals: { include: { contracts: { orderBy: { updatedAt: "desc" } } } },
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!lead) notFound();

  const convert = convertLeadToDeal.bind(null, lead.id);
  const documents = lead.deals.flatMap((d) => d.contracts);

  return (
    <div>
      <PageHeader
        title={fullName(lead.firstName, lead.lastName)}
        subtitle={lead.phone ?? lead.email ?? "No contact info"}
        action={
          <div className="flex gap-2">
            <LinkButton href="/leads">Back</LinkButton>
            {lead.deals.length > 0 ? (
              <LinkButton href={`/pipeline/${lead.deals[0].id}`} variant="primary">
                View Deal →
              </LinkButton>
            ) : (
              <form action={convert}>
                <SubmitButton>Convert to Deal →</SubmitButton>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Lead Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="Status">
                <StatusControl leadId={lead.id} status={lead.status} />
              </Info>
              <Info label="Temperature">
                <Badge options={TEMPERATURES} value={lead.temperature} />
              </Info>
              <Info label="Source">{labelOf(LEAD_SOURCES, lead.source)}</Info>
              <Info label="Motivation">{labelOf(MOTIVATIONS, lead.motivation)}</Info>
              <Info label="Asking Price">{currency(lead.askingPrice)}</Info>
              <Info label="Email">{lead.email ?? "—"}</Info>
              <Info label="Alt Phone">{lead.altPhone ?? "—"}</Info>
              <Info label="Created">{relativeTime(lead.createdAt)}</Info>
              <Info label="Last Contact">{relativeTime(lead.lastContact)}</Info>
            </div>
            {lead.notes && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p>
              </div>
            )}
          </Section>

          {lead.property && (
            <Section
              title="Subject Property"
              action={
                <Link href={`/properties/${lead.property.id}`} className="text-sm text-brand-600 hover:underline">
                  View →
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
                <Info label="Address" className="sm:col-span-3">
                  {lead.property.address}, {lead.property.city}, {lead.property.state} {lead.property.zip}
                </Info>
                <Info label="Beds / Baths">
                  {lead.property.beds ?? "—"} / {lead.property.baths ?? "—"}
                </Info>
                <Info label="SqFt">{lead.property.sqft ?? "—"}</Info>
                <Info label="Year Built">{lead.property.yearBuilt ?? "—"}</Info>
                <Info label="ARV">{currency(lead.property.arv)}</Info>
                <Info label="Repairs">{currency(lead.property.repairEstimate)}</Info>
                <Info label="Condition">{lead.property.condition}</Info>
              </div>
            </Section>
          )}

          {/* Documents (contracts on this client's deals) */}
          {documents.length > 0 && (
            <Section title="Documents & Contracts">
              <ul className="divide-y divide-slate-100">
                {documents.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-[180px] flex-1">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        📄 {c.title}
                      </Link>
                      <div className="text-xs text-slate-400">
                        {c.sentDate ? `Sent ${relativeTime(c.sentDate)}` : "Not sent yet"}
                        {c.signedDate && ` · Signed ${relativeTime(c.signedDate)}`}
                      </div>
                    </div>
                    <Badge
                      options={[
                        { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-500" },
                        { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700" },
                        { value: "signed", label: "Signed", color: "bg-emerald-100 text-emerald-700" },
                        { value: "executed", label: "Executed", color: "bg-emerald-100 text-emerald-700" },
                        { value: "cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-600" },
                      ]}
                      value={c.status}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Activity timeline */}
          <Section title="Activity & Notes">
            <form action={addLeadActivity} className="flex gap-2 border-b border-slate-100 p-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <Select name="type" options={ACTIVITY_TYPES} defaultValue="note" className="max-w-[130px]" />
              <Input name="body" placeholder="Log a call, note, or text…" required />
              <SubmitButton>Add</SubmitButton>
            </form>
            <ul className="divide-y divide-slate-100">
              {lead.activities.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No activity yet.</li>
              )}
              {lead.activities.map((a) => (
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
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Quick Add Activity">
            <div className="p-5">
              <form action={addLeadActivity} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
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

          {lead.tasks.length > 0 && (
            <Section title="Tasks">
              <ul className="divide-y divide-slate-100">
                {lead.tasks.map((t) => (
                  <li key={t.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-slate-700">{t.title}</p>
                    <p className="text-xs text-slate-400">
                      {t.status} · due {relativeTime(t.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
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
