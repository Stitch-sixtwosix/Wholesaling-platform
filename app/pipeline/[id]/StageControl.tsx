"use client";

import { useTransition } from "react";
import { Select } from "@/components/Form";
import { DEAL_STAGES } from "@/lib/constants";
import { updateDealStage } from "../actions";

export function StageControl({ dealId, stage }: { dealId: string; stage: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Select
        options={DEAL_STAGES}
        defaultValue={stage}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateDealStage(dealId, e.target.value))
        }
        className="max-w-[200px]"
      />
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
