import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { DEAL_STAGES } from "@/lib/constants";
import { createDeal } from "../actions";

export default function NewDealPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Deal"
        subtitle="Add a deal to the pipeline and start tracking its economics."
        action={<LinkButton href="/pipeline">Cancel</LinkButton>}
      />

      <form action={createDeal} className="space-y-6">
        <Section title="Deal">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Title *" className="sm:col-span-2">
              <Input name="title" required placeholder="123 Main St — Memphis" />
            </Field>
            <Field label="Stage">
              <Select name="stage" options={DEAL_STAGES} defaultValue="lead" />
            </Field>
            <Field label="Expected Close Date">
              <Input name="expectedCloseDate" type="date" />
            </Field>
          </div>
        </Section>

        <Section title="Economics">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="ARV">
              <Input name="arv" placeholder="$185,000" />
            </Field>
            <Field label="Repair Estimate">
              <Input name="repairEstimate" placeholder="$40,000" />
            </Field>
            <Field label="Contract Price">
              <Input name="contractPrice" placeholder="$95,000" />
            </Field>
            <Field label="Resale Price">
              <Input name="resalePrice" placeholder="$110,000" />
            </Field>
            <Field label="Assignment Fee">
              <Input name="assignmentFee" placeholder="$15,000" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="p-5">
            <Field>
              <Textarea name="notes" rows={4} placeholder="Deal details, terms, contingencies…" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <LinkButton href="/pipeline">Cancel</LinkButton>
          <SubmitButton>Create Deal</SubmitButton>
        </div>
      </form>
    </div>
  );
}
