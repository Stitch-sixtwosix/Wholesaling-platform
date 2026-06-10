import Link from "next/link";
import clsx from "clsx";
import { Field, Input } from "@/components/Form";
import { login, register } from "./actions";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; rerror?: string; next?: string; mode?: string };
}) {
  const next = searchParams.next ?? "/";
  const isRegister = searchParams.mode === "register";
  const nextQs = next && next !== "/" ? `&next=${encodeURIComponent(next)}` : "";

  const registerError =
    searchParams.rerror === "exists"
      ? "An account with that email already exists. Try signing in."
      : searchParams.rerror === "invalid"
      ? "Enter an organization name, your name, a valid email, and a password of at least 6 characters."
      : null;

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
          <p className="mt-1 text-sm text-slate-500">
            {isRegister ? "Create your organization" : "Sign in to your workspace"}
          </p>
        </div>

        {/* Sign In / Register tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1">
          <Link
            href={`/login${nextQs ? `?${nextQs.slice(1)}` : ""}`}
            className={clsx(
              "rounded-lg py-2 text-center text-sm font-medium transition",
              !isRegister ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sign In
          </Link>
          <Link
            href={`/login?mode=register${nextQs}`}
            className={clsx(
              "rounded-lg py-2 text-center text-sm font-medium transition",
              isRegister ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Register
          </Link>
        </div>

        <div className="card p-6">
          {!isRegister ? (
            <>
              {searchParams.error && (
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
            </>
          ) : (
            <>
              {registerError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {registerError}
                </div>
              )}
              <form action={register} className="space-y-4">
                <Field label="Organization name" hint="Your company / team workspace.">
                  <Input name="orgName" type="text" required placeholder="Acme Home Buyers" autoFocus />
                </Field>
                <Field label="Your name">
                  <Input name="name" type="text" required placeholder="Jordan Smith" />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" required placeholder="you@yourcompany.com" />
                </Field>
                <Field label="Password" hint="At least 6 characters.">
                  <Input name="password" type="password" required minLength={6} placeholder="••••••••" />
                </Field>
                <button type="submit" className="btn-primary w-full">
                  Create Organization
                </button>
                <p className="text-center text-xs text-slate-400">
                  You'll be the admin and can invite your team next.
                </p>
              </form>
            </>
          )}
        </div>

        {!isRegister && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p className="mb-2 font-semibold text-slate-600">Demo accounts</p>
            <ul className="space-y-1">
              <li>👑 <strong>Master:</strong> jordan@wholesaleos.com / admin123</li>
              <li>🎯 <strong>Acquisitions:</strong> maya@wholesaleos.com / acq123</li>
              <li>💰 <strong>Dispositions:</strong> devon@wholesaleos.com / dispo123</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
