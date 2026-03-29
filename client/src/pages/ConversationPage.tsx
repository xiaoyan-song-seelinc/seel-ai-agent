/* ── Messages Page ────────────────────────────────────────────
   Two tabs: Conversations (DM-style + ticket actions) and Setup (onboarding).
   Conversations: chat bubbles with topic labels, rule proposals (with
   Accept / Modify & Accept / Reject), and escalated ticket cards.
   Setup: embedded 3-phase onboarding (Connect → Playbook → Hire Rep).
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Send, Check, X, XCircle, Reply, Bot, List, Plus,
  ArrowRight, ChevronDown, ChevronUp, MessageCircle,
  AlertTriangle, Copy, CheckCircle2, Link2, Upload,
  FileText, Sparkles, Eye, Rocket, Settings, BookOpen,
  ExternalLink, Shield, Clock, Pencil,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { TOPICS, type Topic } from "@/lib/mock-data";
import { ZENDESK_TICKETS, type ZendeskTicket } from "@/lib/zendesk-data";

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

  // Group by topic, sort topics by first message, keep messages within topic in order
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
// ── CONVERSATION TAB COMPONENTS ─────────────────────────
// ══════════════════════════════════════════════════════════

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

// ── Message Bubble (with Accept / Modify & Accept / Reject) ──

function MessageBubble({
  msg,
  onAction,
  onReply,
}: {
  msg: ChatMessage;
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
          <span className="text-[10px] font-medium text-foreground">{isAi ? "Rep" : "You"}</span>
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

// ── Escalated Ticket Card (no approval — direct handoff only) ──

function EscalatedTicketCard({
  ticket,
  onInstruct,
}: {
  ticket: ZendeskTicket;
  onInstruct: (id: string, note: string) => void;
}) {
  const [instructInput, setInstructInput] = useState("");
  const [showInstruct, setShowInstruct] = useState(false);

  const handleSendInstruct = () => {
    if (!instructInput.trim()) return;
    onInstruct(ticket.id, instructInput.trim());
    toast.success("Note sent to Rep");
    setInstructInput("");
    setShowInstruct(false);
  };

  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3 h-3 text-primary" />
      </div>

      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-foreground">Rep</span>
          <span className="text-[9px] text-muted-foreground">
            {formatTime(ticket.messages[0]?.timestamp || "2026-03-26T09:00:00Z")}
          </span>
        </div>

        <div className="rounded-xl bg-muted/40 text-foreground rounded-tl-sm overflow-hidden">
          {/* Status bar — escalated */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-red-50/50">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-semibold">Escalated to You</span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              #{ticket.id.replace("zd-", "")} · {ticket.customerName}
            </span>
          </div>

          <div className="px-3 py-2 space-y-2">
            {/* Ticket subject */}
            <p className="text-[12px] font-medium">{ticket.subject}</p>

            {/* Rep's Handoff Note */}
            {ticket.internalNote && (
              <div className="rounded-md bg-white/60 border border-border/50 px-2.5 py-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">Rep's Handoff Note</span>
                <p className="text-[11.5px] leading-relaxed text-foreground/80">{ticket.internalNote}</p>
              </div>
            )}

            {/* Escalation reason */}
            {ticket.escalationReason && (
              <p className="text-[10px] text-muted-foreground/70 italic">{ticket.escalationReason}</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-border/50 bg-muted/10">
            <div className="flex items-center gap-2">
              <a
                href="/zendesk"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium bg-muted text-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Open in Zendesk
              </a>
              <button
                onClick={() => setShowInstruct(!showInstruct)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
              >
                <Reply className="w-3 h-3" /> Notes to Rep
              </button>
            </div>

            {showInstruct && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={instructInput}
                  onChange={(e) => setInstructInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInstruct()}
                  placeholder="Leave a note for how to handle this in the future..."
                  className="flex-1 text-[11px] bg-white border border-border rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={handleSendInstruct}
                  disabled={!instructInput.trim()}
                  className="p-1.5 rounded-md text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Topics Panel ────────────────────────────────────────

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
    <div className="w-[280px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
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
          Done
          <span className="ml-1 text-[9px] text-muted-foreground">({done.length})</span>
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
                <span className="text-[9px] text-muted-foreground">{topic.replyCount} messages</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Thread Side Panel ────────────────────────────────────

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
    <div className="w-[340px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground truncate max-w-[220px]">{topicTitle}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-primary/8 flex items-center justify-center">
            <Bot className="w-2 h-2 text-primary" />
          </div>
          <span className="text-[10px] font-medium text-foreground">Rep</span>
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2 ml-6">
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
                <div className={cn("flex items-center gap-1.5 mb-0.5", reply.sender === "manager" && "justify-end")}>
                  <span className="text-[10px] font-medium text-foreground">{reply.sender === "ai" ? "Rep" : "You"}</span>
                  <span className="text-[9px] text-muted-foreground">{formatTime(reply.timestamp)}</span>
                </div>
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed inline-block text-left",
                  reply.sender === "ai" ? "bg-muted/50 text-foreground" : "bg-primary/6 text-foreground"
                )} dangerouslySetInnerHTML={{
                  __html: reply.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>")
                }} />
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="px-3 py-2.5 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Reply..."
            className="flex-1 text-[11.5px] bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <button onClick={handleSend} disabled={!input.trim()} className="p-1 rounded text-primary hover:bg-primary/8 transition-colors disabled:opacity-30">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── SETUP TAB (ONBOARDING — 3 PHASES) ──────────────────
// ══════════════════════════════════════════════════════════

type OnboardingPhase =
  | "welcome"
  | "connect_zendesk"
  | "connect_shopify"
  | "upload_doc"
  | "importing"
  | "parse_result"
  | "conflict"
  | "go_live"
  | "done";

interface OnboardingMsg {
  id: string;
  role: "ai" | "manager";
  content: string;
  choices?: { label: string; value: string; variant?: "primary" | "outline" }[];
  widget?: string;
  widgetData?: Record<string, unknown>;
}

const SETUP_STEPS = [
  { label: "Connect to your system", phases: ["welcome", "connect_zendesk", "connect_shopify"] },
  { label: "Set up a playbook", phases: ["upload_doc", "importing", "parse_result", "conflict"] },
  { label: "Hire a rep", phases: ["go_live", "done"] },
];

const ALL_OB_PHASES: OnboardingPhase[] = [
  "welcome", "connect_zendesk", "connect_shopify", "upload_doc",
  "importing", "parse_result", "conflict", "go_live", "done",
];

let obMsgCounter = 0;
function makeObMsg(
  role: "ai" | "manager",
  content: string,
  extras?: Partial<Pick<OnboardingMsg, "choices" | "widget" | "widgetData">>
): OnboardingMsg {
  obMsgCounter++;
  return { id: `ob-${obMsgCounter}`, role, content, ...extras };
}

function SetupTab() {
  const [phase, setPhase] = useState<OnboardingPhase>("welcome");
  const [messages, setMessages] = useState<OnboardingMsg[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [typing, setTyping] = useState(false);
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInit = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const addAiMessages = (msgs: OnboardingMsg[], delay = 500) => {
    setTyping(true);
    const copy = [...msgs];
    let i = 0;
    const next = () => {
      if (i < copy.length) {
        const m = copy[i];
        if (m) setMessages((prev) => [...prev, m]);
        i++;
        if (i < copy.length) setTimeout(next, delay);
        else setTyping(false);
      }
    };
    setTimeout(next, 400);
  };

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    addAiMessages([
      makeObMsg("ai", "Hey! I'm your setup assistant. Let's get your AI rep running — this takes about 3 minutes."),
      makeObMsg("ai", "First, let's connect your Zendesk so the rep can read and respond to tickets.", {
        choices: [
          { label: "Connect Zendesk", value: "start_zendesk", variant: "primary" },
          { label: "Skip for now", value: "skip_zendesk", variant: "outline" },
        ],
      }),
    ]);
  }, []);

  const handleChoice = (value: string) => {
    switch (phase) {
      case "welcome":
        if (value === "skip_zendesk") {
          setPhase("connect_shopify");
          addAiMessages([
            makeObMsg("ai", "No problem — you can connect Zendesk later in Integrations."),
            makeObMsg("ai", "How about Shopify? Connecting it lets the rep look up orders and process refunds.", {
              choices: [
                { label: "Connect Shopify", value: "start_shopify", variant: "primary" },
                { label: "Skip for now", value: "skip_shopify", variant: "outline" },
              ],
            }),
          ]);
        } else {
          setPhase("connect_zendesk");
          addAiMessages([makeObMsg("ai", "", { widget: "connect_zendesk" })]);
        }
        break;

      case "connect_zendesk":
        setPhase("connect_shopify");
        addAiMessages([
          makeObMsg("ai", "Zendesk connected! Now let's hook up Shopify so the rep can look up orders and process refunds.", {
            choices: [
              { label: "Connect Shopify", value: "start_shopify", variant: "primary" },
              { label: "Skip for now", value: "skip_shopify", variant: "outline" },
            ],
          }),
        ]);
        break;

      case "connect_shopify":
        setPhase("upload_doc");
        addAiMessages([
          makeObMsg("ai", "Now I need to learn your business rules. Upload a document — your SOP, return policy, or playbook — and I'll extract the rules from it."),
          makeObMsg("ai", "Let me show you how it works with your **Seel Return Policy** as an example.", {
            widget: "upload_doc",
          }),
        ]);
        break;

      case "upload_doc":
        setPhase("importing");
        setImportProgress(0);
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
                    makeObMsg("ai", "I've gone through everything. Here's what I pulled out:", {
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
                    makeObMsg("ai", "One thing I need you to resolve:", { widget: "conflict" }),
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
          makeObMsg("ai", "That's the playbook set up! You can upload more documents and review extracted rules anytime in **Playbook**."),
          makeObMsg("ai", "Now let's hire your rep. I recommend starting in **Training Mode** — the rep will draft replies as Internal Notes in Zendesk, but won't send anything until you approve.", {
            choices: [
              { label: "Start in Training Mode", value: "training", variant: "primary" },
              { label: "Go live in Production", value: "production", variant: "outline" },
            ],
          }),
        ]);
        break;
      }

      case "go_live": {
        setPhase("done");
        const modeName = value === "training" ? "Training Mode" : "Production Mode";
        addAiMessages([
          makeObMsg("ai", `${modeName} activated! Your rep is now working on your Zendesk tickets.`),
          makeObMsg("ai", "A few things you can set up when you're ready:", { widget: "go_live_summary" }),
          makeObMsg("ai", "Where would you like to go?", {
            choices: [
              { label: "Go to Conversations", value: "conversations", variant: "primary" },
              { label: "Open Playbook", value: "playbook", variant: "outline" },
              { label: "Configure Agent", value: "agent", variant: "outline" },
            ],
          }),
        ]);
        break;
      }

      case "done":
        if (value === "playbook") {
          toast.success("Redirecting to Playbook...");
          setTimeout(() => navigate("/playbook"), 600);
        } else if (value === "agent") {
          toast.success("Redirecting to Agent...");
          setTimeout(() => navigate("/agent"), 600);
        } else {
          toast.success("Setup complete!");
        }
        break;
    }
  };

  const currentPhaseIdx = ALL_OB_PHASES.indexOf(phase);

  // Render widgets
  const renderWidget = (msg: OnboardingMsg) => {
    switch (msg.widget) {
      case "connect_zendesk":
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#03363D]/10 flex items-center justify-center">
                <span className="text-xs font-bold text-[#03363D]">Z</span>
              </div>
              <div>
                <p className="text-[12px] font-medium">Zendesk</p>
                <p className="text-[10px] text-muted-foreground">Connect via OAuth</p>
              </div>
            </div>
            <button
              onClick={() => handleChoice("zendesk_connected")}
              className="w-full py-2 rounded-lg bg-[#03363D] text-white text-[12px] font-medium hover:bg-[#03363D]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-3.5 h-3.5" /> Connect Zendesk Account
            </button>
          </div>
        );

      case "connect_shopify":
        return (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#96BF48]/10 flex items-center justify-center">
                <span className="text-xs font-bold text-[#96BF48]">S</span>
              </div>
              <div>
                <p className="text-[12px] font-medium">Shopify</p>
                <p className="text-[10px] text-muted-foreground">Connect via OAuth</p>
              </div>
            </div>
            <button
              onClick={() => handleChoice("shopify_connected")}
              className="w-full py-2 rounded-lg bg-[#96BF48] text-white text-[12px] font-medium hover:bg-[#96BF48]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-3.5 h-3.5" /> Connect Shopify Store
            </button>
          </div>
        );

      case "upload_doc":
        return (
          <div className="mt-2 p-3 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 transition-colors">
            <div className="text-center py-3">
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
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3 h-3 text-primary animate-pulse" />
              </div>
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

      case "go_live_summary":
        return (
          <div className="mt-2 space-y-1">
            {[
              { label: "Action permissions", desc: "What your rep can do autonomously", where: "Agent → Actions" },
              { label: "Agent identity & tone", desc: "Name, greeting, sign-off", where: "Agent → Identity" },
              { label: "More documents", desc: "Upload additional SOPs or FAQs", where: "Playbook → Documents" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 py-1.5 px-2.5 rounded-md border border-border bg-white">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-[9px] text-primary/70 shrink-0 mt-0.5">{item.where}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left: Step progress */}
      <div className="w-[200px] border-r border-border bg-muted/20 flex flex-col shrink-0">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] font-semibold text-foreground">Quick Start</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">~3 min setup</p>
        </div>
        <nav className="flex-1 px-2">
          {SETUP_STEPS.map((step, idx) => {
            const isActive = step.phases.includes(phase);
            const stepLastPhaseIdx = ALL_OB_PHASES.indexOf(step.phases[step.phases.length - 1] as OnboardingPhase);
            const isCompleted = currentPhaseIdx > stepLastPhaseIdx;
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-md mb-0.5 transition-all text-[11px]",
                  isActive && "bg-primary/8 text-primary font-medium",
                  !isActive && isCompleted && "text-foreground/50",
                  !isActive && !isCompleted && "text-muted-foreground/40"
                )}
              >
                <div className={cn(
                  "w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-medium",
                  isCompleted && "bg-emerald-500 text-white",
                  isActive && !isCompleted && "bg-primary/15 text-primary border border-primary/30",
                  !isActive && !isCompleted && "border border-border text-muted-foreground/40"
                )}>
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ScrollArea className="flex-1">
          <div className="max-w-[560px] mx-auto px-5 py-5 space-y-3" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2.5", msg.role === "manager" && "justify-end")}>
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  msg.role === "ai" && "flex-1 max-w-[480px]",
                  msg.role === "manager" && "max-w-[320px]",
                )}>
                  {msg.role === "manager" ? (
                    <div className="bg-primary/8 text-foreground rounded-xl rounded-tr-sm px-3 py-2">
                      <p className="text-[12px]">{msg.content}</p>
                    </div>
                  ) : (
                    <div>
                      {msg.content && (
                        <p className="text-[12.5px] leading-relaxed text-foreground"
                           dangerouslySetInnerHTML={{
                             __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                           }}
                        />
                      )}
                      {msg.widget && renderWidget(msg)}
                      {msg.choices && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {msg.choices.map((c) => (
                            <button
                              key={c.value}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                                c.variant === "primary"
                                  ? "bg-primary text-white hover:bg-primary/90"
                                  : "border border-border text-foreground hover:bg-accent"
                              )}
                              onClick={() => handleChoice(c.value)}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="flex items-center gap-1 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"conversations" | "setup">("conversations");
  const [threadPanel, setThreadPanel] = useState<{ topicId: string; topicTitle: string; contextMsg: string } | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [ticketActions, setTicketActions] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build all messages
  const baseMessages = useMemo(() => buildChatMessages(TOPICS), []);
  const allMessages = useMemo(() => {
    const combined = [...baseMessages, ...extraMessages];
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return combined;
  }, [baseMessages, extraMessages]);

  // Escalated tickets only (no approval in MVP)
  const escalatedTickets = useMemo(() =>
    ZENDESK_TICKETS.filter(t => t.state === "escalated"),
    []
  );

  // Build topics list for panel
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
    // Add escalated ticket topics
    for (const t of escalatedTickets) {
      topicMap.set(`ticket-${t.id}`, {
        id: `ticket-${t.id}`,
        title: t.subject,
        status: ticketActions[t.id] ? "done" : "waiting",
        timestamp: t.messages[0]?.timestamp || "2026-03-26T09:00:00Z",
        hasActions: !ticketActions[t.id],
        replyCount: 1,
      });
    }
    return Array.from(topicMap.values());
  }, [allMessages, escalatedTickets, ticketActions]);

  const waitingCount = topicsList.filter((t) => t.status === "waiting" && t.hasActions).length;

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
      // Open thread panel for modification
      const msgs = allMessages.filter((m) => m.topicId === topicId);
      const first = msgs[0];
      if (first) {
        setThreadPanel({
          topicId,
          topicTitle: first.topicTitle,
          contextMsg: first.content,
        });
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
      setThreadPanel({
        topicId,
        topicTitle: first.topicTitle,
        contextMsg: first.content,
      });
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

  const handleTicketInstruct = (id: string, note: string) => {
    // Just toast for now
  };

  const shownTopics = new Set<string>();

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-border shrink-0 bg-white">
          <div className="flex items-center gap-1">
            {/* Tab buttons */}
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
              {escalatedTickets.filter(t => !ticketActions[t.id]).length > 0 && activeTab !== "conversations" && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
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
            <div className="flex items-center gap-1.5">
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
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab === "conversations" ? (
          <>
            <ScrollArea className="flex-1">
              <div className="max-w-[680px] mx-auto px-5 py-4 space-y-3">
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
                            <MessageBubble msg={msg} onAction={handleAction} onReply={handleReply} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Escalated Ticket Cards */}
                {escalatedTickets.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-medium text-muted-foreground px-2">
                        Wednesday, Mar 26
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <TopicLabel title="Escalated tickets" status="waiting" />

                    <div className="space-y-3">
                      {escalatedTickets.map((ticket) => (
                        <EscalatedTicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onInstruct={handleTicketInstruct}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-5 py-3 border-t border-border bg-white">
              <div className="max-w-[680px] mx-auto">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Message Rep..."
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
          </>
        ) : (
          <SetupTab />
        )}
      </div>

      {/* Side panels (only for conversations tab) */}
      {activeTab === "conversations" && threadPanel && (
        <ThreadSidePanel
          topicId={threadPanel.topicId}
          topicTitle={threadPanel.topicTitle}
          contextMsg={threadPanel.contextMsg}
          onClose={() => setThreadPanel(null)}
        />
      )}

      {activeTab === "conversations" && showTopics && !threadPanel && (
        <TopicsPanel
          topics={topicsList}
          onSelectTopic={handleSelectTopic}
          onClose={() => setShowTopics(false)}
        />
      )}
    </div>
  );
}
