import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { PROPERTY_TYPES, PROPERTY_CONDITIONS, OCCUPANCY } from "@/lib/constants";
import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Property"
        subtitle="Capture the subject property, its attributes, and valuation."
        action={<LinkButton href="/properties">Cancel</LinkButton>}
      />

      <form action={createProperty} className="space-y-6">
        <Section title="Location">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Address *" className="sm:col-span-2">
              <Input name="address" required placeholder="123 Main St" />
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
            <Field label="County">
              <Input name="county" placeholder="Shelby" />
            </Field>
            <Field label="Property Type">
              <Select name="propertyType" options={PROPERTY_TYPES} defaultValue="single_family" />
            </Field>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <Field label="Beds">
              <Input name="beds" placeholder="3" />
            </Field>
            <Field label="Baths">
              <Input name="baths" placeholder="2" />
            </Field>
            <Field label="SqFt">
              <Input name="sqft" placeholder="1450" />
            </Field>
            <Field label="Lot Size (SqFt)">
              <Input name="lotSizeSqft" placeholder="7200" />
            </Field>
            <Field label="Year Built">
              <Input name="yearBuilt" placeholder="1968" />
            </Field>
            <Field label="Condition">
              <Select name="condition" options={PROPERTY_CONDITIONS} defaultValue="unknown" />
            </Field>
            <Field label="Occupancy">
              <Select name="occupancy" options={OCCUPANCY} defaultValue="unknown" />
            </Field>
          </div>
        </Section>

        <Section title="Valuation">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <Field label="Estimated Value (as-is)">
              <Input name="estimatedValue" placeholder="$120,000" />
            </Field>
            <Field label="ARV">
              <Input name="arv" placeholder="$185,000" />
            </Field>
            <Field label="Repair Estimate">
              <Input name="repairEstimate" placeholder="$40,000" />
            </Field>
            <Field label="Tax Assessed">
              <Input name="taxAssessed" placeholder="$95,000" />
            </Field>
            <Field label="Annual Taxes">
              <Input name="annualTaxes" placeholder="$2,400" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="p-5">
            <Field>
              <Textarea
                name="notes"
                rows={4}
                placeholder="Condition details, access notes, neighborhood comps…"
              />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <LinkButton href="/properties">Cancel</LinkButton>
          <SubmitButton>Create Property</SubmitButton>
        </div>
      </form>
    </div>
  );
}
