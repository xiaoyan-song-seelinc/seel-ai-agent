/* ────────────────────────────────────────────────────────────
   AI Support → Communication tab — v6
   Updated Onboarding: 9-step flow per latest spec.
   Hire Dialog: 3 personalities, locked actions, no mode.
   Sanity Check: structured scenario cards.
   Go-live mode: Team Lead area with mode cards.
   Sidebar install: conditional CTA.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send, Check, X, ArrowRight, ChevronDown, ChevronRight,
  MessageCircle, ExternalLink, Pencil, Upload, FileText,
  CheckCircle2, Globe, Clock, BarChart3, List, Link2,
  AlertTriangle, Shield, Lock, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  TOPICS, ESCALATION_TICKETS, ACTION_PERMISSIONS, PERFORMANCE_SUMMARY,
  type Topic, type EscalationTicket, type EscalationStatus,
  type ActionPermission, type AgentMode,
} from "@/lib/mock-data";

// ── helpers ──
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function formatDateGroup(d: string) {
  const date = new Date(d);
  const now = new Date("2026-03-27T10:00:00Z");
  const diff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
function formatRelativeTime(d: string) {
  const diff = Math.floor(
    (new Date("2026-03-27T10:00:00Z").getTime() - new Date(d).getTime()) / 60000
  );
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getInitials(n: string) {
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**"))
        return <strong key={j} className="font-semibold">{seg.slice(2, -2)}</strong>;
      return <span key={j}>{seg}</span>;
    });
    return <p key={i}>{parts}</p>;
  });
}

// ── Alex bubble helper ──
function AlexBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[12px]">&#x1F454;</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
          <span className="text-[9px] text-muted-foreground/50">just now</span>
        </div>
        <div className={cn("rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPIC CARD (Feishu-style) ───────────────────────────
// ══════════════════════════════════════════════════════════

function TopicCard({
  topic,
  onOpenThread,
  onAction,
}: {
  topic: Topic;
  onOpenThread: (id: string) => void;
  onAction: (id: string, action: string) => void;
}) {
  const replies = topic.messages.slice(1);
  const hasMany = replies.length > 5;
  const visibleReplies = hasMany
    ? [...replies.slice(0, 2), null, ...replies.slice(-3)]
    : replies;

  const firstMsg = topic.messages[0];
  const isRuleProposal = !!topic.proposedRule;
  const isPerfSummary = topic.type === "performance_summary";
  const hasPendingAction = topic.proposedRule?.status === "pending";
  const hasUnread = replies.length > 0 && replies.some((r) => r.sender === "ai");

  return (
    <div className="flex gap-2.5 group">
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[12px]">&#x1F454;</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">Alex</span>
          <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(topic.createdAt)}</span>
          {hasPendingAction && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Needs your response" />
          )}
          {hasUnread && !hasPendingAction && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Unread" />
          )}
        </div>

        {isPerfSummary && topic.weeklySummary && (
          <div className="rounded-xl rounded-tl-sm border border-border bg-white overflow-hidden mb-1.5 shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-[13px] font-bold text-foreground">Weekly Performance Summary</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-white/80 px-2 py-0.5 rounded-full border border-border/50">{topic.weeklySummary.periodLabel}</span>
              </div>
            </div>
            {/* KPI Grid */}
            <div className="px-4 py-3 border-b border-border/30">
              <div className="grid grid-cols-5 gap-2">
                {topic.weeklySummary.kpis.map((kpi) => (
                  <div key={kpi.label} className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{kpi.label}</p>
                    <p className="text-[15px] font-bold text-foreground">{kpi.value}</p>
                    <p className={cn("text-[10px] font-medium", kpi.positive ? "text-emerald-600" : "text-red-500")}>{kpi.delta}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Intent Highlights */}
            <div className="px-4 py-3 border-b border-border/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                  <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-0.5">Top Intent</p>
                  <p className="text-[12px] font-semibold text-emerald-800">{topic.weeklySummary.topIntent.name}</p>
                  <p className="text-[10px] text-emerald-600">{topic.weeklySummary.topIntent.volume} tickets · {topic.weeklySummary.topIntent.resolution} resolution</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-2.5">
                  <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-0.5">Needs Attention</p>
                  <p className="text-[12px] font-semibold text-red-800">{topic.weeklySummary.worstIntent.name}</p>
                  <p className="text-[10px] text-red-600">{topic.weeklySummary.worstIntent.volume} tickets · {topic.weeklySummary.worstIntent.resolution} resolution</p>
                </div>
              </div>
            </div>
            {/* Recommendations */}
            <div className="px-4 py-3">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</p>
              <div className="space-y-2">
                {topic.weeklySummary.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground leading-relaxed">{rec.text}</p>
                      <button onClick={() => onAction(topic.id, `navigate:${rec.linkPath}`)} className="text-[10px] text-primary hover:underline mt-0.5 flex items-center gap-0.5">
                        {rec.linkLabel} <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => onAction(topic.id, "navigate:/performance")} className="mt-3 w-full text-center text-[11px] text-primary hover:underline py-1.5 rounded-lg hover:bg-blue-50/50 transition-colors">
                View full performance dashboard →
              </button>
            </div>
          </div>
        )}

        {firstMsg && !isRuleProposal && !isPerfSummary && (
          <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
            <div className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
              {renderMd(firstMsg.content)}
            </div>
          </div>
        )}

        {isRuleProposal && (
          <>
            {firstMsg && (
              <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
                <div className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {renderMd(firstMsg.content)}
                </div>
                {topic.proposedRule!.source && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <a href="#" className="text-[10px] text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Source: {topic.proposedRule!.source}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border bg-white overflow-hidden mb-1.5">
              <div className="px-3.5 py-2 border-b border-border/50 bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {topic.proposedRule!.type === "new" ? "Proposed New Rule" : "Proposed Rule Update"}
                </p>
                <p className="text-[12px] font-medium text-foreground mt-0.5">
                  {topic.proposedRule!.ruleName}
                </p>
              </div>
              <div className="px-3.5 py-2.5">
                {topic.proposedRule!.type === "update" && topic.proposedRule!.before && (
                  <div className="mb-2">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                      {topic.proposedRule!.before}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {topic.proposedRule!.type === "update" ? "Updated" : "Content"}
                  </p>
                  <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
                    {topic.proposedRule!.after}
                  </p>
                </div>
              </div>
              {topic.proposedRule!.status === "pending" && (
                <div className="px-3.5 py-2 border-t border-border/50 flex items-center gap-2">
                  <button
                    onClick={() => onAction(topic.id, "accept")}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Check className="w-3 h-3 inline mr-1" />Accept
                  </button>
                  <button
                    onClick={() => onAction(topic.id, "reject")}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3 h-3 inline mr-1" />Reject
                  </button>
                  <button
                    onClick={() => onAction(topic.id, "reply")}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 inline mr-1" />Reply
                  </button>
                </div>
              )}
              {topic.proposedRule!.status === "accepted" && (
                <div className="px-3.5 py-2 border-t border-border/50">
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">Accepted</Badge>
                </div>
              )}
            </div>
          </>
        )}

        {replies.length > 0 && (
          <div className="mt-1 ml-0.5">
            <div className="text-[9.5px] text-muted-foreground mb-1">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </div>
            <div className="space-y-0.5">
              {visibleReplies.map((reply, idx) => {
                if (reply === null) {
                  return (
                    <button
                      key={`gap-${idx}`}
                      onClick={() => onOpenThread(topic.id)}
                      className="text-[10px] text-primary hover:underline py-0.5"
                    >
                      View {replies.length - 5} earlier replies
                    </button>
                  );
                }
                return (
                  <div key={reply.id} className="flex items-center gap-1.5 py-0.5">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                      reply.sender === "ai" ? "bg-teal-100" : "bg-violet-100"
                    )}>
                      <span className="text-[7px]">
                        {reply.sender === "ai" ? "\u{1F454}" : "SC"}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">
                      {reply.sender === "ai" ? "Alex" : "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate flex-1">
                      {reply.content.slice(0, 60)}{reply.content.length > 60 ? "..." : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => onOpenThread(topic.id)}
          className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-3 h-3" /> Reply to topic
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── FULL THREAD PANEL ───────────────────────────────────
// ══════════════════════════════════════════════════════════

function FullThreadPanel({
  topic,
  onClose,
  onAction,
}: {
  topic: Topic;
  onClose: () => void;
  onAction: (id: string, action: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [topic.messages.length]);

  return (
    <div className="w-[360px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">Topic</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-3">
          {topic.messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.sender === "ai" ? "bg-teal-100" : "bg-violet-100"
              )}>
                <span className="text-[9px]">
                  {msg.sender === "ai" ? "\u{1F454}" : "SC"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold">{msg.sender === "ai" ? "Alex" : "You"}</span>
                  <span className="text-[8px] text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="text-[11.5px] leading-relaxed text-foreground">
                  {renderMd(msg.content)}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="px-3 py-2.5 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to this topic..."
            className="min-h-[36px] max-h-[80px] text-[11px] resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (replyText.trim()) {
                  toast.success("Reply sent");
                  setReplyText("");
                }
              }
            }}
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled={!replyText.trim()}
            onClick={() => {
              if (replyText.trim()) {
                toast.success("Reply sent");
                setReplyText("");
              }
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPICS PANEL (side panel) ───────────────────────────
// ══════════════════════════════════════════════════════════

function TopicsPanel({
  topics,
  onSelectTopic,
  onClose,
}: {
  topics: Topic[];
  onSelectTopic: (id: string) => void;
  onClose: () => void;
}) {
  const sorted = useMemo(
    () => [...topics].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [topics]
  );

  return (
    <div className="w-[280px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">All Topics</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {sorted.map((topic) => {
            const hasPending = topic.proposedRule?.status === "pending";
            const hasUnread = topic.messages.some((m) => m.sender === "ai");
            return (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className="w-full text-left px-4 py-2.5 hover:bg-accent/30 transition-colors border-b border-border/30"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-medium text-foreground truncate flex-1">{topic.title}</p>
                  {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                  {!hasPending && hasUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {topic.messages.length} messages · {formatRelativeTime(topic.createdAt)}
                </p>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// ── SETUP TAB (9-step onboarding flow) ──────────────────
// ══════════════════════════════════════════════════════════

const HIRE_PERSONALITIES = [
  { label: "Friendly" },
  { label: "Professional" },
  { label: "Casual" },
];

type SetupStep =
  | "welcome"
  | "shopify_check"
  | "zendesk_connect"
  | "upload_sop"
  | "processing"
  | "parse_results"
  | "conflicts"
  | "hire_ready"
  | "done";

function SetupTab({
  onHireRep,
}: {
  onHireRep: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("welcome");
  const [useDemo, setUseDemo] = useState(false);
  const [conflictIdx, setConflictIdx] = useState(0);
  const [shopifyConnected] = useState(true);
  const [zendeskConnected, setZendeskConnected] = useState(false);
  const [skippedZendesk, setSkippedZendesk] = useState(false);
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, conflictIdx]);

  // Auto-advance from shopify_check when connected
  useEffect(() => {
    if (step === "shopify_check" && shopifyConnected) {
      const timer = setTimeout(() => setStep("zendesk_connect"), 800);
      return () => clearTimeout(timer);
    }
  }, [step, shopifyConnected]);

  const demoRules = [
    { name: "WISMO Handling", summary: "Look up order + tracking, provide estimated delivery date" },
    { name: "Standard Return & Refund", summary: "Full refund for items returned within 30 days in original condition" },
    { name: "Seel Protection Policy", summary: "Protection plans are non-refundable; direct to resolve.seel.com for claims" },
    { name: "VIP Customer Handling", summary: "Extend return window to 45 days for customers with 3+ orders" },
    { name: "Damaged Item Process", summary: "Request photos, assess damage level, process partial or full refund" },
    { name: "Shipping Delay Escalation", summary: "Escalate if package is 7+ days past estimated delivery" },
    { name: "Final Sale Policy", summary: "Final sale items are non-returnable and non-refundable" },
    { name: "Bulk Order Returns", summary: "Orders over $500 require manager approval for refund" },
  ];

  const conflicts = [
    {
      title: "Return window duration",
      docA: "Document A says the return window is 30 days.",
      docB: "Document B says the return window is 14 days.",
      options: ["30 days (Doc A)", "14 days (Doc B)"],
    },
    {
      title: "Refund method for partial damage",
      docA: "Return policy says 'full refund for all returns'.",
      docB: "Damage handling doc says 'partial refund based on assessment'.",
      options: ["Always full refund", "Partial refund based on assessment"],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-[11px]">&#x1F454;</span>
          </div>
          <div>
            <span className="text-[12px] font-semibold text-foreground">Alex</span>
            <span className="text-[10px] text-muted-foreground ml-1.5">Team Lead · Setup</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4">

          {/* ── Step 1: Welcome ── */}
          <AlexBubble>
            <p className="text-[12px] leading-relaxed text-foreground">
              Hi, I'm Alex — your AI team lead.
            </p>
            <p className="text-[12px] leading-relaxed text-foreground mt-2">
              I'll help you set up your first AI support rep. Here's what we'll do:
            </p>
            <ol className="text-[12px] leading-relaxed text-foreground mt-2 list-decimal list-inside space-y-0.5">
              <li>Connect your tools (Shopify & Zendesk)</li>
              <li>Upload your support docs so I can learn your policies</li>
              <li>Configure your Rep's identity and permissions</li>
              <li>Run a quick sanity check</li>
              <li>Choose how you want your Rep to work</li>
            </ol>
            <p className="text-[12px] leading-relaxed text-foreground mt-2">
              Let's get started.
            </p>
          </AlexBubble>

          {step === "welcome" && (
            <div className="ml-9">
              <Button
                className="h-9 px-6 text-[11px] bg-teal-600 hover:bg-teal-700 rounded-full"
                onClick={() => setStep("shopify_check")}
              >
                Let's go <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Shopify Check ── */}
          {step !== "welcome" && (
            <AlexBubble>
              {shopifyConnected ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[12px] font-medium text-foreground">Shopify is connected — coastalliving.myshopify.com</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    Your AI Rep can look up orders, shipping status, and customer info.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-[12px] font-medium text-foreground">Shopify is not connected</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    We currently support Shopify as the order management system. If you're using a different platform, please contact your Seel point of contact for setup assistance. You can continue without order data, but your Rep will escalate all order-related queries.
                  </p>
                  {step === "shopify_check" && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toast.info("Contact your Seel point of contact for setup assistance.")}>
                        Contact Support
                      </Button>
                      <Button size="sm" className="h-7 text-[10px] bg-teal-600 hover:bg-teal-700" onClick={() => setStep("zendesk_connect")}>
                        Continue without order data
                      </Button>
                    </div>
                  )}
                </>
              )}
            </AlexBubble>
          )}

          {/* ── Step 3: Zendesk Connect ── */}
          {step !== "welcome" && step !== "shopify_check" && (
            <>
              <AlexBubble>
                {zendeskConnected ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[12px] font-medium text-foreground">Zendesk AI Support Access is set up — coastalliving.zendesk.com</span>
                    </div>
                  </>
                ) : skippedZendesk ? (
                  <>
                    <p className="text-[12px] leading-relaxed text-foreground">
                      No problem — you can set this up later. But your Rep won't be able to handle tickets until Zendesk is connected.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] leading-relaxed text-foreground">
                      To let your Rep read and respond to tickets, we need to set up Zendesk AI Support Access. This is a 3-step process you'll complete in the Integrations page.
                    </p>
                  </>
                )}
              </AlexBubble>

              {step === "zendesk_connect" && !zendeskConnected && !skippedZendesk && (
                <div className="ml-9 space-y-2">
                  {/* CTA card */}
                  <div className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#03363D]/10 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-[#03363D]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-foreground">Set up Zendesk AI Support Access</p>
                        <p className="text-[10px] text-muted-foreground">Authorize API · Create Agent seat · Configure ticket routing</p>
                      </div>
                    </div>
                    <Button
                      className="w-full h-9 text-[11px] bg-[#03363D] hover:bg-[#03363D]/90"
                      onClick={() => {
                        navigate("/integrations?setup=ai_support");
                      }}
                    >
                      Open Integrations <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  <button
                    onClick={() => {
                      setSkippedZendesk(true);
                      setStep("upload_sop");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Step 4: Upload SOP Documents ── */}
          {["upload_sop", "processing", "parse_results", "conflicts", "hire_ready", "done"].includes(step) && (
            <>
              <AlexBubble>
                <p className="text-[12px] leading-relaxed text-foreground">
                  Now let's teach your Rep. Upload your customer service SOP documents — I'll extract rules and knowledge from them.
                </p>
              </AlexBubble>

              {step === "upload_sop" && (
                <div className="ml-9 space-y-2">
                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => { setUseDemo(false); setStep("processing"); }}
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-[11px] text-foreground font-medium">Drop files here or click to upload</p>
                    <p className="text-[9px] text-muted-foreground mt-1">PDF, DOCX, TXT — up to 10MB each, max 10 files</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-[9px] text-muted-foreground">or</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Paste a URL to import..." className="h-8 text-[11px] flex-1" />
                    <Button size="sm" variant="outline" className="h-8 text-[10px]">Import</Button>
                  </div>
                  <button
                    onClick={() => { setUseDemo(true); setStep("processing"); }}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Try with a sample document
                  </button>
                  <div>
                    <button
                      onClick={() => setStep("hire_ready")}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Skip — I'll teach my Rep through conversation later
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Processing ── */}
          {["processing", "parse_results", "conflicts", "hire_ready", "done"].includes(step) && step !== "upload_sop" && (
            <AlexBubble>
              {step === "processing" ? (
                <>
                  <p className="text-[12px] leading-relaxed text-foreground">
                    {useDemo
                      ? "Great, I'll use the Seel Return & Shipping Guidelines as a sample. Give me a moment..."
                      : "Analyzing your documents..."}
                  </p>
                  {!useDemo && (
                    <p className="text-[11px] leading-relaxed text-muted-foreground mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      This usually takes 1-2 minutes. You can wait or come back later.
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-muted-foreground">Analyzing documents...</span>
                  </div>
                  {useDemo && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-7 text-[10px]"
                      onClick={() => setStep("parse_results")}
                    >
                      Skip to results (demo)
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* ── Step 5: Parse Results ── */}
                  <p className="text-[12px] leading-relaxed text-foreground">
                    Done! I extracted <strong>{demoRules.length} rules</strong> and <strong>12 knowledge entries</strong> from your documents.
                  </p>
                  <div className="mt-2 space-y-1">
                    {demoRules.slice(0, 5).map((rule, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-medium text-foreground">{rule.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">— {rule.summary}</span>
                        </div>
                      </div>
                    ))}
                    {demoRules.length > 5 && (
                      <button
                        onClick={() => toast.info(`All ${demoRules.length} rules extracted`)}
                        className="text-[10px] text-primary hover:underline ml-4.5"
                      >
                        +{demoRules.length - 5} more rules
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => navigate("/ai-support/playbook")}
                    className="mt-2 text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Review all in Playbook <ArrowRight className="w-3 h-3" />
                  </button>
                  {conflicts.length > 0 && step === "parse_results" && (
                    <>
                      <p className="text-[12px] leading-relaxed text-foreground mt-3">
                        I found <strong>{conflicts.length} conflicts</strong> that need your input:
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-[10px] bg-teal-600 hover:bg-teal-700"
                        onClick={() => { setConflictIdx(0); setStep("conflicts"); }}
                      >
                        Review conflicts
                      </Button>
                    </>
                  )}
                  {(step === "hire_ready" || step === "done") && (
                    <p className="text-[12px] leading-relaxed text-foreground mt-3">
                      All conflicts resolved. Your playbook is ready!
                    </p>
                  )}
                </>
              )}
            </AlexBubble>
          )}

          {/* ── Conflict Cards ── */}
          {step === "conflicts" && conflictIdx < conflicts.length && (
            <div className="ml-9">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-800">
                    Conflict {conflictIdx + 1} of {conflicts.length} — {conflicts[conflictIdx].title}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed mb-1">
                  {conflicts[conflictIdx].docA}
                </p>
                <p className="text-[11px] text-amber-800/80 leading-relaxed mb-3">
                  {conflicts[conflictIdx].docB}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {conflicts[conflictIdx].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        toast.success(`Selected: ${opt}`);
                        if (conflictIdx + 1 >= conflicts.length) {
                          setStep("hire_ready");
                        } else {
                          setConflictIdx(conflictIdx + 1);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-[10.5px] font-medium border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      toast.info("Deferred — you can resolve this in Playbook later");
                      if (conflictIdx + 1 >= conflicts.length) {
                        setStep("hire_ready");
                      } else {
                        setConflictIdx(conflictIdx + 1);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full text-[10.5px] text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Decide later
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Hire Ready ── */}
          {(step === "hire_ready" || step === "done") && (
            <>
              <AlexBubble>
                <p className="text-[12px] leading-relaxed text-foreground">
                  Your playbook is ready. Let's hire your first AI support rep.
                </p>
              </AlexBubble>
              {step === "hire_ready" && (
                <div className="ml-9">
                  <Button
                    className="h-9 px-5 text-[11px] bg-teal-600 hover:bg-teal-700 rounded-full"
                    onClick={onHireRep}
                  >
                    Review & Hire Support Rep <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── HIRE REP DIALOG (updated per spec) ──────────────────
// ══════════════════════════════════════════════════════════

function HireRepDialog({
  open,
  onOpenChange,
  onHire,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onHire: (name: string) => void;
}) {
  const [name, setName] = useState("Ava");
  const [personality, setPersonality] = useState("Friendly");
  const [localActions, setLocalActions] = useState<ActionPermission[]>(() =>
    ACTION_PERMISSIONS.map((a) => ({ ...a }))
  );

  const actionGroups = useMemo(() => {
    const groups: Record<string, ActionPermission[]> = {};
    localActions.forEach((a) => {
      const cat = a.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [localActions]);

  const toggleAction = (id: string) => {
    setLocalActions((prev) =>
      prev.map((a) => {
        if (a.id !== id || a.locked) return a;
        return { ...a, permission: a.permission === "autonomous" ? "disabled" as const : "autonomous" as const };
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0 overflow-hidden">
        <div className="bg-teal-600 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white text-[16px]">Hire Support Rep</DialogTitle>
            <DialogDescription className="text-teal-100 text-[12px]">
              Configure your Rep's identity and permissions.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex max-h-[60vh]">
          {/* Left — Identity */}
          <div className="w-[260px] px-5 py-4 overflow-y-auto border-r border-border shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</p>
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  className="mt-1 h-8 text-[12px]"
                  placeholder="e.g. Ava"
                  maxLength={20}
                />
                <p className="text-[9px] text-muted-foreground mt-0.5 text-right">{name.length}/20</p>
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personality</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {HIRE_PERSONALITIES.map((p) => (
                    <button
                      key={p.label}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10.5px] border transition-colors",
                        p.label === personality
                          ? "border-teal-400 bg-teal-50 text-teal-700"
                          : "border-border text-foreground hover:bg-accent"
                      )}
                      onClick={() => setPersonality(p.label)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Action Permissions */}
          <div className="flex-1 px-5 py-4 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Action Permissions</p>
            <div className="space-y-4">
              {Object.entries(actionGroups).map(([cat, actions]) => (
                <div key={cat}>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-1.5">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          "flex items-start gap-2.5 py-2 px-2.5 rounded-lg border transition-colors",
                          action.locked
                            ? "border-border/40 bg-muted/20"
                            : action.permission === "autonomous"
                            ? "border-teal-200/60 bg-teal-50/30"
                            : "border-border bg-white"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-foreground">{action.name}</span>
                            {action.accessType && (
                              <Badge variant="outline" className="text-[7px] px-1 py-0 h-3.5 border-border/50">
                                {action.accessType}
                              </Badge>
                            )}
                            {action.locked && (
                              <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Always on
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-muted-foreground mt-0.5">{action.description}</p>
                          {action.guardrails && action.guardrails.length > 0 && action.permission === "autonomous" && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <Shield className="w-3 h-3 text-amber-500" />
                              {action.guardrails.map((g) => (
                                <span key={g.id} className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  {g.label}{g.value !== undefined ? `: ${g.unit || ""}${g.value}` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {!action.locked && (
                          <button
                            onClick={() => toggleAction(action.id)}
                            className={cn(
                              "shrink-0 px-2.5 py-1 rounded-full text-[9px] font-medium border transition-colors mt-0.5",
                              action.permission === "autonomous"
                                ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                : "bg-muted/30 text-muted-foreground border-border hover:bg-accent"
                            )}
                          >
                            {action.permission === "autonomous" ? "Autonomous" : "Disabled"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border">
          <Button
            className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-[13px]"
            onClick={() => onHire(name || "Ava")}
            disabled={!name.trim()}
          >
            Hire {name || "Ava"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════
// ── ESCALATION CARD ─────────────────────────────────────
// ══════════════════════════════════════════════════════════

function EscalationCard({ ticket, onResolve }: { ticket: EscalationTicket; onResolve?: (id: string) => void }) {
  const isResolved = ticket.status === "resolved";
  const sentimentColors: Record<string, string> = {
    frustrated: "bg-red-50 text-red-600 border-red-200",
    urgent: "bg-orange-50 text-orange-600 border-orange-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <div className={cn(
      "rounded-xl border px-3.5 py-2.5 transition-colors",
      isResolved ? "border-border/40 bg-muted/20 opacity-60" : "border-border bg-white"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <a
              href={ticket.zendeskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
            >
              #{ticket.zendeskTicketId}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="text-[11px] font-medium text-foreground">{ticket.subject}</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2">
            {ticket.summary}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[9px] text-muted-foreground/60">
              {formatRelativeTime(ticket.createdAt)}
            </span>
            {ticket.sentiment && (
              <Badge variant="outline" className={cn("text-[8px]", sentimentColors[ticket.sentiment] || sentimentColors.neutral)}>
                {ticket.sentiment}
              </Badge>
            )}
            {ticket.orderValue !== undefined && (
              <span className="text-[9px] font-medium text-foreground">
                ${ticket.orderValue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[8px]",
              isResolved
                ? "bg-muted/30 text-muted-foreground border-border/40"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {isResolved ? "Resolved" : "Needs attention"}
          </Badge>
          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(ticket.id)}
              className="px-2 py-1 rounded text-[9px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Check className="w-2.5 h-2.5 inline mr-0.5" />Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP PROFILE PANEL ───────────────────────────────────
// ══════════════════════════════════════════════════════════

function RepProfilePanel({
  repName,
  onClose,
}: {
  repName: string;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const [configOpen, setConfigOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const initials = getInitials(repName);

  const configHistory = [
    { hash: "0413d17", description: `${repName} onboarded — WISMO Specialist, Training mode`, author: "Team Lead (Alex)", date: "29 Mar 2026, 9:14 pm" },
  ];

  const actionGroups = useMemo(() => {
    const groups: Record<string, ActionPermission[]> = {};
    ACTION_PERMISSIONS.forEach((a) => {
      const cat = a.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, []);

  return (
    <div className="w-[320px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">Profile</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center text-white text-[16px] font-bold">
              {initials}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{repName}</p>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] mt-0.5">TRAINING</Badge>
            </div>
          </div>

          <button
            className="text-[10px] text-muted-foreground hover:text-primary hover:underline transition-colors mb-4 flex items-center gap-1"
            onClick={() => navigate("/config")}
          >
            <Pencil className="w-3 h-3" /> Edit in Config
          </button>

          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
            <div className="space-y-1.5">
              {[
                ["Personality", "Friendly"],
                ["Mode", "Training"],
                ["Started", "Mar 29, 2026"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Performance</p>
              <button
                onClick={() => navigate("/ai-support/performance")}
                className="text-[9px] text-primary hover:underline"
              >
                View more →
              </button>
            </div>
            <div className="space-y-1.5">
              {[
                ["Tickets", "0 total / 0 today"],
                ["Resolution", "0%"],
                ["CSAT", "0"],
                ["Avg Response", "2m 15s"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Permissions (read-only) */}
          <div className="mb-4">
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
            >
              {actionsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Action Permissions ({ACTION_PERMISSIONS.length})
            </button>
            {actionsOpen && (
              <div className="space-y-2">
                {Object.entries(actionGroups).map(([cat, actions]) => (
                  <div key={cat}>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
                    <div className="space-y-1">
                      {actions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between py-0.5">
                          <span className="text-[10.5px] text-foreground">{action.name}</span>
                          <Badge variant="outline" className={cn("text-[8px]", action.permission === "autonomous" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-muted/30 text-muted-foreground border-border/40")}>
                            {action.permission === "autonomous" ? "Autonomous" : "Disabled"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
            >
              {configOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Config History ({configHistory.length})
            </button>
            {configOpen && (
              <div className="space-y-2">
                {configHistory.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <Badge variant="outline" className="text-[8px] shrink-0 mt-0.5 font-mono bg-violet-50 text-violet-600 border-violet-200">
                      {entry.hash}
                    </Badge>
                    <div>
                      <p className="text-[10.5px] text-foreground leading-snug">{entry.description}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{entry.author} · {entry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── SCENARIO CARD (Sanity Check) ────────────────────────
// ══════════════════════════════════════════════════════════

interface SanityScenario {
  id: string;
  title: string;
  num: number;
  total: number;
  customerMessage: string;
  actions: string[];
  draftReply: string;
  reasoning: string;
}

const SANITY_SCENARIOS: SanityScenario[] = [
  {
    id: "s1",
    title: "Where is my order?",
    num: 1,
    total: 3,
    customerMessage: "Hi, I ordered a candle set 5 days ago and still haven't received it. Order #CLC-10250.",
    actions: [
      "get_order_details(#CLC-10250)",
      "track_shipment(tracking_number)",
      "message_user(reply)",
    ],
    draftReply: "Hi! I found your order #CLC-10250. It shipped 4 days ago via USPS — tracking shows it's in transit with an estimated delivery of March 28. I'll keep an eye on it for you!",
    reasoning: "Matched rule: 'WISMO Handling'. Order is within delivery window. Tracking info available — gave a specific update.",
  },
  {
    id: "s2",
    title: "Cancel protection plan",
    num: 2,
    total: 3,
    customerMessage: "I bought shipping protection on my last order but I don't want it anymore. Can I cancel and get a refund for the protection fee? Order #CLC-10312.",
    actions: [
      "get_order_details(#CLC-10312)",
      "check Seel protection status",
      "message_user(reply)",
    ],
    draftReply: "I can see your order #CLC-10312 has Seel shipping protection. Unfortunately, the protection plan cannot be canceled after purchase — it's active for the full shipping period. If anything happens to your package, you can file a claim at resolve.seel.com.",
    reasoning: "Matched rule: 'Seel Protection Policy'. Protection plans are non-refundable per policy. Directed customer to claim portal in case they need it later.",
  },
  {
    id: "s3",
    title: "Bulk return request",
    num: 3,
    total: 3,
    customerMessage: "I want to return 15 items from a bulk order. Order #CLC-10301. Total was $2,400.",
    actions: [
      "get_order_details(#CLC-10301)",
      "refund amount $2,400 exceeds guardrail",
      "escalate_ticket(handoff notes)",
    ],
    draftReply: "I understand you'd like to return these items. Since this is a larger order, I'd like our team to review it personally. I've flagged this for a team member who will follow up with you shortly via email.",
    reasoning: "Matched rule: 'Return & Refund'. Refund $2,400 exceeds the $200 guardrail limit. Escalated with full context.",
  },
];

function ScenarioCard({
  scenario,
  onLooksGood,
  onNeedsAdjustment,
}: {
  scenario: SanityScenario;
  onLooksGood: () => void;
  onNeedsAdjustment: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground">
          Scenario {scenario.num} of {scenario.total} — {scenario.title}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Customer message */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer:</p>
          <p className="text-[11.5px] text-foreground leading-relaxed italic">
            "{scenario.customerMessage}"
          </p>
        </div>

        {/* What I'd do */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">What I'd do:</p>
          <div className="space-y-0.5">
            {scenario.actions.map((action, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[9px] text-muted-foreground">→</span>}
                <code className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-mono">
                  {action}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Draft reply */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">My draft reply:</p>
          <blockquote className="pl-3 border-l-2 border-teal-200 text-[11px] text-foreground leading-relaxed">
            {scenario.draftReply}
          </blockquote>
        </div>

        {/* Why */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why:</p>
          <p className="text-[10.5px] text-muted-foreground leading-relaxed">
            {scenario.reasoning}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border/50 flex items-center gap-2">
        <button
          onClick={onLooksGood}
          className="px-3.5 py-1.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Check className="w-3 h-3 inline mr-1" />Looks good
        </button>
        <button
          onClick={onNeedsAdjustment}
          className="px-3.5 py-1.5 rounded-md text-[10.5px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-3 h-3 inline mr-1" />Needs adjustment
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP VIEW (Sanity Check + Escalations) ───────────────
// ══════════════════════════════════════════════════════════

type RepPhase = "greeting" | "scenario_1" | "scenario_2" | "scenario_3" | "handoff" | "role_guide" | "done";

function RepView({
  repName,
  showProfile,
  onToggleProfile,
  onSwitchToTeamLead,
  postHirePhase,
  selectedMode,
  onRoleGuideDone,
}: {
  repName: string;
  showProfile: boolean;
  onToggleProfile: () => void;
  onSwitchToTeamLead: () => void;
  postHirePhase: string;
  selectedMode: string;
  onRoleGuideDone: () => void;
}) {
  const [phase, setPhase] = useState<RepPhase>("greeting");
  const [adjustmentText, setAdjustmentText] = useState("");
  const [showAdjustmentInput, setShowAdjustmentInput] = useState<string | null>(null);
  const [hasShownTip, setHasShownTip] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const initials = getInitials(repName);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => { const next = new Set(Array.from(prev)); next.add(id); return next; });
    toast.success("Escalation marked as resolved");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [phase, showAdjustmentInput]);

  const sortedTickets = useMemo(() => {
    return [...ESCALATION_TICKETS]
      .map((t) => resolvedIds.has(t.id) ? { ...t, status: "resolved" as const } : t)
      .sort((a, b) => {
        // needs_attention first, then by date
        if (a.status !== b.status) return a.status === "needs_attention" ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [resolvedIds]);

  const RepBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
        {initials}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold">{repName}</span>
          <span className="text-[9px] text-muted-foreground/50">just now</span>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
          {children}
        </div>
      </div>
    </div>
  );

  const handleLooksGood = (currentScenario: string) => {
    if (currentScenario === "scenario_1") setPhase("scenario_2");
    else if (currentScenario === "scenario_2") setPhase("scenario_3");
    else if (currentScenario === "scenario_3") setPhase("handoff");
  };

  const handleNeedsAdjustment = (scenarioId: string) => {
    setShowAdjustmentInput(scenarioId);
  };

  const submitAdjustment = (currentScenario: string) => {
    if (!adjustmentText.trim()) return;
    toast.info("Got it. I'll let Team Lead know — they'll update the rules.");
    setShowAdjustmentInput(null);
    setAdjustmentText("");
    if (!hasShownTip) setHasShownTip(true);
    // In real app, this would switch to TL area. For prototype, advance.
    if (currentScenario === "scenario_1") setPhase("scenario_2");
    else if (currentScenario === "scenario_2") setPhase("scenario_3");
    else if (currentScenario === "scenario_3") setPhase("handoff");
  };

  const currentScenarioIdx =
    phase === "scenario_1" ? 0 :
    phase === "scenario_2" ? 1 :
    phase === "scenario_3" ? 2 : -1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
            {initials}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">{repName}</span>
            {(phase === "done" || postHirePhase === "role_guide") ? (
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] font-medium",
                  selectedMode === "production"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                {selectedMode === "production" ? "Production" : "Training"}
              </Badge>
            ) : null}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onToggleProfile}>
          Profile
        </Button>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4">

          {/* Greeting */}
          <RepBubble>
            <p className="text-[12px] leading-relaxed text-foreground">
              Hi! I'm {repName}, your new AI support rep.
            </p>
            <p className="text-[12px] leading-relaxed text-foreground mt-2">
              Before I start handling real tickets, let me show you how I'd handle a few scenarios. I'll walk you through 3 tests one at a time — tell me if each response looks right.
            </p>
          </RepBubble>

          {/* Scenario 1 */}
          {["scenario_1", "scenario_2", "scenario_3", "handoff", "role_guide", "done"].includes(phase) && (
            <>
              {(phase === "scenario_1" && !showAdjustmentInput) ? (
                <div className="ml-9">
                  <ScenarioCard
                    scenario={SANITY_SCENARIOS[0]}
                    onLooksGood={() => handleLooksGood("scenario_1")}
                    onNeedsAdjustment={() => handleNeedsAdjustment("scenario_1")}
                  />
                </div>
              ) : (
                <div className="ml-9">
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium text-foreground">Scenario 1 — {SANITY_SCENARIOS[0].title}</span>
                      <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200 ml-auto">Passed</Badge>
                    </div>
                  </div>
                </div>
              )}
              {phase === "scenario_1" && showAdjustmentInput === "scenario_1" && (
                <div className="ml-9 space-y-2">
                  <Textarea
                    value={adjustmentText}
                    onChange={(e) => setAdjustmentText(e.target.value)}
                    placeholder="What should be different?"
                    className="text-[11px] min-h-[60px]"
                  />
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => submitAdjustment("scenario_1")}>
                    Submit feedback
                  </Button>
                  {!hasShownTip && (
                    <p className="text-[10px] text-muted-foreground italic">
                      By the way — anytime after setup, if you want to adjust rules, just tell Team Lead in the Communication tab. They'll handle it.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Scenario 2 */}
          {["scenario_2", "scenario_3", "handoff", "role_guide", "done"].includes(phase) && (
            <>
              {(phase === "scenario_2" && !showAdjustmentInput) ? (
                <div className="ml-9">
                  <ScenarioCard
                    scenario={SANITY_SCENARIOS[1]}
                    onLooksGood={() => handleLooksGood("scenario_2")}
                    onNeedsAdjustment={() => handleNeedsAdjustment("scenario_2")}
                  />
                </div>
              ) : (
                <div className="ml-9">
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium text-foreground">Scenario 2 — {SANITY_SCENARIOS[1].title}</span>
                      <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200 ml-auto">Passed</Badge>
                    </div>
                  </div>
                </div>
              )}
              {phase === "scenario_2" && showAdjustmentInput === "scenario_2" && (
                <div className="ml-9 space-y-2">
                  <Textarea
                    value={adjustmentText}
                    onChange={(e) => setAdjustmentText(e.target.value)}
                    placeholder="What should be different?"
                    className="text-[11px] min-h-[60px]"
                  />
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => submitAdjustment("scenario_2")}>
                    Submit feedback
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Scenario 3 */}
          {["scenario_3", "handoff", "role_guide", "done"].includes(phase) && (
            <>
              {(phase === "scenario_3" && !showAdjustmentInput) ? (
                <div className="ml-9">
                  <ScenarioCard
                    scenario={SANITY_SCENARIOS[2]}
                    onLooksGood={() => handleLooksGood("scenario_3")}
                    onNeedsAdjustment={() => handleNeedsAdjustment("scenario_3")}
                  />
                </div>
              ) : (
                <div className="ml-9">
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium text-foreground">Scenario 3 — {SANITY_SCENARIOS[2].title}</span>
                      <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200 ml-auto">Passed</Badge>
                    </div>
                  </div>
                </div>
              )}
              {phase === "scenario_3" && showAdjustmentInput === "scenario_3" && (
                <div className="ml-9 space-y-2">
                  <Textarea
                    value={adjustmentText}
                    onChange={(e) => setAdjustmentText(e.target.value)}
                    placeholder="What should be different?"
                    className="text-[11px] min-h-[60px]"
                  />
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => submitAdjustment("scenario_3")}>
                    Submit feedback
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Handoff to Team Lead */}
          {["handoff", "role_guide", "done"].includes(phase) && postHirePhase !== "role_guide" && (
            <>
              <RepBubble>
                <p className="text-[12px] leading-relaxed text-foreground">
                  All scenarios reviewed! I'll hand you back to Team Lead for the final step.
                </p>
              </RepBubble>
              {phase === "handoff" && (
                <div className="ml-9">
                  <Button
                    className="h-9 px-5 text-[11px] bg-teal-600 hover:bg-teal-700 rounded-full"
                    onClick={() => {
                      setPhase("role_guide");
                      onSwitchToTeamLead();
                    }}
                  >
                    Go to Team Lead <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Role Guide (after mode selection) */}
          {(phase === "done" || postHirePhase === "role_guide") && (
            <>
              <RepBubble>
                <p className="text-[12px] leading-relaxed text-foreground">
                  I'm now live in <strong>{selectedMode === "production" ? "Production" : "Training"} mode</strong>. Here's how our team works:
                </p>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Come to me (Rep) when you want to:</p>
                    <ul className="text-[11px] text-foreground mt-1 space-y-0.5 list-disc list-inside">
                      <li>Check on tickets I've escalated to you</li>
                      <li>View or change my settings (click Profile)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Talk to Team Lead when you want to:</p>
                    <ul className="text-[11px] text-foreground mt-1 space-y-0.5 list-disc list-inside">
                      <li>Tell them about policy changes — they'll update my rules</li>
                      <li>Review their improvement suggestions</li>
                      <li>Upload new SOP documents</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">In the Zendesk Sidebar you can:</p>
                    <ul className="text-[11px] text-foreground mt-1 space-y-0.5 list-disc list-inside">
                      <li>See what I'm doing on any ticket in real-time</li>
                      <li>Mark a bad response so Team Lead can analyze it</li>
                      <li>Copy my suggested reply (in Training mode)</li>
                    </ul>
                  </div>
                </div>
              </RepBubble>

              {/* Continue to sidebar install */}
              {postHirePhase === "role_guide" && (
                <div className="ml-9 mt-2">
                  <Button
                    className="h-9 px-5 text-[11px] bg-teal-600 hover:bg-teal-700 rounded-full"
                    onClick={onRoleGuideDone}
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Escalation cards (shown in post-onboarding state) */}
              {phase === "done" && postHirePhase !== "role_guide" && (
                <div className="space-y-2.5 mt-2">
                  {sortedTickets.map((ticket) => (
                    <EscalationCard key={ticket.id} ticket={ticket} onResolve={handleResolve} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MODE SELECTION (in Team Lead area) ──────────────────
// ══════════════════════════════════════════════════════════

function ModeSelectionView({
  repName,
  onModeSelected,
}: {
  repName: string;
  onModeSelected: (mode: "training" | "production") => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <AlexBubble>
        <p className="text-[12px] leading-relaxed text-foreground">
          Your Rep is ready. One last thing — how do you want {repName} to work?
        </p>
      </AlexBubble>

      <div className="ml-9 space-y-2.5">
        {/* Training Mode card */}
        <div
          className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => onModeSelected("training")}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-[12px]">🔵</span>
            </div>
            <span className="text-[12px] font-semibold text-foreground">Training Mode</span>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[8px] ml-auto">Recommended</Badge>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">
            {repName} drafts every response as a Zendesk Internal Note. You review each one in Zendesk and decide whether to copy it and send to the customer. {repName} learns from your decisions.
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Best for: First-time setup — review every response before it reaches customers.
          </p>
        </div>

        {/* Production Mode card */}
        <div
          className="rounded-xl border border-border bg-white p-4 cursor-pointer hover:border-emerald-200 transition-colors"
          onClick={() => setShowConfirm(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-[12px]">🟢</span>
            </div>
            <span className="text-[12px] font-semibold text-foreground">Production Mode</span>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">
            {repName} handles tickets independently — replies directly to customers, and escalates to you when unsure. You review performance after the fact.
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Best for: When you trust the setup and want {repName} working right away.
          </p>
        </div>
      </div>

      {/* Production confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Confirm Production Mode</DialogTitle>
            <DialogDescription className="text-[12px]">
              {repName} will reply directly to customers. You can switch to Training mode anytime from the Rep profile. Continue?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { setShowConfirm(false); onModeSelected("production"); }}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── SIDEBAR INSTALL CTA (Step 9) ────────────────────────
// ══════════════════════════════════════════════════════════

function SidebarInstallCTA({
  onInstall,
  onSkip,
}: {
  onInstall: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      <AlexBubble>
        <p className="text-[12px] leading-relaxed text-foreground">
          One more thing — I noticed you haven't installed the Seel Sidebar App in Zendesk yet. It lets you see what your Rep is doing on each ticket, right inside your Zendesk workspace.
        </p>
      </AlexBubble>
      <div className="ml-9">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-[12px] font-medium text-foreground mb-1">Install Zendesk Sidebar App</p>
          <p className="text-[10.5px] text-muted-foreground mb-3">
            See AI status, copy replies, and mark bad cases — all without leaving Zendesk.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-[10px] bg-teal-600 hover:bg-teal-700" onClick={onInstall}>
              Install <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <button onClick={onSkip} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function CommunicationPage() {
  const [activeView, setActiveView] = useState<"teamlead" | "rep">("teamlead");
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [repName, setRepName] = useState<string | null>("Ava");
  const [showProfile, setShowProfile] = useState(false);
  const [threadTopicId, setThreadTopicId] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [newMsg, setNewMsg] = useState("");

  // Test mode: toggle between Onboarding and Normal conversation
  const [testMode, setTestMode] = useState<"onboarding" | "normal">("onboarding");

  // Post-hire flow state
  const [postHirePhase, setPostHirePhase] = useState<"none" | "sanity_check" | "mode_select" | "role_guide" | "sidebar_install" | "complete">("none");
  const [selectedMode, setSelectedMode] = useState<"training" | "production">("training");
  const [, navigate] = useLocation();

  const threadTopic = useMemo(
    () => (threadTopicId ? topics.find((t) => t.id === threadTopicId) || null : null),
    [threadTopicId, topics]
  );

  const handleTopicAction = useCallback((topicId: string, action: string) => {
    if (action.startsWith("navigate:")) {
      const path = action.replace("navigate:", "");
      navigate(path);
      return;
    }
    if (action === "reply") {
      setThreadTopicId(topicId);
      return;
    }
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId || !t.proposedRule) return t;
        return {
          ...t,
          proposedRule: {
            ...t.proposedRule,
            status: action === "accept" ? ("accepted" as const) : ("rejected" as const),
          },
        };
      })
    );
    toast.success(action === "accept" ? "Rule accepted" : "Rule rejected");
  }, []);

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [topics]
  );

  const pendingCount = useMemo(
    () => topics.filter((t) => t.proposedRule?.status === "pending").length,
    [topics]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* ── Test Mode Toggle Bar ── */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-border bg-amber-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Test Mode</span>
          <div className="flex items-center bg-white rounded-md border border-amber-200 p-0.5">
            <button
              onClick={() => setTestMode("onboarding")}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-medium transition-colors",
                testMode === "onboarding" ? "bg-amber-100 text-amber-800" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Onboarding
            </button>
            <button
              onClick={() => setTestMode("normal")}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-medium transition-colors",
                testMode === "normal" ? "bg-amber-100 text-amber-800" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Normal
            </button>
          </div>
        </div>
        {testMode === "onboarding" && postHirePhase === "none" && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[9px] border-amber-200 text-amber-700 hover:bg-amber-100"
            onClick={() => setShowHireDialog(true)}
          >
            Hire Rep
          </Button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
      {/* ── Narrow sidebar ── */}
      <div className="w-14 border-r border-border bg-white flex flex-col items-center py-3 shrink-0">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveView("teamlead")}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors mb-1",
                  activeView === "teamlead" ? "bg-teal-100" : "hover:bg-accent"
                )}
              >
                <span className="text-[16px]">👔</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">
              <p className="font-semibold">Alex (Team Lead)</p>
              <p className="text-muted-foreground">Manages your playbook & reps</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-6 h-px bg-border my-2" />

          {repName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveView("rep")}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                    activeView === "rep" ? "bg-violet-100" : "hover:bg-accent"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
                    {getInitials(repName)}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                <p className="font-semibold">{repName}</p>
                <p className="text-muted-foreground">L1 — WISMO Specialist · Working</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Config entry at bottom of narrow sidebar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/config")}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">
              <p className="font-semibold">Agent Config</p>
              <p className="text-muted-foreground">Configure all agents</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex min-w-0">
        {activeView === "teamlead" ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header bar — no tabs, just title + topics button */}
            <div className="flex items-center border-b border-border px-4 h-10 shrink-0">
              <span className="text-[12px] font-semibold text-foreground">
                {testMode === "onboarding" ? "Onboarding Setup" : "Team Lead Conversation"}
                {testMode === "normal" && pendingCount > 0 && (
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-amber-400 text-white text-[8px] inline-flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </span>
              <div className="flex-1" />
              {testMode === "normal" && (
                <button
                  onClick={() => setShowTopics(!showTopics)}
                  className="p-1.5 rounded hover:bg-accent transition-colors"
                  title="All topics"
                >
                  <List className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {testMode === "onboarding" ? (
              <SetupTab onHireRep={() => setShowHireDialog(true)} />
            ) : (
              <div className="flex-1 flex flex-col min-w-0">
                <ScrollArea className="flex-1">
                  <div className="px-4 py-4 space-y-5">
                    {/* Mode selection (Step 8) — shown in Conversation tab after sanity check */}
                    {postHirePhase === "mode_select" && repName && (
                      <ModeSelectionView
                        repName={repName}
                        onModeSelected={(mode) => {
                          setSelectedMode(mode);
                          toast.success(`${mode === "training" ? "Training" : "Production"} mode activated`);
                          // Switch to Rep area for role guide per spec
                          setPostHirePhase("role_guide");
                          setActiveView("rep");
                        }}
                      />
                    )}

                    {/* Sidebar install (Step 9) */}
                    {postHirePhase === "sidebar_install" && (
                      <SidebarInstallCTA
                        onInstall={() => {
                          toast.success("Redirecting to Integrations...");
                          setPostHirePhase("complete");
                          navigate("/ai-support/integrations");
                        }}
                        onSkip={() => {
                          setPostHirePhase("complete");
                        }}
                      />
                    )}

                    {/* Onboarding complete message */}
                    {postHirePhase === "complete" && (
                      <>
                        <AlexBubble>
                          <p className="text-[12px] leading-relaxed text-foreground">
                            Setup is complete! {repName} is ready to work. 🎉
                          </p>
                          <p className="text-[12px] leading-relaxed text-foreground mt-2">
                            You can find me here in the Communication tab anytime you need to chat.
                          </p>
                        </AlexBubble>

                        {/* Unfinished items summary — shown if Zendesk was skipped etc. */}
                        {/* In the real app, this would check actual connection state */}
                      </>
                    )}

                    {/* Regular topics */}
                    {sortedTopics.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        onOpenThread={setThreadTopicId}
                        onAction={handleTopicAction}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <div className="px-4 py-2.5 border-t border-border shrink-0">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Start a new topic with Alex..."
                      className="min-h-[36px] max-h-[80px] text-[11px] resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (newMsg.trim()) {
                            toast.success("Message sent to Alex");
                            setNewMsg("");
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      disabled={!newMsg.trim()}
                      onClick={() => {
                        if (newMsg.trim()) {
                          toast.success("Message sent to Alex");
                          setNewMsg("");
                        }
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : repName ? (
          <RepView
            repName={repName}
            showProfile={showProfile}
            onToggleProfile={() => setShowProfile(!showProfile)}
            onSwitchToTeamLead={() => {
              setActiveView("teamlead");
              setPostHirePhase("mode_select");
            }}
            postHirePhase={postHirePhase}
            selectedMode={selectedMode}
            onRoleGuideDone={() => {
              // After role guide, go back to TL for sidebar install
              setActiveView("teamlead");
              setPostHirePhase("sidebar_install");
            }}
          />
        ) : null}

        {/* Side panels */}
        {activeView === "teamlead" && threadTopic && (
          <FullThreadPanel
            topic={threadTopic}
            onClose={() => setThreadTopicId(null)}
            onAction={handleTopicAction}
          />
        )}
        {activeView === "teamlead" && showTopics && !threadTopic && (
          <TopicsPanel
            topics={topics}
            onSelectTopic={(id) => { setThreadTopicId(id); setShowTopics(false); }}
            onClose={() => setShowTopics(false)}
          />
        )}
        {activeView === "rep" && showProfile && repName && (
          <RepProfilePanel repName={repName} onClose={() => setShowProfile(false)} />
        )}
      </div>

      </div>

      {/* Hire dialog */}
      <HireRepDialog
        open={showHireDialog}
        onOpenChange={setShowHireDialog}
        onHire={(name) => {
          setRepName(name);
          setShowHireDialog(false);
          setActiveView("rep");
          setPostHirePhase("sanity_check");
          toast.success(`${name} has been hired!`);
        }}
      />
    </div>
  );
}
