import { PageHeader } from "@/components/ui";
import { AnalyzerClient } from "./AnalyzerClient";

function toNumber(value: string | string[] | undefined): number | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export default function AnalyzerPage({
  searchParams,
}: {
  searchParams: { arv?: string | string[]; repairs?: string | string[] };
}) {
  const initialArv = toNumber(searchParams.arv);
  const initialRepairs = toNumber(searchParams.repairs);

  return (
    <div>
      <PageHeader
        title="Deal Analyzer"
        subtitle="Run the numbers on a wholesale deal using the 70% rule and back into your Maximum Allowable Offer (MAO)."
      />
      <AnalyzerClient initialArv={initialArv} initialRepairs={initialRepairs} />
    </div>
  );
}
