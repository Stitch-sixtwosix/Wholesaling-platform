import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Select, SubmitButton } from "@/components/Form";
import { CONTRACT_TYPES, CONTRACT_STATUSES } from "@/lib/constants";
import { createContract } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const { orgId } = await requireUser();
  const deals = await prisma.deal.findMany({
    where: { orgId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
  const dealOptions = deals.map((d) => ({ value: d.id, label: d.title }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Contract"
        subtitle="The document body is auto-generated from these fields and can be edited after."
        action={<LinkButton href="/contracts">Cancel</LinkButton>}
      />

      <form action={createContract} className="space-y-6">
        <Section title="Contract">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Type">
              <Select name="type" options={CONTRACT_TYPES} defaultValue="purchase" />
            </Field>
            <Field label="Status">
              <Select name="status" options={CONTRACT_STATUSES} defaultValue="draft" />
            </Field>
            <Field
              label="Title"
              className="sm:col-span-2"
              hint="Leave blank to auto-name from type and property address."
            >
              <Input name="title" placeholder="Purchase Agreement — 123 Main St" />
            </Field>
            <Field label="Link to Deal" className="sm:col-span-2">
              <Select name="dealId" options={dealOptions} placeholder="No deal" />
            </Field>
          </div>
        </Section>

        <Section title="Parties & Property">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Seller Name">
              <Input name="sellerName" placeholder="Jane Doe" />
            </Field>
            <Field label="Buyer Name">
              <Input name="buyerName" placeholder="Acme Holdings LLC" />
            </Field>
            <Field label="Property Address" className="sm:col-span-2">
              <Input name="propertyAddress" placeholder="123 Main St, Memphis, TN 38109" />
            </Field>
          </div>
        </Section>

        <Section title="Terms">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Purchase Price">
              <Input name="purchasePrice" placeholder="$120,000" />
            </Field>
            <Field label="Assignment Fee">
              <Input name="assignmentFee" placeholder="$10,000" />
            </Field>
            <Field label="Earnest Money">
              <Input name="earnestMoney" placeholder="$1,000" />
            </Field>
            <Field label="Inspection Days">
              <Input name="inspectionDays" placeholder="10" />
            </Field>
            <Field label="Closing Date">
              <Input name="closingDate" type="date" />
            </Field>
          </div>
        </Section>

        <p className="text-xs text-slate-400">
          Educational template — not legal advice. Consult a licensed attorney before use.
        </p>

        <div className="flex justify-end gap-3">
          <LinkButton href="/contracts">Cancel</LinkButton>
          <SubmitButton>Create Contract</SubmitButton>
        </div>
      </form>
    </div>
  );
}
