"use client";

import { useTransition } from "react";
import { assignBuyer } from "../actions";

export function BuyerControl({
  dealId,
  buyerId,
  buyers,
}: {
  dealId: string;
  buyerId: string | null;
  buyers: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        className="input max-w-[220px]"
        defaultValue={buyerId ?? ""}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => assignBuyer(dealId, e.target.value))
        }
      >
        <option value="">Unassigned</option>
        {buyers.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
