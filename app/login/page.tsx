import { Field, Input } from "@/components/Form";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const error = searchParams.error;
  const next = searchParams.next ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            W
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Wholesale<span className="text-brand-600">OS</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Invalid email or password.
            </div>
          )}
          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <Field label="Email">
              <Input name="email" type="email" required placeholder="you@wholesaleos.com" autoFocus />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required placeholder="••••••••" />
            </Field>
            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="mb-2 font-semibold text-slate-600">Demo accounts</p>
          <ul className="space-y-1">
            <li>👑 <strong>Master:</strong> jordan@wholesaleos.com / admin123</li>
            <li>🎯 <strong>Acquisitions:</strong> maya@wholesaleos.com / acq123</li>
            <li>💰 <strong>Dispositions:</strong> devon@wholesaleos.com / dispo123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
