"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Field, Input, Select } from "@/components/Form";
import { Section, StatCard } from "@/components/ui";
import { currency, percent } from "@/lib/format";
import { analyzeDeal, estimateRehab, REHAB_TIERS } from "@/lib/analyzer";

/** Empty / blank / NaN -> 0, otherwise the parsed number. */
function num(value: string): number {
  if (value.trim() === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function AnalyzerClient({
  initialArv,
  initialRepairs,
}: {
  initialArv?: number;
  initialRepairs?: number;
}) {
  // Inputs are stored as raw strings so the fields can be cleared cleanly.
  const [arv, setArv] = useState(initialArv != null ? String(initialArv) : "");
  const [repairEstimate, setRepairEstimate] = useState(
    initialRepairs != null ? String(initialRepairs) : ""
  );
  const [desiredAssignmentFee, setDesiredAssignmentFee] = useState("10000");
  const [rulePct, setRulePct] = useState("70");
  const [holdingCosts, setHoldingCosts] = useState("");
  const [closingCosts, setClosingCosts] = useState("");
  const [agentCommission, setAgentCommission] = useState("");

  // Rehab estimator subsection.
  const [sqft, setSqft] = useState("");
  const [rehabTier, setRehabTier] = useState(REHAB_TIERS[1].value);

  const result = useMemo(
    () =>
      analyzeDeal({
        arv: num(arv),
        repairEstimate: num(repairEstimate),
        desiredAssignmentFee: num(desiredAssignmentFee),
        rule: num(rulePct) / 100,
        holdingCosts: num(holdingCosts),
        closingCosts: num(closingCosts),
        agentCommission: num(agentCommission),
      }),
    [
      arv,
      repairEstimate,
      desiredAssignmentFee,
      rulePct,
      holdingCosts,
      closingCosts,
      agentCommission,
    ]
  );

  const viable = result.isViable && result.sellerMao > 0;

  function applyEstimate() {
    setRepairEstimate(String(estimateRehab(num(sqft), rehabTier)));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: inputs */}
      <Section title="Deal Inputs">
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="After Repair Value (ARV)" hint="Estimated resale value once fixed up.">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0"
                value={arv}
                onChange={(e) => setArv(e.target.value)}
              />
            </Field>
            <Field label="Repair Estimate" hint="Total rehab budget.">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0"
                value={repairEstimate}
                onChange={(e) => setRepairEstimate(e.target.value)}
              />
            </Field>
            <Field label="Desired Assignment Fee" hint="Your wholesale spread.">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0"
                value={desiredAssignmentFee}
                onChange={(e) => setDesiredAssignmentFee(e.target.value)}
              />
            </Field>
            <Field label="Rule (%)" hint="The classic wholesale rule is 70%.">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                placeholder="70"
                value={rulePct}
                onChange={(e) => setRulePct(e.target.value)}
              />
            </Field>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Flipper costs (optional)
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Holding Costs">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  value={holdingCosts}
                  onChange={(e) => setHoldingCosts(e.target.value)}
                />
              </Field>
              <Field label="Closing Costs">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  value={closingCosts}
                  onChange={(e) => setClosingCosts(e.target.value)}
                />
              </Field>
              <Field label="Agent Commission (%)">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  value={agentCommission}
                  onChange={(e) => setAgentCommission(e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Rehab estimator */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Rehab Estimator
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Square Footage">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                />
              </Field>
              <Field label="Rehab Tier">
                <Select
                  options={REHAB_TIERS.map((t) => ({ value: t.value, label: t.label }))}
                  value={rehabTier}
                  onChange={(e) => setRehabTier(e.target.value)}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={applyEstimate}
              className="btn-secondary mt-3"
            >
              Apply estimate
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Estimates {currency(estimateRehab(num(sqft), rehabTier))} and fills the
              Repair Estimate field.
            </p>
          </div>
        </div>
      </Section>

      {/* RIGHT: results */}
      <div className="space-y-6">
        {/* Viability banner */}
        <div
          className={clsx(
            "rounded-xl border px-5 py-4 text-sm font-medium",
            viable
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {viable
            ? "Deal looks viable — your offer leaves room for your assignment fee."
            : "Margins are thin — renegotiate the price or lower your fee."}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Buyer MAO"
            value={currency(result.buyerMao)}
            sublabel="What an end-buyer should pay"
          />
          <StatCard
            label="Your Max Offer to Seller"
            value={currency(result.sellerMao)}
            sublabel="Most you can offer the seller"
            accent="text-brand-600"
          />
          <StatCard
            label="Your Assignment Fee"
            value={currency(result.assignmentFee)}
            sublabel="Your spread on the deal"
            accent="text-emerald-600"
          />
          <StatCard
            label="Est. Flipper Profit"
            value={currency(result.estimatedFlipProfit)}
            sublabel="Buyer's rough net at Buyer MAO"
          />
        </div>

        {/* Breakdown */}
        <Section title="How we got there">
          <dl className="divide-y divide-slate-100 px-5 text-sm">
            <Row label="ARV" value={currency(num(arv))} />
            <Row
              label={`× Rule (${percent(num(rulePct))})`}
              value={currency(num(arv) * (num(rulePct) / 100))}
            />
            <Row label="− Repairs" value={`(${currency(num(repairEstimate))})`} />
            <Row label="= Buyer MAO" value={currency(result.buyerMao)} strong />
            <Row
              label="− Your Assignment Fee"
              value={`(${currency(num(desiredAssignmentFee))})`}
            />
            <Row
              label="= Your Offer to Seller"
              value={currency(result.sellerMao)}
              strong
            />
          </dl>
        </Section>

        {/* Formula explainer */}
        <div className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-slate-800">The formulas</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              Buyer MAO = ARV × Rule − Repairs
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              Your Offer = Buyer MAO − Assignment Fee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={clsx(strong ? "font-semibold text-slate-800" : "text-slate-500")}>
        {label}
      </dt>
      <dd
        className={clsx(
          "tabular-nums",
          strong ? "font-semibold text-slate-900" : "text-slate-700"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
