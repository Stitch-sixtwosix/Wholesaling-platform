"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV: { group: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "📊" }],
  },
  {
    group: "Acquisitions",
    items: [
      { href: "/leads", label: "Seller Leads", icon: "🎯" },
      { href: "/pipeline", label: "Deal Pipeline", icon: "🗂️" },
      { href: "/properties", label: "Properties", icon: "🏠" },
      { href: "/analyzer", label: "Deal Analyzer", icon: "🧮" },
    ],
  },
  {
    group: "Dispositions",
    items: [
      { href: "/buyers", label: "Cash Buyers", icon: "💰" },
      { href: "/dispositions", label: "Deal Matching", icon: "🔁" },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/marketing", label: "Marketing", icon: "📣" },
      { href: "/contracts", label: "Contracts", icon: "📄" },
      { href: "/tasks", label: "Tasks", icon: "✅" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          W
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Wholesale<span className="text-brand-600">OS</span>
        </span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((section) => (
          <div key={section.group}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.group}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4 text-xs text-slate-400">
        v0.1 · Demo data
      </div>
    </aside>
  );
}
