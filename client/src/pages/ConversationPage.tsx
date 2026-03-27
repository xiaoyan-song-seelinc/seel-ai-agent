/* ── MessagesPage (v3) ─────────────────────────────────────
   IM-style DM with Team Lead.
   Key changes from v2:
   1. Rule proposals: structured "New Rule" vs "Update Rule" cards
   2. Unified topic type — no category tags, default propose-first
   3. Manager rule update → confirmation flow (Yes/No)
   4. Accept / Reject / Reply actions on every proposal
   5. Rule change shown as structured diff card, not inline quote
   6. Inline threads: short threads show below message, long ones collapse
   7. Topics panel: Waiting / Done tabs with red dot count
   8. Red dot = subtle unread indicator
   9. Renamed to Messages
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Send,
  MessageSquare,
  Check,
  X,
  XCircle,
  Reply,
  Bot,
  List,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart3,
} from "lucide-react";
import { TOPICS, type Topic, type TopicType } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────

interface ThreadReply {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  isConfirmation?: boolean; // for Yes/No confirmation UI
}

interface RuleChange {
  type: "new" | "update";
  ruleName: string;
  before?: string; // only for "update"
  after: string;
  source?: string; // e.g. "Observed from tickets #4521, #4533, #4540"
}

interface ConvMessage {
  id: string;
  topicId: string;
  topicTitle: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  ruleChange?: RuleChange;
  actions?: ("accept" | "reject" | "reply")[];
  threadReplies?: ThreadReply[];
  isScribe?: boolean; // performance report — title only
  status: "waiting" | "done";
}

// ── Helpers ────────────────────────────────────────────────

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

// ── Build messages from TOPICS ────────────────────────────

function buildMessages(topics: Topic[]): ConvMessage[] {
  const msgs: ConvMessage[] = [];

  for (const topic of topics) {
    const isPerf = topic.type === "performance_report";
    const isResolved = topic.status === "resolved";
    const firstAi = topic.messages.find((m) => m.sender === "ai");
    const firstManager = topic.messages.find((m) => m.sender === "manager");
    const anchor = firstAi || firstManager;
    if (!anchor) continue;

    // Build thread replies (all messages after the anchor)
    const threadMsgs = topic.messages
      .filter((m) => m.id !== anchor.id)
      .map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      }));

    // Determine if this is a rule proposal
    let ruleChange: RuleChange | undefined;
    if (topic.proposedRule) {
      ruleChange = {
        type: "new",
        ruleName: topic.proposedRule.category + " — " + topic.title,
        after: topic.proposedRule.text,
        source: topic.proposedRule.evidence.map((e) => e).join(" | "),
      };
    }

    // For escalation_review topics that learned from observation, create an "update" rule
    if (topic.type === "escalation_review" && !ruleChange) {
      // Extract rule update from AI messages
      const ruleMsg = topic.messages.find((m) => m.sender === "ai" && m.content.includes("Proposed update"));
      if (ruleMsg) {
        ruleChange = {
          type: "update",
          ruleName: topic.title,
          before: "Require photo evidence for all damage claims regardless of order value.",
          after: "For damage claims on items under $80, process replacement or refund without photo. For items $80+, still request photo.",
          source: `Observed from ticket #${topic.sourceTicketId}`,
        };
      }
    }

    // For rule_update topics initiated by manager
    if (topic.type === "rule_update" && anchor.sender === "manager") {
      ruleChange = {
        type: "new",
        ruleName: topic.title,
        after: anchor.content,
        source: "Manager directive",
      };
    }

    // For knowledge_gap about return shipping cost (t-7)
    if (topic.id === "t-7") {
      ruleChange = {
        type: "update",
        ruleName: "Return Shipping Cost",
        before: "Customer pays $8.95 return shipping fee for all returns.",
        after: "Defective/wrong items → free return shipping (we pay). Change of mind → customer pays ($8.95 deducted from refund).",
        source: "Learned from denied approval on ticket #4498",
      };
    }

    const hasActions = anchor.sender === "ai" && !isPerf && !isResolved;

    msgs.push({
      id: anchor.id,
      topicId: topic.id,
      topicTitle: topic.title,
      sender: anchor.sender,
      content: anchor.content,
      timestamp: anchor.timestamp,
      ruleChange,
      actions: hasActions ? ["accept", "reject", "reply"] : undefined,
      threadReplies: threadMsgs.length > 0 ? threadMsgs : undefined,
      isScribe: isPerf,
      status: isResolved ? "done" : "waiting",
    });
  }

  msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return msgs;
}

// ── Rule Change Card ──────────────────────────────────────

function RuleChangeCard({ change }: { change: RuleChange }) {
  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border">
        {change.type === "new" ? (
          <Plus className="w-3 h-3 text-emerald-600" />
        ) : (
          <ArrowRight className="w-3 h-3 text-blue-600" />
        )}
        <span className="text-[11px] font-semibold text-foreground">
          {change.type === "new" ? "New Rule" : "Rule Update"}
        </span>
        <span className="text-[10px] text-muted-foreground">— {change.ruleName}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        {change.type === "update" && change.before && (
          <div>
            <span className="text-[9px] font-medium text-red-500 uppercase tracking-wider">Before</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-through decoration-red-300">
              {change.before}
            </p>
          </div>
        )}
        <div>
          <span className={cn(
            "text-[9px] font-medium uppercase tracking-wider",
            change.type === "update" ? "text-emerald-600" : "text-emerald-600"
          )}>
            {change.type === "update" ? "After" : "Proposed Rule"}
          </span>
          <p className="text-[11.5px] text-foreground leading-relaxed mt-0.5">
            {change.after}
          </p>
        </div>
        {change.source && (
          <p className="text-[9.5px] text-muted-foreground/70 pt-1 border-t border-border/50">
            Source: {change.source}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Inline Thread ─────────────────────────────────────────

function InlineThread({
  replies,
  onReplyInThread,
}: {
  replies: ThreadReply[];
  onReplyInThread: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = replies.length;

  // Short thread (1-2 replies): show all inline
  // Long thread (3+): show first, collapsed middle, last
  const showAll = count <= 2 || expanded;
  const visibleReplies = showAll
    ? replies
    : [replies[0], replies[replies.length - 1]];
  const hiddenCount = count - 2;

  return (
    <div className="ml-9 mt-1 border-l-2 border-border/60 pl-3 space-y-1.5">
      {showAll ? (
        replies.map((r) => (
          <InlineReplyBubble key={r.id} reply={r} />
        ))
      ) : (
        <>
          <InlineReplyBubble reply={visibleReplies[0]} />
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 py-0.5 transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
          </button>
          <InlineReplyBubble reply={visibleReplies[1]} />
        </>
      )}

      {expanded && count > 2 && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-0.5 transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Collapse
        </button>
      )}

      <button
        onClick={onReplyInThread}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary py-0.5 transition-colors"
      >
        <Reply className="w-3 h-3" />
        Reply
      </button>
    </div>
  );
}

function InlineReplyBubble({ reply }: { reply: ThreadReply }) {
  const isAi = reply.sender === "ai";
  return (
    <div className="flex items-start gap-2">
      {isAi ? (
        <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-2.5 h-2.5 text-primary" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[8px] font-medium text-white">JC</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-foreground">
            {isAi ? "Team Lead" : "You"}
          </span>
          <span className="text-[9px] text-muted-foreground">{formatTime(reply.timestamp)}</span>
        </div>
        <div className="text-[11px] text-foreground/80 leading-relaxed mt-0.5 whitespace-pre-wrap">
          {reply.content.split("\n").map((line, i) => {
            if (line.startsWith("> ")) {
              return (
                <span key={i} className="block border-l-2 border-primary/20 pl-2 my-0.5 text-muted-foreground italic text-[10.5px]">
                  {line.slice(2)}
                </span>
              );
            }
            return <span key={i} className="block" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
          })}
        </div>
      </div>
    </div>
  );
}

// ── Confirmation Card (for manager rule updates) ──────────

function ConfirmationCard({
  content,
  onConfirm,
  onReject,
}: {
  content: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const [decided, setDecided] = useState<"yes" | "no" | null>(null);

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="text-[11px] text-foreground leading-relaxed mb-2.5">
        {content}
      </p>
      {decided === null ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 text-[11px] px-4 rounded-full bg-primary text-white hover:bg-primary/90"
            onClick={() => { setDecided("yes"); onConfirm(); }}
          >
            <Check className="w-3 h-3 mr-1" />
            Yes, confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-4 rounded-full text-muted-foreground"
            onClick={() => { setDecided("no"); onReject(); }}
          >
            <X className="w-3 h-3 mr-1" />
            No, discard
          </Button>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-1.5 text-[11px]",
          decided === "yes" ? "text-emerald-600" : "text-muted-foreground"
        )}>
          {decided === "yes" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {decided === "yes" ? "Confirmed" : "Discarded"}
        </div>
      )}
    </div>
  );
}

// ── Message Card ──────────────────────────────────────────

function MessageCard({
  msg,
  onReplyInThread,
  onAction,
}: {
  msg: ConvMessage;
  onReplyInThread: (msg: ConvMessage) => void;
  onAction: (msgId: string, action: string) => void;
}) {
  const isAi = msg.sender === "ai";
  const [actioned, setActioned] = useState<string | null>(null);

  // Parse content: strip out the proposed rule text if we have a ruleChange card
  const displayContent = msg.ruleChange && msg.sender === "ai"
    ? msg.content.split("\n").filter(line =>
        !line.startsWith("> ") && !line.includes("Proposed rule:") && !line.includes("Proposed update:")
      ).join("\n").trim()
    : msg.content;

  return (
    <div className="group">
      {isAi ? (
        <div className="flex gap-2.5 max-w-[88%]">
          <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-semibold text-foreground">Team Lead</span>
              <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
            </div>

            {/* Content */}
            <div className="rounded-lg border border-border bg-white p-3 text-[12px] leading-relaxed text-foreground">
              {msg.isScribe ? (
                <div className="flex items-center gap-2">
                  {msg.topicTitle.includes("Performance") ? (
                    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium">{msg.topicTitle}</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {displayContent.split("\n").map((line, i) => {
                    if (line.trim() === "") return <div key={i} className="h-1.5" />;
                    if (line.startsWith("- ")) {
                      return (
                        <div key={i} className="flex gap-1.5 ml-1">
                          <span className="text-muted-foreground mt-0.5">·</span>
                          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        </div>
                      );
                    }
                    return (
                      <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                    );
                  })}
                </div>
              )}

              {/* Rule Change Card */}
              {msg.ruleChange && <RuleChangeCard change={msg.ruleChange} />}
            </div>

            {/* Actions: Accept / Reject / Reply */}
            {msg.actions && !actioned && (
              <div className="flex gap-1.5 mt-1.5">
                <Button
                  size="sm"
                  className="h-7 text-[11px] px-3 rounded-full bg-primary text-white hover:bg-primary/90"
                  onClick={() => { setActioned("Accepted"); onAction(msg.id, "accept"); }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-3 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => { setActioned("Rejected"); onAction(msg.id, "reject"); }}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-3 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => onReplyInThread(msg)}
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              </div>
            )}

            {actioned && (
              <div className={cn(
                "flex items-center gap-1.5 mt-1.5 text-[11px]",
                actioned === "Accepted" ? "text-emerald-600" : "text-red-500"
              )}>
                {actioned === "Accepted" ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {actioned}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manager message */
        <div className="flex flex-col items-end">
          <div className="max-w-[75%]">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
              <span className="text-[12px] font-semibold text-foreground">You</span>
            </div>
            <div className="rounded-lg bg-primary/6 border border-primary/10 p-3 text-[12px] leading-relaxed text-foreground">
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Inline thread replies */}
      {msg.threadReplies && msg.threadReplies.length > 0 && (
        <InlineThread
          replies={msg.threadReplies}
          onReplyInThread={() => onReplyInThread(msg)}
        />
      )}
    </div>
  );
}

// ── Topics Panel ──────────────────────────────────────────

function TopicsPanel({
  messages,
  onSelectTopic,
  onClose,
}: {
  messages: ConvMessage[];
  onSelectTopic: (msg: ConvMessage) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");

  const waiting = messages.filter((m) => m.status === "waiting" && m.sender === "ai");
  const done = messages.filter((m) => m.status === "done" && m.sender === "ai");

  const list = tab === "waiting" ? waiting : done;

  return (
    <div className="w-[280px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-3 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground">Topics</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "waiting" | "done")} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 h-8 bg-muted/50">
          <TabsTrigger value="waiting" className="text-[11px] h-6 px-3 data-[state=active]:bg-white relative">
            Waiting
            {waiting.length > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
                {waiting.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="done" className="text-[11px] h-6 px-3 data-[state=active]:bg-white">
            Done
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="py-1">
              {list.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-8">
                  {tab === "waiting" ? "All caught up!" : "No resolved topics yet."}
                </p>
              )}
              {list.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => onSelectTopic(msg)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left border-b border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{msg.topicTitle}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(msg.threadReplies?.[msg.threadReplies.length - 1]?.timestamp || msg.timestamp)}
                      {msg.threadReplies && ` · ${msg.threadReplies.length} replies`}
                    </p>
                  </div>
                  {msg.status === "waiting" && msg.actions && (
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Thread Side Panel (for Reply action) ──────────────────

function ThreadSidePanel({
  msg,
  onClose,
}: {
  msg: ConvMessage;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [localReplies, setLocalReplies] = useState<ThreadReply[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const allReplies = [...(msg.threadReplies || []), ...localReplies];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allReplies.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newReply: ThreadReply = {
      id: `tr-${Date.now()}`,
      sender: "manager",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setLocalReplies((prev) => [...prev, newReply]);
    setInput("");

    // Simulate AI confirmation request
    setTimeout(() => {
      setLocalReplies((prev) => [
        ...prev,
        {
          id: `tr-ai-${Date.now()}`,
          sender: "ai",
          content: `Got it. I'll update the rule to reflect this. Here's what I'll change:\n\n**Updated rule:** ${input.trim()}\n\nPlease confirm this is correct.`,
          timestamp: new Date().toISOString(),
          isConfirmation: true,
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-[360px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground truncate max-w-[240px]">{msg.topicTitle}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Original message summary */}
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center">
            <Bot className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-[10px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2 ml-7">
          {msg.content.replace(/\*\*/g, "").slice(0, 150)}...
        </p>
      </div>

      {/* Thread replies */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-3 space-y-3">
          {allReplies.map((reply) => (
            <div key={reply.id}>
              <div className={cn("flex gap-2", reply.sender === "manager" && "flex-row-reverse")}>
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
                    <span className="text-[10px] font-medium text-foreground">
                      {reply.sender === "ai" ? "Team Lead" : "You"}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{formatTime(reply.timestamp)}</span>
                  </div>
                  <div className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed",
                    reply.sender === "ai" ? "bg-muted/50 text-foreground" : "bg-primary/6 text-foreground"
                  )}>
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: reply.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    }} />
                  </div>
                </div>
              </div>

              {/* Confirmation card for AI replies that need confirmation */}
              {reply.isConfirmation && reply.sender === "ai" && (
                <div className="ml-7 mt-1.5">
                  <ConfirmationCard
                    content="Apply this rule update?"
                    onConfirm={() => {}}
                    onReject={() => {}}
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Reply..."
            className="flex-1 text-[11.5px] bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1 rounded text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function MessagesPage() {
  const [threadPanel, setThreadPanel] = useState<ConvMessage | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ConvMessage[]>([]);
  const [confirmations, setConfirmations] = useState<Map<string, ConvMessage>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const baseMessages = useMemo(() => buildMessages(TOPICS), []);
  const allMessages = [...baseMessages, ...extraMessages];

  const waitingCount = allMessages.filter((m) => m.status === "waiting" && m.sender === "ai").length;

  // Group by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ConvMessage[] }[] = [];
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
    const newMsg: ConvMessage = {
      id: `cm-${Date.now()}`,
      topicId: `new-${Date.now()}`,
      topicTitle: inputValue.trim().slice(0, 60),
      sender: "manager",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      status: "waiting",
    };
    setExtraMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // AI replies with confirmation request
    setTimeout(() => {
      const confirmMsg: ConvMessage = {
        id: `cm-ai-${Date.now()}`,
        topicId: newMsg.topicId,
        topicTitle: newMsg.topicTitle,
        sender: "ai",
        content: `I understand. Let me update the rules to reflect this change.`,
        timestamp: new Date().toISOString(),
        ruleChange: {
          type: "new",
          ruleName: newMsg.topicTitle,
          after: newMsg.content,
          source: "Manager directive",
        },
        status: "waiting",
      };
      setExtraMessages((prev) => [...prev, confirmMsg]);
      setConfirmations((prev) => new Map(prev).set(confirmMsg.id, confirmMsg));
    }, 1500);
  };

  const handleAction = (msgId: string, action: string) => {
    console.log(`Action: ${action} on message ${msgId}`);
  };

  const handleReplyInThread = (msg: ConvMessage) => {
    setThreadPanel(msg);
    setShowTopics(false);
  };

  const handleSelectTopic = (msg: ConvMessage) => {
    // Scroll to the message in the main flow
    const el = document.getElementById(`msg-${msg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/30", "rounded-lg");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/30", "rounded-lg"), 2000);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-border shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[13px] font-semibold text-foreground">Team Lead</span>
            <span className="text-[10px] text-muted-foreground">Your AI team's updates & decisions</span>
          </div>
          <button
            onClick={() => { setShowTopics(!showTopics); setThreadPanel(null); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] transition-colors relative",
              showTopics
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <List className="w-3.5 h-3.5" />
            Topics
            {waitingCount > 0 && !showTopics && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium ml-0.5">
                {waitingCount}
              </span>
            )}
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-[780px] mx-auto px-5 py-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground px-2">{formatDateGroup(group.date)}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-4">
                  {group.messages.map((msg) => (
                    <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-300">
                      <MessageCard
                        msg={msg}
                        onReplyInThread={handleReplyInThread}
                        onAction={handleAction}
                      />
                      {/* Confirmation card for manager-initiated rule updates */}
                      {confirmations.has(msg.id) && (
                        <div className="ml-9 mt-2">
                          <ConfirmationCard
                            content="Apply this rule update?"
                            onConfirm={() => {
                              setConfirmations((prev) => {
                                const next = new Map(prev);
                                next.delete(msg.id);
                                return next;
                              });
                            }}
                            onReject={() => {
                              setConfirmations((prev) => {
                                const next = new Map(prev);
                                next.delete(msg.id);
                                return next;
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-5 py-3 border-t border-border bg-white">
          <div className="max-w-[780px] mx-auto">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
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

      {/* Thread side panel */}
      {threadPanel && (
        <ThreadSidePanel msg={threadPanel} onClose={() => setThreadPanel(null)} />
      )}

      {/* Topics panel */}
      {showTopics && !threadPanel && (
        <TopicsPanel
          messages={allMessages}
          onSelectTopic={handleSelectTopic}
          onClose={() => setShowTopics(false)}
        />
      )}
    </div>
  );
}
