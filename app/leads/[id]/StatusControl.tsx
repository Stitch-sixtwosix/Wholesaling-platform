"use client";

import { useTransition } from "react";
import { Select } from "@/components/Form";
import { LEAD_STATUSES } from "@/lib/constants";
import { updateLeadStatus } from "../actions";

export function StatusControl({ leadId, status }: { leadId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Select
        options={LEAD_STATUSES}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateLeadStatus(leadId, e.target.value))
        }
        className="max-w-[200px]"
      />
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
