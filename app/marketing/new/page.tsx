import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Section, LinkButton } from "@/components/ui";
import { Field, Input, Select, SubmitButton } from "@/components/Form";
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES } from "@/lib/constants";
import { createCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const { orgId } = await requireUser();
  const templates = await prisma.template.findMany({ where: { orgId }, orderBy: { name: "asc" } });
  const templateOptions = templates.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Campaign"
        subtitle="Set up an outbound campaign and (optionally) log its performance."
        action={<LinkButton href="/marketing">Cancel</LinkButton>}
      />

      <form action={createCampaign} className="space-y-6">
        <Section title="Campaign Setup">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Name *" className="sm:col-span-2">
              <Input name="name" required placeholder="May SMS Blast — Memphis 38109" />
            </Field>
            <Field label="Channel">
              <Select name="channel" options={CAMPAIGN_CHANNELS} defaultValue="sms" />
            </Field>
            <Field label="Status">
              <Select name="status" options={CAMPAIGN_STATUSES} defaultValue="draft" />
            </Field>
            <Field label="Audience" className="sm:col-span-2">
              <Input name="audience" placeholder="Absentee owners, 38109, equity > 40%" />
            </Field>
            <Field label="Template">
              <Select name="templateId" options={templateOptions} placeholder="No template" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date">
                <Input name="startDate" type="date" />
              </Field>
              <Field label="End Date">
                <Input name="endDate" type="date" />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Performance (optional)">
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <Field label="Sent">
              <Input name="sent" placeholder="0" />
            </Field>
            <Field label="Delivered">
              <Input name="delivered" placeholder="0" />
            </Field>
            <Field label="Responses">
              <Input name="responses" placeholder="0" />
            </Field>
            <Field label="Leads">
              <Input name="leads" placeholder="0" />
            </Field>
            <Field label="Cost">
              <Input name="cost" placeholder="$0" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <LinkButton href="/marketing">Cancel</LinkButton>
          <SubmitButton>Create Campaign</SubmitButton>
        </div>
      </form>
    </div>
  );
}
