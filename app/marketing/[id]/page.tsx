import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard, Section, LinkButton } from "@/components/ui";
import { Field, Input, Select, SubmitButton } from "@/components/Form";
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES, labelOf } from "@/lib/constants";
import { currency, number, percent, date, fullName } from "@/lib/format";
import { updateCampaign, deleteCampaign } from "../actions";
import { StatusControl } from "./StatusControl";

export const dynamic = "force-dynamic";

function toInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { orgId } = await requireUser();
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, orgId },
    include: {
      template: true,
      members: { include: { lead: true, buyer: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!campaign) notFound();

  const templates = await prisma.template.findMany({ where: { orgId }, orderBy: { name: "asc" } });
  const templateOptions = templates.map((t) => ({ value: t.id, label: t.name }));

  const respRate = campaign.delivered > 0 ? (campaign.responses / campaign.delivered) * 100 : null;
  const costPerLead = campaign.leads > 0 ? currency(campaign.cost / campaign.leads) : "—";
  const remove = deleteCampaign.bind(null, campaign.id);

  return (
    <div>
      <PageHeader
        title={campaign.name}
        subtitle={`${labelOf(CAMPAIGN_CHANNELS, campaign.channel)}${
          campaign.audience ? ` · ${campaign.audience}` : ""
        }`}
        action={
          <div className="flex items-center gap-2">
            <StatusControl campaignId={campaign.id} status={campaign.status} />
            <LinkButton href="/marketing">Back</LinkButton>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Sent" value={number(campaign.sent)} />
        <StatCard label="Delivered" value={number(campaign.delivered)} />
        <StatCard label="Responses" value={number(campaign.responses)} />
        <StatCard label="Leads" value={number(campaign.leads)} />
        <StatCard label="Cost" value={currency(campaign.cost)} />
        <StatCard label="Response Rate" value={percent(respRate, 1)} />
        <StatCard label="Cost / Lead" value={costPerLead} accent="text-brand-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {campaign.template && (
            <Section title={`Template — ${campaign.template.name}`}>
              <div className="p-5">
                {campaign.template.subject && (
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Subject: {campaign.template.subject}
                  </p>
                )}
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">
                  {campaign.template.body}
                </pre>
              </div>
            </Section>
          )}

          <Section title={`Members (${campaign.members.length})`}>
            {campaign.members.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No members in this campaign yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {campaign.members.map((m) => {
                  const person = m.lead
                    ? fullName(m.lead.firstName, m.lead.lastName)
                    : m.buyer
                      ? fullName(m.buyer.firstName, m.buyer.lastName)
                      : "Unknown";
                  return (
                    <li key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-slate-700">{person}</span>
                      <span className="text-xs text-slate-400">{m.status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Edit Campaign">
            <form action={updateCampaign} className="space-y-4 p-5">
              <input type="hidden" name="id" value={campaign.id} />
              <Field label="Name *">
                <Input name="name" required defaultValue={campaign.name} />
              </Field>
              <Field label="Channel">
                <Select name="channel" options={CAMPAIGN_CHANNELS} defaultValue={campaign.channel} />
              </Field>
              <Field label="Status">
                <Select name="status" options={CAMPAIGN_STATUSES} defaultValue={campaign.status} />
              </Field>
              <Field label="Audience">
                <Input name="audience" defaultValue={campaign.audience ?? ""} />
              </Field>
              <Field label="Template">
                <Select
                  name="templateId"
                  options={templateOptions}
                  placeholder="No template"
                  defaultValue={campaign.templateId ?? ""}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date">
                  <Input name="startDate" type="date" defaultValue={toInput(campaign.startDate)} />
                </Field>
                <Field label="End Date">
                  <Input name="endDate" type="date" defaultValue={toInput(campaign.endDate)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sent">
                  <Input name="sent" defaultValue={campaign.sent} />
                </Field>
                <Field label="Delivered">
                  <Input name="delivered" defaultValue={campaign.delivered} />
                </Field>
                <Field label="Responses">
                  <Input name="responses" defaultValue={campaign.responses} />
                </Field>
                <Field label="Leads">
                  <Input name="leads" defaultValue={campaign.leads} />
                </Field>
                <Field label="Cost" className="col-span-2">
                  <Input name="cost" defaultValue={campaign.cost} />
                </Field>
              </div>
              <SubmitButton className="w-full">Save Changes</SubmitButton>
            </form>
          </Section>

          <Section title="Details">
            <div className="space-y-2 p-5 text-sm text-slate-600">
              <p>Starts: {date(campaign.startDate)}</p>
              <p>Ends: {date(campaign.endDate)}</p>
              <p>Created: {date(campaign.createdAt)}</p>
            </div>
          </Section>

          <Section title="Danger Zone">
            <div className="p-5">
              <form action={remove}>
                <button
                  type="submit"
                  className="btn-secondary w-full text-rose-600 hover:bg-rose-50"
                >
                  Delete Campaign
                </button>
              </form>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
