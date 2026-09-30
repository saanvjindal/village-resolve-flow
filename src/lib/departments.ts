export const CATEGORIES = {
  road: { label: "Road", department: "PWD / Panchayat Raj Engineering", slaDays: 15, icon: "🛣️" },
  water: { label: "Water", department: "Rural Water Supply Department", slaDays: 3, icon: "💧" },
  electricity: { label: "Electricity", department: "State Electricity Distribution Co.", slaDays: 2, icon: "⚡" },
  sanitation: { label: "Sanitation", department: "Gram Panchayat (Local Authority)", slaDays: 7, icon: "🧹" },
  healthcare: { label: "Healthcare", department: "District Health Office / PHC", slaDays: 3, icon: "🏥" },
  agriculture: { label: "Agriculture", department: "Agriculture Department", slaDays: 10, icon: "🌾" },
  scheme: { label: "Government Scheme", department: "Block Development Office", slaDays: 21, icon: "📜" },
  other: { label: "Other", department: "Block Development Office", slaDays: 14, icon: "📌" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export const STATUS_STEPS = ["submitted", "received", "assigned", "in_progress", "resolved"] as const;
export const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  received: "Received",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

export type MediaItem = { path: string; type: string; url?: string };
