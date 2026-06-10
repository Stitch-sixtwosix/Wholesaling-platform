import Link from "next/link";
import { prisma } from "@/lib/db";
import { Field, Input } from "@/components/Form";
import { acceptInvite } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  acquisitions: "Acquisitions Manager",
  dispositions: "Dispositions Manager",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const invite = await prisma.invitation.findUnique({ where: { token: params.token } });
  const org = invite ? await prisma.organization.findUnique({ where: { id: invite.orgId } }) : null;

  const invalid = !invite || invite.accepted || !org;

  const error =
    searchParams.error === "invalid"
      ? "Enter your name and a password of at least 6 characters."
      : searchParams.error === "used"
      ? "This invitation is no longer valid."
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
        </div>

        <div className="card p-6">
          {invalid ? (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-800">This invitation isn't valid.</p>
              <p className="mt-1 text-sm text-slate-500">
                It may have already been used or revoked. Ask your admin for a new link.
              </p>
              <Link href="/login" className="btn-ghost mt-4 inline-block text-sm">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-600">
                You've been invited to join{" "}
                <strong className="text-slate-900">{org!.name}</strong> as{" "}
                <strong className="text-slate-900">{ROLE_LABELS[invite!.role] ?? invite!.role}</strong>.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form action={acceptInvite} className="space-y-4">
                <input type="hidden" name="token" value={params.token} />
                <Field label="Email">
                  <Input type="email" value={invite!.email} readOnly className="bg-slate-50 text-slate-500" />
                </Field>
                <Field label="Your name">
                  <Input name="name" type="text" required placeholder="Alex Rivera" autoFocus />
                </Field>
                <Field label="Create a password" hint="At least 6 characters.">
                  <Input name="password" type="password" required minLength={6} placeholder="••••••••" />
                </Field>
                <button type="submit" className="btn-primary w-full">
                  Join {org!.name}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
