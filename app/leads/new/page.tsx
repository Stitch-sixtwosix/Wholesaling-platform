import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  MOTIVATIONS,
  TEMPERATURES,
  PROPERTY_TYPES,
  PROPERTY_CONDITIONS,
  OCCUPANCY,
} from "@/lib/constants";
import { createLead } from "../actions";

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Seller Lead"
        subtitle="Capture the seller and (optionally) the subject property in one step."
        action={<LinkButton href="/leads">Cancel</LinkButton>}
      />

      <form action={createLead} className="space-y-6">
        <Section title="Seller Contact">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="First Name *">
              <Input name="firstName" required placeholder="Jane" />
            </Field>
            <Field label="Last Name">
              <Input name="lastName" placeholder="Doe" />
            </Field>
            <Field label="Phone">
              <Input name="phone" placeholder="(555) 123-4567" />
            </Field>
            <Field label="Alt Phone">
              <Input name="altPhone" placeholder="(555) 987-6543" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="seller@email.com" />
            </Field>
            <Field label="Asking Price">
              <Input name="askingPrice" placeholder="$120,000" />
            </Field>
          </div>
        </Section>

        <Section title="Lead Details">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <Field label="Status">
              <Select name="status" options={LEAD_STATUSES} defaultValue="new" />
            </Field>
            <Field label="Source">
              <Select name="source" options={LEAD_SOURCES} defaultValue="other" />
            </Field>
            <Field label="Temperature">
              <Select name="temperature" options={TEMPERATURES} defaultValue="warm" />
            </Field>
            <Field label="Motivation" className="sm:col-span-3">
              <Select name="motivation" options={MOTIVATIONS} placeholder="Select motivation…" />
            </Field>
          </div>
        </Section>

        <Section title="Subject Property (optional)">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Address" className="sm:col-span-2">
              <Input name="address" placeholder="123 Main St" />
            </Field>
            <Field label="City">
              <Input name="city" placeholder="Memphis" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State">
                <Input name="state" placeholder="TN" />
              </Field>
              <Field label="ZIP">
                <Input name="zip" placeholder="38109" />
              </Field>
            </div>
            <Field label="Property Type">
              <Select name="propertyType" options={PROPERTY_TYPES} defaultValue="single_family" />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Beds">
                <Input name="beds" placeholder="3" />
              </Field>
              <Field label="Baths">
                <Input name="baths" placeholder="2" />
              </Field>
              <Field label="SqFt">
                <Input name="sqft" placeholder="1450" />
              </Field>
            </div>
            <Field label="Condition">
              <Select name="condition" options={PROPERTY_CONDITIONS} defaultValue="unknown" />
            </Field>
            <Field label="Occupancy">
              <Select name="occupancy" options={OCCUPANCY} defaultValue="unknown" />
            </Field>
            <Field label="Est. ARV">
              <Input name="arv" placeholder="$185,000" />
            </Field>
            <Field label="Repair Estimate">
              <Input name="repairEstimate" placeholder="$40,000" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="p-5">
            <Field>
              <Textarea name="notes" rows={4} placeholder="Seller situation, condition details, timeline…" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <LinkButton href="/leads">Cancel</LinkButton>
          <SubmitButton>Create Lead</SubmitButton>
        </div>
      </form>
    </div>
  );
}
