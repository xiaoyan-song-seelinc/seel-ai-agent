/* ── Performance Page ─────────────────────────────────────────
   PRD-aligned: sub-tabs (Dashboard | Conversations),
   5 KPI cards, 3 trend charts, Intent table (4 cols + mini bars),
   Conversation Log as horizontal table with turn-based reasoning detail
   ──────────────────────────────────────────────────────────── */

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PERFORMANCE_SUMMARY,
  DAILY_METRICS,
  INTENT_METRICS,
  CONVERSATION_LOGS,
  type ConversationLog,
  type ReasoningTurn,
} from "@/lib/mock-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, BarChart3, Target, Clock, Users,
  Shuffle, ExternalLink, ChevronRight, Search, Flag,
  AlertTriangle, CheckCircle2, ArrowRight, Info, X,
  MessageCircle, Zap, Brain, Shield, ShieldCheck, ShieldAlert,
  Send as SendIcon, ArrowUpDown, ChevronDown, ChevronUp,
  User, Bot, BookOpen, Activity, Copy, XCircle, Timer,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

type TimeRange = "7d" | "14d" | "30d";
type ModeFilter = "all" | "production" | "training";
type OutcomeFilter = "all" | "resolved" | "escalated" | "pending";
type SubTab = "dashboard" | "conversations";
type SortField = "ticketId" | "intent" | "sentiment" | "outcome" | "mode" | "turns" | "time";
type SortDir = "asc" | "desc";

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



function sentimentColor(s: string): string {
  const map: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    satisfied: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
    concerned: "bg-amber-50 text-amber-700 border-amber-200",
    frustrated: "bg-orange-50 text-orange-700 border-orange-200",
    angry: "bg-red-50 text-red-700 border-red-200",
    urgent: "bg-red-50 text-red-700 border-red-200",
  };
  return map[s] || "bg-slate-50 text-slate-600 border-slate-200";
}

function outcomeStyle(o: string): string {
  if (o === "resolved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (o === "escalated") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

const METRIC_ICONS: Record<string, typeof BarChart3> = {
  "Auto-Resolution Rate": Target,
  "CSAT Score": Users,
  "Sentiment Changed": Shuffle,
  "First Response Time": Clock,
  "Full Resolution Time": Timer,
};

/* ── Mini Bar for Intent table ── */
function MiniBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

function MiniHBar({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">{value}%</span>
    </div>
  );
}

/* ── Reasoning Turn Component ── */
function ReasoningTurnCard({ turn }: { turn: ReasoningTurn }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-[10px] shrink-0">Turn {turn.turnNumber}</Badge>
          <span className="text-[11px] text-muted-foreground truncate">{turn.customerInput}</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* 1. Customer Input */}
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"><User className="w-3 h-3 text-blue-600" /></div>
            <div><p className="text-[10px] font-medium text-muted-foreground mb-0.5">Customer Input</p><p className="text-[12px]">{turn.customerInput}</p></div>
          </div>

          {/* 2. Context Enrichment */}
          {turn.contextEnrichment && (
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5"><Zap className="w-3 h-3 text-purple-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Context Enrichment</p>
                {turn.contextEnrichment.fieldsExtracted.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">{turn.contextEnrichment.fieldsExtracted.map((f, i) => <Badge key={i} variant="secondary" className="text-[9px] font-mono py-0 h-4">{f}</Badge>)}</div>
                )}
                {turn.contextEnrichment.queries.map((q, i) => (
                  <div key={i} className="bg-muted/30 rounded px-2 py-1.5 text-[10px] font-mono mb-1">
                    <span className="text-blue-600">{q.action}</span>({q.params}) → <span className={q.status === "success" ? "text-emerald-600" : "text-red-500"}>{q.status}</span>
                    <span className="text-muted-foreground ml-1">// {q.result}</span>
                  </div>
                ))}
                {turn.contextEnrichment.infoRequested && <p className="text-[10px] text-amber-600">ℹ️ Requested: {turn.contextEnrichment.infoRequested}</p>}
              </div>
            </div>
          )}

          {/* 3. Rule Routing */}
          {turn.ruleRouting && (
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5"><Brain className="w-3 h-3 text-indigo-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Rule Routing</p>
                <div className="flex items-center gap-3 text-[10px] mb-1.5">
                  <span>Intent: <strong>{turn.ruleRouting.intent}</strong> ({(turn.ruleRouting.intentConfidence * 100).toFixed(0)}%)</span>
                  <span>Sentiment: <Badge variant="outline" className={cn("text-[9px] py-0 h-4", sentimentColor(turn.ruleRouting.sentiment))}>{turn.ruleRouting.sentiment}</Badge></span>
                </div>
                {turn.ruleRouting.matchedRules.length > 0 ? turn.ruleRouting.matchedRules.map((r, i) => (
                  <div key={i} className="bg-muted/30 rounded px-2 py-1.5 text-[10px] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground">({r.ruleId}, {(r.confidence * 100).toFixed(0)}%)</span>
                  </div>
                )) : <p className="text-[10px] text-amber-600">No matching rules</p>}
              </div>
            </div>
          )}

          {/* 4. Knowledge Retrieval */}
          {turn.knowledgeRetrieval && (
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5"><BookOpen className="w-3 h-3 text-teal-600" /></div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Knowledge Retrieval</p>
                <div className="bg-muted/30 rounded px-2 py-1.5 text-[10px]">
                  <p>Query: <span className="font-mono">{turn.knowledgeRetrieval.query}</span></p>
                  <p>Results: {turn.knowledgeRetrieval.resultsCount} | Top score: {turn.knowledgeRetrieval.topScore.toFixed(2)}</p>
                  {turn.knowledgeRetrieval.belowThreshold && <p className="text-amber-600 mt-0.5">⚠ No knowledge loaded (below threshold)</p>}
                </div>
              </div>
            </div>
          )}

          {/* 5. Actions Executed */}
          {turn.actionsExecuted && turn.actionsExecuted.length > 0 && (
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5"><Activity className="w-3 h-3 text-orange-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Actions Executed</p>
                {turn.actionsExecuted.map((a, i) => (
                  <div key={i} className="bg-muted/30 rounded px-2 py-1.5 text-[10px] font-mono mb-1">
                    <div className="flex items-center gap-1">{a.result === "success" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}<span className="font-semibold">{a.name}</span></div>
                    <p className="text-muted-foreground mt-0.5">In: {a.input}</p>
                    <p className="text-muted-foreground">Out: {a.output}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Guardrail Check */}
          {turn.guardrailCheck && (
            <div className="flex gap-2.5">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", turn.guardrailCheck.result === "passed" ? "bg-emerald-50" : "bg-red-50")}>
                {turn.guardrailCheck.result === "passed" ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <ShieldAlert className="w-3 h-3 text-red-600" />}
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Guardrail Check</p>
                {turn.guardrailCheck.result === "passed"
                  ? <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0 h-4">Passed</Badge>
                  : <div><Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-200 py-0 h-4">Blocked</Badge><p className="text-[10px] text-red-600 mt-0.5">{turn.guardrailCheck.blockedRule} — {turn.guardrailCheck.blockedReason}</p></div>
                }
              </div>
            </div>
          )}

          {/* 7. Rep Output */}
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-3 h-3 text-emerald-600" /></div>
            <div className="flex-1 min-w-0"><p className="text-[10px] font-medium text-muted-foreground mb-0.5">Rep Output</p><div className="bg-emerald-50/50 border border-emerald-100 rounded px-2.5 py-2 text-[12px]">{turn.repOutput}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Conversation Detail Sheet ── */
function LogDetailSheet({ log, open, onClose }: { log: ConversationLog | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"conversation" | "reasoning">("conversation");
  
  if (!log) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[560px] sm:max-w-[560px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="min-w-0">
            <SheetTitle className="text-[14px] font-semibold leading-tight flex items-center gap-2">
              <a href={log.zendeskUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                #{log.zendeskTicketId} <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-muted-foreground font-normal">·</span>
              <span className="font-normal truncate">{log.subject}</span>
            </SheetTitle>
          </div>
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-[11px]">
            <div><span className="text-muted-foreground">Customer:</span> {log.customerName} <span className="text-muted-foreground">({log.customerEmail})</span></div>
            <div><span className="text-muted-foreground">Intent:</span> <span className="font-medium">{log.finalIntent}</span></div>
            <div><span className="text-muted-foreground">Sentiment:</span> <Badge variant="outline" className={cn("text-[9px] py-0 h-4 ml-1", sentimentColor(log.finalSentiment))}>{log.finalSentiment}</Badge></div>
            <div><span className="text-muted-foreground">Outcome:</span> <Badge variant="outline" className={cn("text-[9px] py-0 h-4 ml-1", outcomeStyle(log.outcome))}>{log.outcome}</Badge></div>
            <div><span className="text-muted-foreground">Mode:</span> <Badge variant="outline" className="text-[9px] py-0 h-4 ml-1">{log.mode}</Badge></div>
            <div><span className="text-muted-foreground">Turns:</span> {log.totalTurns}</div>
            <div><span className="text-muted-foreground">Duration:</span> {formatDuration(log.duration)}</div>
            <div><span className="text-muted-foreground">Started:</span> {new Date(log.createdAt).toLocaleString()}</div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(["conversation", "reasoning"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors", tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                {t === "conversation" ? "Conversation" : "Reasoning"}
              </button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {tab === "conversation" ? (
            <div className="space-y-3">
              {log.messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "agent" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed",
                    msg.role === "customer" ? "bg-muted text-foreground rounded-bl-sm"
                      : msg.role === "internal" ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-br-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium opacity-70">{msg.role === "customer" ? log.customerName : msg.role === "internal" ? "Internal Note" : "Ava (Rep)"}</span>
                      <span className="text-[9px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Escalation info */}
              {log.outcome === "escalated" && (
                <div className="pt-3 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-red-200" />
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Escalated</Badge>
                    <div className="flex-1 h-px bg-red-200" />
                  </div>
                  {log.escalationReason && (
                    <div className="mb-2"><p className="text-[10px] font-medium text-muted-foreground">Escalation Reason</p><p className="text-[12px] mt-0.5">{log.escalationReason}</p></div>
                  )}
                  {log.handoffNotes && (
                    <div className="mb-2"><p className="text-[10px] font-medium text-muted-foreground">Handoff Notes</p><p className="text-[12px] mt-0.5">{log.handoffNotes}</p></div>
                  )}
                  {log.suggestedReply && (
                    <div className="mb-2">
                      <p className="text-[10px] font-medium text-muted-foreground">Suggested Reply</p>
                      <div className="bg-muted/30 rounded px-2.5 py-2 text-[12px] mt-0.5 flex items-start gap-2">
                        <span className="flex-1">{log.suggestedReply}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(log.suggestedReply || ""); toast.success("Copied"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flag info */}
              {log.flagged && (
                <div className="border-t border-border/40 pt-3 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-orange-600">
                    <Flag className="w-3 h-3" /><span className="font-medium">Flagged by Manager</span>
                  </div>
                  {log.flagNote && <p className="text-[11px] mt-1 text-muted-foreground">{log.flagNote}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {log.reasoningTurns && log.reasoningTurns.length > 0 ? (
                log.reasoningTurns.map((turn) => <ReasoningTurnCard key={turn.turnNumber} turn={turn} />)
              ) : (
                /* Legacy fallback */
                <div className="space-y-0">
                  {log.reasoning.map((step, i) => {
                    const iconMap: Record<string, typeof Brain> = { classify: Brain, rule_match: Search, action_check: Shield, decision: Zap, gap_signal: AlertTriangle, execute_action: Zap, generate_reply: SendIcon };
                    const colorMap: Record<string, string> = { classify: "text-blue-500 bg-blue-50", rule_match: "text-violet-500 bg-violet-50", action_check: "text-amber-500 bg-amber-50", decision: "text-emerald-500 bg-emerald-50", gap_signal: "text-red-500 bg-red-50", execute_action: "text-teal-500 bg-teal-50", generate_reply: "text-sky-500 bg-sky-50" };
                    const Icon = iconMap[step.type] || Brain;
                    const colorClass = colorMap[step.type] || "text-gray-500 bg-gray-50";
                    return (
                      <div key={i} className="flex gap-2.5 relative">
                        {i < log.reasoning.length - 1 && <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-border/50" />}
                        <div className={cn("w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5", colorClass)}><Icon className="w-2.5 h-2.5" /></div>
                        <div className="pb-3 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium">{step.label}</span>
                            <span className="text-[9px] text-muted-foreground/50">{new Date(step.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-wrap">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ── Main Performance Page ── */
export default function Performance() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("production");
  const [location] = useLocation();
  const subTab: SubTab = location === "/performance/conversations" ? "conversations" : "dashboard";
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  const [csatDismissed, setCsatDismissed] = useState(false);
  const [, navigate] = useLocation();
  // No longer need local subTab state — derived from URL

  const csatAvailable = true; // toggle to false to demo CSAT warning

  const daysMap: Record<TimeRange, number> = { "7d": 7, "14d": 14, "30d": 30 };
  const visibleMetrics = DAILY_METRICS.slice(-daysMap[timeRange]);

  const chartData = visibleMetrics.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    resolution: Math.round(d.autoResolutionRate),
    csat: Number(d.csat.toFixed(1)),
    frt: Math.round(d.firstResponseTime),
    fullRT: Math.round(d.fullResolutionTime / 60), // in minutes for chart
  }));

  // Filter conversation logs
  const filteredLogs = useMemo(() => {
    let logs = [...CONVERSATION_LOGS];
    if (modeFilter !== "all") logs = logs.filter((l) => l.mode === modeFilter);
    if (outcomeFilter !== "all") logs = logs.filter((l) => l.outcome === outcomeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter((l) =>
        l.zendeskTicketId.includes(q) || l.customerEmail.toLowerCase().includes(q) ||
        l.subject.toLowerCase().includes(q) || l.customerName.toLowerCase().includes(q)
      );
    }
    logs.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "ticketId": cmp = a.zendeskTicketId.localeCompare(b.zendeskTicketId); break;
        case "intent": cmp = a.finalIntent.localeCompare(b.finalIntent); break;
        case "sentiment": cmp = a.finalSentiment.localeCompare(b.finalSentiment); break;
        case "outcome": cmp = a.outcome.localeCompare(b.outcome); break;
        case "mode": cmp = a.mode.localeCompare(b.mode); break;
        case "turns": cmp = a.totalTurns - b.totalTurns; break;
        case "time": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return logs;
  }, [modeFilter, outcomeFilter, searchQuery, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={cn("w-3 h-3 inline ml-0.5", sortField === field ? "text-foreground" : "text-muted-foreground/30")} />
  );

  // KPI helpers
  const isPositiveTrend = (label: string, trend: number) => {
    if (label === "First Response Time" || label === "Full Resolution Time" || label === "Sentiment Changed") return trend < 0;
    return trend > 0;
  };

  const formatKPIValue = (label: string, value: number, unit: string) => {
    if (label === "Full Resolution Time") return formatDuration(value);
    if (unit === "s") return `${value}s`;
    if (unit === "/5") return `${value}/5`;
    return `${value}${unit}`;
  };

  const formatTrend = (label: string, trend: number, unit: string) => {
    const sign = trend > 0 ? "+" : "";
    if (label === "Full Resolution Time") return `${sign}${formatDuration(Math.abs(trend))}`;
    if (label === "First Response Time") return `${sign}${trend}s`;
    if (unit === "/5") return `${sign}${trend}`;
    return `${sign}${trend}${unit}`;
  };

  const maxVolume = Math.max(...INTENT_METRICS.map((m) => m.volume));

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1060px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground">{subTab === "dashboard" ? "Dashboard" : "Conversations"}</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">{subTab === "dashboard" ? "Monitor your AI Rep's performance metrics." : "Review all AI-handled conversations."}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode filter — dropdown */}
            <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as ModeFilter)}>
              <SelectTrigger className="h-8 w-[130px] text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="all">All Modes</SelectItem>
              </SelectContent>
            </Select>
            {/* Time range — dropdown */}
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="h-8 w-[110px] text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══ Dashboard ═══ */}
        {subTab === "dashboard" && (
          <>
            {/* CSAT Warning Banner */}
            {!csatAvailable && !csatDismissed && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-amber-800">CSAT data is not available</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">This usually means your Zendesk account doesn't have Customer Satisfaction surveys enabled. Enable it in Zendesk Admin → Settings → Satisfaction to start collecting CSAT data.</p>
                  <button className="text-[11px] text-amber-700 underline mt-1">Learn more</button>
                </div>
                <button onClick={() => setCsatDismissed(true)} className="text-amber-400 hover:text-amber-600"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* KPI Cards — 5 */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {PERFORMANCE_SUMMARY.map((metric) => {
                const Icon = METRIC_ICONS[metric.label] || BarChart3;
                const positive = isPositiveTrend(metric.label, metric.trend);
                return (
                  <Card key={metric.label} className="overflow-hidden relative">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground font-medium">{metric.label}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-semibold text-foreground tabular-nums">{formatKPIValue(metric.label, metric.value, metric.unit)}</span>
                      </div>
                      <div className={cn("flex items-center gap-0.5 mt-1 text-[11px] font-medium", positive ? "text-emerald-600" : "text-red-500")}>
                        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{formatTrend(metric.label, metric.trend, metric.unit)}</span>
                        <span className="text-muted-foreground font-normal ml-0.5">{metric.trendLabel}</span>
                      </div>
                    </CardContent>
                    {/* CSAT overlay when unavailable */}
                    {metric.label === "CSAT Score" && !csatAvailable && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="text-center"><AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-0.5" /><p className="text-[10px] text-muted-foreground">Unavailable</p></div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Trend Charts — 3 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Resolution Rate */}
              <Card>
                <CardHeader className="pb-1"><CardTitle className="text-[13px]">Resolution Rate</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} unit="%" />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                        <Area type="monotone" dataKey="resolution" stroke="#10b981" fill="url(#gRes)" strokeWidth={2} name="Resolution %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* CSAT Trend */}
              <Card>
                <CardHeader className="pb-1"><CardTitle className="text-[13px]">CSAT Trend</CardTitle></CardHeader>
                <CardContent>
                  {csatAvailable ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs><linearGradient id="gCSAT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[3, 5]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                          <Area type="monotone" dataKey="csat" stroke="#6366f1" fill="url(#gCSAT)" strokeWidth={2} name="CSAT" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center">
                      <div className="text-center"><Info className="w-6 h-6 text-muted-foreground/20 mx-auto mb-1" /><p className="text-[11px] text-muted-foreground">CSAT data unavailable</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Response Time — dual line */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-[13px]">Response Time</CardTitle>
                  <div className="flex gap-3 mt-1">
                    <div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded bg-blue-500" /><span className="text-[9px] text-muted-foreground">First Response (s)</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded bg-amber-500" /><span className="text-[9px] text-muted-foreground">Full Resolution (min)</span></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                        <Line type="monotone" dataKey="frt" stroke="#3b82f6" strokeWidth={2} dot={false} name="First Response (s)" />
                        <Line type="monotone" dataKey="fullRT" stroke="#f59e0b" strokeWidth={2} dot={false} name="Full Resolution (min)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intent Table — 4 columns per PRD */}
            <Card className="mb-6">
              <CardHeader className="pb-2"><CardTitle className="text-[13px]">Performance by Intent</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intent</th>
                        <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                        <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolution Rate</th>
                        <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">CSAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTENT_METRICS.filter((m) => m.volume > 0).map((intent) => {
                        const highlight = intent.volume > 40 && intent.resolutionRate < 60;
                        return (
                          <tr key={intent.intent} className={cn("border-b border-border/30 hover:bg-muted/20 transition-colors", highlight && "bg-amber-50/40")}>
                            <td className="py-2.5 px-3 font-medium">
                              <div className="flex items-center gap-1.5">
                                {highlight && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                                {intent.intent}
                              </div>
                            </td>
                            <td className="py-2.5 px-3"><MiniBar value={intent.volume} max={maxVolume} color="bg-blue-400" /></td>
                            <td className="py-2.5 px-3"><MiniHBar value={intent.resolutionRate} color={intent.resolutionRate >= 70 ? "bg-emerald-400" : intent.resolutionRate >= 50 ? "bg-amber-400" : "bg-red-400"} /></td>
                            <td className="py-2.5 px-3">
                              {intent.csat > 0 ? (
                                <span className={cn("text-[12px] font-medium", intent.csat >= 4.2 ? "text-emerald-600" : intent.csat >= 3.8 ? "text-amber-600" : "text-red-500")}>{intent.csat}/5</span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </>
        )}

        {/* ═══ Conversations Sub-Tab ═══ */}
        {subTab === "conversations" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                {(["all", "resolved", "escalated", "pending"] as OutcomeFilter[]).map((o) => (
                  <button key={o} onClick={() => setOutcomeFilter(o)} className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors capitalize", outcomeFilter === o ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {o === "pending" ? "Handling" : o}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search ticket ID, email, subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-muted/20 text-[11px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <span className="text-[11px] text-muted-foreground ml-auto">{filteredLogs.length} conversations</span>
            </div>

            {/* Horizontal Table */}
            {filteredLogs.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("ticketId")}>Ticket ID <SortIcon field="ticketId" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Customer</th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("intent")}>Intent <SortIcon field="intent" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("sentiment")}>Sentiment <SortIcon field="sentiment" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("outcome")}>Outcome <SortIcon field="outcome" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("mode")}>Mode <SortIcon field="mode" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("turns")}>Turns <SortIcon field="turns" /></th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Summary</th>
                          <th className="text-left py-2.5 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => toggleSort("time")}>Time <SortIcon field="time" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} onClick={() => setSelectedLog(log)} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-primary font-mono text-[11px]">#{log.zendeskTicketId}</span>
                              {log.flagged && <Flag className="w-2.5 h-2.5 text-orange-500 inline ml-1" />}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-[11px]">{log.customerName}</div>
                              <div className="text-[10px] text-muted-foreground">{log.customerEmail}</div>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">{log.finalIntent}</td>
                            <td className="py-2.5 px-3"><Badge variant="outline" className={cn("text-[9px] py-0 h-4", sentimentColor(log.finalSentiment))}>{log.finalSentiment}</Badge></td>
                            <td className="py-2.5 px-3"><Badge variant="outline" className={cn("text-[9px] py-0 h-4", outcomeStyle(log.outcome))}>{log.outcome}</Badge></td>
                            <td className="py-2.5 px-3"><Badge variant="outline" className="text-[9px] py-0 h-4">{log.mode}</Badge></td>
                            <td className="py-2.5 px-3 text-[11px] text-center tabular-nums">{log.totalTurns}</td>
                            <td className="py-2.5 px-3 text-[11px] text-muted-foreground max-w-[180px] truncate">{log.messages[0]?.text.slice(0, 80)}</td>
                            <td className="py-2.5 px-3 text-[11px] text-muted-foreground whitespace-nowrap">{relativeTime(log.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground">No conversations found for the selected filters.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="h-4" />
      </div>

      <LogDetailSheet log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </ScrollArea>
  );
}
