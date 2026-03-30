/* ── Performance Page ─────────────────────────────────────────
   KPI cards + trend charts + intent breakdown + weekly summary
   + conversation log transparency section
   ──────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  PERFORMANCE_SUMMARY,
  DAILY_METRICS,
  INTENT_METRICS,
  WEEKLY_SUMMARY,
  CONVERSATION_LOGS,
  ACTIONABLE_ITEMS,
  type ConversationLog,
  type ConversationLogMode,
  type ConversationOutcome,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  Users,
  Shuffle,
  ExternalLink,
  ChevronRight,
  Search,
  Flag,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  X,
  MessageCircle,
  Zap,
  Brain,
  Shield,
  Send as SendIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "7d" | "14d" | "30d";
type ModeFilter = "all" | "production" | "training";
type OutcomeFilter = "all" | "resolved" | "escalated";

const METRIC_ICONS: Record<string, typeof BarChart3> = {
  "Auto-Resolution Rate": Target,
  "CSAT Score": Users,
  "Intent Changed": Shuffle,
  "First Response Time": Clock,
};

/* ── helpers ── */
function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function renderTemplate(tpl: string, vars: Record<string, unknown>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}

const STEP_ICONS: Record<string, typeof Brain> = {
  classify: Brain,
  rule_match: Search,
  action_check: Shield,
  decision: Zap,
  gap_signal: AlertTriangle,
  execute_action: Zap,
  generate_reply: SendIcon,
};

const STEP_COLORS: Record<string, string> = {
  classify: "text-blue-500 bg-blue-50",
  rule_match: "text-violet-500 bg-violet-50",
  action_check: "text-amber-500 bg-amber-50",
  decision: "text-emerald-500 bg-emerald-50",
  gap_signal: "text-red-500 bg-red-50",
  execute_action: "text-teal-500 bg-teal-50",
  generate_reply: "text-sky-500 bg-sky-50",
};

/* ── Conversation Log Detail Sheet ── */
function LogDetailSheet({ log, open, onClose }: { log: ConversationLog | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"reasoning" | "conversation">("reasoning");

  if (!log) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-[14px] font-semibold leading-tight">{log.subject}</SheetTitle>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <span>{log.customerName}</span>
                <span>·</span>
                <a href={log.zendeskUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                  #{log.zendeskTicketId} <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span>·</span>
                <span>{relativeTime(log.createdAt)}</span>
              </div>
            </div>
          </div>
          {/* Meta row */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="outline" className="text-[10px] font-normal">
              {log.mode === "training" ? "Training" : "Production"}
            </Badge>
            <Badge variant={log.outcome === "resolved" ? "default" : log.outcome === "escalated" ? "destructive" : "secondary"} className="text-[10px]">
              {log.outcome}
            </Badge>
            {log.intentChanged && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                Intent Changed
              </Badge>
            )}
            {log.flagged && (
              <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50">
                <Flag className="w-2.5 h-2.5 mr-0.5" /> Flagged
              </Badge>
            )}
            {log.csat != null && (
              <Badge variant="outline" className="text-[10px]">CSAT: {log.csat}/5</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">Confidence: {Math.round(log.confidence * 100)}%</Badge>
            <Badge variant="outline" className="text-[10px]">{log.totalTurns} turns</Badge>
            <Badge variant="outline" className="text-[10px]">{formatDuration(log.duration)}</Badge>
          </div>
          {/* Intent flow */}
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{log.initialIntent}</span>
            {log.intentChanged && (
              <>
                <ArrowRight className="w-3 h-3 text-amber-500" />
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">{log.finalIntent}</span>
              </>
            )}
          </div>
          {/* Rule + Actions */}
          <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
            <div>Rule: <span className="text-foreground">{log.ruleMatched || "—"}</span></div>
            {log.actionsTaken.length > 0 && (
              <div>Actions: <span className="text-foreground">{log.actionsTaken.join(", ")}</span></div>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(["reasoning", "conversation"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                  tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {t === "reasoning" ? "Reasoning Trace" : "Conversation"}
              </button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {tab === "reasoning" ? (
            <div className="space-y-0">
              {log.reasoning.map((step, i) => {
                const Icon = STEP_ICONS[step.type] || Brain;
                const colorClass = STEP_COLORS[step.type] || "text-gray-500 bg-gray-50";
                return (
                  <div key={i} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {i < log.reasoning.length - 1 && (
                      <div className="absolute left-[13px] top-[28px] bottom-0 w-px bg-border/60" />
                    )}
                    <div className={cn("w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="pb-4 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-foreground">{step.label}</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(step.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {log.messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "agent" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed",
                      msg.role === "customer"
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : msg.role === "internal"
                        ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-br-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium opacity-70">
                        {msg.role === "customer" ? log.customerName : msg.role === "internal" ? "Internal Note" : "Alex (AI)"}
                      </span>
                      <span className="text-[9px] opacity-50">
                        {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ── Main Performance Page ── */
export default function Performance() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  const [csatDismissed, setCsatDismissed] = useState(false);
  const [, navigate] = useLocation();

  // Simulate CSAT data failure for demo
  const csatAvailable = true; // toggle to false to show warning

  const daysMap: Record<TimeRange, number> = { "7d": 7, "14d": 14, "30d": 30 };
  const visibleMetrics = DAILY_METRICS.slice(-daysMap[timeRange]);

  const chartData = visibleMetrics.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Auto-Resolution": Math.round(d.autoResolutionRate),
    CSAT: Number(d.csat.toFixed(1)),
    "Intent Changed": Math.round(d.intentChangedRate),
    Volume: d.volume,
  }));

  // Filter conversation logs
  const filteredLogs = useMemo(() => {
    return CONVERSATION_LOGS.filter((log) => {
      if (modeFilter !== "all" && log.mode !== modeFilter) return false;
      if (outcomeFilter !== "all" && log.outcome !== outcomeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.subject.toLowerCase().includes(q) ||
          log.customerName.toLowerCase().includes(q) ||
          log.zendeskTicketId.includes(q) ||
          log.initialIntent.toLowerCase().includes(q) ||
          log.finalIntent.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [modeFilter, outcomeFilter, searchQuery]);

  const summaryVars = WEEKLY_SUMMARY.variables;

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1020px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground">Performance</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              How Alex is performing across all customer interactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode filter */}
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              {(["all", "production", "training"] as ModeFilter[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors capitalize",
                    modeFilter === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "all" ? "All Data" : m}
                </button>
              ))}
            </div>
            {/* Time range */}
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              {(["7d", "14d", "30d"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                    timeRange === range ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CSAT Warning Banner */}
        {!csatAvailable && !csatDismissed && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-medium text-amber-800">CSAT data is currently unavailable</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Zendesk CSAT survey data could not be retrieved. This may be because CSAT surveys are not enabled in your Zendesk account, or the API connection has expired. Please check your Zendesk settings or reconnect the integration.
              </p>
            </div>
            <button onClick={() => setCsatDismissed(true)} className="text-amber-400 hover:text-amber-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {PERFORMANCE_SUMMARY.map((metric) => {
            const Icon = METRIC_ICONS[metric.label] || BarChart3;
            const isPositive =
              metric.label === "Intent Changed" || metric.label === "First Response Time"
                ? metric.trend < 0
                : metric.trend > 0;
            return (
              <Card key={metric.label} className="overflow-hidden">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-xl font-semibold text-foreground">
                      {metric.value}
                      <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] font-medium mb-1",
                        isPositive ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(metric.trend)}
                      {metric.unit === "%" || metric.unit === "/5" ? "" : metric.unit}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{metric.trendLabel}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Auto-Resolution & Intent Changed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Resolution Rate & Intent Changed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorResolution" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.48 0.09 195)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.48 0.09 195)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIntentChanged" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.15 60)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.65 0.15 60)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 80)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} unit="%" />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.90 0.005 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Area type="monotone" dataKey="Auto-Resolution" stroke="oklch(0.48 0.09 195)" fill="url(#colorResolution)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Intent Changed" stroke="oklch(0.65 0.15 60)" fill="url(#colorIntentChanged)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CSAT Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">CSAT Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {csatAvailable ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCSAT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.72 0.12 80)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.72 0.12 80)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 80)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[3, 5]} tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.90 0.005 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Area type="monotone" dataKey="CSAT" stroke="oklch(0.72 0.12 80)" fill="url(#colorCSAT)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="text-center">
                    <Info className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">CSAT data unavailable</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Check Zendesk integration settings</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Intent Breakdown */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Performance by Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intent</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Resolution</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CSAT</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intent Changed</th>
                  </tr>
                </thead>
                <tbody>
                  {INTENT_METRICS.map((intent) => (
                    <tr key={intent.intent} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">{intent.intent}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{intent.volume}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.resolutionRate >= 75 ? "text-emerald-600" : intent.resolutionRate >= 60 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.resolutionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.csat >= 4.2 ? "text-emerald-600" : intent.csat >= 3.8 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.csat}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.intentChangedRate <= 10 ? "text-emerald-600" : intent.intentChangedRate <= 20 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.intentChangedRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary & Recommendations */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px]">Weekly Summary & Recommendations</CardTitle>
              <Badge variant="outline" className="text-[10px] font-normal">{WEEKLY_SUMMARY.weekLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary as code block */}
            <div className="bg-muted/40 rounded-lg p-4 mb-4 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
{`Period:          ${summaryVars.total_tickets > 0 ? WEEKLY_SUMMARY.weekLabel : "—"}
Total Tickets:   ${summaryVars.total_tickets}
Auto-Resolved:   ${summaryVars.auto_resolved} (${summaryVars.auto_resolution_rate}%, ${summaryVars.auto_resolution_rate_delta} vs prev week)
Intent Changed:  ${summaryVars.intent_changed_rate}% (${summaryVars.intent_changed_rate_delta} vs prev week)
First Response:  ${summaryVars.avg_first_response} (${summaryVars.avg_first_response_delta} vs prev week)
CSAT:            ${summaryVars.csat}/5 (${summaryVars.csat_delta} vs prev week)`}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider mb-1">Top Performing Intent</p>
                <p className="text-[13px] font-semibold text-emerald-800">{summaryVars.top_intent}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">{summaryVars.top_intent_volume} tickets, highest resolution rate</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <p className="text-[10px] font-medium text-red-700 uppercase tracking-wider mb-1">Needs Attention</p>
                <p className="text-[13px] font-semibold text-red-800">{summaryVars.worst_intent}</p>
                <p className="text-[11px] text-red-600 mt-0.5">Only {summaryVars.worst_intent_resolution} resolution rate</p>
              </div>
            </div>

            {/* Actionable Recommendations */}
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</p>
            <div className="space-y-2">
              {WEEKLY_SUMMARY.recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground leading-relaxed">
                      {renderTemplate(rec.text, summaryVars as unknown as Record<string, unknown>)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] text-primary shrink-0 h-7 px-2"
                    onClick={() => navigate(rec.linkPath)}
                  >
                    {rec.linkLabel} <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Conversation Logs (Transparency) ── */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[14px]">Conversation Logs</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Full transparency into every AI-handled conversation, including reasoning and actions.</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Outcome filter */}
                <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                  {(["all", "resolved", "escalated"] as OutcomeFilter[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOutcomeFilter(o)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors capitalize",
                        outcomeFilter === o ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by subject, customer, ticket ID, or intent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/50 bg-muted/20 text-[12px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[12px] text-muted-foreground">No conversations match your filters.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-left rounded-lg border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all p-3 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Outcome indicator */}
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        log.outcome === "resolved" ? "bg-emerald-500" : log.outcome === "escalated" ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-foreground truncate">{log.subject}</span>
                          {log.flagged && <Flag className="w-3 h-3 text-red-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{log.customerName}</span>
                          <span>·</span>
                          <span>#{log.zendeskTicketId}</span>
                          <span>·</span>
                          <span>{relativeTime(log.createdAt)}</span>
                          <span>·</span>
                          <span>{log.totalTurns} turns</span>
                          <span>·</span>
                          <span>{formatDuration(log.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-[9px] font-normal py-0 h-4">
                            {log.mode === "training" ? "Training" : "Prod"}
                          </Badge>
                          <Badge variant={log.outcome === "resolved" ? "default" : "destructive"} className="text-[9px] py-0 h-4">
                            {log.outcome}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{log.initialIntent}</span>
                          {log.intentChanged && (
                            <>
                              <ArrowRight className="w-2.5 h-2.5 text-amber-500" />
                              <span className="text-[10px] text-amber-600">{log.finalIntent}</span>
                            </>
                          )}
                          {log.ruleMatched && (
                            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
                              Rule: {log.ruleMatched}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground mt-1 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* Detail Sheet */}
      <LogDetailSheet log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </ScrollArea>
  );
}
