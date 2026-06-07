"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = (v as string | null)?.trim();
  return s ? s : undefined;
}
function dateOf(v: FormDataEntryValue | null): Date | undefined {
  const s = (v as string | null)?.trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createTask(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) throw new Error("Title is required");

  await prisma.task.create({
    data: {
      title,
      description: str(formData.get("description")),
      priority: str(formData.get("priority")) ?? "medium",
      status: str(formData.get("status")) ?? "open",
      dueDate: dateOf(formData.get("dueDate")),
      leadId: str(formData.get("leadId")),
      dealId: str(formData.get("dealId")),
      ownerId: str(formData.get("ownerId")),
    },
  });

  revalidatePath("/tasks");
}

export async function toggleTask(taskId: string, done: boolean) {
  await prisma.task.update({
    where: { id: taskId },
    data: done
      ? { status: "done", completedAt: new Date() }
      : { status: "open", completedAt: null },
  });
  revalidatePath("/tasks");
}

export async function updateTaskStatus(taskId: string, status: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}
