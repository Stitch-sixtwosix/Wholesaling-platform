"use client";

import { useTransition } from "react";
import { Select } from "@/components/Form";
import { BUYER_STATUSES } from "@/lib/constants";
import { updateBuyerStatus } from "../actions";

export function StatusControl({ buyerId, status }: { buyerId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Select
        options={BUYER_STATUSES}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateBuyerStatus(buyerId, e.target.value))
        }
        className="max-w-[200px]"
      />
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
