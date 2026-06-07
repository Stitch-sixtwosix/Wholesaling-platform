"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui";
import { TASK_PRIORITIES } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { toggleTask, deleteTask } from "./actions";

export type TaskItemData = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  overdue?: boolean;
  relatedLabel?: string;
};

export function TaskItem({ task }: { task: TaskItemData }) {
  const [pending, startTransition] = useTransition();
  const done = task.status === "done";

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-5 py-3",
        pending && "opacity-60"
      )}
    >
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={() => startTransition(() => toggleTask(task.id, !done))}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />

      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "truncate text-sm font-medium",
            done ? "text-slate-400 line-through" : "text-slate-800"
          )}
        >
          {task.title}
        </p>
        {task.relatedLabel && (
          <p className="truncate text-xs text-slate-400">{task.relatedLabel}</p>
        )}
      </div>

      <Badge options={TASK_PRIORITIES} value={task.priority} className="shrink-0" />

      <span
        className={clsx(
          "w-28 shrink-0 text-right text-xs",
          task.overdue && !done ? "font-medium text-rose-600" : "text-slate-400"
        )}
      >
        {task.dueDate ? relativeTime(task.dueDate) : "—"}
      </span>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this task?")) {
            startTransition(() => deleteTask(task.id));
          }
        }}
        className="shrink-0 rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
        aria-label="Delete task"
        title="Delete task"
      >
        ✕
      </button>
    </div>
  );
}
