import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { BUYER_TYPES, BUYER_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { createBuyer } from "../actions";

export default function NewBuyerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Cash Buyer"
        subtitle="Add a buyer and their buy box to match against your deals."
        action={<LinkButton href="/buyers">Cancel</LinkButton>}
      />

      <form action={createBuyer} className="space-y-6">
        <Section title="Contact">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="First Name *">
              <Input name="firstName" required placeholder="John" />
            </Field>
            <Field label="Last Name">
              <Input name="lastName" placeholder="Smith" />
            </Field>
            <Field label="Company">
              <Input name="company" placeholder="Smith Capital LLC" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="buyer@email.com" />
            </Field>
            <Field label="Phone">
              <Input name="phone" placeholder="(555) 123-4567" />
            </Field>
          </div>
        </Section>

        <Section title="Profile">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Buyer Type">
              <Select name="buyerType" options={BUYER_TYPES} defaultValue="flipper" />
            </Field>
            <Field label="Status">
              <Select name="status" options={BUYER_STATUSES} defaultValue="active" />
            </Field>
            <Field label="Proof of Funds">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="proofOfFunds"
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
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Buys with cash
              </label>
            </Field>
          </div>
        </Section>

        <Section title="Buy Box">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Markets" className="sm:col-span-2" hint="Comma separated cities/zips">
              <Input name="markets" placeholder="Memphis, 38109, Shelby County" />
            </Field>
            <Field label="Property Types" className="sm:col-span-2" hint="Hold Ctrl/Cmd to select multiple">
              <select name="propertyTypes" multiple className="input h-36">
                {PROPERTY_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Min Price">
              <Input name="minPrice" placeholder="$50,000" />
            </Field>
            <Field label="Max Price">
              <Input name="maxPrice" placeholder="$250,000" />
            </Field>
            <Field label="Min Beds">
              <Input name="minBeds" placeholder="3" />
            </Field>
            <Field label="Max Rehab">
              <Input name="maxRehab" placeholder="$60,000" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="p-5">
            <Field>
              <Textarea name="notes" rows={4} placeholder="Preferences, financing details, past deals…" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <LinkButton href="/buyers">Cancel</LinkButton>
          <SubmitButton>Create Buyer</SubmitButton>
        </div>
      </form>
    </div>
  );
}
