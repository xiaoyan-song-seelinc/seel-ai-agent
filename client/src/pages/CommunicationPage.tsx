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
  AlertCircleIcon,
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

// ── Rule Change Card ────────────────────────────────────

function RuleChangeCard({ change }: { change: RuleChange }) {
  const [beforeExpanded, setBeforeExpanded] = useState(false);
  const [afterExpanded, setAfterExpanded] = useState(false);
  const MAX_CHARS = 140;

  const renderRuleText = (text: string, expanded: boolean, toggle: () => void, isStrikethrough?: boolean) => {
    const isLong = text.length > MAX_CHARS;
    const display = !isLong || expanded ? text : text.slice(0, MAX_CHARS) + "...";
    return (
      <div>
        <p className={cn(
          "text-[12px] leading-relaxed",
          isStrikethrough ? "text-muted-foreground line-through decoration-red-300/60" : "text-foreground"
        )}>
          {display}
        </p>
        {isLong && (
          <button onClick={toggle} className="text-[10px] text-primary hover:underline mt-0.5">
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mt-2 rounded-lg border border-border/80 overflow-hidden bg-muted/20">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60 bg-muted/30">
        {change.type === "new" ? (
          <Plus className="w-3 h-3 text-emerald-600" />
        ) : (
          <ArrowRight className="w-3 h-3 text-blue-600" />
        )}
        <span className="text-[11px] font-semibold text-foreground">
          {change.type === "new" ? "New Rule" : "Rule Update"}
        </span>
        <span className="text-[10px] text-muted-foreground">{change.ruleName}</span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {change.type === "update" && change.before && (
          <div>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-red-400/80">Current</span>
            {renderRuleText(change.before, beforeExpanded, () => setBeforeExpanded(!beforeExpanded), true)}
          </div>
        )}
        <div>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
            {change.type === "update" ? "Proposed" : "Proposed Rule"}
          </span>
          {renderRuleText(change.after, afterExpanded, () => setAfterExpanded(!afterExpanded))}
        </div>
        {change.source && (
          <p className="text-[10px] text-muted-foreground/70 italic">{change.source}</p>
        )}
      </div>
    </div>
  );
}

// ── Topic Label ─────────────────────────────────────────

function TopicLabel({ title, status }: { title: string; status: "waiting" | "done" }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 mt-3">
      <MessageCircle className="w-3 h-3 text-muted-foreground/50" />
      <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[400px]">{title}</span>
      <span className={cn(
        "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
        status === "done" ? "bg-muted text-muted-foreground" : "bg-amber-50 text-amber-700"
      )}>
        {status === "done" ? "Done" : "Waiting"}
      </span>
      <div className="flex-1 h-px bg-border/50" />
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
  senderLabel?: string;
  onAction: (topicId: string, action: string) => void;
  onReply: (topicId: string) => void;
}) {
  const isAi = msg.sender === "ai";

  return (
    <div className={cn("flex gap-2.5", !isAi && "flex-row-reverse")}>
      {isAi && (
        <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[85%] min-w-0", !isAi && "text-right")}>
        <div className={cn("flex items-center gap-1.5 mb-0.5", !isAi && "justify-end")}>
          <span className="text-[10px] font-medium text-foreground">{isAi ? (senderLabel || "Team Lead") : "You"}</span>
          <span className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
        </div>

        <div className={cn(
          "rounded-xl px-3 py-2 inline-block text-left",
          isAi ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/6 text-foreground rounded-tr-sm"
        )}>
          <CollapsibleText text={msg.content} />
          {msg.ruleChange && <RuleChangeCard change={msg.ruleChange} />}
        </div>

        {msg.hasActions && (
          <div className="flex items-center gap-1.5 mt-1.5 ml-0.5">
            <button
              onClick={() => onAction(msg.topicId, "accept")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => onAction(msg.topicId, "modify_accept")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Modify & Accept
            </button>
            <button
              onClick={() => onAction(msg.topicId, "reject")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <X className="w-3 h-3" /> Reject
            </button>
            <button
              onClick={() => onReply(msg.topicId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── ESCALATION TICKET CARD (for Rep conversation) ───────
// ══════════════════════════════════════════════════════════

const statusConfig: Record<EscalationStatus, { label: string; color: string; dotColor: string }> = {
  needs_attention: { label: "Needs attention", color: "bg-red-50 text-red-700", dotColor: "bg-red-500" },
  in_progress: { label: "In progress", color: "bg-amber-50 text-amber-700", dotColor: "bg-amber-400" },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700", dotColor: "bg-emerald-500" },
};

function EscalationCard({
  ticket,
  onStatusChange,
}: {
  ticket: EscalationTicket;
  onStatusChange: (id: string, status: EscalationStatus) => void;
}) {
  const cfg = statusConfig[ticket.status];

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all",
      ticket.status === "needs_attention" ? "border-red-200/80 bg-white" :
      ticket.status === "in_progress" ? "border-amber-200/80 bg-white" :
      "border-border/60 bg-muted/20"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotColor)} />
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", cfg.color)}>
          {cfg.label}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          #{ticket.zendeskTicketId} · {formatRelativeTime(ticket.createdAt)}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-1.5">
        <p className="text-[12.5px] font-medium text-foreground leading-snug">{ticket.subject}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{ticket.summary}</p>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[10px] text-muted-foreground">{ticket.customerName}</span>
          {ticket.orderValue && (
            <span className="text-[10px] text-muted-foreground">${ticket.orderValue}</span>
          )}
          {ticket.sentiment === "frustrated" && (
            <span className="text-[10px] text-red-500 font-medium">Frustrated</span>
          )}
          {ticket.sentiment === "urgent" && (
            <span className="text-[10px] text-red-600 font-medium">Urgent</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-border/40 flex items-center gap-2">
        <a
          href={ticket.zendeskUrl}
          onClick={(e) => { e.preventDefault(); window.open("/zendesk", "_blank"); }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-muted text-foreground hover:bg-accent transition-colors"
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
                <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-2.5 h-2.5 text-primary" />
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
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border px-2">
        {(["mode", "identity", "actions"] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={cn(
              "px-3 py-2 text-[11px] font-medium capitalize transition-colors relative",
              activeSection === sec ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {sec}
            {activeSection === sec && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-foreground rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeSection === "mode" && (
            <div className="space-y-2">
              {modeConfig.map(({ mode, icon: Icon, color, desc }) => (
                <button
                  key={mode}
                  onClick={() => { setAgentMode(mode); toast.success(`Mode → ${mode}`); }}
                  className={cn(
                    "w-full border rounded-md px-3 py-2.5 text-left transition-all",
                    agentMode === mode
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      color === "emerald" && "bg-emerald-400",
                      color === "amber" && "bg-amber-400",
                      color === "zinc" && "bg-zinc-400"
                    )} />
                    <span className="text-[12px] font-medium capitalize">{mode}</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
          )}

          {activeSection === "identity" && (
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">Name</Label>
                <Input
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  className="h-8 text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tone</Label>
                <Select
                  value={identity.tone}
                  onValueChange={(val: "professional" | "friendly" | "casual") => setIdentity({ ...identity, tone: val })}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Disclose AI</Label>
                  <Tip text="If enabled, the rep will tell customers it's an AI when asked." />
                </div>
                <Switch
                  checked={identity.transparentAboutAI}
                  onCheckedChange={(checked) => setIdentity({ ...identity, transparentAboutAI: checked })}
                />
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">Greeting</Label>
                <Input
                  value={identity.greeting}
                  onChange={(e) => setIdentity({ ...identity, greeting: e.target.value })}
                  className="h-8 text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">Signature</Label>
                <Input
                  value={identity.signature}
                  onChange={(e) => setIdentity({ ...identity, signature: e.target.value })}
                  className="h-8 text-[12px]"
                />
              </div>
            </div>
          )}

          {activeSection === "actions" && (
            <div className="space-y-3">
              {Object.entries(
                permissions.reduce<Record<string, ActionPermission[]>>(
                  (acc, p) => { (acc[p.category] = acc[p.category] || []).push(p); return acc; },
                  {}
                )
              ).map(([category, actions]) => (
                <div key={category}>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{category}</p>
                  <div className="space-y-0 divide-y divide-border/30">
                    {actions.map((action) => {
                      const isOn = action.permission !== "disabled";
                      return (
                        <div key={action.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-foreground">{action.name}</span>
                            <Tip text={action.description} />
                          </div>
                          <Switch
                            checked={isOn}
                            onCheckedChange={() => togglePermission(action.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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

type OBPhase = "welcome" | "upload_doc" | "importing" | "conflict" | "go_live" | "done";

interface OnboardingMsg {
  id: string;
  sender: "ai" | "manager";
  content: string;
  choices?: { label: string; value: string; variant?: "primary" | "outline" }[];
  widget?: string;
  widgetData?: Record<string, unknown>;
}

function SetupTab() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<OBPhase>("welcome");
  const [messages, setMessages] = useState<OnboardingMsg[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  useEffect(() => {
    if (messages.length === 0) {
      addAiMessages([
        makeObMsg("ai", "Hi! I'm your Team Lead. I'll help you set up your Playbook — the rules and policies your AI Rep will follow."),
        makeObMsg("ai", "Do you have a return policy, SOP doc, or guidelines you can share?", {
          choices: [
            { label: "Upload document", value: "upload", variant: "primary" },
            { label: "Try demo (Sales Return Guideline)", value: "demo", variant: "outline" },
          ],
        }),
      ]);
    }
  }, []);

  const handleChoice = (value: string) => {
    switch (phase) {
      case "welcome":
        if (value === "upload" || value === "demo") {
          setMessages((prev) => [...prev, makeObMsg("manager", value === "upload" ? "I'll upload a document" : "Let me try the demo")]);
          setPhase("upload_doc");
          addAiMessages([
            makeObMsg("ai", value === "demo"
              ? "Great! Let me show you how it works with a **Sales Return Guideline** as an example."
              : "Perfect! Upload your document and I'll extract the rules from it."
            ),
            makeObMsg("ai", "", { widget: "upload_doc" }),
          ]);
        }
        break;

      case "upload_doc":
        setPhase("importing");
        setImportProgress(0);
        setMessages((prev) => [...prev, makeObMsg("manager", "Uploaded: Seel_Return_Policy_v2.pdf")]);
        addAiMessages([
          makeObMsg("ai", "Got it! Reading through your return policy now...", { widget: "import_progress" }),
        ]);
        {
          const interval = setInterval(() => {
            setImportProgress((prev) => {
              if (prev >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                  setPhase("conflict");
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
                    makeObMsg("ai", "One conflict I need you to resolve:", { widget: "conflict" }),
                  ], 600);
                }, 500);
                return 100;
              }
              return prev + Math.random() * 15;
            });
          }, 180);
        }
        break;

      case "conflict": {
        const choiceLabel = value === "30_days" ? "30 days from delivery" : "28 calendar days from delivery";
        setMessages((prev) => [...prev, makeObMsg("manager", choiceLabel)]);
        setPhase("go_live");
        addAiMessages([
          makeObMsg("ai", `Got it — I'll use "${choiceLabel}" as the rule.`),
          makeObMsg("ai", "Playbook is set up! You can review and edit rules anytime in the **Playbook** tab."),
          makeObMsg("ai", "When you're ready, hire a Rep from the left panel to start handling tickets. I recommend starting in **Training Mode**.", {
            choices: [
              { label: "Go to Playbook", value: "playbook", variant: "primary" },
              { label: "Stay here", value: "stay", variant: "outline" },
            ],
          }),
        ]);
        break;
      }

      case "go_live":
        if (value === "playbook") {
          toast.success("Redirecting to Playbook...");
          setTimeout(() => navigate("/playbook"), 600);
        } else {
          toast.success("Setup complete! You can hire a Rep when ready.");
        }
        setPhase("done");
        break;
    }
  };

  const renderWidget = (msg: OnboardingMsg) => {
    switch (msg.widget) {
      case "upload_doc":
        return (
          <div className="mt-2 p-3 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 transition-colors">
            <div className="text-center py-2">
              <Upload className="w-5 h-5 text-muted-foreground/50 mx-auto mb-1.5" />
              <p className="text-[12px] font-medium text-foreground">Drop your document here</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, or TXT</p>
            </div>
            <button
              onClick={() => handleChoice("uploaded")}
              className="w-full mt-1.5 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" /> Upload Seel_Return_Policy_v2.pdf
            </button>
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
          </div>
        );
      }

      case "conflict":
        return (
          <div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-amber-900">Conflict: Return Window</p>
                <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                  Your return policy says "30-day return window" but the FAQ page says "28 calendar days from delivery." Which one should I follow?
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleChoice("30_days")}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                30 days from delivery
              </button>
              <button
                onClick={() => handleChoice("28_days")}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                28 calendar days
              </button>
            </div>
          </div>
        );

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
              <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={cn("max-w-[85%] min-w-0", msg.sender === "manager" && "text-right")}>
              <div className={cn("flex items-center gap-1.5 mb-0.5", msg.sender === "manager" && "justify-end")}>
                <span className="text-[10px] font-medium text-foreground">{msg.sender === "ai" ? "Team Lead" : "You"}</span>
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
  const [repHired, setRepHired] = useState(true); // MVP: rep already exists
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
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200/60 flex items-center gap-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[12px] text-amber-800 flex-1">
              <span className="font-medium">Zendesk not connected</span> — set up integration to let your Rep handle tickets.
            </p>
            <button
              onClick={() => navigate("/integrations")}
              className="text-[11px] font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 shrink-0"
            >
              Go to Integrations
            </button>
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
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {waitingCount > 0 && selected.type !== "team_lead" && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                      {waitingCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                <p className="font-medium">Team Lead</p>
                <p className="text-muted-foreground text-[10px]">Playbook & rules</p>
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
                    <Bot className="w-4 h-4 text-emerald-600" />
                    {needsAttentionCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                        {needsAttentionCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[11px]">
                  <p className="font-medium">Alex</p>
                  <p className="text-muted-foreground text-[10px]">Production</p>
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
                  <p className="text-muted-foreground text-[10px]">Complete setup to hire one</p>
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
                {/* Header */}
                <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab("conversations")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                        activeTab === "conversations"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Conversations
                    </button>
                    <button
                      onClick={() => setActiveTab("setup")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                        activeTab === "setup"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Setup
                    </button>
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
                                        senderLabel="Team Lead"
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
                              placeholder="Message Team Lead..."
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
                  <SetupTab />
                )}
              </>
            ) : (
              /* ── Rep View ── */
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Rep header */}
                  <div className="flex items-center justify-between px-5 h-10 border-b border-border shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground">Alex</span>
                      <Badge variant="secondary" className="h-4 text-[9px] px-1.5">Production</Badge>
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
