/* ── CommunicationPage ─────────────────────────────────────────
   AI Support → Communication tab.
   Left panel: Team Lead (fixed) + Reps section.
   Right area: conversation with selected entity.
   - Team Lead: Topics (rule proposals, learning, performance) + Onboarding
   - Rep: Escalation tickets (cards with status badges) + Config panel
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send, Check, X, Reply, Bot, List, Plus,
  ArrowRight, ChevronDown, ChevronUp, MessageCircle,
  AlertTriangle, ExternalLink, Pencil, Upload,
  FileText, Sparkles, CheckCircle2, Link2, Eye,
  Rocket, Power, HelpCircle, Settings, Zap, User,
  AlertCircleIcon, Globe, UserPlus, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  TOPICS, ESCALATION_TICKETS, ACTION_PERMISSIONS, AGENT_IDENTITY, AGENT_MODE,
  type Topic, type EscalationTicket, type EscalationStatus,
  type ActionPermission, type AgentIdentity, type AgentMode,
} from "@/lib/mock-data";

// ══════════════════════════════════════════════════════════
// ── SHARED TYPES & HELPERS ──────────────────────────────
// ══════════════════════════════════════════════════════════

interface RuleChange {
  type: "new" | "update";
  ruleName: string;
  before?: string;
  after: string;
  source?: string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  topicId: string;
  topicTitle: string;
  topicStatus: "waiting" | "done";
  ruleChange?: RuleChange;
  hasActions?: boolean;
  isTopicStart?: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date("2026-03-27T10:00:00Z");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date("2026-03-27T10:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground mt-0.5">·</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        return (
          <div key={i} className="flex gap-1.5 ml-1">
            <span className="text-muted-foreground shrink-0">{match[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: match[2].replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </div>
        );
      }
    }
    return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
  });
}

// ── Build flat chat messages from TOPICS ────────────────────

function buildChatMessages(topics: Topic[]): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (const topic of topics) {
    const isResolved = topic.status === "resolved";
    const status: "waiting" | "done" = isResolved ? "done" : "waiting";

    let ruleChange: RuleChange | undefined;

    if (topic.proposedRule) {
      ruleChange = {
        type: "new",
        ruleName: topic.proposedRule.category + " — " + topic.title,
        after: topic.proposedRule.text,
        source: topic.proposedRule.evidence.join(" | "),
      };
    }

    if (topic.type === "escalation_review" && topic.id === "t-3") {
      ruleChange = {
        type: "update",
        ruleName: "Damaged Item Handling",
        before: "Require photo evidence for all damage claims regardless of order value.",
        after: "For damage claims on items under $80, process replacement or refund without photo. For items $80+, still request photo.",
        source: `Observed from ticket #${topic.sourceTicketId}`,
      };
    }

    if (topic.id === "t-7") {
      ruleChange = {
        type: "update",
        ruleName: "Return Shipping Cost",
        before: "Customer pays $8.95 return shipping fee for all returns.",
        after: "Defective/wrong items → free return shipping (we pay). Change of mind → customer pays ($8.95 deducted from refund).",
        source: "Learned from denied approval on ticket #4498",
      };
    }

    for (let i = 0; i < topic.messages.length; i++) {
      const msg = topic.messages[i];
      const isFirst = i === 0;

      if (msg.sender === "ai" && topic.proposedRule &&
        (msg.content.includes("Proposed rule:") || msg.content.includes("Should I adopt this rule?"))) {
        if (!isFirst) continue;
      }

      let content = msg.content;
      if (isFirst && ruleChange && topic.type !== "rule_update") {
        content = content.split("\n").filter(line =>
          !line.startsWith("> ") && !line.includes("Proposed rule:") && !line.includes("Proposed update:")
        ).join("\n").trim();
      }

      let msgRuleChange: RuleChange | undefined;
      if (topic.type === "rule_update" && msg.sender === "ai" && i === 1) {
        msgRuleChange = {
          type: "new",
          ruleName: topic.title,
          after: "Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.",
          source: "Manager directive",
        };
      } else if (isFirst && ruleChange && topic.type !== "rule_update") {
        msgRuleChange = ruleChange;
      }

      const hasActions = isFirst && msg.sender === "ai" && !isResolved &&
        topic.status !== "read" && topic.type !== "performance_report" &&
        ruleChange !== undefined;

      messages.push({
        id: msg.id,
        sender: msg.sender,
        content,
        timestamp: msg.timestamp,
        topicId: topic.id,
        topicTitle: topic.title,
        topicStatus: status,
        ruleChange: msgRuleChange,
        hasActions,
        isTopicStart: isFirst,
      });
    }
  }

  const topicGroups = new Map<string, ChatMessage[]>();
  for (const msg of messages) {
    if (!topicGroups.has(msg.topicId)) topicGroups.set(msg.topicId, []);
    topicGroups.get(msg.topicId)!.push(msg);
  }
  for (const group of Array.from(topicGroups.values())) {
    group.sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  const sortedTopics = Array.from(topicGroups.entries()).sort(
    ([, a], [, b]) => new Date(a[0].timestamp).getTime() - new Date(b[0].timestamp).getTime()
  );
  return sortedTopics.flatMap(([, msgs]) => msgs);
}

// ══════════════════════════════════════════════════════════
// ── SMALL SHARED COMPONENTS ─────────────────────────────
// ══════════════════════════════════════════════════════════

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">
          <HelpCircle className="w-3 h-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed bg-foreground text-background">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function CollapsibleText({ text, maxLines = 4 }: { text: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const isLong = lines.length > maxLines;

  if (!isLong || expanded) {
    return (
      <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
        {renderMarkdown(text)}
        {isLong && (
          <button onClick={() => setExpanded(false)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
            <ChevronUp className="w-3 h-3" /> Show less
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
      {renderMarkdown(lines.slice(0, maxLines).join("\n"))}
      <button onClick={() => setExpanded(true)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
        <ChevronDown className="w-3 h-3" /> Show more
      </button>
    </div>
  );
}

// ── Topic Label ────────────────────────────────────────

function TopicLabel({ title, status }: { title: string; status: "waiting" | "done" }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 mt-3">
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status === "waiting" ? "bg-amber-400" : "bg-emerald-400")} />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</span>
    </div>
  );
}

// ── Rule Change Card ────────────────────────────────────

function RuleChangeCard({
  change,
  hasActions,
  onAction,
  topicId,
}: {
  change: RuleChange;
  hasActions: boolean;
  onAction?: (topicId: string, action: string) => void;
  topicId: string;
}) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-white overflow-hidden">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", change.type === "new" ? "bg-emerald-400" : "bg-amber-400")} />
        <span className="text-[11px] font-semibold text-foreground">{change.ruleName}</span>
        <Badge variant="secondary" className="h-4 text-[8px] px-1.5 ml-auto">
          {change.type === "new" ? "NEW" : "UPDATE"}
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {change.before && (
          <div className="flex gap-2">
            <span className="text-[10px] font-medium text-red-400 w-10 shrink-0 mt-0.5">Before</span>
            <p className="text-[11px] text-muted-foreground line-through leading-relaxed">{change.before}</p>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-[10px] font-medium text-emerald-500 w-10 shrink-0 mt-0.5">{change.before ? "After" : "Rule"}</span>
          <p className="text-[11px] text-foreground leading-relaxed">{change.after}</p>
        </div>
        {change.source && (
          <p className="text-[9px] text-muted-foreground/60 mt-1">Source: {change.source}</p>
        )}
      </div>
      {hasActions && onAction && (
        <div className="px-3 py-2 border-t border-border/50 bg-muted/10 flex items-center gap-1.5">
          <button
            onClick={() => onAction(topicId, "accept")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onAction(topicId, "modify_accept")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Modify & Accept
          </button>
          <button
            onClick={() => onAction(topicId, "reject")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
          >
            <X className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────

function MessageBubble({
  msg,
  senderLabel,
  onAction,
  onReply,
}: {
  msg: ChatMessage;
  senderLabel: string;
  onAction?: (topicId: string, action: string) => void;
  onReply?: (topicId: string) => void;
}) {
  return (
    <div className={cn("flex gap-2.5 group", msg.sender === "manager" && "flex-row-reverse")}>
      {msg.sender === "ai" && (
        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[11px]">🎯</span>
        </div>
      )}
      <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
        <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
          <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? senderLabel : "You"}</span>
          <span className="text-[9px] text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
        </div>
        <div className={cn(
          "rounded-xl px-3 py-2 inline-block text-left",
          msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
        )}>
          {msg.content && <CollapsibleText text={msg.content} maxLines={6} />}
          {msg.ruleChange && (
            <RuleChangeCard
              change={msg.ruleChange}
              hasActions={!!msg.hasActions}
              onAction={onAction}
              topicId={msg.topicId}
            />
          )}
        </div>
        {msg.sender === "ai" && onReply && (
          <button
            onClick={() => onReply(msg.topicId)}
            className="opacity-0 group-hover:opacity-100 mt-0.5 ml-0.5 text-[10px] text-muted-foreground hover:text-primary transition-all flex items-center gap-0.5"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
      </div>
    </div>
  );
}

// ── Escalation Card ────────────────────────────────────

function EscalationCard({
  ticket,
  onStatusChange,
}: {
  ticket: EscalationTicket & { status: EscalationStatus };
  onStatusChange: (id: string, status: EscalationStatus) => void;
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-white p-3 transition-all",
      ticket.status === "needs_attention" ? "border-red-200/60 shadow-sm" :
      ticket.status === "in_progress" ? "border-amber-200/60" : "border-border/40 opacity-70"
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
          ticket.status === "needs_attention" ? "bg-red-500" :
          ticket.status === "in_progress" ? "bg-amber-400" : "bg-emerald-500"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-medium text-foreground truncate">{ticket.subject}</p>
            <span className="text-[9px] text-muted-foreground shrink-0">{formatRelativeTime(ticket.createdAt)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{ticket.reason}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground/60">#{ticket.zendeskTicketId}</span>
            <span className="text-[10px] text-muted-foreground/60">·</span>
            <span className="text-[10px] text-muted-foreground/60">{ticket.customerName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30">
        <a
          href={ticket.zendeskUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-primary hover:bg-primary/8 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Open in Zendesk
        </a>
        {ticket.status === "needs_attention" && (
          <button
            onClick={() => onStatusChange(ticket.id, "in_progress")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
          >
            Mark as in progress
          </button>
        )}
        {ticket.status === "in_progress" && (
          <button
            onClick={() => onStatusChange(ticket.id, "resolved")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors ml-auto"
          >
            <CheckCircle2 className="w-3 h-3" /> Mark resolved
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TOPICS PANEL (right side for Team Lead) ─────────────
// ══════════════════════════════════════════════════════════

interface TopicItem {
  id: string;
  title: string;
  status: "waiting" | "done";
  timestamp: string;
  hasActions: boolean;
  replyCount: number;
}

function TopicsPanel({
  topics,
  onSelectTopic,
  onClose,
}: {
  topics: TopicItem[];
  onSelectTopic: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");
  const waiting = topics.filter((t) => t.status === "waiting");
  const done = topics.filter((t) => t.status === "done");
  const list = tab === "waiting" ? waiting : done;

  return (
    <div className="w-[260px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">Topics</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("waiting")}
          className={cn(
            "flex-1 py-2 text-[11px] font-medium text-center transition-colors relative",
            tab === "waiting" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Waiting
          {waiting.length > 0 && (
            <span className="ml-1 w-4 h-4 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-medium">
              {waiting.length}
            </span>
          )}
          {tab === "waiting" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />}
        </button>
        <button
          onClick={() => setTab("done")}
          className={cn(
            "flex-1 py-2 text-[11px] font-medium text-center transition-colors relative",
            tab === "done" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Done <span className="text-[9px] text-muted-foreground">({done.length})</span>
          {tab === "done" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {list.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 text-center py-8">No topics</p>
          )}
          {list.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/30"
            >
              <p className="text-[11.5px] font-medium text-foreground truncate">{topic.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-muted-foreground">{formatRelativeTime(topic.timestamp)}</span>
                <span className="text-[9px] text-muted-foreground">{topic.replyCount} msgs</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── THREAD SIDE PANEL ───────────────────────────────────
// ══════════════════════════════════════════════════════════

interface ThreadReply {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
}

function ThreadSidePanel({
  topicId,
  topicTitle,
  contextMsg,
  onClose,
}: {
  topicId: string;
  topicTitle: string;
  contextMsg: string;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newReply: ThreadReply = {
      id: `tr-${Date.now()}`,
      sender: "manager",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setReplies((prev) => [...prev, newReply]);
    setInput("");
    setTimeout(() => {
      setReplies((prev) => [
        ...prev,
        {
          id: `tr-ai-${Date.now()}`,
          sender: "ai",
          content: `Got it. I'll update the rule accordingly.\n\n**Updated rule:** ${input.trim()}\n\nPlease confirm this is correct.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-[320px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground truncate">{topicTitle}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2">
          {contextMsg.replace(/\*\*/g, "").slice(0, 150)}...
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="py-3 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className={cn("flex gap-2", reply.sender === "manager" && "flex-row-reverse")}>
              {reply.sender === "ai" ? (
                <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px]">🎯</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-medium text-white">JC</span>
                </div>
              )}
              <div className={cn("max-w-[85%]", reply.sender === "manager" && "text-right")}>
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 inline-block text-left",
                  reply.sender === "ai" ? "bg-muted/40" : "bg-primary/6"
                )}>
                  <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your modification..."
            className="flex-1 text-[11px] bg-muted/30 border border-border rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-md text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── REP CONFIG PANEL ────────────────────────────────────
// ══════════════════════════════════════════════════════════

function RepConfigPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);
  const [activeSection, setActiveSection] = useState<"mode" | "identity" | "actions">("mode");

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, permission: p.permission === "disabled" ? "autonomous" : "disabled" }
          : p
      )
    );
  };

  const modeConfig: { mode: AgentMode; icon: typeof Rocket; color: string; desc: string }[] = [
    { mode: "production", icon: Rocket, color: "emerald", desc: "Replies directly to customers." },
    { mode: "training", icon: Eye, color: "amber", desc: "Drafts as internal notes for review." },
    { mode: "off", icon: Power, color: "zinc", desc: "Inactive — all tickets go to humans." },
  ];

  return (
    <div className="w-[360px] border-l border-border bg-white flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground">Configure {identity.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { toast.success("Changes saved"); onClose(); }}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border px-4">
        {(["mode", "identity", "actions"] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={cn(
              "py-2 px-3 text-[11px] font-medium capitalize transition-colors relative",
              activeSection === sec ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {sec}
            {activeSection === sec && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-foreground rounded-full" />}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeSection === "mode" && (
            <div className="space-y-2">
              {modeConfig.map(({ mode, icon: Icon, color, desc }) => (
                <button
                  key={mode}
                  onClick={() => setAgentMode(mode)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    agentMode === mode
                      ? `border-${color}-300 bg-${color}-50/50 shadow-sm`
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    agentMode === mode ? `bg-${color}-100` : "bg-muted/50"
                  )}>
                    <Icon className={cn("w-4 h-4", agentMode === mode ? `text-${color}-600` : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium capitalize">{mode}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  {agentMode === mode && <Check className={`w-4 h-4 text-${color}-500 ml-auto`} />}
                </button>
              ))}
            </div>
          )}

          {activeSection === "identity" && (
            <div className="space-y-4">
              <div>
                <Label className="text-[11px] font-medium">Name</Label>
                <Input
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  className="mt-1 h-8 text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-medium">Tone</Label>
                <Select value={identity.tone} onValueChange={(v) => setIdentity({ ...identity, tone: v as AgentIdentity["tone"] })}>
                  <SelectTrigger className="mt-1 h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-medium">Greeting</Label>
                <Textarea
                  value={identity.greeting}
                  onChange={(e) => setIdentity({ ...identity, greeting: e.target.value })}
                  className="mt-1 text-[12px] min-h-[60px]"
                  rows={2}
                />
              </div>
            </div>
          )}

          {activeSection === "actions" && (
            <div className="space-y-3">
              {permissions.map((action) => {
                const isOn = action.permission === "autonomous";
                return (
                  <div key={action.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[12px] font-medium text-foreground">{action.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                    <Switch
                      checked={isOn}
                      onCheckedChange={() => togglePermission(action.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── SETUP TAB (Onboarding — Team Lead conversation) ─────
// ══════════════════════════════════════════════════════════

type OBPhase = "greeting" | "upload_doc" | "importing" | "processing_notice" | "conflict_1" | "conflict_2" | "conflict_3" | "playbook_done" | "done";

interface OnboardingMsg {
  id: string;
  sender: "ai" | "manager";
  content: string;
  choices?: { label: string; value: string; variant?: "primary" | "outline" }[];
  widget?: string;
  widgetData?: Record<string, unknown>;
}

interface ConflictItem {
  id: number;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  resolved: boolean;
  choice?: string;
  note?: string;
}

const DEMO_CONFLICTS: ConflictItem[] = [
  {
    id: 1,
    title: "Return Window",
    description: 'Your return policy says "30-day return window" but the FAQ page says "28 calendar days from delivery."',
    optionA: "30 days from delivery",
    optionB: "28 calendar days",
    resolved: false,
  },
  {
    id: 2,
    title: "Refund Method",
    description: 'Policy doc says "refund to original payment method only" but your FAQ mentions store credit as an option.',
    optionA: "Original payment method only",
    optionB: "Original method or store credit",
    resolved: false,
  },
  {
    id: 3,
    title: "Return Shipping",
    description: 'Policy says "free returns" but the terms page says "customer pays $8.95 for return shipping."',
    optionA: "Free returns for all",
    optionB: "Free for defective, $8.95 for others",
    resolved: false,
  },
];

function SetupTab({ onHireRep }: { onHireRep: () => void }) {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<OBPhase>("greeting");
  const [messages, setMessages] = useState<OnboardingMsg[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>(DEMO_CONFLICTS);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [conflictNote, setConflictNote] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, phase]);

  const makeObMsg = (
    sender: "ai" | "manager",
    content: string,
    extra?: Partial<OnboardingMsg>
  ): OnboardingMsg => ({
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    content,
    ...extra,
  });

  const addAiMessages = useCallback((msgs: OnboardingMsg[], delay = 400) => {
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, msg]);
      }, delay * (i + 1));
    });
  }, []);

  // ── Greeting: introduce system + Team Lead role ──
  useEffect(() => {
    if (messages.length === 0) {
      addAiMessages([
        makeObMsg("ai", "Hi! I'm **Sarah**, your Team Lead. I help you build and manage the **Playbook** — the set of rules, policies, and guidelines your AI Rep will follow when handling customer tickets."),
        makeObMsg("ai", "Once your Playbook is ready, you can hire an AI Rep who'll start handling tickets based on these rules. The more precise your Playbook, the better your Rep performs."),
        makeObMsg("ai", "Let's get started — share your return policy, SOP document, or any customer service guidelines, and I'll turn them into actionable rules.", {
          widget: "upload_doc",
        }),
      ], 500);
    }
  }, []);

  const handleUpload = (isDemo: boolean) => {
    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", isDemo ? "Try with Seel Return Guidelines" : "Uploaded: Return_Policy_v2.pdf"),
    ]);
    setPhase("importing");
    setImportProgress(0);
    addAiMessages([
      makeObMsg("ai", isDemo
        ? "Great choice! Let me analyze the **Seel Return Guidelines** and extract the rules..."
        : "Got it! Reading through your document now...",
        { widget: "import_progress" }
      ),
    ]);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", `Shared link: ${urlInput.trim()}`),
    ]);
    setUrlInput("");
    setShowUrlInput(false);
    setPhase("importing");
    setImportProgress(0);
    addAiMessages([
      makeObMsg("ai", "Got it! Fetching and analyzing the page content...", { widget: "import_progress" }),
    ]);
  };

  // ── Import progress simulation ──
  useEffect(() => {
    if (phase !== "importing") return;
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase("processing_notice");
            addAiMessages([
              makeObMsg("ai", "I've extracted the following rules:", {
                widget: "parse_result",
                widgetData: {
                  rules: [
                    { category: "Return Window", count: 3, example: "30-day return window from delivery date" },
                    { category: "Refund Method", count: 2, example: "Refund to original payment method only" },
                    { category: "Condition Rules", count: 4, example: "Items must be unused with tags attached" },
                    { category: "Exceptions", count: 2, example: "Final sale items are non-returnable" },
                    { category: "Shipping", count: 2, example: "Customer pays return shipping unless defective" },
                  ],
                },
              }),
              makeObMsg("ai", `I found **${DEMO_CONFLICTS.length} conflicts** that need your input. Let me walk you through each one.`, {
                widget: "conflict_queue",
              }),
            ], 600);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [phase]);

  const handleConflictResolve = (conflictId: number, choice: string) => {
    const updated = conflicts.map((c) =>
      c.id === conflictId ? { ...c, resolved: true, choice, note: conflictNote || undefined } : c
    );
    setConflicts(updated);
    setConflictNote("");

    const choiceLabel = choice === "a"
      ? conflicts.find((c) => c.id === conflictId)?.optionA
      : conflicts.find((c) => c.id === conflictId)?.optionB;

    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", `${choiceLabel}${conflictNote ? ` — "${conflictNote}"` : ""}`),
    ]);

    const nextUnresolved = updated.findIndex((c) => !c.resolved);
    if (nextUnresolved === -1) {
      // All conflicts resolved
      setPhase("playbook_done");
      addAiMessages([
        makeObMsg("ai", "All conflicts resolved! Your Playbook is ready."),
        makeObMsg("ai", "You can review and edit rules anytime in the **Playbook** tab. When you're ready, hire your first AI Rep to start handling tickets.", {
          choices: [
            { label: "Hire a Rep", value: "hire_rep", variant: "primary" },
          ],
        }),
      ]);
    } else {
      setCurrentConflictIdx(nextUnresolved);
      addAiMessages([
        makeObMsg("ai", `Got it — I'll use "${choiceLabel}". Next conflict:`),
      ]);
    }
  };

  const handleConflictDismiss = (conflictId: number) => {
    const updated = conflicts.map((c) =>
      c.id === conflictId ? { ...c, resolved: true, choice: "skipped" } : c
    );
    setConflicts(updated);
    setConflictNote("");

    setMessages((prev) => [
      ...prev,
      makeObMsg("manager", "Skipped — I'll decide later"),
    ]);

    const nextUnresolved = updated.findIndex((c) => !c.resolved);
    if (nextUnresolved === -1) {
      setPhase("playbook_done");
      addAiMessages([
        makeObMsg("ai", "Playbook is ready! You can revisit skipped conflicts in the **Playbook** tab anytime."),
        makeObMsg("ai", "When you're ready, hire your first AI Rep to start handling tickets.", {
          choices: [
            { label: "Hire a Rep", value: "hire_rep", variant: "primary" },
          ],
        }),
      ]);
    } else {
      setCurrentConflictIdx(nextUnresolved);
      addAiMessages([
        makeObMsg("ai", "No problem, you can resolve it later. Next conflict:"),
      ]);
    }
  };

  const handleChoice = (value: string) => {
    if (value === "hire_rep") {
      onHireRep();
      setPhase("done");
      setMessages((prev) => [
        ...prev,
        makeObMsg("manager", "Let's hire a Rep!"),
      ]);
      addAiMessages([
        makeObMsg("ai", "Great! I've set up your first AI Rep. You can find them in the left panel under **Reps**. Configure their name, tone, and actions, then switch them to Production mode when ready."),
      ]);
    }
  };

  const renderWidget = (msg: OnboardingMsg) => {
    switch (msg.widget) {
      case "upload_doc":
        return (
          <div className="mt-2.5 space-y-2">
            {/* File upload area */}
            <div
              onClick={() => handleUpload(false)}
              className="p-4 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
            >
              <div className="text-center">
                <Upload className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-[12px] font-medium text-foreground">Drop your document here, or click to browse</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, TXT, or paste a URL below</p>
              </div>
            </div>

            {/* URL paste option */}
            {showUrlInput ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    placeholder="https://your-store.com/return-policy"
                    className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-muted-foreground/40"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Import
                </button>
                <button
                  onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" /> Or paste a webpage URL
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  onClick={() => handleUpload(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  No doc handy? <span className="text-primary hover:underline">Try with Seel Return Guidelines</span>
                </button>
              </div>
            )}
          </div>
        );

      case "import_progress":
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2.5 mb-2">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[11px] text-muted-foreground">
                {importProgress < 30 && "Reading document..."}
                {importProgress >= 30 && importProgress < 60 && "Extracting business rules..."}
                {importProgress >= 60 && importProgress < 90 && "Cross-referencing with FAQ..."}
                {importProgress >= 90 && "Finalizing..."}
              </span>
            </div>
            <Progress value={Math.min(importProgress, 100)} className="h-1" />
          </div>
        );

      case "parse_result": {
        const rules = (msg.widgetData?.rules as { category: string; count: number; example: string }[]) || [];
        const totalRules = rules.reduce((sum, r) => sum + r.count, 0);
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[12px] font-medium">{totalRules} rules extracted</span>
            </div>
            <div className="space-y-1">
              {rules.map((r) => (
                <div key={r.category} className="flex items-start gap-2 py-1 px-2 rounded-md bg-muted/40">
                  <span className="text-[11px] font-medium text-foreground w-24 shrink-0">{r.category}</span>
                  <span className="text-[11px] text-muted-foreground flex-1">{r.example}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{r.count}</span>
                </div>
              ))}
            </div>
            {/* Processing time notice */}
            <div className="mt-3 p-2.5 rounded-md bg-blue-50/60 border border-blue-100/60">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    <strong>Note:</strong> In production, processing your full document takes about 30–60 minutes. You'll get a notification when it's ready — feel free to come back later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "conflict_queue": {
        const current = conflicts[currentConflictIdx];
        if (!current || current.resolved) return null;
        const resolvedCount = conflicts.filter((c) => c.resolved).length;

        return (
          <div className="mt-2.5 space-y-2">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground">
                Conflict {resolvedCount + 1} of {conflicts.length}
              </span>
              <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Conflict card */}
            <div className="rounded-lg border border-amber-100 bg-amber-50/30 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-amber-100/60">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[12px] font-medium text-foreground">{current.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{current.description}</p>
              </div>

              <div className="px-3.5 py-2.5 space-y-2">
                {/* Option buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConflictResolve(current.id, "a")}
                    className="flex-1 px-3 py-2 rounded-lg text-[11px] font-medium border border-border text-foreground hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
                  >
                    {current.optionA}
                  </button>
                  <button
                    onClick={() => handleConflictResolve(current.id, "b")}
                    className="flex-1 px-3 py-2 rounded-lg text-[11px] font-medium border border-border text-foreground hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
                  >
                    {current.optionB}
                  </button>
                </div>

                {/* Note input */}
                <div className="flex items-center gap-2">
                  <input
                    value={conflictNote}
                    onChange={(e) => setConflictNote(e.target.value)}
                    placeholder="Add a note or clarification (optional)..."
                    className="flex-1 text-[11px] bg-white border border-border/60 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/40"
                  />
                  <button
                    onClick={() => handleConflictDismiss(current.id)}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-[620px] mx-auto px-5 py-6 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.sender === "manager" && "flex-row-reverse")}>
            {msg.sender === "ai" && (
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[11px]">🎯</span>
              </div>
            )}
            <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
              <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
                <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? "Sarah" : "You"}</span>
              </div>
              <div className={cn(
                "rounded-xl px-3 py-2 inline-block text-left",
                msg.sender === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
              )}>
                {msg.content && <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />}
                {msg.widget && renderWidget(msg)}
              </div>
              {msg.choices && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-0.5">
                  {msg.choices.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleChoice(c.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                        c.variant === "primary"
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "border border-border text-foreground hover:bg-accent"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ─────────────────────────────────
// ══════════════════════════════════════════════════════════

type SelectedEntity = { type: "team_lead" } | { type: "rep"; id: string; name: string };

export default function CommunicationPage() {
  const [, navigate] = useLocation();

  // Welcome dialog — first visit only
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("seel_ai_welcome_seen");
  });

  // Selected entity in left panel
  const [selected, setSelected] = useState<SelectedEntity>({ type: "team_lead" });

  // Team Lead conversation state
  const [activeTab, setActiveTab] = useState<"conversations" | "setup">("conversations");
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [showTopics, setShowTopics] = useState(false);
  const [threadPanel, setThreadPanel] = useState<{ topicId: string; topicTitle: string; contextMsg: string } | null>(null);

  // Rep state
  const [repHired, setRepHired] = useState(false);
  const [showRepConfig, setShowRepConfig] = useState(false);
  const [escalationStatuses, setEscalationStatuses] = useState<Record<string, EscalationStatus>>(() => {
    const map: Record<string, EscalationStatus> = {};
    ESCALATION_TICKETS.forEach((t) => { map[t.id] = t.status; });
    return map;
  });

  // Integration status
  const zendeskConnected = false; // MVP: not connected

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build Team Lead messages
  const baseMessages = useMemo(() => buildChatMessages(TOPICS), []);
  const allMessages = useMemo(() => {
    const combined = [...baseMessages, ...extraMessages];
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return combined;
  }, [baseMessages, extraMessages]);

  // Topics list
  const topicsList = useMemo(() => {
    const topicMap = new Map<string, TopicItem>();
    for (const msg of allMessages) {
      if (!topicMap.has(msg.topicId)) {
        topicMap.set(msg.topicId, {
          id: msg.topicId,
          title: msg.topicTitle,
          status: msg.topicStatus,
          timestamp: msg.timestamp,
          hasActions: !!msg.hasActions,
          replyCount: 0,
        });
      }
      topicMap.get(msg.topicId)!.replyCount++;
      topicMap.get(msg.topicId)!.timestamp = msg.timestamp;
    }
    return Array.from(topicMap.values());
  }, [allMessages]);

  const waitingCount = topicsList.filter((t) => t.status === "waiting" && t.hasActions).length;

  // Escalation counts
  const needsAttentionCount = useMemo(() =>
    ESCALATION_TICKETS.filter((t) => escalationStatuses[t.id] === "needs_attention").length,
    [escalationStatuses]
  );

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    for (const msg of allMessages) {
      const dateKey = new Date(msg.timestamp).toISOString().split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: msg.timestamp, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [allMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const topicId = `new-${Date.now()}`;
    const now = new Date().toISOString();

    const managerMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      sender: "manager",
      content: inputValue.trim(),
      timestamp: now,
      topicId,
      topicTitle: inputValue.trim().slice(0, 60),
      topicStatus: "waiting",
      isTopicStart: true,
    };

    setExtraMessages((prev) => [...prev, managerMsg]);
    setInputValue("");

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `cm-ai-${Date.now()}`,
        sender: "ai",
        content: "I understand. Let me update the rules to reflect this change.",
        timestamp: new Date().toISOString(),
        topicId,
        topicTitle: managerMsg.topicTitle,
        topicStatus: "waiting",
        ruleChange: {
          type: "new",
          ruleName: managerMsg.topicTitle,
          after: inputValue.trim(),
          source: "Manager directive",
        },
        hasActions: false,
      };
      setExtraMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  const handleAction = (topicId: string, action: string) => {
    if (action === "modify_accept") {
      const msgs = allMessages.filter((m) => m.topicId === topicId);
      const first = msgs[0];
      if (first) {
        setThreadPanel({ topicId, topicTitle: first.topicTitle, contextMsg: first.content });
        setShowTopics(false);
        toast.info("Edit the rule in the thread, then confirm.");
      }
    } else {
      toast.success(action === "accept" ? "Rule accepted" : "Rule rejected");
    }
  };

  const handleReply = (topicId: string) => {
    const msgs = allMessages.filter((m) => m.topicId === topicId);
    const first = msgs[0];
    if (first) {
      setThreadPanel({ topicId, topicTitle: first.topicTitle, contextMsg: first.content });
      setShowTopics(false);
    }
  };

  const handleSelectTopic = (topicId: string) => {
    const el = document.getElementById(`msg-${topicId}-start`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/5");
      setTimeout(() => el.classList.remove("bg-primary/5"), 2000);
    }
  };

  const handleEscalationStatusChange = (id: string, status: EscalationStatus) => {
    setEscalationStatuses((prev) => ({ ...prev, [id]: status }));
    toast.success(status === "resolved" ? "Marked as resolved" : "Marked as in progress");
  };

  const handleCloseWelcome = () => {
    localStorage.setItem("seel_ai_welcome_seen", "1");
    setShowWelcome(false);
  };

  const handleHireRep = () => {
    setRepHired(true);
    setSelected({ type: "rep", id: "rep-1", name: "Alex" });
    toast.success("Your first AI Rep is ready! Configure them in the panel.");
  };

  const shownTopics = new Set<string>();

  // Escalation tickets with current statuses
  const escalationTicketsWithStatus = useMemo(() =>
    ESCALATION_TICKETS.map((t) => ({ ...t, status: escalationStatuses[t.id] || t.status })),
    [escalationStatuses]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">
        {/* ── Welcome Dialog ── */}
        <Dialog open={showWelcome} onOpenChange={(open) => { if (!open) handleCloseWelcome(); }}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-[16px]">Welcome to AI Support</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed mt-2">
                Automate customer service with an AI-powered Rep that follows your rules.
                We currently support <strong>Shopify + Zendesk</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                If you use Zendesk, you can get started right away. For other helpdesks,{" "}
                <a href="mailto:support@seel.com" className="text-primary hover:underline">talk to us</a> — we're expanding platform support soon.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCloseWelcome} className="h-8 text-[12px]">
                Get Started
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Yellow Banner (Integration not set up) ── */}
        {!zendeskConnected && (
          <div className="px-5 py-2 bg-amber-50/80 border-b border-amber-100 flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[11.5px] text-amber-700 flex-1">
              Zendesk not connected — <button onClick={() => navigate("/integrations")} className="font-medium underline underline-offset-2 hover:text-amber-900">set up integration</button> to go live.
            </p>
          </div>
        )}

        {/* ── Main content area ── */}
        <div className="flex flex-1 min-h-0">
          {/* ── Left Panel: Narrow avatar bar ── */}
          <div className="w-[56px] shrink-0 border-r border-border bg-[#fafbfc] flex flex-col items-center py-3 gap-1">
            {/* Team Lead */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setSelected({ type: "team_lead" }); setShowRepConfig(false); }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all relative",
                    selected.type === "team_lead"
                      ? "bg-indigo-100 ring-2 ring-indigo-400 ring-offset-1"
                      : "bg-indigo-50 hover:bg-indigo-100"
                  )}
                >
                  <span className="text-[14px]">🎯</span>
                  {waitingCount > 0 && selected.type !== "team_lead" && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                      {waitingCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                <p className="font-medium">Sarah — Team Lead</p>
                <p className="text-muted-foreground text-[10px]">Manages your Playbook and rules</p>
              </TooltipContent>
            </Tooltip>

            {/* Divider + Reps label */}
            <div className="w-6 h-px bg-border my-1" />
            <p className="text-[8px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Reps</p>

            {/* Rep */}
            {repHired ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setSelected({ type: "rep", id: "rep-1", name: "Alex" }); setShowRepConfig(false); }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all relative",
                      selected.type === "rep"
                        ? "bg-emerald-100 ring-2 ring-emerald-400 ring-offset-1"
                        : "bg-emerald-50 hover:bg-emerald-100"
                    )}
                  >
                    <span className="text-[14px]">💬</span>
                    {needsAttentionCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                        {needsAttentionCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[11px]">
                  <p className="font-medium">Alex — AI Rep</p>
                  <p className="text-muted-foreground text-[10px]">Working · Handling tickets</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[11px]">
                  <p>No reps yet</p>
                  <p className="text-muted-foreground text-[10px]">Talk to Sarah to set up your Playbook first</p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex-1" />
          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {selected.type === "team_lead" ? (
              /* ── Team Lead View ── */
              <>
                {/* Header with Team Lead info */}
                <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">🎯</span>
                      <span className="text-[13px] font-semibold text-foreground">Sarah</span>
                      <span className="text-[11px] text-muted-foreground">Team Lead</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTab("conversations")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                          activeTab === "conversations"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        Conversations
                      </button>
                      <button
                        onClick={() => setActiveTab("setup")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                          activeTab === "setup"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        Setup
                      </button>
                    </div>
                  </div>

                  {activeTab === "conversations" && (
                    <button
                      onClick={() => { setShowTopics(!showTopics); setThreadPanel(null); }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] transition-colors relative",
                        showTopics ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <List className="w-3.5 h-3.5" /> Topics
                      {waitingCount > 0 && !showTopics && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium ml-0.5">
                          {waitingCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Tab content */}
                {activeTab === "conversations" ? (
                  <div className="flex flex-1 min-h-0">
                    <div className="flex-1 flex flex-col min-w-0">
                      <ScrollArea className="flex-1">
                        <div className="max-w-[640px] mx-auto px-5 py-4 space-y-3">
                          {groupedMessages.map((group, gi) => (
                            <div key={gi}>
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[10px] font-medium text-muted-foreground px-2">
                                  {formatDateGroup(group.date)}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>

                              <div className="space-y-3">
                                {group.messages.map((msg) => {
                                  const showTopicLabel = msg.isTopicStart && !shownTopics.has(msg.topicId);
                                  if (msg.isTopicStart) shownTopics.add(msg.topicId);

                                  return (
                                    <div key={msg.id} id={msg.isTopicStart ? `msg-${msg.topicId}-start` : undefined} className="transition-colors duration-500 rounded-lg">
                                      {showTopicLabel && (
                                        <TopicLabel title={msg.topicTitle} status={msg.topicStatus} />
                                      )}
                                      <MessageBubble
                                        msg={msg}
                                        senderLabel="Sarah"
                                        onAction={handleAction}
                                        onReply={handleReply}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Input */}
                      <div className="px-5 py-3 border-t border-border bg-white">
                        <div className="max-w-[640px] mx-auto">
                          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                            <input
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                              placeholder="Message Sarah..."
                              className="flex-1 text-[12.5px] bg-transparent outline-none placeholder:text-muted-foreground/50"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!inputValue.trim()}
                              className="p-1.5 rounded-md text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Side panels */}
                    {threadPanel && (
                      <ThreadSidePanel
                        topicId={threadPanel.topicId}
                        topicTitle={threadPanel.topicTitle}
                        contextMsg={threadPanel.contextMsg}
                        onClose={() => setThreadPanel(null)}
                      />
                    )}

                    {showTopics && !threadPanel && (
                      <TopicsPanel
                        topics={topicsList}
                        onSelectTopic={handleSelectTopic}
                        onClose={() => setShowTopics(false)}
                      />
                    )}
                  </div>
                ) : (
                  <SetupTab onHireRep={handleHireRep} />
                )}
              </>
            ) : selected.type === "rep" && !repHired ? (
              /* ── Rep not hired yet — guide to Team Lead ── */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-[300px]">
                  <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">No Rep hired yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Talk to Sarah (your Team Lead) to set up your Playbook first, then hire your first AI Rep.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-[11px]"
                    onClick={() => { setSelected({ type: "team_lead" }); setActiveTab("setup"); }}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" /> Go to Setup
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Rep View ── */
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Rep header */}
                  <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">💬</span>
                      <span className="text-[13px] font-semibold text-foreground">Alex</span>
                      <Badge variant="secondary" className="h-4 text-[9px] px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">Working</Badge>
                    </div>
                    <button
                      onClick={() => setShowRepConfig(!showRepConfig)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors",
                        showRepConfig ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </button>
                  </div>

                  {/* Escalation tickets */}
                  <ScrollArea className="flex-1">
                    <div className="max-w-[640px] mx-auto px-5 py-4 space-y-3">
                      {/* Section: Needs Attention */}
                      {escalationTicketsWithStatus.filter((t) => t.status === "needs_attention").length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[11px] font-semibold text-foreground">Needs Attention</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({escalationTicketsWithStatus.filter((t) => t.status === "needs_attention").length})
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {escalationTicketsWithStatus
                              .filter((t) => t.status === "needs_attention")
                              .map((t) => (
                                <EscalationCard key={t.id} ticket={t} onStatusChange={handleEscalationStatusChange} />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Section: In Progress */}
                      {escalationTicketsWithStatus.filter((t) => t.status === "in_progress").length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-[11px] font-semibold text-foreground">In Progress</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({escalationTicketsWithStatus.filter((t) => t.status === "in_progress").length})
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {escalationTicketsWithStatus
                              .filter((t) => t.status === "in_progress")
                              .map((t) => (
                                <EscalationCard key={t.id} ticket={t} onStatusChange={handleEscalationStatusChange} />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Section: Resolved */}
                      {escalationTicketsWithStatus.filter((t) => t.status === "resolved").length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-semibold text-foreground">Resolved</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({escalationTicketsWithStatus.filter((t) => t.status === "resolved").length})
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {escalationTicketsWithStatus
                              .filter((t) => t.status === "resolved")
                              .map((t) => (
                                <EscalationCard key={t.id} ticket={t} onStatusChange={handleEscalationStatusChange} />
                              ))}
                          </div>
                        </div>
                      )}

                      {escalationTicketsWithStatus.length === 0 && (
                        <div className="text-center py-16">
                          <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                          <p className="text-[13px] font-medium text-muted-foreground">All clear</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">No escalated tickets right now</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Rep Config Panel */}
                {showRepConfig && (
                  <RepConfigPanel onClose={() => setShowRepConfig(false)} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
