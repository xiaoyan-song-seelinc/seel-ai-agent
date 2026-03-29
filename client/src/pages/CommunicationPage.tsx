/* ──────────────────────────────────────────────────────────
   AI Support → Communication tab — v5
   10 adjustments: narrow sidebar, separator, no hire more,
   keep onboarding tab, topic grouping, unread badges,
   adjustment flow, simplified profile, config collapsed,
   performance fields.
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
  CheckCircle2, Globe, Clock, BarChart3, List,
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
  const hasPendingAction = topic.proposedRule?.status === "pending";
  const hasUnread = replies.length > 0 && replies.some((r) => r.sender === "ai");

  return (
    <div className="flex gap-2.5 group">
      {/* Alex avatar */}
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[12px]">&#x1F454;</span>
      </div>
      <div className="flex-1 min-w-0">
        {/* Sender + time + badges */}
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

        {/* Performance summary — bigger title */}
        {isPerfSummary && firstMsg && (
          <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
            <p className="text-[14px] font-bold text-foreground mb-2">Weekly Performance Summary</p>
            <div className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
              {renderMd(firstMsg.content)}
            </div>
          </div>
        )}

        {/* Regular message */}
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

      {/* Reply input */}
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
// ── SETUP TAB (onboarding flow) ─────────────────────────
// ══════════════════════════════════════════════════════════

const PERSONALITIES = [
  { emoji: "👋", label: "Friendly" },
  { emoji: "🏛️", label: "Neutral" },
  { emoji: "📋", label: "Matter-of-fact" },
  { emoji: "💼", label: "Professional" },
  { emoji: "😄", label: "Humorous" },
];

type SetupStep = "greeting" | "upload" | "processing" | "rules_extracted" | "conflicts" | "done";

function SetupTab({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [step, setStep] = useState<SetupStep>("greeting");
  const [useDemo, setUseDemo] = useState(false);
  const [conflictIdx, setConflictIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, conflictIdx]);

  const demoRules = [
    "Seel Return Protection — Full Refund Policy",
    "Seel Return Protection — Partial Damage Handling",
    "Seel Return Protection — Claim Window (30 days)",
    "Seel Return Protection — Excluded Items",
    "Seel Return Protection — Escalation to Claims Team",
    "Seel Return Protection — Duplicate Claim Prevention",
    "Seel Return Protection — Shipping Label Generation",
  ];

  const conflicts = [
    {
      title: "Refund amount for partial damage",
      description: "Your return policy says 'full refund for all returns', but the damage handling doc says 'partial refund based on damage assessment'. Which should I follow?",
      options: ["Always full refund", "Partial refund based on assessment", "Escalate to manager"],
    },
    {
      title: "Claim window after delivery",
      description: "The main policy states 30-day claim window, but the FAQ mentions 14 days for electronics. Should electronics have a different window?",
      options: ["30 days for all items", "14 days for electronics", "Escalate to manager"],
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
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => { setUseDemo(false); setStep("processing"); }}
              >
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-[11px] text-foreground font-medium">Drop files here or click to upload</p>
                <p className="text-[9px] text-muted-foreground mt-1">PDF, DOCX, TXT — up to 10MB each</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-[9px] text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Paste a URL to import..." className="h-8 text-[11px] flex-1" />
                <Button size="sm" variant="outline" className="h-8 text-[10px]">Import</Button>
              </div>
              <button
                onClick={() => { setUseDemo(true); setStep("processing"); }}
                className="mt-2 text-[10px] text-primary hover:underline"
              >
                No docs handy? Try with Seel Return Guidelines →
              </button>
            </div>
          )}

          {/* Processing */}
          {step !== "greeting" && (
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
                      <p className="text-[12px] leading-relaxed text-foreground">
                        {useDemo
                          ? "Great, I'll use the Seel Return Guidelines as a demo. Give me a moment to read through them..."
                          : "Got it! I'm reading through your documents now..."}
                      </p>
                      {!useDemo && (
                        <p className="text-[12px] leading-relaxed text-muted-foreground mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          For your own documents, this usually takes 30–60 minutes. I'll notify you when it's ready — feel free to come back later.
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
                          onClick={() => setStep("rules_extracted")}
                        >
                          Skip to results (demo)
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[12px] leading-relaxed text-foreground">
                        Done! I've extracted <strong>{demoRules.length} rules</strong> from your documents:
                      </p>
                      <div className="mt-2 space-y-1">
                        {demoRules.slice(0, 5).map((rule, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-foreground">{rule}</span>
                          </div>
                        ))}
                        {demoRules.length > 5 && (
                          <button
                            onClick={() => toast.info(`All ${demoRules.length} rules: ${demoRules.join(", ")}`)}
                            className="text-[10px] text-primary hover:underline ml-4.5"
                          >
                            +{demoRules.length - 5} more rules
                          </button>
                        )}
                      </div>
                      {conflicts.length > 0 && step === "rules_extracted" && (
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
                      {step === "done" && (
                        <p className="text-[12px] leading-relaxed text-foreground mt-3">
                          All conflicts resolved. Your playbook is ready!
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conflicts — one bubble per conflict */}
          {step === "conflicts" && conflictIdx < conflicts.length && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px]">&#x1F454;</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold">Alex (Team Lead)</span>
                  <span className="text-[9px] text-muted-foreground/50">just now</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-amber-50/60 border border-amber-200/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
                    Conflict {conflictIdx + 1} of {conflicts.length}
                  </p>
                  <p className="text-[12px] font-medium text-foreground mb-1">{conflicts[conflictIdx].title}</p>
                  <p className="text-[11.5px] text-foreground leading-relaxed">{conflicts[conflictIdx].description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {conflicts[conflictIdx].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        toast.success(`Selected: ${opt}`);
                        if (conflictIdx + 1 >= conflicts.length) {
                          setStep("done");
                        } else {
                          setConflictIdx(conflictIdx + 1);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-[10.5px] border border-border bg-white hover:bg-accent transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      toast.info("Conflict dismissed — will use default behavior");
                      if (conflictIdx + 1 >= conflicts.length) {
                        setStep("done");
                      } else {
                        setConflictIdx(conflictIdx + 1);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full text-[10.5px] text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Done — hire rep */}
          {step === "done" && (
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
                    className="h-9 px-5 text-[11px] bg-teal-600 hover:bg-teal-700 rounded-full"
                    onClick={onSetupComplete}
                  >
                    Review & Hire Support Rep <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white text-[16px]">Hire Support Rep</DialogTitle>
            <DialogDescription className="text-teal-100 text-[12px]">
              Pre-configured based on your training docs. Review and confirm.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex max-h-[60vh]">
          {/* Left column — basic config */}
          <div className="flex-1 px-5 py-4 overflow-y-auto border-r border-border">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-8 text-[12px]" />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personality</Label>
                <div
 className="flex flex-wrap gap-1.5 mt-1.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.label}
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-[10.5px] border transition-colors flex items-center gap-1",
                      p.label === personality
                        ? "border-teal-400 bg-teal-50 text-teal-700"
                        : "border-border text-foreground hover:bg-accent"
                    )}
                    onClick={() => setPersonality(p.label)}
                  >
                    <span className="text-[11px]">{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
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
            </div>
          </div>

          {/* Right column — allowed actions */}
          <div className="flex-1 px-5 py-4 overflow-y-auto">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Allowed Actions</Label>
            <div className="mt-2 space-y-3">
              {Object.entries(actionGroups).map(([cat, actions]) => (
                <div key={cat}>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat}</p>
                  <div className="space-y-1">
                    {actions.map((action) => (
                      <label key={action.id} className="flex items-start gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                  defaultChecked={action.permission === 'autonomous'}
                          className="mt-0.5 rounded border-border"
                        />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-foreground">{action.name}</span>
                            {action.guardrails && action.guardrails.length > 0 && (
                              <p className="text-[9px] text-muted-foreground mt-0.5">{action.guardrails[0].label}</p>                     )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border">
          <Button
            className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-[13px]"
            onClick={() => onHire(name || "Ava")}
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
      "rounded-xl border px-3.5 py-2.5 transition-colors",
      isResolved ? "border-border/40 bg-muted/20 opacity-60" : "border-border bg-white"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-medium text-foreground">
              #{ticket.id} · {ticket.subject}
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2">
            {ticket.summary}
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-1">
            {formatRelativeTime(ticket.createdAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] shrink-0",
            isResolved
              ? "bg-muted/30 text-muted-foreground border-border/40"
              : "bg-amber-50 text-amber-700 border-amber-200"
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
  const [configOpen, setConfigOpen] = useState(false);
  const [personality, setPersonality] = useState("Friendly");
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

  // Edit mode
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
          <div className="px-4 py-4 space-y-3">
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input defaultValue={repName} className="mt-1 h-8 text-[12px]" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personality</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.label}
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-[10.5px] border transition-colors flex items-center gap-1",
                      p.label === personality
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-border text-foreground hover:bg-accent"
                    )}
                    onClick={() => setPersonality(p.label)}
                  >
                    <span className="text-[11px]">{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
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

            {/* Allowed Actions with Guardrails */}
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Allowed Actions</Label>
              <div className="mt-2 space-y-3">
                {Object.entries(actionGroups).map(([cat, actions]) => (
                  <div key={cat}>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat}</p>
                    <div className="space-y-1">
                      {actions.map((action) => (
                        <label key={action.id} className="flex items-start gap-2 py-1 cursor-pointer">
                          <input type="checkbox" defaultChecked={action.permission === 'autonomous'} className="mt-0.5 rounded border-border" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-foreground">{action.name}</span>
                            {action.guardrails && action.guardrails.length > 0 && (
                              <p className="text-[9px] text-muted-foreground mt-0.5">{action.guardrails[0].label}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full h-8 text-[11px]" onClick={() => { setIsEditing(false); toast.success("Profile updated"); }}>
              Save Changes
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // View mode
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

          {/* Details — simplified fields */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
            <div className="space-y-1.5">
              {[
                ["Personality", "Warm & Professional"],
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

          {/* Performance — no Cost, no Escalation, has Avg Response */}
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

          {/* Config History — collapsed by default */}
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
  const [onboardingStep] = useState<RepOnboardingStep>("done");
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

          {/* Pre-completed onboarding — Greeting */}
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

          {/* Scenario 1 — self-handle */}
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
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  Here's what I'd do:
                </p>
                <ol className="text-[12px] text-foreground leading-relaxed mt-1 list-decimal list-inside space-y-0.5">
                  <li>Look up #DBH-29174 in Shopify</li>
                  <li>I see it's <strong>shipped</strong> via Royal Mail, tracking RM29174UK, expected Mar 25</li>
                  <li>I'd reply:</li>
                </ol>
                <blockquote className="mt-2 pl-3 border-l-2 border-border text-[11.5px] text-muted-foreground italic">
                  Hi Emma! Your order #DBH-29174 shipped via Royal Mail (tracking: RM29174UK) and is expected to arrive by March 25th. You can track it here: [link]. Let me know if you need anything else!
                </blockquote>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  This is read-only — I'm just looking up info and replying. Does this look right?
                </p>
              </div>
            </div>
          </div>

          {/* User response — That's right */}
          <div className="flex gap-2.5 justify-end">
            <div className="rounded-xl rounded-tr-sm bg-violet-50 border border-violet-100 px-3.5 py-2 max-w-[80%]">
              <p className="text-[12px] text-foreground">That's right</p>
            </div>
          </div>

          {/* Scenario 2 — escalation (unclear input) */}
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
                <p className="text-[13px] font-bold text-foreground mb-1.5">Scenario 2 — "I want a refund but also keep the item"</p>
                <p className="text-[12px] text-foreground leading-relaxed">
                  Customer writes: <em>"I bought this as a gift and the recipient doesn't want it. Can I get a refund without returning it?"</em>
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  This one's tricky — the request is unclear and doesn't match any standard flow. I'd <strong>escalate to you</strong> with a note explaining the ambiguity so you can decide.
                </p>
              </div>
            </div>
          </div>

          {/* User response */}
          <div className="flex gap-2.5 justify-end">
            <div className="rounded-xl rounded-tr-sm bg-violet-50 border border-violet-100 px-3.5 py-2 max-w-[80%]">
              <p className="text-[12px] text-foreground">That's right</p>
            </div>
          </div>

          {/* Scenario 3 — escalation (no permission) */}
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
                <p className="text-[13px] font-bold text-foreground mb-1.5">Scenario 3 — "Process my refund now"</p>
                <p className="text-[12px] text-foreground leading-relaxed">
                  Customer writes: <em>"I returned my order last week. Where's my refund?"</em>
                </p>
                <p className="text-[12px] text-foreground leading-relaxed mt-2">
                  I can look up the return status, but I don't have permission to <strong>process refunds</strong>. I'd <strong>escalate to you</strong> with the return details so you can trigger the refund.
                </p>
              </div>
            </div>
          </div>

          {/* User response */}
          <div className="flex gap-2.5 justify-end">
            <div className="rounded-xl rounded-tr-sm bg-violet-50 border border-violet-100 px-3.5 py-2 max-w-[80%]">
              <p className="text-[12px] text-foreground">That's right</p>
            </div>
          </div>

          {/* Mode selection */}
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
                  Great — I'm confident I understand your policies.
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  One last question. How do you want me to work?
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  <strong>Training mode</strong> — I draft my responses and actions, but I check with you before anything goes out to the customer. Good if you want to review my work for a while.
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  <strong>Production mode</strong> — I handle tickets on my own. You can review everything after the fact. Good if you trust the sanity check and want me working immediately.
                </p>
              </div>
            </div>
          </div>

          {/* User chose Training */}
          <div className="flex gap-2.5 justify-end">
            <div className="rounded-xl rounded-tr-sm bg-violet-50 border border-violet-100 px-3.5 py-2 max-w-[80%]">
              <p className="text-[12px] text-foreground">Training — check with me first</p>
            </div>
          </div>

          {/* Rep confirms + tells about escalation communication */}
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
                  I'm live in <strong>Training mode</strong>. I'll start picking up WISMO, cancellation, and address change tickets now.
                </p>
                <p className="text-[12px] leading-relaxed text-foreground mt-2">
                  I'll message you here whenever I need your help — like when a ticket needs escalation or when I'm unsure about something. You'll see those as cards below.
                </p>
              </div>
            </div>
          </div>

          {/* Escalation cards */}
          <div className="space-y-2.5 mt-2">
            {sortedTickets.map((ticket) => (
              <EscalationCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function CommunicationPage() {
  const [activeView, setActiveView] = useState<"teamlead" | "rep">("teamlead");
  const [teamLeadTab, setTeamLeadTab] = useState<"conversation" | "setup">("conversation");
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [repName, setRepName] = useState<string | null>("Ava");
  const [showProfile, setShowProfile] = useState(false);
  const [threadTopicId, setThreadTopicId] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [newMsg, setNewMsg] = useState("");

  const threadTopic = useMemo(
    () => (threadTopicId ? topics.find((t) => t.id === threadTopicId) || null : null),
    [threadTopicId, topics]
  );

  const handleTopicAction = useCallback((topicId: string, action: string) => {
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
    <div className="flex h-[calc(100vh-48px)]">
      {/* ── Narrow sidebar ── */}
      <div className="w-14 border-r border-border bg-white flex flex-col items-center py-3 shrink-0">
        <TooltipProvider delayDuration={200}>
          {/* Team Lead */}
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

          {/* Separator */}
          <div className="w-6 h-px bg-border my-2" />

          {/* Rep — only if hired */}
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
        </TooltipProvider>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex min-w-0">
        {activeView === "teamlead" ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tab bar */}
            <div className="flex items-center border-b border-border px-4 h-10 shrink-0">
              <button
                onClick={() => setTeamLeadTab("conversation")}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors mr-1",
                  teamLeadTab === "conversation" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Conversation
                {pendingCount > 0 && (
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-amber-400 text-white text-[8px] inline-flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTeamLeadTab("setup")}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                  teamLeadTab === "setup" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Onboarding
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowTopics(!showTopics)}
                className="p-1.5 rounded hover:bg-accent transition-colors"
                title="All topics"
              >
                <List className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {teamLeadTab === "setup" ? (
              <SetupTab onSetupComplete={() => setShowHireDialog(true)} />
            ) : (
              <div className="flex-1 flex flex-col min-w-0">
                {/* Topics feed */}
                <ScrollArea className="flex-1">
                  <div className="px-4 py-4 space-y-5">
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

                {/* Message input — initiate new topic */}
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

      {/* Hire dialog */}
      <HireRepDialog
        open={showHireDialog}
        onOpenChange={setShowHireDialog}
        onHire={(name) => {
          setRepName(name);
          setShowHireDialog(false);
          setActiveView("rep");
          toast.success(`${name} has been hired!`);
        }}
      />
    </div>
  );
}
