import Link from "next/link";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div className="md:hidden">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Wholesale<span className="text-brand-600">OS</span>
        </Link>
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="flex items-center gap-3">
        <Link href="/leads/new" className="btn-secondary text-xs">
          + Lead
        </Link>
        <Link href="/analyzer" className="btn-primary text-xs">
          Analyze a Deal
        </Link>
        <div className="flex items-center gap-2 pl-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            JP
          </div>
        </div>
      </div>
    </header>
  );
}
