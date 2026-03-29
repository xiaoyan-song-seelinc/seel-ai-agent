/* ──────────────────────────────────────────────────────────
   AI Support → Communication tab — v4
   15 adjustments: conflict UX, hire dialog, sanity check,
   escalation cards, profile, topic cards, rule proposal,
   performance summary, direct input, pre-setup rep, etc.
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
  Send, Check, X, Plus, ArrowRight, ChevronDown,
  MessageCircle, ExternalLink, Pencil, Upload, FileText,
  CheckCircle2, Globe, UserPlus, Clock, BarChart3, List, User,
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

  return (
    <div className="flex gap-2.5 group">
      {/* Alex avatar */}
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[12px]">&#x1F454;</span>
      </div>
      <div className="flex-1 min-w-0">
        {/* Sender + time */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">Alex</span>
          <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(topic.createdAt)}</span>
        </div>

        {/* Performance summary — bigger title, no auto action items */}
        {isPerfSummary && firstMsg && (
          <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
            <p className="text-[14px] font-bold text-foreground mb-2">Weekly Performance Summary</p>
            <div className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
              {renderMd(firstMsg.content)}
            </div>
          </div>
        )}

        {/* Regular message (not rule proposal, not perf summary) */}
        {firstMsg && !isRuleProposal && !isPerfSummary && (
          <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
            <div className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
              {renderMd(firstMsg.content)}
            </div>
          </div>
        )}

        {/* Rule Proposal — conversation context + card */}
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

            {/* Proposed Change card */}
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

        {/* Reply previews */}
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

        {/* Reply to topic link */}
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
                  <span className="text-[10px] font-semibold text-foreground">
                    {msg.sender === "ai" ? "Alex" : "You"}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="text-[11.5px] leading-relaxed text-foreground whitespace-pre-wrap">
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
            placeholder="Reply to topic..."
            className="min-h-[36px] max-h-[100px] text-[11.5px] resize-none"
            rows={1}
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled={!replyText.trim()}
            onClick={() => { toast.success("Reply sent"); setReplyText(""); }}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPICS LIST PANEL ───────────────────────────────────
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
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTopic(t.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-accent/30 transition-colors border-b border-border/30"
            >
              <div className="flex items-center gap-2">
                <p className="text-[11.5px] font-medium text-foreground truncate flex-1">{t.title}</p>
                {t.proposedRule?.status === "pending" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t.messages.length} messages · {formatRelativeTime(t.createdAt)}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}



// ══════════════════════════════════════════════════════════
// ── SETUP TAB (Team Lead onboarding) ────────────────────
// ══════════════════════════════════════════════════════════

type SetupStep = "greeting" | "upload" | "processing" | "rules_extracted" | "conflicts" | "playbook_ready" | "hire_prompt";

interface ConflictItem {
  id: string;
  title: string;
  description: string;
  options: { label: string; value: string }[];
  resolved: boolean;
  selectedOption?: string;
}

const DEMO_CONFLICTS: ConflictItem[] = [
  {
    id: "c-1",
    title: "Return window for VIP customers",
    description: "Your SOP says 30-day return window for everyone, but your team has been extending to 45 days for VIP customers (3+ orders). Which should I follow?",
    options: [
      { label: "30 days for everyone", value: "30_all" },
      { label: "45 days for VIP customers", value: "45_vip" },
      { label: "Dismiss — I'll clarify later", value: "dismiss" },
    ],
    resolved: false,
  },
  {
    id: "c-2",
    title: "Photo evidence for damaged items",
    description: "Your policy requires photo evidence for all damage claims. But for items under $80, your team usually skips this step. Should I require photos for low-value items?",
    options: [
      { label: "Always require photos", value: "always_photo" },
      { label: "Skip for items under $80", value: "skip_under_80" },
      { label: "Dismiss — I'll clarify later", value: "dismiss" },
    ],
    resolved: false,
  },
];

const DEMO_EXTRACTED_RULES = [
  "Standard Return & Refund",
  "Where Is My Order (WISMO)",
  "Damaged / Wrong Item",
  "Order Cancellation",
  "Return Shipping Cost",
  "International Returns",
  "VIP Customer Handling",
  "Discount & Coupon Policy",
];

function SetupTab({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [step, setStep] = useState<SetupStep>("greeting");
  const [conflicts, setConflicts] = useState(DEMO_CONFLICTS);
  const [showAllRules, setShowAllRules] = useState(false);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, currentConflictIdx]);

  const handleConflictResolve = (id: string, value: string) => {
    setConflicts((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true, selectedOption: value } : c)));
    setTimeout(() => {
      if (currentConflictIdx < conflicts.length - 1) {
        setCurrentConflictIdx((i) => i + 1);
      } else {
        setStep("playbook_ready");
      }
    }, 500);
  };

  const visibleRules = showAllRules ? DEMO_EXTRACTED_RULES : DEMO_EXTRACTED_RULES.slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-11 border-b border-border shrink-0">
        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
          <span className="text-[11px]">&#x1F454;</span>
        </div>
        <div>
          <span className="text-[12px] font-semibold text-foreground">Alex</span>
          <span className="text-[10px] text-muted-foreground ml-1.5">Team Lead</span>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4">

          {/* Greeting */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[12px]">&#x1F454;</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                <span className="text-[9px] text-muted-foreground/50">just now</span>
              </div>
              <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                <p className="text-[12px] leading-relaxed text-foreground">
                  Welcome to Support Workforce! I'm Alex, your Team Lead. I manage your support reps so you don't have to deal with the details.
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  Your Zendesk and Shopify are connected. I need two things from you before we can get your first rep on the floor.
                </p>
              </div>
            </div>
          </div>

          {/* Training docs prompt */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[12px]">&#x1F454;</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                <span className="text-[9px] text-muted-foreground/50">just now</span>
              </div>
              <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                <p className="text-[13px] font-bold text-foreground mb-1.5">First — your training docs.</p>
                <p className="text-[12px] leading-relaxed text-foreground">
                  Upload the same playbooks, refund policies, and escalation rules you'd hand a new hire. I'll read them, extract the rules, and flag anything that's unclear.
                </p>
              </div>
            </div>
          </div>

          {step === "greeting" && (
            <div className="ml-9">
              {/* Upload area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors"
                onClick={() => setStep("processing")}
              >
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-[11px] font-medium text-foreground">Drop files here or click to upload</p>
                <p className="text-[9.5px] text-muted-foreground mt-0.5">PDF, DOC, CSV — or paste a URL</p>
              </div>
              {/* URL input */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-white">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste a URL..."
                    className="text-[11px] bg-transparent outline-none flex-1 placeholder:text-muted-foreground/50"
                    onKeyDown={(e) => { if (e.key === "Enter") setStep("processing"); }}
                  />
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setStep("processing")}>
                  Add
                </Button>
              </div>
              <button
                className="text-[10px] text-primary hover:underline mt-2 block"
                onClick={() => setStep("processing")}
              >
                No docs handy? Try with Seel Return Guidelines (demo)
              </button>
            </div>
          )}

          {/* Processing */}
          {(step === "processing" || step === "rules_extracted" || step === "conflicts" || step === "playbook_ready" || step === "hire_prompt") && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px]">&#x1F454;</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                  {step === "processing" ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12px] font-medium text-foreground">Reading your docs...</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        This takes a moment for the demo. When you upload your own documents, processing may take 30–60 minutes. I'll notify you when it's ready.
                      </p>
                      {/* Auto-advance for demo */}
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setStep("rules_extracted")}>
                          Skip (demo) →
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[12px] text-foreground mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />
                        Done! I extracted <strong>{DEMO_EXTRACTED_RULES.length} rules</strong> from your documents:
                      </p>
                      <div className="space-y-1">
                        {visibleRules.map((rule, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-foreground">
                            <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                            {rule}
                          </div>
                        ))}
                        {!showAllRules && DEMO_EXTRACTED_RULES.length > 5 && (
                          <button
                            className="text-[10px] text-primary hover:underline mt-1"
                            onClick={() => setShowAllRules(true)}
                          >
                            Show {DEMO_EXTRACTED_RULES.length - 5} more...
                          </button>
                        )}
                      </div>
                      {step === "rules_extracted" && (
                        <p className="text-[11px] text-muted-foreground mt-2">
                          I found a couple of things that need your input...
                          <Button size="sm" variant="link" className="h-auto p-0 ml-1 text-[11px]" onClick={() => { setStep("conflicts"); setCurrentConflictIdx(0); }}>
                            Continue →
                          </Button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conflicts — one at a time as chat bubbles */}
          {(step === "conflicts" || step === "playbook_ready" || step === "hire_prompt") && conflicts.map((conflict, idx) => {
            if (idx > currentConflictIdx && step === "conflicts") return null;
            return (
              <div key={conflict.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px]">&#x1F454;</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                    <span className="text-[9px] text-muted-foreground/50">just now</span>
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                    <p className="text-[12px] font-medium text-foreground mb-1">{conflict.title}</p>
                    <p className="text-[11.5px] text-foreground leading-relaxed">{conflict.description}</p>
                  </div>
                  {/* Options or resolved state */}
                  {conflict.resolved ? (
                    <div className="mt-1.5 flex justify-end">
                      <div className="rounded-xl rounded-tr-sm bg-violet-50 px-3 py-1.5">
                        <span className="text-[11px] text-violet-700">
                          {conflict.options.find((o) => o.value === conflict.selectedOption)?.label}
                        </span>
                      </div>
                    </div>
                  ) : idx === currentConflictIdx && step === "conflicts" ? (
                    <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                      {conflict.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleConflictResolve(conflict.id, opt.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10.5px] font-medium border transition-colors",
                            opt.value === "dismiss"
                              ? "border-border text-muted-foreground hover:bg-accent"
                              : "border-primary/30 text-primary hover:bg-primary/5"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Playbook ready */}
          {(step === "playbook_ready" || step === "hire_prompt") && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px]">&#x1F454;</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                  <p className="text-[12px] text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />
                    Your playbook is set up with {DEMO_EXTRACTED_RULES.length} rules. You can review and edit them anytime in the Playbook tab.
                  </p>
                </div>
                {step === "playbook_ready" && (
                  <Button size="sm" variant="link" className="h-auto p-0 mt-1 text-[11px]" onClick={() => setStep("hire_prompt")}>
                    Continue →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hire prompt */}
          {step === "hire_prompt" && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px]">&#x1F454;</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                  <p className="text-[13px] font-bold text-foreground mb-1.5">Second — let's hire your first support rep.</p>
                  <p className="text-[12px] leading-relaxed text-foreground">
                    I'll start them on WISMO — order status, cancellations for unshipped orders, and address changes. Highest volume, lowest risk. Once they prove themselves, we expand their scope.
                  </p>
                  <p className="text-[12px] leading-relaxed text-foreground mt-2">
                    I've pre-configured a rep based on your docs. Review the profile and hit Hire:
                  </p>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white text-[11.5px] h-9 px-4"
                    onClick={onSetupComplete}
                  >
                    Review & Hire Support Rep <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── HIRE REP DIALOG ─────────────────────────────────────
// ══════════════════════════════════════════════════════════

const PERSONALITIES = [
  { label: "Friendly", emoji: "👋" },
  { label: "Neutral", emoji: "📋" },
  { label: "Matter-of-fact", emoji: "📄" },
  { label: "Professional", emoji: "💼" },
  { label: "Humorous", emoji: "😊" },
];

function HireRepDialog({
  open,
  onOpenChange,
  onHire,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onHire: (name: string) => void;
}) {
  const [name, setName] = useState("Ava");
  const [personality, setPersonality] = useState("Friendly");
  const [strategy, setStrategy] = useState("conservative");
  const [language, setLanguage] = useState("en-GB");

  const groupedActions = useMemo(() => {
    const groups: Record<string, ActionPermission[]> = {};
    ACTION_PERMISSIONS.forEach((a) => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-[16px]">Hire Support Rep</DialogTitle>
            <DialogDescription className="text-teal-100 text-[12px]">
              Pre-configured based on your training docs. Review and confirm.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column — basic info */}
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-8 text-[12px]" />
              </div>

              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tone of Voice</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPersonality(p.label)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-full text-[10.5px] border transition-colors flex items-center gap-1",
                        personality === p.label
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-border text-foreground hover:bg-accent"
                      )}
                    >
                      <span className="text-[11px]">{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="mt-1 h-8 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1 h-8 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-GB">English (British)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right column — actions */}
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Allowed Actions</Label>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {Object.entries(groupedActions).map(([category, actions]) => (
                  <div key={category}>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
                    <div className="space-y-0.5">
                      {actions.map((action) => (
                        <div key={action.id}>
                          <label className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-accent/30 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={action.permission === "autonomous"}
                              className="rounded border-border text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] text-foreground">{action.name}</span>
                              {action.permission === "disabled" && (
                                <span className="text-[9px] text-muted-foreground ml-1">(not assigned)</span>
                              )}
                            </div>
                          </label>
                          {action.guardrails && action.guardrails.length > 0 && action.permission === "autonomous" && (
                            <div className="ml-7 mb-1">
                              {action.guardrails.map((g) => (
                                <div key={g.id} className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground py-0.5">
                                  <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                  {g.label}{g.value ? `: ${g.value}${g.unit || ""}` : ""}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border">
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-10"
            onClick={() => onHire(name)}
          >
            Hire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════
// ── ESCALATION CARD ─────────────────────────────────────
// ══════════════════════════════════════════════════════════

function EscalationCard({ ticket }: { ticket: EscalationTicket }) {
  const isResolved = ticket.status === "resolved";
  return (
    <div className={cn(
      "rounded-lg border px-3.5 py-2.5 transition-colors",
      isResolved ? "border-border/40 bg-muted/20 opacity-60" : "border-border bg-white hover:shadow-sm"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-medium text-foreground">
              #{ticket.zendeskTicketId} · {ticket.subject}
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {ticket.reason}
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-1">{formatRelativeTime(ticket.createdAt)}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] shrink-0",
            isResolved ? "bg-muted/30 text-muted-foreground border-border/30" : "bg-amber-50 text-amber-600 border-amber-200"
          )}
        >
          {isResolved ? "Resolved" : "Needs attention"}
        </Badge>
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
  const [isEditing, setIsEditing] = useState(false);
  const initials = getInitials(repName);

  const configHistory = [
    {
      hash: "0413d17",
      description: `${repName} onboarded — WISMO Specialist, Training mode`,
      author: "Team Lead (Alex)",
      date: "29 Mar 2026, 9:14 pm",
    },
  ];

  if (isEditing) {
    return (
      <div className="w-[320px] border-l border-border bg-white flex flex-col h-full shrink-0">
        <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
          <span className="text-[12px] font-semibold text-foreground">Edit Profile</span>
          <button onClick={() => setIsEditing(false)} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-4">
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input defaultValue={repName} className="mt-1 h-8 text-[12px]" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Role</Label>
              <Input defaultValue="L1 — WISMO Specialist" className="mt-1 h-8 text-[12px]" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Strategy</Label>
              <Select defaultValue="conservative">
                <SelectTrigger className="mt-1 h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Refund Cap</Label>
              <Input defaultValue="£100" className="mt-1 h-8 text-[12px]" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personality</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.label}
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-[10.5px] border transition-colors flex items-center gap-1",
                      p.label === "Friendly"
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-border text-foreground hover:bg-accent"
                    )}
                  >
                    <span className="text-[11px]">{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Language</Label>
              <Select defaultValue="en-GB">
                <SelectTrigger className="mt-1 h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-GB">English (British)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mode</Label>
              <Select defaultValue="training">
                <SelectTrigger className="mt-1 h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-8 text-[11px]" onClick={() => { setIsEditing(false); toast.success("Profile updated"); }}>
              Save Changes
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

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
          {/* Avatar + name + mode badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center text-white text-[16px] font-bold">
              {initials}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{repName}</p>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] mt-0.5">TRAINING</Badge>
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-[10.5px] mb-4"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit Profile
          </Button>

          {/* Details */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
            <div className="space-y-1.5">
              {[
                ["Role", "L1 — WISMO Specialist"],
                ["Strategy", "Conservative"],
                ["Refund Cap", "£100"],
                ["Personality", "Warm & Professional"],
                ["Language", "English (British)"],
                ["Started", "Mar 29, 2026"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
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
                ["Avg Response", "—"],
                ["Escalation", "0%"],
                ["Cost/Ticket", "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Config History */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Config History ({configHistory.length})
            </p>
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
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP VIEW (conversation + escalations) ───────────────
// ══════════════════════════════════════════════════════════

type RepOnboardingStep = "greeting" | "scenario_1" | "scenario_2" | "scenario_3" | "mode_select" | "ready" | "done";

function RepView({
  repName,
  showProfile,
  onToggleProfile,
}: {
  repName: string;
  showProfile: boolean;
  onToggleProfile: () => void;
}) {
  const [onboardingStep, setOnboardingStep] = useState<RepOnboardingStep>("done");
  const initials = getInitials(repName);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [onboardingStep]);

  const sortedTickets = useMemo(() => {
    return [...ESCALATION_TICKETS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
            {initials}
          </div>
          <div>
            <span className="text-[12px] font-semibold text-foreground">{repName}</span>
            <span className="text-[10px] text-muted-foreground ml-1.5">L1 — WISMO Specialist · Onboarding</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onToggleProfile}>
          Profile
        </Button>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4">

          {/* Pre-completed onboarding conversation */}
          {/* Greeting */}
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
                <p className="text-[12px] leading-relaxed text-foreground">
                  Hi! I'm {repName}. Alex brought me up to speed on your docs — I've studied your playbook, refund policy, and escalation rules.
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  Before I start handling real tickets, let me show you how I'd handle three scenarios. You tell me if I'm on the right track.
                </p>
              </div>
            </div>
          </div>

          {/* Scenario 1 */}
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
                <p className="text-[13px] font-bold text-foreground mb-1.5">Scenario 1 — "Where is my order?"</p>
                <p className="text-[12px] text-foreground leading-relaxed">
                  Customer writes: <em>"Where is my order #DBH-29174? It's been a week and I haven't received anything."</em>
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">Here's what I'd do:</p>
                <p className="text-[12px] text-foreground leading-relaxed">1. Look up #DBH-29174 in Shopify</p>
                <p className="text-[12px] text-foreground leading-relaxed">2. I see it's <strong>shipped</strong> via Royal Mail, tracking RM29174UK, expected Mar 25</p>
                <p className="text-[12px] text-foreground leading-relaxed">3. I'd reply:</p>
                <div className="ml-3 mt-1 pl-2.5 border-l-2 border-border/50">
                  <p className="text-[11.5px] text-muted-foreground italic leading-relaxed">
                    Hi Emma! Your order #DBH-29174 shipped via Royal Mail (tracking: RM29174UK) and is expected to arrive by March 25th. You can track it here: [link]. Let me know if you need anything else!
                  </p>
                </div>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  This is read-only — I'm just looking up info and replying. Does this look right?
                </p>
              </div>
              {/* User response (pre-completed) */}
              <div className="flex justify-end mt-1.5">
                <div className="rounded-xl rounded-tr-sm bg-violet-50 px-3 py-1.5">
                  <span className="text-[11px] text-violet-700">That's right</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 2 — Escalation: unclear input */}
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
                <p className="text-[13px] font-bold text-foreground mb-1.5">Scenario 2 — "I want to return this"</p>
                <p className="text-[12px] text-foreground leading-relaxed">
                  Customer writes: <em>"I want to return this. It's not what I expected."</em>
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  I'd need to know which order and item. But the customer hasn't given me an order number. I'd ask for it first. If they say it's damaged, I follow the damage rule. If it's change-of-mind, I follow the standard return rule.
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  <strong>But if the customer gets frustrated</strong> and says "I want to talk to a manager" — I'd escalate immediately. That triggers my escalation guardrail.
                </p>
              </div>
              <div className="flex justify-end mt-1.5">
                <div className="rounded-xl rounded-tr-sm bg-violet-50 px-3 py-1.5">
                  <span className="text-[11px] text-violet-700">That's right</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 3 — Escalation: no permission */}
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
                <p className="text-[13px] font-bold text-foreground mb-1.5">Scenario 3 — "Can I get a discount?"</p>
                <p className="text-[12px] text-foreground leading-relaxed">
                  Customer writes: <em>"I've been a loyal customer for 2 years. Can I get a discount on my next order?"</em>
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  I don't have the "Create Coupon" action enabled, so I can't generate a discount code. I'd escalate this to you with a note: "Loyal customer requesting discount — I don't have permission to create coupons."
                </p>
              </div>
              <div className="flex justify-end mt-1.5">
                <div className="rounded-xl rounded-tr-sm bg-violet-50 px-3 py-1.5">
                  <span className="text-[11px] text-violet-700">That's right</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode selection (pre-completed) */}
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
                <p className="text-[12px] text-foreground leading-relaxed">
                  Great — I'm confident I understand your policies.
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  One last question. How do you want me to work?
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  <strong>Training mode</strong> — I draft my responses and actions, but I check with you before anything goes out to the customer. Good if you want to review my work for a while.
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  <strong>Production mode</strong> — I handle tickets on my own. You can review everything after the fact. Good if you trust the sanity check and want me working immediately.
                </p>
              </div>
              {/* User chose Training */}
              <div className="flex justify-end mt-1.5">
                <div className="rounded-xl rounded-tr-sm bg-violet-50 px-3 py-1.5">
                  <span className="text-[11px] text-violet-700">Training — check with me first</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ready + communication explanation */}
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
                <p className="text-[12px] text-foreground leading-relaxed">
                  I'm live in <strong>Training mode</strong>. I'll start picking up WISMO, cancellation, and address change tickets now.
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  I'll message you here when I need your help — like when a customer situation falls outside my rules, or when I don't have permission to take an action. You can also adjust my settings anytime from my Profile.
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  If something about my tone or approach needs adjustment, let Alex (Team Lead) know — he'll coach me on it.
                </p>
              </div>
            </div>
          </div>

          {/* Escalation cards — sorted by time */}
          {sortedTickets.length > 0 && (
            <div className="space-y-2 mt-2">
              {sortedTickets.map((ticket) => (
                <EscalationCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"alex" | string>("alex");
  const [setupDone, setSetupDone] = useState(true);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [reps, setReps] = useState<{ id: string; name: string }[]>([
    { id: "rep-ava", name: "Ava" },
  ]);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [topics, setTopics] = useState(TOPICS);

  const activeRep = reps.find((r) => r.id === activeTab);
  const threadTopic = openThread ? topics.find((t) => t.id === openThread) : null;

  const handleTopicAction = useCallback((topicId: string, action: string) => {
    if (action === "accept") {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId && t.proposedRule
            ? { ...t, proposedRule: { ...t.proposedRule, status: "accepted" as const } }
            : t
        )
      );
      toast.success("Rule accepted and applied to playbook");
    } else if (action === "reject") {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId && t.proposedRule
            ? { ...t, proposedRule: { ...t.proposedRule, status: "rejected" as const } }
            : t
        )
      );
      toast.info("Rule rejected");
    } else if (action === "reply") {
      setOpenThread(topicId);
    }
  }, []);

  const handleHire = (name: string) => {
    const newRep = { id: `rep-${name.toLowerCase()}`, name };
    if (!reps.find((r) => r.name === name)) {
      setReps((prev) => [...prev, newRep]);
    }
    setHireDialogOpen(false);
    setActiveTab(newRep.id);
    toast.success(`${name} has been hired!`);
  };

  const handleSetupComplete = () => {
    setHireDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    toast.success("Message sent — Alex will respond shortly");
    setNewMessage("");
  };

  // Group topics by date
  const topicsByDate = useMemo(() => {
    const sorted = [...topics].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const groups: { date: string; topics: Topic[] }[] = [];
    sorted.forEach((t) => {
      const dateKey = formatDateGroup(t.createdAt);
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) existing.topics.push(t);
      else groups.push({ date: dateKey, topics: [t] });
    });
    return groups;
  }, [topics]);

  return (
    <div className="flex h-full">
      {/* Left sidebar — contacts */}
      <div className="w-[200px] border-r border-border bg-white flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-[11px] font-semibold text-foreground">Messages</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="py-1">
            {/* Alex (Team Lead) */}
            <button
              onClick={() => { setActiveTab("alex"); setShowProfile(false); }}
              className={cn(
                "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
                activeTab === "alex" ? "bg-accent" : "hover:bg-accent/30"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-[11px]">&#x1F454;</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">Alex</p>
                <p className="text-[9px] text-muted-foreground truncate">Team Lead</p>
              </div>
            </button>

            {/* Reps */}
            {reps.map((rep) => (
              <button
                key={rep.id}
                onClick={() => { setActiveTab(rep.id); setShowProfile(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
                  activeTab === rep.id ? "bg-accent" : "hover:bg-accent/30"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  {getInitials(rep.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{rep.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">Working</p>
                </div>
              </button>
            ))}

            {/* Add rep */}
            <button
              onClick={() => setHireDialogOpen(true)}
              className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              <div className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px]">Hire Rep</span>
            </button>
          </div>
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-w-0">
        {activeTab === "alex" && !setupDone ? (
          <div className="flex-1">
            <SetupTab onSetupComplete={handleSetupComplete} />
          </div>
        ) : activeTab === "alex" ? (
          <div className="flex-1 flex flex-col">
            {/* Alex header */}
            <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-[11px]">&#x1F454;</span>
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-foreground">Alex</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">Team Lead</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setShowTopics(!showTopics)}
              >
                <List className="w-3 h-3 mr-1" /> Topics
              </Button>
            </div>

            {/* Topics feed */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-4 space-y-5">
                {topicsByDate.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-[9px] text-muted-foreground/60 font-medium">{group.date}</span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                    <div className="space-y-4">
                      {group.topics.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          onOpenThread={(id) => { setOpenThread(id); setShowTopics(false); }}
                          onAction={handleTopicAction}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="px-3 py-2.5 border-t border-border">
              <div className="flex items-end gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Start a new topic..."
                  className="min-h-[36px] max-h-[100px] text-[11.5px] resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : activeRep ? (
          <div className="flex-1">
            <RepView
              repName={activeRep.name}
              showProfile={showProfile}
              onToggleProfile={() => setShowProfile(!showProfile)}
            />
          </div>
        ) : null}

        {/* Side panels */}
        {activeTab === "alex" && showTopics && !openThread && (
          <TopicsPanel
            topics={topics}
            onSelectTopic={(id) => { setOpenThread(id); setShowTopics(false); }}
            onClose={() => setShowTopics(false)}
          />
        )}
        {activeTab === "alex" && threadTopic && (
          <FullThreadPanel
            topic={threadTopic}
            onClose={() => setOpenThread(null)}
            onAction={handleTopicAction}
          />
        )}
        {activeRep && showProfile && (
          <RepProfilePanel
            repName={activeRep.name}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>

      <HireRepDialog
        open={hireDialogOpen}
        onOpenChange={setHireDialogOpen}
        onHire={handleHire}
      />
    </div>
  );
}
