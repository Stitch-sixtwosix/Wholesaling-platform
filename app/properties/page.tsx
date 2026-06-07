import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, DataTable, EmptyState, LinkButton } from "@/components/ui";
import { PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { currency, number } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { q } = searchParams;

  const properties = await prisma.property.findMany({
    where: q
      ? {
          OR: [
            { address: { contains: q } },
            { city: { contains: q } },
            { zip: { contains: q } },
          ],
        }
      : {},
    include: { _count: { select: { leads: true, deals: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="Every subject property, comp set, and valuation in one place."
        action={
          <LinkButton href="/properties/new" variant="primary">
            + New Property
          </LinkButton>
        }
      />

      <form className="mb-4" action="/properties">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by address, city, or ZIP…"
          className="input max-w-md"
        />
      </form>

      {properties.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="Adjust your search or add a new property to get started."
          action={
            <LinkButton href="/properties/new" variant="primary">
              + New Property
            </LinkButton>
          }
        />
      ) : (
        <DataTable>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Address</th>
              <th className="th">Type</th>
              <th className="th">Beds / Baths</th>
              <th className="th">SqFt</th>
              <th className="th">ARV</th>
              <th className="th">Repairs</th>
              <th className="th">Est. Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link
                    href={`/properties/${p.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {p.address}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                    {p.zip ? ` ${p.zip}` : ""}
                  </div>
                </td>
                <td className="td text-slate-500">{labelOf(PROPERTY_TYPES, p.propertyType)}</td>
                <td className="td">
                  {p.beds ?? "—"} / {p.baths ?? "—"}
                </td>
                <td className="td">{number(p.sqft)}</td>
                <td className="td">{currency(p.arv)}</td>
                <td className="td">{currency(p.repairEstimate)}</td>
                <td className="td">{currency(p.estimatedValue)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
