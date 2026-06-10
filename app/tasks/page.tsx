import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard, Section, EmptyState } from "@/components/ui";
import { Field, Input, Textarea, Select, SubmitButton } from "@/components/Form";
import { TASK_PRIORITIES } from "@/lib/constants";
import { fullName } from "@/lib/format";
import { TaskItem, type TaskItemData } from "./TaskItem";
import { createTask } from "./actions";

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export default async function TasksPage() {
  const { orgId } = await requireUser();
  const [tasks, leads, deals] = await Promise.all([
    prisma.task.findMany({
      where: { orgId },
      include: { lead: true, deal: true, owner: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.deal.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const relatedLabelFor = (t: (typeof tasks)[number]): string | undefined => {
    if (t.lead) return `Lead · ${fullName(t.lead.firstName, t.lead.lastName)}`;
    if (t.deal) return `Deal · ${t.deal.title}`;
    return undefined;
  };

  const isDone = (t: (typeof tasks)[number]) => t.status === "done";
  const isOverdue = (t: (typeof tasks)[number]) =>
    !isDone(t) && t.dueDate !== null && t.dueDate < todayStart;
  const isDueToday = (t: (typeof tasks)[number]) =>
    !isDone(t) &&
    t.dueDate !== null &&
    t.dueDate >= todayStart &&
    t.dueDate <= todayEnd;

  const toItem = (t: (typeof tasks)[number]): TaskItemData => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    overdue: isOverdue(t),
    relatedLabel: relatedLabelFor(t),
  });

  const overdue = tasks.filter((t) => isOverdue(t));
  const open = tasks.filter((t) => !isDone(t) && !isOverdue(t));
  const done = tasks.filter((t) => isDone(t));

  const openCount = tasks.filter((t) => !isDone(t)).length;
  const overdueCount = overdue.length;
  const dueTodayCount = tasks.filter((t) => isDueToday(t)).length;
  const completedCount = done.length;

  const leadOptions = leads.map((l) => ({
    value: l.id,
    label: fullName(l.firstName, l.lastName),
  }));
  const dealOptions = deals.map((d) => ({ value: d.id, label: d.title }));

  const renderGroup = (title: string, list: typeof tasks) => (
    <Section title={`${title} (${list.length})`}>
      {list.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">No tasks here.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {list.map((t) => (
            <TaskItem key={t.id} task={toItem(t)} />
          ))}
        </div>
      )}
    </Section>
  );

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Everything that needs doing — across leads and deals."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open" value={String(openCount)} />
        <StatCard
          label="Overdue"
          value={String(overdueCount)}
          accent={overdueCount > 0 ? "text-rose-600" : undefined}
        />
        <StatCard label="Due Today" value={String(dueTodayCount)} />
        <StatCard
          label="Completed"
          value={String(completedCount)}
          accent={completedCount > 0 ? "text-emerald-600" : undefined}
        />
      </div>

      <Section title="New Task" className="mb-6">
        <form action={createTask} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <Input name="title" required placeholder="Follow up with seller…" />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea name="description" rows={2} placeholder="Optional details…" />
          </Field>
          <Field label="Priority">
            <Select
              name="priority"
              options={TASK_PRIORITIES}
              defaultValue="medium"
            />
          </Field>
          <Field label="Due Date">
            <Input name="dueDate" type="date" />
          </Field>
          <Field label="Related Lead">
            <Select
              name="leadId"
              options={leadOptions}
              placeholder="— None —"
            />
          </Field>
          <Field label="Related Deal">
            <Select
              name="dealId"
              options={dealOptions}
              placeholder="— None —"
            />
          </Field>
          <div className="md:col-span-2">
            <SubmitButton>+ Add Task</SubmitButton>
          </div>
        </form>
      </Section>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task using the form above."
        />
      ) : (
        <div className="space-y-6">
          {renderGroup("Overdue", overdue)}
          {renderGroup("Open", open)}
          {renderGroup("Done", done)}
        </div>
      )}
    </div>
  );
}
