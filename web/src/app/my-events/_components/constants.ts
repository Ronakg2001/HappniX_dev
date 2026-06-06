import { Edit2, Clock3, Radio, CheckCircle2, Archive } from "lucide-react";

// ─── Status Config ────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  Draft:     { cardBadge: "bg-black/70 text-amber-400 border-amber-500/50",   workspaceBadge: "bg-amber-500/20 text-amber-400 border-amber-500/30",   dot: "bg-amber-400",   icon: Edit2 },
  Upcoming:  { cardBadge: "bg-black/70 text-blue-400 border-blue-500/50",     workspaceBadge: "bg-blue-500/20 text-blue-400 border-blue-500/30",     dot: "bg-blue-400",    icon: Clock3 },
  Live:      { cardBadge: "bg-black/70 text-green-400 border-green-500/50",   workspaceBadge: "bg-green-500/20 text-green-400 border-green-500/30",   dot: "bg-green-400",   icon: Radio },
  Completed: { cardBadge: "bg-black/70 text-purple-400 border-purple-500/50", workspaceBadge: "bg-purple-500/20 text-purple-400 border-purple-500/30", dot: "bg-purple-400", icon: CheckCircle2 },
  Archived:  { cardBadge: "bg-black/70 text-white/50 border-white/20",        workspaceBadge: "bg-white/5 text-white/40 border-white/10",             dot: "bg-white/30",    icon: Archive },
};

// ─── Filters ──────────────────────────────────────────────────────────────────
export const FILTERS = ["All", "Draft", "Upcoming", "Live", "Completed", "Archived"] as const;
export type FilterType = typeof FILTERS[number];

// ─── Workspace Tabs ───────────────────────────────────────────────────────────
export const UPCOMING_TABS  = ["Overview", "Attendees", "Schedule", "Tickets", "Communication", "Settings"] as const;
export const LIVE_TABS      = ["Check-In", "Sessions", "Announcements", "Live Stats"] as const;
export const COMPLETED_TABS = ["Analytics", "Reviews", "Media"] as const;

export type UpcomingTab  = typeof UPCOMING_TABS[number];
export type LiveTab      = typeof LIVE_TABS[number];
export type CompletedTab = typeof COMPLETED_TABS[number];

// ─── Number Helpers ───────────────────────────────────────────────────────────
export const fmt    = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
export const fmtRev = (n: number) => `₹${n >= 100000 ? `${(n / 100000).toFixed(1)}L` : fmt(n)}`;
