"use client";

import { useTransition } from "react";
import { Select } from "@/components/Form";
import { CONTRACT_STATUSES } from "@/lib/constants";
import { updateContractStatus } from "../actions";

export function StatusControl({ contractId, status }: { contractId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Select
        options={CONTRACT_STATUSES}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateContractStatus(contractId, e.target.value))
        }
        className="max-w-[200px]"
      />
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
