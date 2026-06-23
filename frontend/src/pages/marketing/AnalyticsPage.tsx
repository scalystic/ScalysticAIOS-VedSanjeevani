import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  Star,
  Zap,
  AlertCircle,
  Calendar,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppData } from "@/context/AppData";
import type {
  CampaignObjective,
  CampaignItem,
  ContentCategory,
} from "@/context/AppData";

// ── Brand palette ─────────────────────────────────────────────────────────────

const C = {
  teal: "#0FA38E",
  mint: "#35C59A",
  info: "#3B82F6",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  gray: "#6B7280",
  lightGray: "#E5E7EB",
  deepGreen: "#0F2E25",
  purple: "#8B5CF6",
} as const;

// ── Core types ────────────────────────────────────────────────────────────────

type DatePreset =
  | "this_week"
  | "this_month"
  | "this_year"
  | "last_7d"
  | "last_30d"
  | "last_90d"
  | "year_2025"
  | "custom";
type Platform = "all" | "meta" | "google";
type LeaderTab = "content" | "agency" | "creator" | "type" | "format";
type SortMetric = "spend" | "revenue" | "roas" | "impressions";

interface DayData {
  date: string;
  label: string;
  spend: number;
  revenue: number;
  metaSpend: number;
  metaRevenue: number;
  googleSpend: number;
  googleRevenue: number;
}

// ── AI Insight types ──────────────────────────────────────────────────────────

type InsightType =
  | "opportunity"
  | "anomaly"
  | "highlight"
  | "prediction"
  | "risk";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
  confidence: number; // 0–100
}

const INSIGHT_STYLE: Record<
  InsightType,
  { label: string; color: string; bg: string; text: string }
> = {
  opportunity: {
    label: "Opportunity",
    color: "#0FA38E",
    bg: "rgba(15,163,142,0.10)",
    text: "#0A8A78",
  },
  anomaly: {
    label: "Anomaly",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    text: "#B45309",
  },
  highlight: {
    label: "Highlight",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.10)",
    text: "#1D4ED8",
  },
  prediction: {
    label: "Prediction",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.10)",
    text: "#6D28D9",
  },
  risk: {
    label: "Risk",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.10)",
    text: "#B91C1C",
  },
};

// ── Daily data — generated once at module level ───────────────────────────────
// Covers Jan 1 2025 → Jun 21 2026 (537 days) — deterministic, no Date.now()

const DATA_START_MS = new Date("2025-01-01").getTime();
const DATA_END_MS = new Date("2026-06-21").getTime();
const TOTAL_DAYS = Math.ceil((DATA_END_MS - DATA_START_MS) / 86_400_000) + 1;

const ALL_DAILY: DayData[] = Array.from({ length: TOTAL_DAYS }, (_, i) => {
  const ms = DATA_START_MS + i * 86_400_000;
  const d = new Date(ms);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const phase = i / (TOTAL_DAYS - 1);
  const growth = 1 + phase * 0.45;
  const wave = Math.sin(i * 0.42) * 0.12 + Math.cos(i * 0.19) * 0.07;
  const spend = Math.round(
    12_000 * (1 + wave) * (isWeekend ? 1.22 : 1) * growth,
  );
  const roas = 3.5 + Math.sin(i * 0.18) * 0.4 + phase * 0.5;
  const revenue = Math.round(spend * roas);
  const metaFrac = 0.62;
  return {
    date: d.toISOString().split("T")[0],
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    spend,
    revenue,
    metaSpend: Math.round(spend * metaFrac),
    metaRevenue: Math.round(revenue * metaFrac),
    googleSpend: Math.round(spend * (1 - metaFrac)),
    googleRevenue: Math.round(revenue * (1 - metaFrac)),
  };
});

// ── Date utilities ────────────────────────────────────────────────────────────

const TODAY = "2026-06-21";
const TODAY_MS = new Date(TODAY).getTime();

function dateMs(s: string) {
  return new Date(s).getTime();
}

function getPresetRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
): [string, string] {
  const d = new Date(TODAY);
  switch (preset) {
    case "this_week": {
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const mon = new Date(TODAY_MS - dow * 86_400_000);
      const sun = new Date(mon.getTime() + 6 * 86_400_000);
      return [mon.toISOString().split("T")[0], sun.toISOString().split("T")[0]];
    }
    case "this_month":
      return [`${TODAY.slice(0, 7)}-01`, TODAY];
    case "this_year":
      return [`${TODAY.slice(0, 4)}-01-01`, TODAY];
    case "last_7d": {
      const s = new Date(TODAY_MS - 6 * 86_400_000);
      return [s.toISOString().split("T")[0], TODAY];
    }
    case "last_30d": {
      const s = new Date(TODAY_MS - 29 * 86_400_000);
      return [s.toISOString().split("T")[0], TODAY];
    }
    case "last_90d": {
      const s = new Date(TODAY_MS - 89 * 86_400_000);
      return [s.toISOString().split("T")[0], TODAY];
    }
    case "year_2025":
      return ["2025-01-01", "2025-12-31"];
    case "custom":
      return [customStart || TODAY, customEnd || TODAY];
  }
}

function getPreviousRange(start: string, end: string): [string, string] {
  const duration = dateMs(end) - dateMs(start);
  const prevEnd = new Date(dateMs(start) - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return [
    prevStart.toISOString().split("T")[0],
    prevEnd.toISOString().split("T")[0],
  ];
}

function sliceDailyData(start: string, end: string): DayData[] {
  return ALL_DAILY.filter((d) => d.date >= start && d.date <= end);
}

function sumCampaigns(campaigns: CampaignItem[]) {
  const spend = campaigns.reduce((s, c) => s + c.spend, 0);
  const revenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  return { spend, revenue, roas: spend > 0 ? revenue / spend : 0, impressions, clicks, conversions };
}

function fmtDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-IN", opts);
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-IN", opts);
  return `${s} – ${e}`;
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function campaignInRange(c: CampaignItem, start: string, end: string) {
  const cEnd = c.endDate ?? "2099-12-31";
  return c.startDate <= end && cEnd >= start;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV(campaigns: CampaignItem[], start: string, end: string) {
  const headers = [
    "Campaign Name",
    "Platform",
    "Objective",
    "Status",
    "Agency",
    "Start Date",
    "End Date",
    "Budget Type",
    "Budget (₹)",
    "Spend (₹)",
    "Revenue (₹)",
    "ROAS",
    "Impressions",
    "Clicks",
    "CTR (%)",
    "Conversions",
    "Cost/Conv (₹)",
  ];
  const rows = campaigns.map((c) => [
    `"${c.name}"`,
    c.platform,
    c.objective,
    c.status,
    c.agency ?? "Unassigned",
    c.startDate,
    c.endDate ?? "Ongoing",
    c.budgetType,
    c.budget,
    c.spend,
    Math.round(c.revenue),
    c.roas.toFixed(2),
    c.impressions,
    c.clicks,
    c.ctr.toFixed(2),
    c.conversions,
    c.conversions > 0 ? c.costPerConversion.toFixed(0) : "—",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics_${start}_to_${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtINR(v: number) {
  if (v === 0) return "—";
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(2)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}
function fmtRoas(v: number) {
  return v > 0 ? `${v.toFixed(2)}x` : "—";
}
function fmtCompact(v: number) {
  if (v === 0) return "—";
  if (v >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// ── Shared tooltip ────────────────────────────────────────────────────────────

type TEntry = { name: string; value: number; color?: string; fill?: string };
type TTooltip = { active?: boolean; payload?: TEntry[]; label?: string };

function ChartTooltip({
  active,
  payload,
  label,
  fmt = fmtINR,
}: TTooltip & { fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-1 last:mb-0">
          {(e.color ?? e.fill) && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: e.color ?? e.fill }}
            />
          )}
          <span className="text-gray">{e.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-4">
            {fmt(e.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TipINR(props: TTooltip) {
  return <ChartTooltip {...props} fmt={fmtINR} />;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  positiveIsGood = true,
}: {
  label: string;
  value: string;
  change: number | null;
  positiveIsGood?: boolean;
}) {
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const good = positiveIsGood ? isPositive : isNegative;

  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <p className="text-xs text-gray font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
          {value}
        </p>
        {change !== null ? (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              good
                ? "text-success"
                : isNegative === isPositive
                  ? "text-gray"
                  : "text-error",
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : isNegative ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(change).toFixed(1)}% vs prev period</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray">No prior data</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────

function LeaderboardRow({
  rank,
  name,
  sub,
  spend,
  revenue,
  roas,
  maxRoas,
  impressions,
  conversions,
  sortMetric,
}: {
  rank: number;
  name: string;
  sub?: string;
  spend: number;
  revenue: number;
  roas: number;
  maxRoas: number;
  impressions: number;
  conversions: number;
  sortMetric: SortMetric;
}) {
  const barPct = maxRoas > 0 ? Math.min((roas / maxRoas) * 100, 100) : 0;
  const barColor =
    roas >= 4
      ? C.success
      : roas >= 3
        ? C.warning
        : roas > 0
          ? C.error
          : C.lightGray;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-off-white transition-colors">
      <span className="w-6 text-sm font-semibold text-gray text-right shrink-0">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        {sub && <p className="text-[11px] text-gray truncate">{sub}</p>}
      </div>
      <div className="hidden sm:block w-24 text-right">
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {sortMetric === "spend"
            ? fmtINR(spend)
            : sortMetric === "revenue"
              ? fmtINR(revenue)
              : sortMetric === "impressions"
                ? fmtCompact(impressions)
                : ""}
        </p>
        <p className="text-[11px] text-gray capitalize">{sortMetric}</p>
      </div>
      <div className="flex items-center gap-2 w-36 shrink-0">
        <div className="flex-1 h-2 rounded-full bg-light-gray overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${barPct}%`, backgroundColor: barColor }}
          />
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums w-14 text-right",
            roas >= 4
              ? "text-success"
              : roas >= 3
                ? "text-warning"
                : roas > 0
                  ? "text-error"
                  : "text-gray",
          )}
        >
          {fmtRoas(roas)}
        </span>
      </div>
      <div className="hidden lg:block w-20 text-right">
        <p className="text-sm text-slate tabular-nums">
          {fmtCompact(conversions)}
        </p>
        <p className="text-[11px] text-gray">Conv.</p>
      </div>
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="px-5 pt-5 pb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-gray mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  );
}

// ── AI Insight Card ───────────────────────────────────────────────────────────

function AIInsightCard({ insight }: { insight: Insight }) {
  const s = INSIGHT_STYLE[insight.type];
  const Icon =
    insight.type === "opportunity"
      ? TrendingUp
      : insight.type === "anomaly"
        ? AlertTriangle
        : insight.type === "highlight"
          ? Star
          : insight.type === "prediction"
            ? Zap
            : AlertCircle;

  return (
    <div
      className="bg-card rounded-xl border border-border flex flex-col transition-shadow duration-200 hover:shadow-md"
      style={{ borderTopColor: s.color, borderTopWidth: "3px" }}
    >
      {/* Top section */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5 flex-1">
        {/* Badge + confidence */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ background: s.bg, color: s.text }}
          >
            <Icon className="h-2.5 w-2.5" />
            {s.label}
          </span>
          <span className="text-[10px] text-gray tabular-nums shrink-0">
            {insight.confidence}% conf.
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-foreground leading-snug">
          {insight.title}
        </p>

        {/* Body — 4-line clamp via inline style for cross-browser safety */}
        <p
          className="text-xs text-gray leading-relaxed"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {insight.body}
        </p>
      </div>

      {/* Metric + confidence bar */}
      <div className="px-4 pt-3 pb-4 border-t border-border space-y-2.5">
        <div>
          <p
            className="text-xl font-bold tabular-nums leading-none"
            style={{ color: s.color }}
          >
            {insight.metric}
          </p>
          <p className="text-[10px] text-gray mt-1">{insight.metricLabel}</p>
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: C.lightGray }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${insight.confidence}%`,
                background: s.color,
                opacity: 0.8,
              }}
            />
          </div>
          <p className="text-[10px] text-gray">AI confidence</p>
        </div>
      </div>
    </div>
  );
}

// ── AI Insights Panel ─────────────────────────────────────────────────────────

function AIInsightsPanel({
  insights,
  loading,
  campaignCount,
  periodLabel,
}: {
  insights: Insight[];
  loading: boolean;
  campaignCount: number;
  periodLabel: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        borderColor: "rgba(15,163,142,0.22)",
        background:
          "linear-gradient(148deg, rgba(15,163,142,0.045) 0%, transparent 52%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.deepGreen }}
          >
            <Sparkles className="h-4 w-4" style={{ color: C.mint }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Insights</p>
            <p className="text-xs text-gray">
              {loading
                ? "Analysing campaigns, content, and trend data…"
                : `${insights.length} signal${insights.length !== 1 ? "s" : ""} detected · ${campaignCount} campaign${campaignCount !== 1 ? "s" : ""} · ${periodLabel}`}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              loading ? "animate-pulse" : "",
            )}
            style={{ background: loading ? C.warning : C.mint }}
          />
          <span className="text-xs text-gray">
            {loading ? "Analysing" : "Live"}
          </span>
        </div>
      </div>

      {/* Skeleton loading */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border animate-pulse"
              style={{
                height: "228px",
                borderTopWidth: "3px",
                borderTopColor: C.lightGray,
              }}
            />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-card rounded-xl border border-border px-6 py-10 text-center">
          <Sparkles
            className="h-5 w-5 mx-auto mb-2.5"
            style={{ color: C.gray }}
          />
          <p className="text-sm text-gray">
            No strong signals in the current filters.
          </p>
          <p className="text-xs text-gray mt-1">
            Try a wider date range or remove dimension filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {insights.map((insight) => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Preset chip bar ───────────────────────────────────────────────────────────

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "Last 7D", value: "last_7d" },
  { label: "Last 30D", value: "last_30d" },
  { label: "Last 90D", value: "last_90d" },
  { label: "Year 2025", value: "year_2025" },
  { label: "Custom", value: "custom" },
];

const OBJECTIVE_LABEL: Record<CampaignObjective, string> = {
  conversions: "Conversions",
  traffic: "Traffic",
  awareness: "Awareness",
  lead_generation: "Lead Gen",
  engagement: "Engagement",
  video_views: "Video Views",
  app_installs: "App Installs",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  // ── Filters ──
  const [preset, setPreset] = useState<DatePreset>("last_30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [platform, setPlatform] = useState<Platform>("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "image">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<ContentCategory | "all">(
    "all",
  );
  const [leaderTab, setLeaderTab] = useState<LeaderTab>("content");
  const [sortMetric, setSortMetric] = useState<SortMetric>("spend");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (platform !== "all") count++;
    if (agencyFilter !== "all") count++;
    if (creatorFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    return count;
  }, [platform, agencyFilter, creatorFilter, typeFilter, categoryFilter]);

  const handleClearAll = () => {
    setPlatform("all");
    setAgencyFilter("all");
    setCreatorFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
  };

  // ── AI loading state (brief "analysing" effect on filter change) ──
  const [aiLoading, setAiLoading] = useState(true);

  const { campaignItems, adItems, contentItems, agencyItems } = useAppData();

  // ── Date ranges ──
  const [rangeStart, rangeEnd] = getPresetRange(preset, customStart, customEnd);
  const [prevStart, prevEnd] = getPreviousRange(rangeStart, rangeEnd);

  // Re-trigger AI loading whenever filters change
  useEffect(() => {
    setAiLoading(true);
    const t = setTimeout(() => setAiLoading(false), 950);
    return () => clearTimeout(t);
  }, [
    rangeStart,
    rangeEnd,
    platform,
    agencyFilter,
    creatorFilter,
    typeFilter,
    categoryFilter,
  ]);

  // ── Daily trend data ──
  const currDays = useMemo(
    () => sliceDailyData(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );
  const prevDays = useMemo(
    () => sliceDailyData(prevStart, prevEnd),
    [prevStart, prevEnd],
  );

  // ── Campaign-level filtered data ──
  const filteredCampaigns = useMemo(
    () =>
      campaignItems
        .filter((c) => campaignInRange(c, rangeStart, rangeEnd))
        .filter((c) => platform === "all" || c.platform === platform)
        .filter((c) => agencyFilter === "all" || c.agency === agencyFilter),
    [campaignItems, rangeStart, rangeEnd, platform, agencyFilter],
  );

  // ── KPI aggregations from real campaign data ──
  const curr = useMemo(() => sumCampaigns(filteredCampaigns), [filteredCampaigns]);

  const prevCampaigns = useMemo(
    () =>
      campaignItems
        .filter((c) => campaignInRange(c, prevStart, prevEnd))
        .filter((c) => platform === "all" || c.platform === platform)
        .filter((c) => agencyFilter === "all" || c.agency === agencyFilter),
    [campaignItems, prevStart, prevEnd, platform, agencyFilter],
  );
  const prev = useMemo(() => sumCampaigns(prevCampaigns), [prevCampaigns]);

  // ── Period-accurate deltas from daily time-series (campaign totals are static
  //    lifetime figures so curr === prev when the same campaigns span both windows) ──
  const currDailySpend = useMemo(
    () =>
      currDays.reduce(
        (s, d) =>
          s +
          (platform === "meta"
            ? d.metaSpend
            : platform === "google"
              ? d.googleSpend
              : d.spend),
        0,
      ),
    [currDays, platform],
  );
  const currDailyRevenue = useMemo(
    () =>
      currDays.reduce(
        (s, d) =>
          s +
          (platform === "meta"
            ? d.metaRevenue
            : platform === "google"
              ? d.googleRevenue
              : d.revenue),
        0,
      ),
    [currDays, platform],
  );
  const prevDailySpend = useMemo(
    () =>
      prevDays.reduce(
        (s, d) =>
          s +
          (platform === "meta"
            ? d.metaSpend
            : platform === "google"
              ? d.googleSpend
              : d.spend),
        0,
      ),
    [prevDays, platform],
  );
  const prevDailyRevenue = useMemo(
    () =>
      prevDays.reduce(
        (s, d) =>
          s +
          (platform === "meta"
            ? d.metaRevenue
            : platform === "google"
              ? d.googleRevenue
              : d.revenue),
        0,
      ),
    [prevDays, platform],
  );
  const currDailyRoas =
    currDailySpend > 0 ? currDailyRevenue / currDailySpend : 0;
  const prevDailyRoas =
    prevDailySpend > 0 ? prevDailyRevenue / prevDailySpend : 0;
  // Spend ratio used to scale campaign-derived impression/click/conversion totals
  const dailySpendRatio =
    currDailySpend > 0 ? prevDailySpend / currDailySpend : 0;

  const activeCampaignIds = useMemo(
    () => new Set(filteredCampaigns.map((c) => c.id)),
    [filteredCampaigns],
  );

  const filteredAdItems = useMemo(
    () => adItems.filter((a) => activeCampaignIds.has(a.campaignId)),
    [adItems, activeCampaignIds],
  );

  // ── Filter options ──
  const agencyNames = useMemo(
    () => agencyItems.map((a) => a.name),
    [agencyItems],
  );
  const creators = useMemo(
    () => [...new Set(contentItems.map((c) => c.creator))].sort(),
    [contentItems],
  );

  // ── Trend chart data ──
  const trendData = useMemo(
    () =>
      currDays.map((d) => ({
        label: d.label,
        Spend:
          platform === "meta"
            ? d.metaSpend
            : platform === "google"
              ? d.googleSpend
              : d.spend,
        Revenue:
          platform === "meta"
            ? d.metaRevenue
            : platform === "google"
              ? d.googleRevenue
              : d.revenue,
      })),
    [currDays, platform],
  );

  // ── Content leaderboard ──
  const contentLeader = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        type: string;
        creator: string;
        spend: number;
        revenue: number;
        impressions: number;
        conversions: number;
      }
    >();
    for (const ad of filteredAdItems) {
      if (!ad.contentId) continue;
      const c = contentItems.find((x) => x.id === ad.contentId);
      if (!c) continue;
      if (typeFilter !== "all" && c.type !== typeFilter) continue;
      if (creatorFilter !== "all" && c.creator !== creatorFilter) continue;
      const prev = map.get(ad.contentId) ?? {
        name: c.name,
        type: c.type,
        creator: c.creator,
        spend: 0,
        revenue: 0,
        impressions: 0,
        conversions: 0,
      };
      map.set(ad.contentId, {
        ...prev,
        spend: prev.spend + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        conversions: prev.conversions + ad.conversions,
      });
    }
    return [...map.values()];
  }, [filteredAdItems, contentItems, typeFilter, creatorFilter]);

  // ── Agency leaderboard ──
  const agencyLeader = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        type: string;
        spend: number;
        revenue: number;
        impressions: number;
        conversions: number;
      }
    >();
    for (const c of filteredCampaigns) {
      if (!c.agency) continue;
      const agency = agencyItems.find((a) => a.name === c.agency);
      const prev = map.get(c.agency) ?? {
        name: c.agency,
        type: agency?.type ?? "performance",
        spend: 0,
        revenue: 0,
        impressions: 0,
        conversions: 0,
      };
      map.set(c.agency, {
        ...prev,
        spend: prev.spend + c.spend,
        revenue: prev.revenue + c.revenue,
        impressions: prev.impressions + c.impressions,
        conversions: prev.conversions + c.conversions,
      });
    }
    return [...map.values()];
  }, [filteredCampaigns, agencyItems]);

  // ── Creator leaderboard ──
  const creatorLeader = useMemo(() => {
    const map = new Map<
      string,
      {
        spend: number;
        revenue: number;
        impressions: number;
        conversions: number;
        contentCount: number;
      }
    >();
    const contentSeen = new Map<string, Set<string>>();
    for (const ad of filteredAdItems) {
      if (!ad.contentId) continue;
      const c = contentItems.find((x) => x.id === ad.contentId);
      if (!c) continue;
      if (typeFilter !== "all" && c.type !== typeFilter) continue;
      const creator = c.creator;
      const prev = map.get(creator) ?? {
        spend: 0,
        revenue: 0,
        impressions: 0,
        conversions: 0,
        contentCount: 0,
      };
      const seen = contentSeen.get(creator) ?? new Set<string>();
      seen.add(ad.contentId);
      contentSeen.set(creator, seen);
      map.set(creator, {
        spend: prev.spend + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        conversions: prev.conversions + ad.conversions,
        contentCount: seen.size,
      });
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v }));
  }, [filteredAdItems, contentItems, typeFilter]);

  // ── Content type leaderboard ──
  const typeLeader = useMemo(() => {
    const map = new Map<
      string,
      {
        spend: number;
        revenue: number;
        impressions: number;
        conversions: number;
        adCount: number;
      }
    >();
    for (const ad of filteredAdItems) {
      const t = ad.contentType;
      if (typeFilter !== "all" && t !== typeFilter) continue;
      const prev = map.get(t) ?? {
        spend: 0,
        revenue: 0,
        impressions: 0,
        conversions: 0,
        adCount: 0,
      };
      map.set(t, {
        spend: prev.spend + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        conversions: prev.conversions + ad.conversions,
        adCount: prev.adCount + 1,
      });
    }
    return [...map.entries()].map(([name, v]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      rawName: name,
      ...v,
    }));
  }, [filteredAdItems, typeFilter]);

  // ── Content format (category) leaderboard ──
  const CATEGORY_LABEL: Record<ContentCategory, string> = {
    ugc: "UGC",
    founder_led: "Founder Led",
    team: "Team",
    brand: "Brand",
  };

  const formatLeader = useMemo(() => {
    const map = new Map<
      ContentCategory,
      {
        spend: number;
        revenue: number;
        impressions: number;
        conversions: number;
        adCount: number;
      }
    >();
    for (const ad of filteredAdItems) {
      if (!ad.contentId) continue;
      const c = contentItems.find((x) => x.id === ad.contentId);
      if (!c) continue;
      if (categoryFilter !== "all" && c.category !== categoryFilter) continue;
      const cat = c.category;
      const prev = map.get(cat) ?? {
        spend: 0,
        revenue: 0,
        impressions: 0,
        conversions: 0,
        adCount: 0,
      };
      map.set(cat, {
        spend: prev.spend + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        conversions: prev.conversions + ad.conversions,
        adCount: prev.adCount + 1,
      });
    }
    return [...map.entries()].map(([cat, v]) => ({
      name: CATEGORY_LABEL[cat],
      rawCategory: cat,
      ...v,
    }));
  }, [filteredAdItems, contentItems, categoryFilter]);

  // ── Sort leaderboard rows ──
  function sortRows<
    T extends {
      spend: number;
      revenue: number;
      impressions: number;
      conversions: number;
    },
  >(rows: T[]) {
    const key =
      sortMetric === "roas"
        ? (r: T) => (r.spend > 0 ? r.revenue / r.spend : 0)
        : (r: T) => r[sortMetric];
    return [...rows].sort((a, b) => key(b) - key(a));
  }

  const contentSorted = useMemo(
    () => sortRows(contentLeader),
    [contentLeader, sortMetric],
  );
  const contentByRoas = useMemo(
    () =>
      [...contentLeader].sort((a, b) => {
        const ra = a.spend > 0 ? a.revenue / a.spend : 0;
        const rb = b.spend > 0 ? b.revenue / b.spend : 0;
        return rb - ra;
      }),
    [contentLeader],
  );
  const agencySorted = useMemo(
    () => sortRows(agencyLeader),
    [agencyLeader, sortMetric],
  );
  const creatorSorted = useMemo(
    () => sortRows(creatorLeader),
    [creatorLeader, sortMetric],
  );
  const typeSorted = useMemo(
    () => sortRows(typeLeader),
    [typeLeader, sortMetric],
  );
  const formatSorted = useMemo(
    () => sortRows(formatLeader),
    [formatLeader, sortMetric],
  );

  function maxRoasOf<T extends { spend: number; revenue: number }>(rows: T[]) {
    return Math.max(
      ...rows.map((r) => (r.spend > 0 ? r.revenue / r.spend : 0)),
      0.1,
    );
  }

  // ── Platform split for pie chart ──
  const platformPie = useMemo(() => {
    const meta = filteredCampaigns
      .filter((c) => c.platform === "meta")
      .reduce((s, c) => s + c.spend, 0);
    const google = filteredCampaigns
      .filter((c) => c.platform === "google")
      .reduce((s, c) => s + c.spend, 0);
    return [
      { name: "Meta", value: meta, color: C.info },
      { name: "Google", value: google, color: C.warning },
    ].filter((d) => d.value > 0);
  }, [filteredCampaigns]);

  // ── Objective breakdown bar chart ──
  const objectiveData = useMemo(() => {
    const map = new Map<CampaignObjective, number>();
    for (const c of filteredCampaigns) {
      map.set(c.objective, (map.get(c.objective) ?? 0) + c.spend);
    }
    return [...map.entries()]
      .map(([obj, spend]) => ({ name: OBJECTIVE_LABEL[obj], Spend: spend }))
      .sort((a, b) => b.Spend - a.Spend);
  }, [filteredCampaigns]);

  // ── AI Insight engine ─────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    const out: Insight[] = [];

    // ── Signal 1: Platform efficiency arbitrage ──
    if (platform === "all" && filteredCampaigns.length > 0) {
      const metaC = filteredCampaigns.filter((c) => c.platform === "meta");
      const googleC = filteredCampaigns.filter((c) => c.platform === "google");
      const mSpend = metaC.reduce((s, c) => s + c.spend, 0);
      const mRev = metaC.reduce((s, c) => s + c.revenue, 0);
      const gSpend = googleC.reduce((s, c) => s + c.spend, 0);
      const gRev = googleC.reduce((s, c) => s + c.revenue, 0);
      const mRoas = mSpend > 0 ? mRev / mSpend : 0;
      const gRoas = gSpend > 0 ? gRev / gSpend : 0;

      if (mRoas > 0 && gRoas > 0) {
        const leader = mRoas >= gRoas ? "Meta" : "Google";
        const laggard = leader === "Meta" ? "Google" : "Meta";
        const leadRoas = Math.max(mRoas, gRoas);
        const lagRoas = Math.min(mRoas, gRoas);
        const lagSpend = leader === "Meta" ? gSpend : mSpend;
        const pct = Math.round((leadRoas / lagRoas - 1) * 100);

        if (pct > 10) {
          const uplift = Math.round(lagSpend * 0.2 * (leadRoas - lagRoas));
          out.push({
            id: "platform-efficiency",
            type: "opportunity",
            title: `Shift budget to ${leader}`,
            body: `${leader} is delivering ${pct}% higher ROAS than ${laggard} (${fmtRoas(leadRoas)} vs ${fmtRoas(lagRoas)}). Moving 20% of ${laggard} spend could yield an estimated ${fmtINR(uplift)} in additional revenue this period.`,
            metric: `+${pct}%`,
            metricLabel: "ROAS delta vs other platform",
            confidence: Math.min(93, 66 + pct),
          });
        }
      }
    }

    // ── Signal 2: Top content asset (always ranked by ROAS, independent of leaderboard sort) ──
    if (contentByRoas.length > 0) {
      const top = contentByRoas[0];
      const topRoas = top.spend > 0 ? top.revenue / top.spend : 0;
      const avgRoas = curr.roas;
      const premium =
        avgRoas > 0 ? Math.round((topRoas / avgRoas - 1) * 100) : 0;
      const share =
        curr.spend > 0 ? Math.round((top.spend / curr.spend) * 100) : 0;
      const creator = (top as { creator?: string }).creator ?? "your team";
      const name =
        top.name.length > 26 ? top.name.slice(0, 23) + "…" : top.name;

      if (topRoas > 0) {
        out.push({
          id: "top-content",
          type: "highlight",
          title: `"${name}" is your #1 asset`,
          body: `Created by ${creator}, this piece is driving ${fmtRoas(topRoas)} ROAS — ${premium >= 0 ? premium + "% above" : Math.abs(premium) + "% below"} your ${fmtRoas(avgRoas)} period average. It accounts for ${share}% of total tracked spend.`,
          metric: fmtRoas(topRoas),
          metricLabel: "Content ROAS",
          confidence: 94,
        });
      }
    }

    // ── Signal 3: Intra-period ROAS momentum ──
    if (currDays.length >= 6) {
      const mid = Math.floor(currDays.length / 2);
      const fhDays = currDays.slice(0, mid);
      const shDays = currDays.slice(mid);
      const fhSpend = fhDays.reduce((s, d) => s + d.spend, 0);
      const shSpend = shDays.reduce((s, d) => s + d.spend, 0);
      const fhRoas =
        fhSpend > 0 ? fhDays.reduce((s, d) => s + d.revenue, 0) / fhSpend : 0;
      const shRoas =
        shSpend > 0 ? shDays.reduce((s, d) => s + d.revenue, 0) / shSpend : 0;
      const delta = fhRoas > 0 ? ((shRoas - fhRoas) / fhRoas) * 100 : 0;

      if (Math.abs(delta) > 4) {
        out.push({
          id: "roas-trend",
          type: delta > 0 ? "opportunity" : "risk",
          title: delta > 0 ? "ROAS is accelerating" : "ROAS is decelerating",
          body: `ROAS ${delta > 0 ? "climbed" : "fell"} ${Math.abs(delta).toFixed(1)}% comparing the second half of this period to the first (${fmtRoas(fhRoas)} → ${fmtRoas(shRoas)}). ${delta > 0 ? "Strong momentum — consider scaling budgets on top performers before it normalises." : "Creative fatigue may be a factor. Refreshing ad sets or pausing underperformers is recommended."}`,
          metric: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
          metricLabel: "Half-period ROAS delta",
          confidence: Math.round(Math.min(88, 58 + Math.abs(delta) * 2.8)),
        });
      }
    }

    // ── Signal 4: Spend anomaly — biggest single-day spike ──
    if (currDays.length >= 5) {
      const avgSpend =
        currDays.reduce((s, d) => s + d.spend, 0) / currDays.length;
      const peakDay = currDays.reduce(
        (m, d) => (d.spend > m.spend ? d : m),
        currDays[0],
      );
      const spikePct =
        avgSpend > 0 ? ((peakDay.spend - avgSpend) / avgSpend) * 100 : 0;

      if (spikePct > 35) {
        const peakRoas =
          peakDay.spend > 0 ? peakDay.revenue / peakDay.spend : 0;
        out.push({
          id: "spend-anomaly",
          type: "anomaly",
          title: `Spend spike detected on ${peakDay.label}`,
          body: `Daily spend hit ${fmtINR(peakDay.spend)} on ${peakDay.label} — ${Math.round(spikePct)}% above the period average of ${fmtINR(Math.round(avgSpend))}. Revenue that day was ${fmtINR(peakDay.revenue)} at ${fmtRoas(peakRoas)} ROAS. Consider whether this was deliberate pacing or a budget cap issue.`,
          metric: `+${Math.round(spikePct)}%`,
          metricLabel: "vs period daily avg",
          confidence: 97,
        });
      }
    }

    // ── Signal 5: Content format winner ──
    if (formatSorted.length >= 2) {
      const topFmt = formatSorted[0];
      const secFmt = formatSorted[1];
      const topR = topFmt.spend > 0 ? topFmt.revenue / topFmt.spend : 0;
      const secR = secFmt.spend > 0 ? secFmt.revenue / secFmt.spend : 0;
      const gap = secR > 0 ? Math.round((topR / secR - 1) * 100) : 0;

      if (gap > 8 && topR > 0) {
        out.push({
          id: "format-winner",
          type: "highlight",
          title: `${topFmt.name} format leads by ${gap}%`,
          body: `${topFmt.name} content is achieving ${fmtRoas(topR)} ROAS vs ${secFmt.name} at ${fmtRoas(secR)} — a ${gap}% advantage. Prioritising ${topFmt.name} briefs in upcoming campaigns could lift blended ROAS without increasing total spend.`,
          metric: fmtRoas(topR),
          metricLabel: `${topFmt.name} format ROAS`,
          confidence: 83,
        });
      }
    }

    // ── Signal 6: 30-day revenue projection ──
    if (currDays.length >= 7 && curr.revenue > 0) {
      const dailyAvg = curr.revenue / currDays.length;
      const trendF = (() => {
        if (currDays.length < 14) return 1;
        const mid = Math.floor(currDays.length / 2);
        const fhR =
          currDays.slice(0, mid).reduce((s, d) => s + d.revenue, 0) / mid;
        const shR =
          currDays.slice(mid).reduce((s, d) => s + d.revenue, 0) /
          (currDays.length - mid);
        return fhR > 0 ? Math.min(1.5, Math.max(0.65, shR / fhR)) : 1;
      })();
      const forecast = Math.round(dailyAvg * 30 * trendF);
      const trendPct = Math.round((trendF - 1) * 100);

      out.push({
        id: "revenue-forecast",
        type: "prediction",
        title: "30-day revenue projection",
        body: `At ${fmtINR(Math.round(dailyAvg))}/day average${trendF !== 1 ? ` with a ${trendF > 1 ? "+" : ""}${trendPct}% momentum adjustment applied` : ""}, AI projects ~${fmtINR(forecast)} over the next 30 days. Assumes current ${fmtRoas(curr.roas)} ROAS and spend pacing hold. Actual outcome may vary with budget changes.`,
        metric: fmtINR(forecast),
        metricLabel: "Projected 30-day revenue",
        confidence: 68,
      });
    }

    return out.slice(0, 5);
  }, [
    filteredCampaigns,
    contentByRoas,
    formatSorted,
    currDays,
    curr,
    platform,
  ]);

  // ── Trend chart x-axis interval ──
  const xInterval =
    currDays.length <= 14
      ? 0
      : currDays.length <= 60
        ? 4
        : currDays.length <= 130
          ? 13
          : 29;

  // ── Active leaderboard rows ──
  const activeRows =
    leaderTab === "content"
      ? contentSorted
      : leaderTab === "agency"
        ? agencySorted
        : leaderTab === "creator"
          ? creatorSorted
          : leaderTab === "format"
            ? formatSorted
            : typeSorted;
  const activeMaxRoas = maxRoasOf(activeRows);

  const periodLabel = fmtDateRange(rangeStart, rangeEnd);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Overview</h1>
          <p className="mt-0.5 text-xs text-gray">
            Cross-channel performance — {periodLabel}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCSV(filteredCampaigns, rangeStart, rangeEnd)}
          className="h-9 gap-1.5 text-xs font-medium border-border shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ── Compact Filter Toolbar ── */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Preset Selector */}
            <Select
              value={preset}
              onValueChange={(v) => setPreset(v as DatePreset)}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background border-border font-medium">
                <Calendar className="mr-2 h-3.5 w-3.5 text-gray" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Pickers */}
            {preset === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-32 h-9 text-xs bg-background"
                />
                <span className="text-[10px] text-gray uppercase font-semibold">
                  to
                </span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-32 h-9 text-xs bg-background"
                />
              </div>
            )}

            {/* Filters Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-9 px-3 gap-1.5 text-xs font-semibold border-border bg-background transition-all",
                activeFilterCount > 0 &&
                  "border-teal/30 bg-teal/5 text-teal hover:bg-teal/10",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal text-white text-[9px] font-bold px-1">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="h-3 w-3 text-gray" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray" />
              )}
            </Button>

            {/* Clear Filters (ghost button) */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-9 px-2 text-xs text-gray hover:text-error gap-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <span className="text-xs text-gray hidden md:inline ml-auto">
            {filteredCampaigns.length} campaign
            {filteredCampaigns.length !== 1 ? "s" : ""} in range
          </span>
        </div>

        {/* Collapsible advanced dimension filters */}
        {showFilters && (
          <div className="pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray uppercase tracking-wider">
                Platform
              </label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as Platform)}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="meta">Meta Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray uppercase tracking-wider">
                Agency
              </label>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-full h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencyNames.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray uppercase tracking-wider">
                Creator
              </label>
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger className="w-full h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {creators.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray uppercase tracking-wider">
                Media Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(v as "all" | "video" | "image")
                }
              >
                <SelectTrigger className="w-full h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray uppercase tracking-wider">
                Format
              </label>
              <Select
                value={categoryFilter}
                onValueChange={(v) =>
                  setCategoryFilter(v as ContentCategory | "all")
                }
              >
                <SelectTrigger className="w-full h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="ugc">UGC</SelectItem>
                  <SelectItem value="founder_led">Founder Led</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Spend"
          value={fmtINR(curr.spend)}
          change={pctChange(currDailySpend, prevDailySpend)}
        />
        <KpiCard
          label="Total Revenue"
          value={fmtINR(curr.revenue)}
          change={pctChange(currDailyRevenue, prevDailyRevenue)}
        />
        <KpiCard
          label="Overall ROAS"
          value={fmtRoas(curr.roas)}
          change={pctChange(currDailyRoas, prevDailyRoas)}
        />
        <KpiCard
          label="Impressions"
          value={fmtCompact(curr.impressions)}
          change={pctChange(
            curr.impressions,
            Math.round(curr.impressions * dailySpendRatio),
          )}
        />
        <KpiCard
          label="Clicks"
          value={fmtCompact(curr.clicks)}
          change={pctChange(
            curr.clicks,
            Math.round(curr.clicks * dailySpendRatio),
          )}
        />
        <KpiCard
          label="Conversions"
          value={fmtCompact(curr.conversions)}
          change={pctChange(
            curr.conversions,
            Math.round(curr.conversions * dailySpendRatio),
          )}
        />
      </div>

      {/* ── AI Insights ── */}
      <AIInsightsPanel
        insights={insights}
        loading={aiLoading}
        campaignCount={filteredCampaigns.length}
        periodLabel={periodLabel}
      />

      {/* ── Spend & Revenue Trend ── */}
      <ChartCard
        title="Spend & Revenue Trend"
        description={`Daily · ${periodLabel}${platform !== "all" ? ` · ${platform === "meta" ? "Meta Ads" : "Google Ads"}` : ""}`}
      >
        {currDays.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray">
            No data for the selected date range.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.mint} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.mint} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={C.lightGray}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: C.gray }}
                  axisLine={false}
                  tickLine={false}
                  interval={xInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.gray }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtINR}
                  width={54}
                />
                <RechartTooltip content={TipINR} />
                <Area
                  type="monotone"
                  dataKey="Spend"
                  name="Spend"
                  stroke={C.teal}
                  strokeWidth={2}
                  fill="url(#gS)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  name="Revenue"
                  stroke={C.mint}
                  strokeWidth={2}
                  fill="url(#gR)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: C.teal }}
                />
                Spend
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: C.mint }}
                />
                Revenue
              </span>
            </div>
          </>
        )}
      </ChartCard>

      {/* ── Performance Leaderboard ── */}
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5">
          <div className="flex">
            {(
              [
                ["content", "Content"],
                ["agency", "Agency"],
                ["creator", "Creator"],
                ["type", "Media Type"],
                ["format", "Content Format"],
              ] as [LeaderTab, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setLeaderTab(val)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                  leaderTab === val
                    ? "border-teal text-teal"
                    : "border-transparent text-gray hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 py-2">
            <span className="text-xs text-gray hidden sm:block">Sort by</span>
            <Select
              value={sortMetric}
              onValueChange={(v) => setSortMetric(v as SortMetric)}
            >
              <SelectTrigger className="w-[110px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spend">Spend</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="impressions">Impressions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-2 border-b border-border bg-off-white">
          <span className="w-6 shrink-0" />
          <span className="flex-1 text-xs font-semibold text-gray uppercase tracking-wide">
            Name
          </span>
          <span className="hidden sm:block w-24 text-right text-xs font-semibold text-gray uppercase tracking-wide capitalize">
            {sortMetric}
          </span>
          <span className="w-36 text-xs font-semibold text-gray uppercase tracking-wide">
            ROAS
          </span>
          <span className="hidden lg:block w-20 text-right text-xs font-semibold text-gray uppercase tracking-wide">
            Conv.
          </span>
        </div>

        {activeRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray">
            No data for the current filters.
          </p>
        ) : (
          activeRows.map((row, i) => {
            const roas = row.spend > 0 ? row.revenue / row.spend : 0;
            const sub =
              leaderTab === "content"
                ? (row as { creator?: string }).creator
                : leaderTab === "agency"
                  ? (row as { type?: string }).type === "performance"
                    ? "Performance Marketing"
                    : "Creator Agency"
                  : leaderTab === "creator"
                    ? `${(row as { contentCount?: number }).contentCount ?? 0} content piece${(row as { contentCount?: number }).contentCount !== 1 ? "s" : ""}`
                    : `${(row as { adCount?: number }).adCount ?? 0} ads`;

            return (
              <LeaderboardRow
                key={(row as { name: string }).name + i}
                rank={i + 1}
                name={(row as { name: string }).name}
                sub={sub}
                spend={row.spend}
                revenue={row.revenue}
                roas={roas}
                maxRoas={activeMaxRoas}
                impressions={row.impressions}
                conversions={row.conversions}
                sortMetric={sortMetric}
              />
            );
          })
        )}
      </Card>

      {/* ── Platform Split + Objective Breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Spend by Platform"
          description="Budget allocation across ad platforms"
        >
          {platformPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray">
              No campaign data for this period.
            </p>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={platformPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {platformPie.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                  <RechartTooltip content={TipINR} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4 pl-2 pr-4">
                {platformPie.map((e) => {
                  const total = platformPie.reduce((s, p) => s + p.value, 0);
                  return (
                    <div key={e.name}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: e.color }}
                        />
                        <span className="text-xs text-gray">{e.name}</span>
                      </div>
                      <p className="text-xl font-bold text-foreground pl-4">
                        {fmtINR(e.value)}
                      </p>
                      <p className="text-xs text-gray pl-4">
                        {Math.round((e.value / total) * 100)}% of spend
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Spend by Objective"
          description="How budget is distributed across campaign goals"
        >
          {objectiveData.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray">
              No campaign data for this period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={objectiveData}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={C.lightGray}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: C.gray }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtINR}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: C.gray }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <RechartTooltip content={TipINR} />
                <Bar
                  dataKey="Spend"
                  name="Spend"
                  fill={C.teal}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
