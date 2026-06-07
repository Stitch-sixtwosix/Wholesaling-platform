import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, DataTable, EmptyState, LinkButton } from "@/components/ui";
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  TEMPERATURES,
  labelOf,
} from "@/lib/constants";
import { currency, fullName, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const { status, q } = searchParams;

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    include: { property: true },
    orderBy: { updatedAt: "desc" },
  });

  const counts = await prisma.lead.groupBy({ by: ["status"], _count: true });
  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div>
      <PageHeader
        title="Seller Leads"
        subtitle="Acquisitions CRM — every motivated seller in one place."
        action={
          <LinkButton href="/leads/new" variant="primary">
            + New Lead
          </LinkButton>
        }
      />

      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/leads"
          className={`badge ${!status ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          All ({total})
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/leads?status=${s.value}`}
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

      <form className="mb-4" action="/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, or email…"
          className="input max-w-md"
        />
      </form>

      {leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Adjust your filters or add a new seller lead to get started."
          action={
            <LinkButton href="/leads/new" variant="primary">
              + New Lead
            </LinkButton>
          }
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Seller</th>
              <th className="th">Property</th>
              <th className="th">Status</th>
              <th className="th">Temp</th>
              <th className="th">Source</th>
              <th className="th">Asking</th>
              <th className="th">Last Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-brand-700 hover:underline">
                    {fullName(lead.firstName, lead.lastName)}
                  </Link>
                  <div className="text-xs text-slate-400">{lead.phone ?? "no phone"}</div>
                </td>
                <td className="td">
                  {lead.property ? (
                    <span>
                      {lead.property.address}
                      <span className="block text-xs text-slate-400">
                        {lead.property.city}, {lead.property.state}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="td">
                  <Badge options={LEAD_STATUSES} value={lead.status} />
                </td>
                <td className="td">
                  <Badge options={TEMPERATURES} value={lead.temperature} />
                </td>
                <td className="td text-slate-500">{labelOf(LEAD_SOURCES, lead.source)}</td>
                <td className="td">{currency(lead.askingPrice)}</td>
                <td className="td text-slate-500">{relativeTime(lead.lastContact)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
