import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Section, Badge, DataTable } from "@/components/ui";
import { Field, Input, Select, SubmitButton } from "@/components/Form";
import { relativeTime } from "@/lib/format";
import { createUser, deleteUser, setUserActive, setUserRole, resetPassword } from "./actions";

export const dynamic = "force-dynamic";

const ROLES = [
  { value: "admin", label: "Master Admin (full access)" },
  { value: "acquisitions", label: "Acquisitions Manager" },
  { value: "dispositions", label: "Dispositions Manager" },
  { value: "manager", label: "Manager (full access, non-admin)" },
];

const ROLE_BADGES = [
  { value: "admin", label: "Master Admin", color: "bg-violet-100 text-violet-700" },
  { value: "manager", label: "Manager", color: "bg-indigo-100 text-indigo-700" },
  { value: "acquisitions", label: "Acquisitions", color: "bg-blue-100 text-blue-700" },
  { value: "dispositions", label: "Dispositions", color: "bg-emerald-100 text-emerald-700" },
];

export default async function TeamPage() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="Team & Access"
        subtitle="Create and manage logins for your acquisition and disposition managers."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Status</th>
                <th className="th">Added</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isMe = u.id === me.uid;
                const toggle = setUserActive.bind(null, u.id, !u.active);
                const remove = deleteUser.bind(null, u.id);
                return (
                  <tr key={u.id} className="align-top hover:bg-slate-50">
                    <td className="td font-medium text-slate-800">
                      {u.name}
                      {isMe && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="td text-slate-500">{u.email}</td>
                    <td className="td">
                      <form action={setUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <Select
                          name="role"
                          options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                          defaultValue={u.role}
                          className="max-w-[150px] py-1 text-xs"
                        />
                        <button type="submit" className="btn-ghost text-xs">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="td">
                      <Badge
                        options={[
                          { value: "true", label: "Active", color: "bg-emerald-100 text-emerald-700" },
                          { value: "false", label: "Disabled", color: "bg-slate-100 text-slate-500" },
                        ]}
                        value={String(u.active)}
                      />
                    </td>
                    <td className="td text-slate-400">{relativeTime(u.createdAt)}</td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        {!isMe && (
                          <form action={toggle}>
                            <button type="submit" className="btn-ghost text-xs">
                              {u.active ? "Disable" : "Enable"}
                            </button>
                          </form>
                        )}
                        {!isMe && (
                          <form action={remove}>
                            <button type="submit" className="btn-ghost text-xs text-rose-600">
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>

          <Section title="Reset a Password" className="mt-6">
            <form action={resetPassword} className="flex flex-wrap items-end gap-3 p-5">
              <Field label="User" className="min-w-[200px] flex-1">
                <Select
                  name="userId"
                  options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                />
              </Field>
              <Field label="New Password" className="min-w-[180px] flex-1">
                <Input name="password" type="text" placeholder="min 6 characters" />
              </Field>
              <SubmitButton>Reset</SubmitButton>
            </form>
          </Section>
        </div>

        <div>
          <Section title="Add a Login">
            <form action={createUser} className="space-y-4 p-5">
              <Field label="Full Name">
                <Input name="name" required placeholder="Alex Rivera" />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" required placeholder="alex@wholesaleos.com" />
              </Field>
              <Field label="Role">
                <Select name="role" options={ROLES.map((r) => ({ value: r.value, label: r.label }))} defaultValue="acquisitions" />
              </Field>
              <Field label="Temporary Password" hint="At least 6 characters">
                <Input name="password" type="text" required placeholder="••••••" />
              </Field>
              <SubmitButton className="w-full">Create Login</SubmitButton>
            </form>
          </Section>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p className="mb-2 font-semibold text-slate-600">Role access</p>
            <ul className="space-y-1.5">
              <li><Badge options={ROLE_BADGES} value="admin" /> — everything, incl. Team</li>
              <li><Badge options={ROLE_BADGES} value="acquisitions" /> — leads, pipeline, properties, analyzer</li>
              <li><Badge options={ROLE_BADGES} value="dispositions" /> — buyers, matching, marketing</li>
              <li>Both roles share Dashboard, Contracts &amp; Tasks.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
