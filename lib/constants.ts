// Domain vocabulary used across the platform — labels + display colors.

export type Option = { value: string; label: string; color?: string };

export const LEAD_STATUSES: Option[] = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "qualified", label: "Qualified", color: "bg-indigo-100 text-indigo-700" },
  { value: "appointment", label: "Appointment", color: "bg-violet-100 text-violet-700" },
  { value: "offer_made", label: "Offer Made", color: "bg-amber-100 text-amber-700" },
  { value: "under_contract", label: "Under Contract", color: "bg-emerald-100 text-emerald-700" },
  { value: "nurture", label: "Nurture", color: "bg-cyan-100 text-cyan-700" },
  { value: "dead", label: "Dead", color: "bg-rose-100 text-rose-700" },
];

export const LEAD_SOURCES: Option[] = [
  { value: "ppc", label: "PPC / Ads" },
  { value: "seo", label: "SEO / Website" },
  { value: "direct_mail", label: "Direct Mail" },
  { value: "cold_call", label: "Cold Call" },
  { value: "sms", label: "SMS / Text" },
  { value: "driving_for_dollars", label: "Driving for Dollars" },
  { value: "referral", label: "Referral" },
  { value: "list", label: "Pulled List" },
  { value: "bandit_sign", label: "Bandit Sign" },
  { value: "other", label: "Other" },
];

export const MOTIVATIONS: Option[] = [
  { value: "foreclosure", label: "Foreclosure / Pre-foreclosure" },
  { value: "divorce", label: "Divorce" },
  { value: "inherited", label: "Inherited / Probate" },
  { value: "tired_landlord", label: "Tired Landlord" },
  { value: "relocation", label: "Relocation" },
  { value: "financial", label: "Financial Distress" },
  { value: "repairs", label: "Major Repairs Needed" },
  { value: "vacant", label: "Vacant Property" },
  { value: "other", label: "Other" },
];

export const TEMPERATURES: Option[] = [
  { value: "hot", label: "Hot", color: "bg-rose-100 text-rose-700" },
  { value: "warm", label: "Warm", color: "bg-amber-100 text-amber-700" },
  { value: "cold", label: "Cold", color: "bg-sky-100 text-sky-700" },
];

export const DEAL_STAGES: Option[] = [
  { value: "lead", label: "Lead", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "appointment", label: "Appointment", color: "bg-violet-100 text-violet-700" },
  { value: "offer", label: "Offer", color: "bg-amber-100 text-amber-700" },
  { value: "under_contract", label: "Under Contract", color: "bg-indigo-100 text-indigo-700" },
  { value: "assigned", label: "Assigned", color: "bg-cyan-100 text-cyan-700" },
  { value: "closed", label: "Closed", color: "bg-emerald-100 text-emerald-700" },
  { value: "dead", label: "Dead", color: "bg-rose-100 text-rose-700" },
];

export const PROPERTY_TYPES: Option[] = [
  { value: "single_family", label: "Single Family" },
  { value: "multi_family", label: "Multi Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land" },
  { value: "mobile", label: "Mobile Home" },
  { value: "commercial", label: "Commercial" },
];

export const PROPERTY_CONDITIONS: Option[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "distressed", label: "Distressed" },
  { value: "unknown", label: "Unknown" },
];

export const OCCUPANCY: Option[] = [
  { value: "owner", label: "Owner Occupied" },
  { value: "tenant", label: "Tenant Occupied" },
  { value: "vacant", label: "Vacant" },
  { value: "unknown", label: "Unknown" },
];

export const BUYER_TYPES: Option[] = [
  { value: "flipper", label: "Fix & Flipper" },
  { value: "landlord", label: "Buy & Hold Landlord" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "owner_occupant", label: "Owner Occupant" },
  { value: "hedge_fund", label: "Hedge Fund / iBuyer" },
  { value: "other", label: "Other" },
];

export const BUYER_STATUSES: Option[] = [
  { value: "vip", label: "VIP", color: "bg-amber-100 text-amber-700" },
  { value: "active", label: "Active", color: "bg-emerald-100 text-emerald-700" },
  { value: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-600" },
];

export const CAMPAIGN_CHANNELS: Option[] = [
  { value: "sms", label: "SMS / Text" },
  { value: "email", label: "Email" },
  { value: "direct_mail", label: "Direct Mail" },
  { value: "cold_call", label: "Cold Call" },
  { value: "rvm", label: "Ringless Voicemail" },
  { value: "ppc", label: "PPC / Ads" },
];

export const CAMPAIGN_STATUSES: Option[] = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "active", label: "Active", color: "bg-emerald-100 text-emerald-700" },
  { value: "paused", label: "Paused", color: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-700" },
];

export const CONTRACT_TYPES: Option[] = [
  { value: "purchase", label: "Purchase Agreement" },
  { value: "assignment", label: "Assignment Agreement" },
  { value: "jv", label: "JV Agreement" },
  { value: "option", label: "Option Agreement" },
];

export const CONTRACT_STATUSES: Option[] = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700" },
  { value: "signed", label: "Signed", color: "bg-indigo-100 text-indigo-700" },
  { value: "executed", label: "Executed", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-700" },
];

export const TASK_PRIORITIES: Option[] = [
  { value: "urgent", label: "Urgent", color: "bg-rose-100 text-rose-700" },
  { value: "high", label: "High", color: "bg-amber-100 text-amber-700" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-600" },
];

export const TASK_STATUSES: Option[] = [
  { value: "open", label: "Open", color: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "done", label: "Done", color: "bg-emerald-100 text-emerald-700" },
];

export const ACTIVITY_TYPES: Option[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "offer", label: "Offer" },
  { value: "status_change", label: "Status Change" },
  { value: "system", label: "System" },
];

export function labelOf(options: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function colorOf(options: Option[], value: string | null | undefined): string {
  if (!value) return "bg-slate-100 text-slate-600";
  return options.find((o) => o.value === value)?.color ?? "bg-slate-100 text-slate-600";
}
