import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, Section, EmptyState, LinkButton } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { CAMPAIGN_CHANNELS } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { createTemplate, updateTemplate, deleteTemplate } from "../actions";

export const dynamic = "force-dynamic";

const MERGE_HINT =
  "Merge tags supported: {{firstName}}, {{address}}, {{arv}}, {{agent}}";

export default async function TemplatesPage() {
  const { orgId } = await requireUser();
  const templates = await prisma.template.findMany({ where: { orgId }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Templates"
        subtitle="Reusable message scripts for SMS, email, and mailers."
        action={<LinkButton href="/marketing">Back to Marketing</LinkButton>}
      />

      <Section title="New Template" className="mb-6">
        <form action={createTemplate} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input name="name" required placeholder="Initial SMS — Absentee" />
            </Field>
            <Field label="Channel">
              <Select name="channel" options={CAMPAIGN_CHANNELS} defaultValue="sms" />
            </Field>
          </div>
          <Field label="Subject">
            <Input name="subject" placeholder="(email only) Quick question about {{address}}" />
          </Field>
          <Field label="Body" hint={MERGE_HINT}>
            <Textarea
              name="body"
              rows={4}
              placeholder="Hi {{firstName}}, are you open to an offer on {{address}}?"
            />
          </Field>
          <div className="flex justify-end">
            <SubmitButton>Create Template</SubmitButton>
          </div>
        </form>
      </Section>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create your first message template above to reuse it across campaigns."
        />
      ) : (
        <div className="space-y-6">
          {templates.map((t) => (
            <Section
              key={t.id}
              title={t.name}
              action={<Badge options={CAMPAIGN_CHANNELS} value={t.channel} />}
            >
              <form action={updateTemplate} className="space-y-4 p-5">
                <input type="hidden" name="id" value={t.id} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name *">
                    <Input name="name" required defaultValue={t.name} />
                  </Field>
                  <Field label="Channel">
                    <Select name="channel" options={CAMPAIGN_CHANNELS} defaultValue={t.channel} />
                  </Field>
                </div>
                <Field label="Subject">
                  <Input name="subject" defaultValue={t.subject ?? ""} />
                </Field>
                <Field label="Body" hint={MERGE_HINT}>
                  <Textarea name="body" rows={4} defaultValue={t.body} />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Updated {relativeTime(t.updatedAt)}</p>
                  <SubmitButton>Save</SubmitButton>
                </div>
              </form>
              <div className="border-t border-slate-100 p-5">
                <form action={deleteTemplate.bind(null, t.id)}>
                  <button
                    type="submit"
                    className="btn-secondary text-rose-600 hover:bg-rose-50"
                  >
                    Delete Template
                  </button>
                </form>
              </div>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
