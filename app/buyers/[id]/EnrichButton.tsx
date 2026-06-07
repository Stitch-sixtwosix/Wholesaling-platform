"use client";

import { useState, useTransition } from "react";
import { enrichBuyer } from "../discover/actions";

export function EnrichButton({ buyerId }: { buyerId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run() {
    if (
      !confirm(
        "Enrich this buyer with Apollo? This consumes 1 Apollo credit per matched person (no charge if not found)."
      )
    )
      return;
    setMsg(null);
    startTransition(async () => {
      const res = await enrichBuyer(buyerId);
      setMsg({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div className="p-5">
      <button onClick={run} disabled={pending} className="btn-primary w-full">
        {pending ? "Enriching…" : "✨ Enrich with Apollo"}
      </button>
      <p className="mt-2 text-xs text-slate-400">
        Reveals verified email &amp; phone. Uses 1 Apollo credit per match.
      </p>
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-600" : "text-amber-600"}`}>{msg.text}</p>
      )}
    </div>
  );
}
