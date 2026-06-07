import { format, formatDistanceToNow } from "date-fns";

export function currency(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(value);
}

export function number(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function percent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function date(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
}

export function dateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function fullName(first: string, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ");
}

export function initials(first: string, last?: string | null): string {
  return [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase();
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
