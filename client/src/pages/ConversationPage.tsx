/* ── Messages Page ────────────────────────────────────────────
   DM-style conversation flow. Each message is a chat bubble.
   Topics are marked with lightweight inline labels.
   Rule proposals are embedded cards within AI messages.
   No onboarding — that lives at /onboarding.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Send, Check, X, XCircle, Reply, Bot, List, Plus,
  ArrowRight, ChevronDown, ChevronUp, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TOPICS, type Topic } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────

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
    if (line.startsWith("> ")) {
      return (
        <div key={i} className="border-l-2 border-primary/20 pl-2 my-0.5 text-muted-foreground italic text-[11px]">
          {line.slice(2)}
        </div>
      );
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

    // Determine rule change for this topic
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

    // Process messages
    for (let i = 0; i < topic.messages.length; i++) {
      const msg = topic.messages[i];
      const isFirst = i === 0;

      // Skip duplicate rule text messages (e.g. t-1's m-1-2)
      if (msg.sender === "ai" && topic.proposedRule &&
        (msg.content.includes("Proposed rule:") || msg.content.includes("Should I adopt this rule?"))) {
        if (!isFirst) continue;
      }

      // Clean content: strip rule-related lines from anchor if we have a ruleChange
      let content = msg.content;
      if (isFirst && ruleChange && topic.type !== "rule_update") {
        content = content.split("\n").filter(line =>
          !line.startsWith("> ") && !line.includes("Proposed rule:") && !line.includes("Proposed update:")
        ).join("\n").trim();
      }

      // Determine if this message should carry the rule card
      // For rule_update (t-6): AI's second message carries the rule
      // For others: first AI message carries it
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

      // Determine if this message should show actions
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

  // Group by topic, sort topics by their first message, keep messages within topic in order
  const topicGroups = new Map<string, ChatMessage[]>();
  for (const msg of messages) {
    if (!topicGroups.has(msg.topicId)) topicGroups.set(msg.topicId, []);
    topicGroups.get(msg.topicId)!.push(msg);
  }
  // Sort each topic's messages internally
  for (const group of Array.from(topicGroups.values())) {
    group.sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  // Sort topics by their first message timestamp
  const sortedTopics = Array.from(topicGroups.entries()).sort(
    ([, a], [, b]) => new Date(a[0].timestamp).getTime() - new Date(b[0].timestamp).getTime()
  );
  // Flatten: all messages of topic A, then all of topic B, etc.
  return sortedTopics.flatMap(([, msgs]) => msgs);
}

// ── Collapsible Text ─────────────────────────────────────

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
        <span className="text-[10px] text-muted-foreground truncate">{change.ruleName}</span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {change.type === "update" && change.before && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Current</span>
            </div>
            <div className="pl-3">
              {renderRuleText(change.before, beforeExpanded, () => setBeforeExpanded(!beforeExpanded), true)}
            </div>
          </div>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {change.type === "update" ? "Proposed" : "Proposed Rule"}
            </span>
          </div>
          <div className="pl-3">
            {renderRuleText(change.after, afterExpanded, () => setAfterExpanded(!afterExpanded))}
          </div>
        </div>
        {change.source && (
          <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/40 pl-3">
            {change.source}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Topic Label (lightweight inline divider) ────────────

function TopicLabel({ title, status }: { title: string; status: "waiting" | "done" }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-border/60" />
      <div className="flex items-center gap-1.5 px-2">
        <MessageCircle className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-[10px] font-medium text-muted-foreground">{title}</span>
        {status === "done" && (
          <span className="text-[9px] text-emerald-500 font-medium">Done</span>
        )}
      </div>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────

function MessageBubble({
  msg,
  onAction,
  onReply,
}: {
  msg: ChatMessage;
  onAction: (topicId: string, action: string) => void;
  onReply: (topicId: string) => void;
}) {
  const [actioned, setActioned] = useState<string | null>(null);
  const isAi = msg.sender === "ai";

  if (!isAi) {
    // Manager message — right-aligned bubble
    return (
      <div className="flex justify-end group">
        <div className="max-w-[75%]">
          <div className="flex items-center gap-1.5 justify-end mb-0.5">
            <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(msg.timestamp)}
            </span>
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-primary/8 border border-primary/10 px-3.5 py-2 text-[12.5px] leading-relaxed text-foreground">
            {renderMarkdown(msg.content)}
          </div>
        </div>
      </div>
    );
  }

  // AI message — left-aligned with avatar
  return (
    <div className="flex gap-2.5 group max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-medium text-foreground">Rep</span>
          <span className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
        </div>

        {/* Message content */}
        {msg.content && (
          <div className="text-[12.5px] leading-relaxed text-foreground/90">
            <CollapsibleText text={msg.content} />
          </div>
        )}

        {/* Rule change card */}
        {msg.ruleChange && <RuleChangeCard change={msg.ruleChange} />}

        {/* Action buttons */}
        {msg.hasActions && !actioned && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <Button
              size="sm"
              className="h-7 text-[11px] px-3.5 rounded-full bg-primary text-white hover:bg-primary/90"
              onClick={() => { setActioned("Accepted"); onAction(msg.topicId, "accept"); }}
            >
              <Check className="w-3 h-3 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-3.5 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => { setActioned("Rejected"); onAction(msg.topicId, "reject"); }}
            >
              <XCircle className="w-3 h-3 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-3.5 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => onReply(msg.topicId)}
            >
              <Reply className="w-3 h-3 mr-1" /> Reply
            </Button>
          </div>
        )}

        {actioned && (
          <div className={cn(
            "flex items-center gap-1.5 mt-2 text-[11px]",
            actioned === "Accepted" ? "text-emerald-600" : "text-red-500"
          )}>
            {actioned === "Accepted" ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {actioned}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Topics Panel ─────────────────────────────────────────

function TopicsPanel({
  topics,
  onSelectTopic,
  onClose,
}: {
  topics: { id: string; title: string; status: "waiting" | "done"; timestamp: string; hasActions: boolean; replyCount: number }[];
  onSelectTopic: (topicId: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");
  const waiting = topics.filter((t) => t.status === "waiting");
  const done = topics.filter((t) => t.status === "done");
  const list = tab === "waiting" ? waiting : done;

  return (
    <div className="w-[260px] border-l border-border bg-white flex flex-col h-full shrink-0">
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
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTopic(t.id)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left border-b border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(t.timestamp)}
                      {t.replyCount > 0 && ` · ${t.replyCount} messages`}
                    </p>
                  </div>
                  {t.status === "waiting" && t.hasActions && (
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

      {/* Original context */}
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
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function MessagesPage() {
  const [threadPanel, setThreadPanel] = useState<{ topicId: string; topicTitle: string; contextMsg: string } | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build all messages
  const baseMessages = useMemo(() => buildChatMessages(TOPICS), []);
  const allMessages = useMemo(() => {
    const combined = [...baseMessages, ...extraMessages];
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return combined;
  }, [baseMessages, extraMessages]);

  // Build topics list for panel
  const topicsList = useMemo(() => {
    const topicMap = new Map<string, { id: string; title: string; status: "waiting" | "done"; timestamp: string; hasActions: boolean; replyCount: number }>();
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

  // Group messages by date for date dividers
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

    // AI responds
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
    toast.success(action === "accept" ? "Rule accepted" : "Rule rejected");
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
    // Find the first message of this topic and scroll to it
    const el = document.getElementById(`msg-${topicId}-start`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/5");
      setTimeout(() => el.classList.remove("bg-primary/5"), 2000);
    }
  };

  // Track which topic labels have been shown
  const shownTopics = new Set<string>();

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-border shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[13px] font-semibold text-foreground">Rep</span>
            <span className="text-[10px] text-muted-foreground">AI support agent</span>
          </div>
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
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-[680px] mx-auto px-5 py-4 space-y-3">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground px-2">{formatDateGroup(group.date)}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    // Show topic label before the first message of each topic
                    const showTopicLabel = msg.isTopicStart && !shownTopics.has(msg.topicId);
                    if (msg.isTopicStart) shownTopics.add(msg.topicId);

                    return (
                      <div key={msg.id} id={msg.isTopicStart ? `msg-${msg.topicId}-start` : undefined} className="transition-colors duration-500 rounded-lg">
                        {showTopicLabel && (
                          <TopicLabel title={msg.topicTitle} status={msg.topicStatus} />
                        )}
                        <MessageBubble
                          msg={msg}
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
      </div>

      {/* Thread side panel */}
      {threadPanel && (
        <ThreadSidePanel
          topicId={threadPanel.topicId}
          topicTitle={threadPanel.topicTitle}
          contextMsg={threadPanel.contextMsg}
          onClose={() => setThreadPanel(null)}
        />
      )}

      {/* Topics panel */}
      {showTopics && !threadPanel && (
        <TopicsPanel
          topics={topicsList}
          onSelectTopic={handleSelectTopic}
          onClose={() => setShowTopics(false)}
        />
      )}
    </div>
  );
}
