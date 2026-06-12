import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { CONTRACT_TYPES, CONTRACT_STATUSES, labelOf } from "@/lib/constants";
import { currency, date, dateTime } from "@/lib/format";
import { updateContract, deleteContract, sendContractToOwner } from "../actions";
import { StatusControl } from "./StatusControl";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

// Format a date for an <input type="date"> default value (YYYY-MM-DD).
function dateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sent?: string };
}) {
  const { orgId } = await requireUser();
  const contract = await prisma.contract.findFirst({
    where: { id: params.id, orgId },
    include: { deal: { include: { lead: true } } },
  });
  if (!contract) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { resendApiKey: true, fromEmail: true },
  });
  const emailReady = Boolean(org?.resendApiKey && org?.fromEmail);
  const ownerEmail = contract.deal?.lead?.email ?? "";

  const del = deleteContract.bind(null, contract.id);

  return (
    <div>
      <PageHeader
        title={contract.title}
        subtitle={labelOf(CONTRACT_TYPES, contract.type)}
        action={
          <div className="flex items-center gap-2">
            <LinkButton href="/contracts">Back</LinkButton>
            <PrintButton />
          </div>
        }
      />

      <p className="mb-4 text-xs text-slate-400">
        Educational template — not legal advice. Consult a licensed attorney before use.
      </p>

      {searchParams.sent && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {emailReady
            ? `Contract emailed to ${searchParams.sent} and marked as Sent.`
            : `Contract marked as Sent to ${searchParams.sent}. Connect an email service in Settings to actually deliver it.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main: document */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Document">
            <div className="p-5">
              <pre className="mx-auto max-w-3xl whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-8 font-mono text-sm leading-relaxed text-slate-800 shadow-sm">
                {contract.body ?? "No document body generated yet."}
              </pre>
            </div>
          </Section>

          {/* Edit the body directly. All current field values are kept as hidden
              inputs so a regenerate-free body edit doesn't lose them. */}
          <Section title="Edit Document Body">
            <form action={updateContract} className="space-y-3 p-5">
              <input type="hidden" name="id" value={contract.id} />
              <input type="hidden" name="type" value={contract.type} />
              <input type="hidden" name="title" value={contract.title} />
              <input type="hidden" name="status" value={contract.status} />
              <input type="hidden" name="dealId" value={contract.dealId ?? ""} />
              <input type="hidden" name="sellerName" value={contract.sellerName ?? ""} />
              <input type="hidden" name="buyerName" value={contract.buyerName ?? ""} />
              <input type="hidden" name="propertyAddress" value={contract.propertyAddress ?? ""} />
              <input type="hidden" name="purchasePrice" value={contract.purchasePrice ?? ""} />
              <input type="hidden" name="assignmentFee" value={contract.assignmentFee ?? ""} />
              <input type="hidden" name="earnestMoney" value={contract.earnestMoney ?? ""} />
              <input type="hidden" name="inspectionDays" value={contract.inspectionDays ?? ""} />
              <input type="hidden" name="closingDate" value={dateInput(contract.closingDate)} />
              <Field
                label="Document Text"
                hint="Editing here saves your text verbatim and does not regenerate from fields."
              >
                <Textarea name="body" rows={14} defaultValue={contract.body ?? ""} className="font-mono text-sm" />
              </Field>
              <div className="flex justify-end">
                <SubmitButton>Save Document</SubmitButton>
              </div>
            </form>
          </Section>
        </div>

        {/* Right: details + edit */}
        <div className="space-y-6">
          <Section title="Send to Owner">
            <form action={sendContractToOwner} className="space-y-3 p-5">
              <input type="hidden" name="contractId" value={contract.id} />
              <Field
                label="Owner / Seller Email"
                hint={
                  ownerEmail
                    ? "Pre-filled from the linked lead."
                    : "No email on the linked lead — enter one."
                }
              >
                <Input
                  name="to"
                  type="email"
                  required
                  defaultValue={ownerEmail}
                  placeholder="owner@email.com"
                />
              </Field>
              <SubmitButton className="w-full">
                {emailReady ? "📤 Email Contract to Owner" : "Mark as Sent to Owner"}
              </SubmitButton>
              {!emailReady && (
                <p className="text-xs text-amber-600">
                  No email service connected — this will log the send and mark the contract Sent.
                  Add a Resend key in <Link href="/settings" className="underline">Settings</Link> to
                  deliver real email.
                </p>
              )}
              <p className="text-xs text-slate-400">
                Sending marks the contract <strong>Sent</strong>, logs it on the deal timeline, and
                moves the deal to the Offer stage if it isn't there yet.
              </p>
            </form>
          </Section>

          <Section title="Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
              <Info label="Status">
                <StatusControl contractId={contract.id} status={contract.status} />
              </Info>
              <Info label="Type">{labelOf(CONTRACT_TYPES, contract.type)}</Info>
              <Info label="Purchase Price">{currency(contract.purchasePrice)}</Info>
              <Info label="Assignment Fee">{currency(contract.assignmentFee)}</Info>
              <Info label="Created">{dateTime(contract.createdAt)}</Info>
              <Info label="Sent">{contract.sentDate ? dateTime(contract.sentDate) : "—"}</Info>
              <Info label="Signed">{contract.signedDate ? dateTime(contract.signedDate) : "—"}</Info>
              <Info label="Closing">{date(contract.closingDate)}</Info>
              <Info label="Linked Deal" className="col-span-2">
                {contract.deal ? (
                  <Link href={`/pipeline/${contract.deal.id}`} className="text-brand-600 hover:underline">
                    {contract.deal.title} →
                  </Link>
                ) : (
                  "—"
                )}
              </Info>
            </div>
          </Section>

          <Section title="Edit & Regenerate">
            <form action={updateContract} className="space-y-3 p-5">
              <input type="hidden" name="id" value={contract.id} />
              <Field label="Type">
                <Select name="type" options={CONTRACT_TYPES} defaultValue={contract.type} />
              </Field>
              <Field label="Status">
                <Select name="status" options={CONTRACT_STATUSES} defaultValue={contract.status} />
              </Field>
              <Field label="Title">
                <Input name="title" defaultValue={contract.title} />
              </Field>
              <Field label="Seller Name">
                <Input name="sellerName" defaultValue={contract.sellerName ?? ""} />
              </Field>
              <Field label="Buyer Name">
                <Input name="buyerName" defaultValue={contract.buyerName ?? ""} />
              </Field>
              <Field label="Property Address">
                <Input name="propertyAddress" defaultValue={contract.propertyAddress ?? ""} />
              </Field>
              <Field label="Purchase Price">
                <Input name="purchasePrice" defaultValue={contract.purchasePrice ?? ""} />
              </Field>
              <Field label="Assignment Fee">
                <Input name="assignmentFee" defaultValue={contract.assignmentFee ?? ""} />
              </Field>
              <Field label="Earnest Money">
                <Input name="earnestMoney" defaultValue={contract.earnestMoney ?? ""} />
              </Field>
              <Field label="Inspection Days">
                <Input name="inspectionDays" defaultValue={contract.inspectionDays ?? ""} />
              </Field>
              <Field label="Closing Date">
                <Input name="closingDate" type="date" defaultValue={dateInput(contract.closingDate)} />
              </Field>
              <p className="text-xs text-slate-400">
                Saving regenerates the document from these fields.
              </p>
              <div className="flex justify-end">
                <SubmitButton>Save &amp; Regenerate</SubmitButton>
              </div>
            </form>
          </Section>

          <Section title="Danger Zone">
            <div className="p-5">
              <form action={del}>
                <button type="submit" className="btn-secondary w-full text-rose-600">
                  Delete Contract
                </button>
              </form>
            </div>
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
