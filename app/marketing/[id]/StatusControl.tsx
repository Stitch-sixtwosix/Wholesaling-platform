"use client";

import { useTransition } from "react";
import { Select } from "@/components/Form";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { updateCampaignStatus } from "../actions";

export function StatusControl({ campaignId, status }: { campaignId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Select
        options={CAMPAIGN_STATUSES}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateCampaignStatus(campaignId, e.target.value))
        }
        className="max-w-[200px]"
      />
      {pending && <span className="text-xs text-slate-400">saving…</span>}
    </div>
  );
}
