import { prisma } from "@/lib/db";
import { signContract } from "./actions";

export const dynamic = "force-dynamic";

function money(n: number | null | undefined) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "—";
}

export default async function SignPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { state?: string };
}) {
  const contract = await prisma.contract.findUnique({
    where: { signToken: params.token },
  });

  // Shell wrapper for all states.
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );

  if (!contract) {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">Signing link not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This link is invalid or has expired. Please contact the sender for a new one.
          </p>
        </div>
      </Shell>
    );
  }

  const alreadySigned =
    contract.status === "signed" ||
    contract.status === "executed" ||
    searchParams.state === "signed" ||
    searchParams.state === "already";

  if (alreadySigned) {
    return (
      <Shell>
        <div className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Contract signed</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you{contract.signerName ? `, ${contract.signerName}` : ""}. Your signature has been
            recorded{contract.signedDate ? ` on ${contract.signedDate.toLocaleString()}` : ""}. A copy
            stays on file with the sender. You can close this page.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">{contract.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Please review the document below, then sign at the bottom.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400">Property</p>
          <p className="text-sm font-medium text-slate-800">{contract.propertyAddress ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Purchase Price</p>
          <p className="text-sm font-medium text-slate-800">{money(contract.purchasePrice)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Seller</p>
          <p className="text-sm font-medium text-slate-800">{contract.sellerName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Buyer</p>
          <p className="text-sm font-medium text-slate-800">{contract.buyerName ?? "—"}</p>
        </div>
      </div>

      {/* Document */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
          {contract.body ?? "No document body available."}
        </pre>
      </div>

      {/* Sign */}
      <form
        action={signContract}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="token" value={params.token} />
        <h2 className="text-lg font-semibold text-slate-800">Sign electronically</h2>
        <p className="mt-1 text-xs text-slate-500">
          Type your full legal name to sign. This is a legally binding electronic signature under the
          U.S. ESIGN Act and UETA.
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Full legal name</span>
          <input
            name="signerName"
            required
            placeholder="Type your name to sign"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-[cursive] text-xl text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="mt-4 flex items-start gap-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-600">
            I agree to sign this document electronically and intend my typed name to be my legal
            signature.
          </span>
        </label>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
        >
          ✍️ Sign Contract
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Your name, the date/time, and your IP address are recorded as proof of signature.
        </p>
      </form>
    </Shell>
  );
}
