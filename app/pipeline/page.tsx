import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard, LinkButton } from "@/components/ui";
import { DEAL_STAGES } from "@/lib/constants";
import { currency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { orgId } = await requireUser();
  const deals = await prisma.deal.findMany({
    where: { orgId },
    include: { lead: true, property: true, buyer: true },
    orderBy: { updatedAt: "desc" },
  });

  const pipelineValue = deals
    .filter((d) => d.status === "active")
    .reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);
  const wonRevenue = deals
    .filter((d) => d.status === "won")
    .reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Deal Pipeline"
        subtitle="Track every deal from lead to close on the Kanban board."
        action={
          <LinkButton href="/pipeline/new" variant="primary">
            + New Deal
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active Pipeline Value" value={currency(pipelineValue)} sublabel="Sum of active assignment fees" />
        <StatCard label="Won Revenue" value={currency(wonRevenue)} sublabel="Closed deals" accent="text-emerald-600" />
        <StatCard label="Total Deals" value={String(deals.length)} sublabel="Across all stages" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.value);
          const stageFees = stageDeals.reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);
          const muted = stage.value === "dead";
          return (
            <div key={stage.value} className="min-w-[260px] flex-1">
              <div
                className={`mb-3 flex items-center justify-between rounded-lg px-3 py-2 ${
                  muted ? "bg-slate-100" : "bg-white border border-slate-200"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${muted ? "text-slate-500" : "text-slate-800"}`}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-slate-400">{currency(stageFees)}</p>
                </div>
                <span className="badge bg-slate-100 text-slate-600">{stageDeals.length}</span>
              </div>

              <div className="space-y-3">
                {stageDeals.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-slate-300">No deals</p>
                )}
                {stageDeals.map((deal) => {
                  const buyerName = deal.buyer
                    ? deal.buyer.company ||
                      [deal.buyer.firstName, deal.buyer.lastName].filter(Boolean).join(" ")
                    : "Unassigned";
                  return (
                    <Link
                      key={deal.id}
                      href={`/pipeline/${deal.id}`}
                      className={`card block p-3 transition hover:shadow-md ${muted ? "opacity-70" : ""}`}
                    >
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{deal.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{buyerName}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-600">
                          {currency(deal.assignmentFee)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Spread {currency(deal.assignmentFee)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
