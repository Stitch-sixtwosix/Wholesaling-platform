import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatCard, Badge, DataTable, EmptyState, LinkButton } from "@/components/ui";
import { CONTRACT_TYPES, CONTRACT_STATUSES, labelOf } from "@/lib/constants";
import { currency, date } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const { type } = searchParams;

  const contracts = await prisma.contract.findMany({
    where: { ...(type ? { type } : {}) },
    include: { deal: true },
    orderBy: { updatedAt: "desc" },
  });

  const typeCounts = await prisma.contract.groupBy({ by: ["type"], _count: true });
  const countFor = (t: string) => typeCounts.find((c) => c.type === t)?._count ?? 0;
  const total = typeCounts.reduce((sum, c) => sum + c._count, 0);

  const allContracts = type ? await prisma.contract.findMany() : contracts;
  const executedCount = allContracts.filter((c) => c.status === "executed").length;
  const feesOnExecuted = allContracts
    .filter((c) => c.status === "executed" || c.status === "signed")
    .reduce((sum, c) => sum + (c.assignmentFee ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Contracts"
        subtitle="Generate and track purchase, assignment, JV, and option agreements."
        action={
          <LinkButton href="/contracts/new" variant="primary">
            + New Contract
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Contracts" value={String(total)} sublabel="All types" />
        <StatCard
          label="Executed"
          value={String(executedCount)}
          sublabel="Fully executed agreements"
          accent="text-emerald-600"
        />
        <StatCard
          label="Assignment Fees"
          value={currency(feesOnExecuted)}
          sublabel="On signed / executed contracts"
          accent="text-emerald-600"
        />
      </div>

      {/* Type filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/contracts"
          className={`badge border ${
            !type ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          All ({total})
        </Link>
        {CONTRACT_TYPES.map((t) => (
          <Link
            key={t.value}
            href={`/contracts?type=${t.value}`}
            className={`badge border ${
              type === t.value
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {t.label} ({countFor(t.value)})
          </Link>
        ))}
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description="Generate a new agreement to get started."
          action={
            <LinkButton href="/contracts/new" variant="primary">
              + New Contract
            </LinkButton>
          }
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Title</th>
              <th className="th">Type</th>
              <th className="th">Status</th>
              <th className="th">Property</th>
              <th className="th">Price</th>
              <th className="th">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.title}
                  </Link>
                  {c.deal && (
                    <div className="text-xs text-slate-400">{c.deal.title}</div>
                  )}
                </td>
                <td className="td text-slate-500">{labelOf(CONTRACT_TYPES, c.type)}</td>
                <td className="td">
                  <Badge options={CONTRACT_STATUSES} value={c.status} />
                </td>
                <td className="td">
                  {c.propertyAddress ?? <span className="text-slate-400">—</span>}
                </td>
                <td className="td">{currency(c.purchasePrice)}</td>
                <td className="td text-slate-500">{date(c.closingDate)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
