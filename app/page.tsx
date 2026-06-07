import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatCard, Section, Badge } from "@/components/ui";
import { DEAL_STAGES, LEAD_STATUSES, ACTIVITY_TYPES, labelOf } from "@/lib/constants";
import { currency, fullName, relativeTime } from "@/lib/format";
import { PipelineFunnel, RevenueChart } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { denied?: string };
}) {
  const denied = searchParams?.denied;
  const [
    leadCount,
    activeLeadCount,
    deals,
    wonDeals,
    buyerCount,
    activeCampaigns,
    openTasks,
    recentLeads,
    recentActivities,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: { notIn: ["dead", "nurture"] } } }),
    prisma.deal.findMany(),
    prisma.deal.findMany({ where: { status: "won" } }),
    prisma.buyer.count({ where: { status: { not: "inactive" } } }),
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.task.findMany({
      where: { status: { not: "done" } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { lead: true, deal: true },
    }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { property: true } }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { lead: true, deal: true, buyer: true },
    }),
  ]);

  // Economics
  const realizedRevenue = wonDeals.reduce((s, d) => s + (d.assignmentFee ?? 0), 0);
  const activeDeals = deals.filter((d) => d.status === "active" && d.stage !== "dead");
  const pipelineValue = activeDeals.reduce((s, d) => s + (d.assignmentFee ?? 0), 0);
  const underContract = deals.filter((d) => ["under_contract", "assigned"].includes(d.stage));
  const conversionRate = leadCount > 0 ? (wonDeals.length / leadCount) * 100 : 0;

  // Pipeline funnel data
  const funnelData = DEAL_STAGES.filter((s) => s.value !== "dead").map((s) => ({
    name: s.label,
    value: deals.filter((d) => d.stage === s.value).length,
  }));

  // Revenue by month (last 6 months) from won deals
  const revenueByMonth = buildRevenueByMonth(wonDeals);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your virtual wholesaling business at a glance."
      />

      {denied && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don’t have access to that section with your current role.
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Realized Revenue"
          value={currency(realizedRevenue)}
          sublabel={`${wonDeals.length} deals closed`}
          accent="text-emerald-600"
        />
        <StatCard
          label="Pipeline Value"
          value={currency(pipelineValue)}
          sublabel={`${activeDeals.length} active deals`}
          accent="text-brand-600"
        />
        <StatCard
          label="Active Leads"
          value={String(activeLeadCount)}
          sublabel={`${leadCount} total · ${conversionRate.toFixed(1)}% conversion`}
        />
        <StatCard
          label="Cash Buyers"
          value={String(buyerCount)}
          sublabel={`${activeCampaigns} active campaigns`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charts */}
        <Section title="Pipeline Funnel" className="lg:col-span-2">
          <div className="p-5">
            <PipelineFunnel data={funnelData} />
          </div>
        </Section>

        <Section title="Under Contract">
          <ul className="divide-y divide-slate-100">
            {underContract.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-400">Nothing under contract.</li>
            )}
            {underContract.map((d) => (
              <li key={d.id} className="px-5 py-3">
                <Link href={`/pipeline/${d.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                  {d.title}
                </Link>
                <div className="mt-1 flex items-center justify-between">
                  <Badge options={DEAL_STAGES} value={d.stage} />
                  <span className="text-sm font-semibold text-emerald-600">
                    {currency(d.assignmentFee)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Revenue (last 6 months)" className="lg:col-span-2">
          <div className="p-5">
            <RevenueChart data={revenueByMonth} />
          </div>
        </Section>

        <Section
          title="Tasks Due"
          action={<Link href="/tasks" className="text-sm text-brand-600 hover:underline">All</Link>}
        >
          <ul className="divide-y divide-slate-100">
            {openTasks.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-400">No open tasks. 🎉</li>
            )}
            {openTasks.map((t) => (
              <li key={t.id} className="px-5 py-3">
                <p className="text-sm font-medium text-slate-700">{t.title}</p>
                <p className="text-xs text-slate-400">
                  due {relativeTime(t.dueDate)}
                  {t.lead && ` · ${fullName(t.lead.firstName, t.lead.lastName)}`}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title="Newest Leads"
          action={<Link href="/leads" className="text-sm text-brand-600 hover:underline">All leads</Link>}
        >
          <ul className="divide-y divide-slate-100">
            {recentLeads.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link href={`/leads/${l.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {fullName(l.firstName, l.lastName)}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {l.property ? `${l.property.city}, ${l.property.state}` : "—"} · {relativeTime(l.createdAt)}
                  </p>
                </div>
                <Badge options={LEAD_STATUSES} value={l.status} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Recent Activity">
          <ul className="divide-y divide-slate-100">
            {recentActivities.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <p className="text-sm text-slate-700">{a.body}</p>
                <p className="text-xs text-slate-400">
                  {labelOf(ACTIVITY_TYPES, a.type)} · {relativeTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function buildRevenueByMonth(deals: { closedDate: Date | null; assignmentFee: number | null }[]) {
  const months: { name: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short" });
    const revenue = deals
      .filter(
        (deal) =>
          deal.closedDate &&
          deal.closedDate.getMonth() === d.getMonth() &&
          deal.closedDate.getFullYear() === d.getFullYear()
      )
      .reduce((s, deal) => s + (deal.assignmentFee ?? 0), 0);
    months.push({ name: key, revenue });
  }
  return months;
}
