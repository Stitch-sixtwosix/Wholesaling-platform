import Link from "next/link";
import { logout } from "@/app/login/actions";

const ROLE_LABELS: Record<string, string> = {
  admin: "Master Admin",
  manager: "Manager",
  acquisitions: "Acquisitions",
  dispositions: "Dispositions",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ name, role }: { name: string; role: string }) {
  const showAcq = role === "admin" || role === "manager" || role === "acquisitions";
  const showDispo = role === "admin" || role === "manager" || role === "dispositions";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div className="md:hidden">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Wholesale<span className="text-brand-600">OS</span>
        </Link>
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="flex items-center gap-3">
        {showAcq && (
          <Link href="/leads/new" className="btn-secondary text-xs">
            + Lead
          </Link>
        )}
        {showDispo && (
          <Link href="/buyers/discover" className="btn-secondary text-xs">
            🔎 Find Buyers
          </Link>
        )}
        {showAcq && (
          <Link href="/analyzer" className="btn-primary text-xs">
            Analyze a Deal
          </Link>
        )}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(name)}
          </div>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-xs font-semibold text-slate-700">{name}</p>
            <p className="text-[11px] text-slate-400">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-ghost text-xs" title="Sign out">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
