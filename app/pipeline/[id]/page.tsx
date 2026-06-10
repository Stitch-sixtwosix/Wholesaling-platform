import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import {
  DEAL_STAGES,
  ACTIVITY_TYPES,
  CONTRACT_STATUSES,
  TASK_STATUSES,
  labelOf,
} from "@/lib/constants";
import { currency, dateTime, relativeTime, fullName } from "@/lib/format";
import { updateDealEconomics, addDealActivity } from "../actions";
import { StageControl } from "./StageControl";
import { BuyerControl } from "./BuyerControl";

export const dynamic = "force-dynamic";

function toDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const { orgId } = await requireUser();
  const deal = await prisma.deal.findFirst({
    where: { id: params.id, orgId },
    include: {
      lead: true,
      property: true,
      buyer: true,
      activities: { orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!deal) notFound();

  const buyers = await prisma.buyer.findMany({ where: { orgId }, orderBy: { updatedAt: "desc" } });
  const buyerOptions = buyers.map((b) => ({
    id: b.id,
    label: b.company || fullName(b.firstName, b.lastName) || "Unnamed buyer",
  }));

  const spread = (deal.resalePrice ?? deal.contractPrice ?? 0) - (deal.contractPrice ?? 0);

  return (
    <div>
      <PageHeader
        title={deal.title}
        subtitle={`Created ${relativeTime(deal.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <LinkButton href="/pipeline">Back</LinkButton>
            <Badge options={DEAL_STAGES} value={deal.stage} />
            <StageControl dealId={deal.id} stage={deal.stage} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Deal P&L">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              <Info label="ARV">{currency(deal.arv)}</Info>
              <Info label="Repair Estimate">{currency(deal.repairEstimate)}</Info>
              <Info label="Contract Price">{currency(deal.contractPrice)}</Info>
              <Info label="Resale Price">{currency(deal.resalePrice)}</Info>
              <Info label="Closing Costs">{currency(deal.closingCosts)}</Info>
              <Info label="Spread">{currency(spread)}</Info>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Assignment Fee
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600">
                {currency(deal.assignmentFee)}
              </p>
            </div>
          </Section>

          <Section title="Edit Economics">
            <form action={updateDealEconomics} className="space-y-4 p-5">
              <input type="hidden" name="dealId" value={deal.id} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ARV">
                  <Input name="arv" defaultValue={deal.arv ?? ""} placeholder="$185,000" />
                </Field>
                <Field label="Repair Estimate">
                  <Input name="repairEstimate" defaultValue={deal.repairEstimate ?? ""} placeholder="$40,000" />
                </Field>
                <Field label="Contract Price">
                  <Input name="contractPrice" defaultValue={deal.contractPrice ?? ""} placeholder="$95,000" />
                </Field>
                <Field label="Resale Price">
                  <Input name="resalePrice" defaultValue={deal.resalePrice ?? ""} placeholder="$110,000" />
                </Field>
                <Field label="Assignment Fee">
                  <Input name="assignmentFee" defaultValue={deal.assignmentFee ?? ""} placeholder="$15,000" />
                </Field>
                <Field label="Closing Costs">
                  <Input name="closingCosts" defaultValue={deal.closingCosts ?? ""} placeholder="$3,000" />
                </Field>
                <Field label="Expected Close Date">
                  <Input name="expectedCloseDate" type="date" defaultValue={toDateInput(deal.expectedCloseDate)} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea name="notes" rows={3} defaultValue={deal.notes ?? ""} placeholder="Deal details, terms…" />
              </Field>
              <div className="flex justify-end">
                <SubmitButton>Save Economics</SubmitButton>
              </div>
            </form>
          </Section>

          {/* Activity timeline */}
          <Section title="Activity & Notes">
            <form action={addDealActivity} className="flex gap-2 border-b border-slate-100 p-4">
              <input type="hidden" name="dealId" value={deal.id} />
              <Select name="type" options={ACTIVITY_TYPES} defaultValue="note" className="max-w-[130px]" />
              <Input name="body" placeholder="Log a call, note, or update…" required />
              <SubmitButton>Add</SubmitButton>
            </form>
            <ul className="divide-y divide-slate-100">
              {deal.activities.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No activity yet.</li>
              )}
              {deal.activities.map((a) => (
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
          <Section title="Linked">
            <div className="space-y-3 p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lead</p>
                {deal.lead ? (
                  <Link href={`/leads/${deal.lead.id}`} className="text-brand-700 hover:underline">
                    {fullName(deal.lead.firstName, deal.lead.lastName)}
                  </Link>
                ) : (
                  <p className="text-slate-400">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Property</p>
                {deal.property ? (
                  <Link href={`/properties/${deal.property.id}`} className="text-brand-700 hover:underline">
                    {deal.property.address}, {deal.property.city}, {deal.property.state}
                  </Link>
                ) : (
                  <p className="text-slate-400">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Buyer</p>
                {deal.buyer ? (
                  <Link href={`/buyers/${deal.buyer.id}`} className="text-brand-700 hover:underline">
                    {deal.buyer.company || fullName(deal.buyer.firstName, deal.buyer.lastName)}
                  </Link>
                ) : (
                  <p className="text-slate-400">Unassigned</p>
                )}
                <div className="mt-2">
                  <BuyerControl dealId={deal.id} buyerId={deal.buyerId} buyers={buyerOptions} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Contracts">
            <ul className="divide-y divide-slate-100">
              {deal.contracts.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No contracts.</li>
              )}
              {deal.contracts.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.title}
                  </Link>
                  <Badge options={CONTRACT_STATUSES} value={c.status} />
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Tasks">
            <ul className="divide-y divide-slate-100">
              {deal.tasks.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-400">No tasks.</li>
              )}
              {deal.tasks.map((t) => (
                <li key={t.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-slate-700">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    {labelOf(TASK_STATUSES, t.status)} · due {relativeTime(t.dueDate)}
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
