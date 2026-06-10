"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select nothing, user can copy from the field.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="input max-w-[220px] py-1 text-xs text-slate-500"
      />
      <button type="button" onClick={copy} className="btn-ghost text-xs">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
