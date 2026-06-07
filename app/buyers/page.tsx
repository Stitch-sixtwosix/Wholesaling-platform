import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, StatCard, DataTable, EmptyState, LinkButton } from "@/components/ui";
import { BUYER_TYPES, BUYER_STATUSES, labelOf } from "@/lib/constants";
import { currency, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const { status, q } = searchParams;

  const buyers = await prisma.buyer.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { company: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const counts = await prisma.buyer.groupBy({ by: ["status"], _count: true });
  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);
  const vipCount = countFor("vip");
  const pofCount = await prisma.buyer.count({ where: { proofOfFunds: true } });

  const priceRange = (min: number | null, max: number | null) => {
    if (min === null && max === null) return "—";
    return `${currency(min)} – ${currency(max)}`;
  };

  return (
    <div>
      <PageHeader
        title="Cash Buyers"
        subtitle="Dispositions CRM — your buyers list and their buy boxes."
        action={
          <LinkButton href="/buyers/new" variant="primary">
            + New Buyer
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Buyers" value={String(total)} />
        <StatCard label="VIP Buyers" value={String(vipCount)} accent="text-amber-600" />
        <StatCard label="With Proof of Funds" value={String(pofCount)} accent="text-emerald-600" />
      </div>

      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/buyers"
          className={`badge ${!status ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          All ({total})
        </Link>
        {BUYER_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/buyers?status=${s.value}`}
            className={`badge border ${
              status === s.value
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {s.label} ({countFor(s.value)})
          </Link>
        ))}
      </div>

      <form className="mb-4" action="/buyers">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, company, or email…"
          className="input max-w-md"
        />
      </form>

      {buyers.length === 0 ? (
        <EmptyState
          title="No buyers found"
          description="Adjust your filters or add a new cash buyer to get started."
          action={
            <LinkButton href="/buyers/new" variant="primary">
              + New Buyer
            </LinkButton>
          }
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Type</th>
              <th className="th">Status</th>
              <th className="th">Markets</th>
              <th className="th">Price Range</th>
              <th className="th">POF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {buyers.map((buyer) => (
              <tr key={buyer.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={`/buyers/${buyer.id}`} className="font-medium text-brand-700 hover:underline">
                    {fullName(buyer.firstName, buyer.lastName)}
                  </Link>
                  {buyer.company && <div className="text-xs text-slate-400">{buyer.company}</div>}
                </td>
                <td className="td text-slate-500">{labelOf(BUYER_TYPES, buyer.buyerType)}</td>
                <td className="td">
                  <Badge options={BUYER_STATUSES} value={buyer.status} />
                </td>
                <td className="td text-slate-500">{buyer.markets ?? "—"}</td>
                <td className="td">{priceRange(buyer.minPrice, buyer.maxPrice)}</td>
                <td className="td">{buyer.proofOfFunds ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
