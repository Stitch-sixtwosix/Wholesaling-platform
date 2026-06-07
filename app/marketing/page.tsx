import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, DataTable, EmptyState, LinkButton, StatCard, Section } from "@/components/ui";
import { ChannelChart } from "@/components/Charts";
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES, labelOf } from "@/lib/constants";
import { currency, number, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const campaigns = await prisma.campaign.findMany({
    include: { template: true },
    orderBy: { updatedAt: "desc" },
  });
  const templateCount = await prisma.template.count();

  const totalCost = campaigns.reduce((sum, c) => sum + (c.cost ?? 0), 0);
  const totalResponses = campaigns.reduce((sum, c) => sum + (c.responses ?? 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads ?? 0), 0);
  const costPerLead = totalLeads > 0 ? currency(totalCost / totalLeads) : "—";

  // Leads by channel
  const leadsByChannel = new Map<string, number>();
  for (const c of campaigns) {
    leadsByChannel.set(c.channel, (leadsByChannel.get(c.channel) ?? 0) + (c.leads ?? 0));
  }
  const chartData = CAMPAIGN_CHANNELS.filter((ch) => leadsByChannel.has(ch.value)).map((ch) => ({
    name: ch.label,
    value: leadsByChannel.get(ch.value) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle="Outbound campaigns and message templates — track spend, responses, and cost per lead."
        action={
          <div className="flex gap-2">
            <LinkButton href="/marketing/templates">Templates ({templateCount})</LinkButton>
            <LinkButton href="/marketing/new" variant="primary">
              + New Campaign
            </LinkButton>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Spend" value={currency(totalCost)} />
        <StatCard label="Total Responses" value={number(totalResponses)} />
        <StatCard label="Leads Generated" value={number(totalLeads)} />
        <StatCard label="Blended Cost / Lead" value={costPerLead} accent="text-brand-700" />
      </div>

      <div className="mb-6">
        <Section title="Leads by Channel">
          <div className="p-5">
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No lead data yet.</p>
            ) : (
              <ChannelChart data={chartData} />
            )}
          </div>
        </Section>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Launch your first outbound campaign to start generating motivated seller leads."
          action={
            <LinkButton href="/marketing/new" variant="primary">
              + New Campaign
            </LinkButton>
          }
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Campaign</th>
              <th className="th">Channel</th>
              <th className="th">Status</th>
              <th className="th">Sent</th>
              <th className="th">Responses</th>
              <th className="th">Resp. Rate</th>
              <th className="th">Leads</th>
              <th className="th">Cost</th>
              <th className="th">Cost / Lead</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c) => {
              const respRate = c.delivered > 0 ? (c.responses / c.delivered) * 100 : null;
              const cpl = c.leads > 0 ? currency(c.cost / c.leads) : "—";
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/marketing/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                    {c.template && (
                      <div className="text-xs text-slate-400">{c.template.name}</div>
                    )}
                  </td>
                  <td className="td text-slate-500">{labelOf(CAMPAIGN_CHANNELS, c.channel)}</td>
                  <td className="td">
                    <Badge options={CAMPAIGN_STATUSES} value={c.status} />
                  </td>
                  <td className="td">{number(c.sent)}</td>
                  <td className="td">{number(c.responses)}</td>
                  <td className="td">{percent(respRate, 1)}</td>
                  <td className="td">{number(c.leads)}</td>
                  <td className="td">{currency(c.cost)}</td>
                  <td className="td">{cpl}</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
