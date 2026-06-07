import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, StatCard, EmptyState, Section } from "@/components/ui";
import { SubmitButton } from "@/components/Form";
import { DEAL_STAGES, BUYER_TYPES, BUYER_STATUSES, labelOf } from "@/lib/constants";
import { currency, percent, fullName } from "@/lib/format";
import { buyerMatchScore } from "@/lib/analyzer";
import { assignBuyerToDeal, blastDeal } from "./actions";

export const dynamic = "force-dynamic";

const DISPO_STAGES = ["under_contract", "assigned", "offer", "appointment"];

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

export default async function DispositionsPage({
  searchParams,
}: {
  searchParams: { deal?: string };
}) {
  const selectedId = searchParams.deal;

  // Dispo-ready deals; fall back to all active deals if none match.
  let deals = await prisma.deal.findMany({
    where: { status: "active", stage: { in: DISPO_STAGES } },
    include: { property: true, buyer: true },
    orderBy: { updatedAt: "desc" },
  });
  if (deals.length === 0) {
    deals = await prisma.deal.findMany({
      where: { status: "active" },
      include: { property: true, buyer: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  const buyers = await prisma.buyer.findMany({
    where: { status: { not: "inactive" } },
    orderBy: { updatedAt: "desc" },
  });

  const totalAssignmentFee = deals.reduce((sum, d) => sum + (d.assignmentFee ?? 0), 0);

  const selectedDeal = selectedId ? deals.find((d) => d.id === selectedId) ?? null : null;

  // Build match scores for the selected deal.
  let ranked: { buyer: (typeof buyers)[number]; score: number }[] = [];
  if (selectedDeal) {
    const dealInput = {
      price: selectedDeal.contractPrice ?? selectedDeal.resalePrice ?? 0,
      propertyType: selectedDeal.property?.propertyType ?? null,
      market: selectedDeal.property?.city ?? null,
      rehab: selectedDeal.repairEstimate ?? null,
      beds: selectedDeal.property?.beds ?? null,
    };
    ranked = buyers
      .map((buyer) => ({ buyer, score: buyerMatchScore(dealInput, buyer) }))
      .sort((a, b) => b.score - a.score);
  }

  return (
    <div>
      <PageHeader
        title="Dispositions"
        subtitle="Match deals to your cash buyers' buy boxes and blast them out."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Dispo-Ready Deals" value={String(deals.length)} />
        <StatCard label="Active Buyers" value={String(buyers.length)} />
        <StatCard
          label="Assignment Fee Pipeline"
          value={currency(totalAssignmentFee)}
          accent="text-emerald-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Left: deals */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">Deals</h2>
          {deals.length === 0 ? (
            <EmptyState
              title="No active deals"
              description="Deals in the dispositions pipeline will appear here."
            />
          ) : (
            deals.map((deal) => {
              const isSelected = deal.id === selectedId;
              return (
                <div
                  key={deal.id}
                  className={clsx(
                    "card p-4 transition",
                    isSelected
                      ? "ring-2 ring-brand-500 border-brand-500"
                      : "hover:border-slate-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{deal.title}</p>
                      <div className="mt-1">
                        <Badge options={DEAL_STAGES} value={deal.stage} />
                      </div>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-slate-500">Contract</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {currency(deal.contractPrice)}
                    </dd>
                    <dt className="text-slate-500">Resale</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {currency(deal.resalePrice)}
                    </dd>
                    <dt className="text-slate-500">Assignment Fee</dt>
                    <dd className="text-right font-semibold text-emerald-600">
                      {currency(deal.assignmentFee)}
                    </dd>
                    <dt className="text-slate-500">Buyer</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {deal.buyer
                        ? deal.buyer.company || fullName(deal.buyer.firstName, deal.buyer.lastName)
                        : <span className="text-slate-400">Unassigned</span>}
                    </dd>
                  </dl>

                  <div className="mt-3 text-right">
                    <Link
                      href={`/dispositions?deal=${deal.id}`}
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      Match buyers →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: matched buyers */}
        <div>
          {!selectedDeal ? (
            <EmptyState
              title="Pick a deal to match"
              description="Select a deal from the left to see your cash buyers ranked by buy-box fit."
            />
          ) : (
            <Section title={`Matched Buyers · ${selectedDeal.title}`}>
              {/* Blast form */}
              <form action={blastDeal} className="border-b border-slate-200 px-5 py-4">
                <input type="hidden" name="dealId" value={selectedDeal.id} />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Buyers scoring 50%+ are pre-selected.
                  </p>
                  <SubmitButton>📣 Blast Deal</SubmitButton>
                </div>

                <div className="mt-3 space-y-2">
                  {ranked.length === 0 ? (
                    <p className="text-sm text-slate-400">No active buyers to blast.</p>
                  ) : (
                    ranked.map(({ buyer, score }) => (
                      <label
                        key={buyer.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          name="buyerIds"
                          value={buyer.id}
                          defaultChecked={score >= 50}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {buyer.company || fullName(buyer.firstName, buyer.lastName)}
                        </span>
                        <span className={clsx("badge shrink-0", scoreColor(score))}>
                          {percent(score)} match
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </form>

              {/* Ranked buyer rows */}
              {ranked.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  No active buyers found.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {ranked.map(({ buyer, score }) => (
                    <li key={buyer.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-900">
                              {buyer.company || fullName(buyer.firstName, buyer.lastName)}
                            </p>
                            <Badge options={BUYER_STATUSES} value={buyer.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {labelOf(BUYER_TYPES, buyer.buyerType)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={clsx("badge", scoreColor(score))}>
                            {percent(score)} match
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={clsx("h-full rounded-full", scoreBarColor(score))}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <dt className="text-slate-500">Price range</dt>
                        <dd className="text-right text-slate-800">
                          {buyer.minPrice == null && buyer.maxPrice == null
                            ? "Any"
                            : `${currency(buyer.minPrice)} – ${currency(buyer.maxPrice)}`}
                        </dd>
                        <dt className="text-slate-500">Markets</dt>
                        <dd className="truncate text-right text-slate-800">
                          {buyer.markets || "Any"}
                        </dd>
                      </dl>

                      <form
                        action={assignBuyerToDeal.bind(null, selectedDeal.id, buyer.id)}
                        className="mt-3 text-right"
                      >
                        <button
                          type="submit"
                          className={clsx(
                            "btn-secondary",
                            selectedDeal.buyerId === buyer.id && "opacity-60"
                          )}
                        >
                          {selectedDeal.buyerId === buyer.id ? "Assigned ✓" : "Assign"}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
