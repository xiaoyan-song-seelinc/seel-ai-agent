/* ── Messages Page ────────────────────────────────────────────
   Topic-card layout inspired by Feishu.
   Each topic = a card. Rule updates split into context + proposal.
   Before/After collapsible for long content.
   Onboarding integrated as first conversation.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Send, Check, X, XCircle, Reply, Bot, List, Plus,
  ArrowRight, ChevronDown, ChevronUp, FileText, BarChart3,
  Link2, Upload, AlertTriangle, CheckCircle2, Sparkles, Eye, Rocket,
  RotateCcw, Copy, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TOPICS, type Topic } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────

interface ThreadReply {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  isConfirmation?: boolean;
}

interface RuleChange {
  type: "new" | "update";
  ruleName: string;
  before?: string;
  after: string;
  source?: string;
}

interface TopicMessage {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  ruleChange?: RuleChange;
  widget?: string;
  widgetData?: Record<string, unknown>;
  choices?: { label: string; value: string; icon?: string; variant?: string }[];
}

interface TopicCard {
  id: string;
  title: string;
  status: "waiting" | "done";
  timestamp: string;
  messages: TopicMessage[];
  replies: ThreadReply[];
  hasActions: boolean;
  isScribe?: boolean;
  isOnboarding?: boolean;
  isPhaseLabel?: boolean;
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

// ── Build topic cards from TOPICS ────────────────────────

function buildTopicCards(topics: Topic[]): TopicCard[] {
  const cards: TopicCard[] = [];

  for (const topic of topics) {
    const isPerf = topic.type === "performance_report";
    const isResolved = topic.status === "resolved";

    // Build messages for this topic
    const topicMsgs: TopicMessage[] = [];
    const replies: ThreadReply[] = [];

    // First message is always the anchor
    const anchor = topic.messages[0];
    if (!anchor) continue;

    // For escalation_review (t-3) and knowledge_gap with proposed rules,
    // split into context message + rule proposal message
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

    // For rule_update from manager (t-6), the anchor is manager message
    if (topic.type === "rule_update" && anchor.sender === "manager") {
      // Manager's directive is first message
      topicMsgs.push({
        id: anchor.id,
        sender: anchor.sender,
        content: anchor.content,
        timestamp: anchor.timestamp,
      });
      // AI's confirmation with rule is second message
      if (topic.messages[1]) {
        topicMsgs.push({
          id: topic.messages[1].id,
          sender: topic.messages[1].sender,
          content: topic.messages[1].content,
          timestamp: topic.messages[1].timestamp,
          ruleChange: {
            type: "new",
            ruleName: topic.title,
            after: "Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.",
            source: "Manager directive",
          },
        });
      }
      // Rest are replies
      for (let i = 2; i < topic.messages.length; i++) {
        replies.push({
          id: topic.messages[i].id,
          sender: topic.messages[i].sender,
          content: topic.messages[i].content,
          timestamp: topic.messages[i].timestamp,
        });
      }
    } else if (ruleChange) {
      // Split: context message + rule proposal card
      // Context: strip out the rule-related lines from anchor
      const contextContent = anchor.content.split("\n").filter(line =>
        !line.startsWith("> ") && !line.includes("Proposed rule:") && !line.includes("Proposed update:")
      ).join("\n").trim();

      topicMsgs.push({
        id: anchor.id,
        sender: anchor.sender,
        content: contextContent,
        timestamp: anchor.timestamp,
      });

      // Rule proposal as separate message (the card)
      topicMsgs.push({
        id: `${anchor.id}-rule`,
        sender: "ai",
        content: "",
        timestamp: new Date(new Date(anchor.timestamp).getTime() + 1000).toISOString(),
        ruleChange,
      });

      // Rest are replies — but skip messages that are just the proposed rule text
      // (e.g. t-1's m-1-2 which duplicates the proposedRule content)
      for (let i = 1; i < topic.messages.length; i++) {
        const msg = topic.messages[i];
        const isRuleDuplicate = (msg.sender === "ai" && topic.proposedRule &&
          msg.content.includes("Proposed rule:")) || (msg.sender === "ai" && msg.content.includes("Should I adopt this rule?"));
        if (isRuleDuplicate) continue;
        replies.push({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
        });
      }
    } else {
      // Normal: first message as anchor, rest as replies
      topicMsgs.push({
        id: anchor.id,
        sender: anchor.sender,
        content: anchor.content,
        timestamp: anchor.timestamp,
      });

      for (let i = 1; i < topic.messages.length; i++) {
        replies.push({
          id: topic.messages[i].id,
          sender: topic.messages[i].sender,
          content: topic.messages[i].content,
          timestamp: topic.messages[i].timestamp,
        });
      }
    }

    const hasActions = anchor.sender === "ai" && !isPerf && !isResolved && topic.status !== "read";

    cards.push({
      id: topic.id,
      title: topic.title,
      status: isResolved ? "done" : "waiting",
      timestamp: anchor.timestamp,
      messages: topicMsgs,
      replies,
      hasActions,
      isScribe: isPerf,
    });
  }

  cards.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return cards;
}

// ── Collapsible Text ─────────────────────────────────────

function CollapsibleText({ text, maxLines = 3 }: { text: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const isLong = lines.length > maxLines;

  if (!isLong || expanded) {
    return (
      <div className="text-[12px] leading-relaxed whitespace-pre-wrap">
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
    <div className="text-[12px] leading-relaxed whitespace-pre-wrap">
      {renderMarkdown(lines.slice(0, maxLines).join("\n"))}
      <button onClick={() => setExpanded(true)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
        <ChevronDown className="w-3 h-3" /> Show more ({lines.length - maxLines} more lines)
      </button>
    </div>
  );
}

// ── Rule Change Card (redesigned) ────────────────────────

function RuleChangeCard({ change }: { change: RuleChange }) {
  const [beforeExpanded, setBeforeExpanded] = useState(false);
  const [afterExpanded, setAfterExpanded] = useState(false);
  const MAX_CHARS = 120;

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
    <div className="rounded-lg border border-border/80 overflow-hidden bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        {change.type === "new" ? (
          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
            <Plus className="w-3 h-3 text-emerald-600" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-blue-600" />
          </div>
        )}
        <span className="text-[11px] font-semibold text-foreground">
          {change.type === "new" ? "New Rule" : "Rule Update"}
        </span>
        <span className="text-[11px] text-muted-foreground">·</span>
        <span className="text-[11px] text-muted-foreground truncate">{change.ruleName}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2.5">
        {change.type === "update" && change.before && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Current</span>
            </div>
            <div className="pl-3.5">
              {renderRuleText(change.before, beforeExpanded, () => setBeforeExpanded(!beforeExpanded), true)}
            </div>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", change.type === "update" ? "bg-emerald-400" : "bg-emerald-400")} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {change.type === "update" ? "Proposed" : "Proposed Rule"}
            </span>
          </div>
          <div className="pl-3.5">
            {renderRuleText(change.after, afterExpanded, () => setAfterExpanded(!afterExpanded))}
          </div>
        </div>
        {change.source && (
          <p className="text-[10px] text-muted-foreground/60 pt-1.5 border-t border-border/40 pl-3.5">
            {change.source}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Inline Reply ─────────────────────────────────────────

function InlineReplyBubble({ reply }: { reply: ThreadReply }) {
  const isAi = reply.sender === "ai";
  return (
    <div className="flex items-start gap-2 py-1">
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
          <span className="text-[11px] font-medium text-foreground">{isAi ? "Rep" : "You"}</span>
          <span className="text-[9px] text-muted-foreground">{formatTime(reply.timestamp)}</span>
        </div>
        <div className="text-[12px] text-foreground/80 leading-relaxed mt-0.5">
          {renderMarkdown(reply.content)}
        </div>
      </div>
    </div>
  );
}

function InlineReplies({
  replies,
  onOpenThread,
}: {
  replies: ThreadReply[];
  onOpenThread: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = replies.length;

  if (count === 0) return null;

  const showAll = count <= 2 || expanded;
  const hiddenCount = count - 2;

  return (
    <div className="mt-2 pt-2 border-t border-border/40">
      <div className="space-y-0.5">
        {showAll ? (
          replies.map((r) => <InlineReplyBubble key={r.id} reply={r} />)
        ) : (
          <>
            <InlineReplyBubble reply={replies[0]} />
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 py-1 pl-7 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </button>
            <InlineReplyBubble reply={replies[replies.length - 1]} />
          </>
        )}
      </div>
      {expanded && count > 2 && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-0.5 pl-7 transition-colors"
        >
          <ChevronUp className="w-3 h-3" /> Collapse
        </button>
      )}
      <button
        onClick={onOpenThread}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary py-1 pl-7 transition-colors"
      >
        <Reply className="w-3 h-3" /> Reply
      </button>
    </div>
  );
}

// ── Confirmation Card ────────────────────────────────────

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
      <p className="text-[11px] text-foreground leading-relaxed mb-2.5">{content}</p>
      {decided === null ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 text-[11px] px-4 rounded-full bg-primary text-white hover:bg-primary/90"
            onClick={() => { setDecided("yes"); onConfirm(); }}
          >
            <Check className="w-3 h-3 mr-1" /> Yes, confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-4 rounded-full text-muted-foreground"
            onClick={() => { setDecided("no"); onReject(); }}
          >
            <X className="w-3 h-3 mr-1" /> No, discard
          </Button>
        </div>
      ) : (
        <div className={cn("flex items-center gap-1.5 text-[11px]", decided === "yes" ? "text-emerald-600" : "text-muted-foreground")}>
          {decided === "yes" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {decided === "yes" ? "Confirmed" : "Discarded"}
        </div>
      )}
    </div>
  );
}

// ── Topic Card Component ─────────────────────────────────

function TopicCardView({
  card,
  onAction,
  onOpenThread,
}: {
  card: TopicCard;
  onAction: (cardId: string, action: string) => void;
  onOpenThread: (card: TopicCard) => void;
}) {
  const [actioned, setActioned] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden hover:shadow-sm transition-shadow">
      {/* Topic header */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border/50 bg-muted/20">
        <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
          {card.isScribe ? (
            <BarChart3 className="w-2.5 h-2.5 text-primary" />
          ) : (
            <MessageCircle className="w-2.5 h-2.5 text-primary" />
          )}
        </div>
        <span className="text-[12px] font-semibold text-foreground flex-1 truncate">{card.title}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">{formatRelativeTime(card.timestamp)}</span>
        {card.status === "waiting" && card.hasActions && (
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        )}
      </div>

      {/* Messages within topic */}
      <div className="px-3.5 py-2.5 space-y-3">
        {card.messages.map((msg) => (
          <div key={msg.id}>
            {/* Sender label */}
            <div className="flex items-center gap-1.5 mb-1">
              {msg.sender === "ai" ? (
                <div className="w-4 h-4 rounded-full bg-primary/8 flex items-center justify-center">
                  <Bot className="w-2 h-2 text-primary" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[7px] font-medium text-white">JC</span>
                </div>
              )}
              <span className="text-[11px] font-medium text-foreground">{msg.sender === "ai" ? "Rep" : "You"}</span>
              <span className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
            </div>

            {/* Content */}
            {msg.content && (
              <div className="pl-5.5 ml-[22px]">
                <CollapsibleText text={msg.content} maxLines={6} />
              </div>
            )}

            {/* Rule change card */}
            {msg.ruleChange && (
              <div className="ml-[22px] mt-2">
                <RuleChangeCard change={msg.ruleChange} />
              </div>
            )}

            {/* Onboarding widgets */}
            {msg.widget && (
              <div className="ml-[22px] mt-2">
                <OnboardingWidget
                  widget={msg.widget}
                  widgetData={msg.widgetData}
                  importProgress={0}
                  onAction={() => {}}
                />
              </div>
            )}

            {/* Choices */}
            {msg.choices && msg.choices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-[22px]">
                {msg.choices.map((c) => (
                  <button
                    key={c.value}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                      c.variant === "primary"
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-border text-foreground hover:bg-accent"
                    )}
                  >
                    {c.label}
                    {c.icon === "arrow" && <ArrowRight className="w-3 h-3" />}
                    {c.icon === "eye" && <Eye className="w-3 h-3" />}
                    {c.icon === "rocket" && <Rocket className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {card.hasActions && !actioned && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-t border-border/40">
          <Button
            size="sm"
            className="h-7 text-[11px] px-3 rounded-full bg-primary text-white hover:bg-primary/90"
            onClick={() => { setActioned("Accepted"); onAction(card.id, "accept"); }}
          >
            <Check className="w-3 h-3 mr-1" /> Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-3 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => { setActioned("Rejected"); onAction(card.id, "reject"); }}
          >
            <XCircle className="w-3 h-3 mr-1" /> Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-3 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => onOpenThread(card)}
          >
            <Reply className="w-3 h-3 mr-1" /> Reply
          </Button>
        </div>
      )}

      {actioned && (
        <div className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 border-t border-border/40 text-[11px]",
          actioned === "Accepted" ? "text-emerald-600" : "text-red-500"
        )}>
          {actioned === "Accepted" ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {actioned}
        </div>
      )}

      {/* Inline replies */}
      {card.replies.length > 0 && (
        <div className="px-3.5 pb-2.5">
          <InlineReplies replies={card.replies} onOpenThread={() => onOpenThread(card)} />
        </div>
      )}
    </div>
  );
}

// ── Onboarding Widget Renderer ───────────────────────────

function OnboardingWidget({
  widget,
  widgetData,
  importProgress,
  onAction,
}: {
  widget: string;
  widgetData?: Record<string, unknown>;
  importProgress: number;
  onAction: (value: string) => void;
}) {
  switch (widget) {
    case "connect_zendesk":
      return (
        <div className="p-3 rounded-lg border border-border bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#03363D]/10 flex items-center justify-center">
              <span className="text-[12px] font-bold text-[#03363D]">Z</span>
            </div>
            <div>
              <p className="text-[12px] font-medium">Zendesk</p>
              <p className="text-[10px] text-muted-foreground">Connect via OAuth</p>
            </div>
          </div>
          <button onClick={() => onAction("zendesk_connected")} className="w-full py-2 rounded-lg bg-[#03363D] text-white text-[12px] font-medium hover:bg-[#03363D]/90 transition-colors flex items-center justify-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> Connect Zendesk Account
          </button>
        </div>
      );
    case "connect_shopify":
      return (
        <div className="p-3 rounded-lg border border-border bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#96BF48]/10 flex items-center justify-center">
              <span className="text-[12px] font-bold text-[#96BF48]">S</span>
            </div>
            <div>
              <p className="text-[12px] font-medium">Shopify</p>
              <p className="text-[10px] text-muted-foreground">Connect via OAuth</p>
            </div>
          </div>
          <button onClick={() => onAction("shopify_connected")} className="w-full py-2 rounded-lg bg-[#96BF48] text-white text-[12px] font-medium hover:bg-[#96BF48]/90 transition-colors flex items-center justify-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> Connect Shopify Store
          </button>
        </div>
      );
    case "upload_doc":
      return (
        <div className="p-3 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 transition-colors">
          <div className="text-center py-3">
            <Upload className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-[12px] font-medium text-foreground">Drop your document here</p>
            <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
          </div>
          <button onClick={() => onAction("uploaded")} className="w-full mt-2 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Upload Seel_Return_Policy_v2.pdf
          </button>
        </div>
      );
    case "import_progress":
      return (
        <div className="p-3 rounded-lg border border-border bg-white">
          <div className="flex items-center gap-3 mb-2">
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
      const rules = (widgetData?.rules as { category: string; count: number; example: string }[]) || [];
      const totalRules = rules.reduce((sum, r) => sum + r.count, 0);
      return (
        <div className="p-3 rounded-lg border border-border bg-white">
          <div className="flex items-center gap-2 mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[12px] font-medium">{totalRules} rules extracted</span>
          </div>
          <div className="space-y-1">
            {rules.map((r) => (
              <div key={r.category} className="flex items-start gap-2 py-1.5 px-2.5 rounded-md bg-muted/40">
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
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-2 mb-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-amber-900">Conflict: Return Window</p>
              <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
                Your return policy says "30-day return window" but the FAQ page says "28 calendar days from delivery." Which one should I follow?
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={() => onAction("30_days")} className="px-3.5 py-1.5 rounded-full text-[11px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors">
              30 days from delivery
            </button>
            <button onClick={() => onAction("28_days")} className="px-3.5 py-1.5 rounded-full text-[11px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors">
              28 calendar days
            </button>
          </div>
        </div>
      );
    case "actions_form":
      return <ActionsFormWidget onDone={() => onAction("actions_done")} />;
    case "escalation_form":
      return <EscalationFormWidget onDone={() => onAction("escalation_done")} />;
    case "scenario": {
      const scenario = widgetData as { title: string; description: string; response: string };
      return (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="px-3 py-2 bg-violet-50/50 border-b border-border">
            <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">{scenario.title}</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">{scenario.description}</p>
            <div className="p-2.5 rounded-md bg-muted/30 border border-border/40">
              <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: (scenario.response || "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
              />
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

// ── Actions Form Widget ──────────────────────────────────

const DEFAULT_ACTIONS = [
  { id: "return_label", label: "Create return labels", default: true },
  { id: "reply", label: "Send customer replies", default: true },
  { id: "internal_note", label: "Write internal notes", default: true },
  { id: "lookup_order", label: "Look up orders", default: true },
  { id: "cancel", label: "Cancel orders", default: false },
  { id: "seel_ticket", label: "Create Seel ticket", default: true },
];

function ActionsFormWidget({ onDone }: { onDone: () => void }) {
  const [perms, setPerms] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_ACTIONS.map((a) => [a.id, a.default]))
  );
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-[11px] font-medium text-foreground mb-2.5">Action Permissions</p>
      <div className="space-y-2">
        {DEFAULT_ACTIONS.map((a) => (
          <div key={a.id} className="flex items-center justify-between">
            <span className="text-[11px] text-foreground">{a.label}</span>
            <Switch checked={perms[a.id]} onCheckedChange={(v) => setPerms((p) => ({ ...p, [a.id]: v }))} />
          </div>
        ))}
      </div>
      <Button size="sm" className="mt-3 h-7 text-[11px] rounded-full px-4" onClick={onDone}>
        <Check className="w-3 h-3 mr-1" /> Confirm Permissions
      </Button>
    </div>
  );
}

// ── Escalation Form Widget ───────────────────────────────

const DEFAULT_ESCALATION = [
  { id: "angry", label: "Customer is angry or upset", default: true },
  { id: "legal", label: "Legal or compliance keywords", default: true },
  { id: "manager_request", label: "Customer asks for a manager", default: true },
  { id: "unresolved_3", label: "Unresolved after 3 exchanges", default: true },
  { id: "high_value", label: "Order value exceeds $500", default: false },
];

function EscalationFormWidget({ onDone }: { onDone: () => void }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_ESCALATION.map((e) => [e.id, e.default]))
  );
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-[11px] font-medium text-foreground mb-2.5">Escalation Triggers</p>
      <div className="space-y-2">
        {DEFAULT_ESCALATION.map((e) => (
          <div key={e.id} className="flex items-center justify-between">
            <span className="text-[11px] text-foreground">{e.label}</span>
            <Switch checked={toggles[e.id]} onCheckedChange={(v) => setToggles((p) => ({ ...p, [e.id]: v }))} />
          </div>
        ))}
      </div>
      <Button size="sm" className="mt-3 h-7 text-[11px] rounded-full px-4" onClick={onDone}>
        <Check className="w-3 h-3 mr-1" /> Confirm Triggers
      </Button>
    </div>
  );
}

// ── Topics Panel ─────────────────────────────────────────

function TopicsPanel({
  cards,
  onSelectTopic,
  onClose,
}: {
  cards: TopicCard[];
  onSelectTopic: (card: TopicCard) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"waiting" | "done">("waiting");
  const waiting = cards.filter((c) => c.status === "waiting" && !c.isOnboarding && !c.isPhaseLabel);
  const done = cards.filter((c) => c.status === "done" && !c.isOnboarding && !c.isPhaseLabel);
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
              {list.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onSelectTopic(card)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left border-b border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{card.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(card.replies.length > 0 ? card.replies[card.replies.length - 1].timestamp : card.timestamp)}
                      {card.replies.length > 0 && ` · ${card.replies.length} replies`}
                    </p>
                  </div>
                  {card.status === "waiting" && card.hasActions && (
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

function ThreadSidePanel({
  card,
  onClose,
}: {
  card: TopicCard;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [localReplies, setLocalReplies] = useState<ThreadReply[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const allReplies = [...card.replies, ...localReplies];

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
    <div className="w-[340px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground truncate max-w-[220px]">{card.title}</span>
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
          <span className="text-[9px] text-muted-foreground">{formatTime(card.timestamp)}</span>
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-2 ml-6">
          {card.messages[0]?.content.replace(/\*\*/g, "").slice(0, 150)}...
        </p>
      </div>

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
                    <span className="text-[10px] font-medium text-foreground">{reply.sender === "ai" ? "Rep" : "You"}</span>
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
              {reply.isConfirmation && reply.sender === "ai" && (
                <div className="ml-7 mt-1.5">
                  <ConfirmationCard content="Apply this rule update?" onConfirm={() => {}} onReject={() => {}} />
                </div>
              )}
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
// ── ONBOARDING STATE MACHINE ─────────────────────────────
// ══════════════════════════════════════════════════════════

type OBPhase =
  | "idle" | "welcome"
  | "connect_zendesk" | "connect_shopify"
  | "upload_doc" | "importing" | "parse_result" | "conflict"
  | "actions_form" | "escalation_form"
  | "rep_name" | "rep_tone"
  | "scenario_1" | "scenario_2" | "scenario_3"
  | "mode_select" | "complete";

interface OBMessage {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  widget?: string;
  widgetData?: Record<string, unknown>;
  choices?: { label: string; value: string; icon?: string; variant?: string }[];
  isPhaseLabel?: boolean;
}

const OB_BASE_TIME = "2026-03-20T09:00:00Z";
let obMsgId = 0;
function obMsg(sender: "ai" | "manager", content: string, extras?: Partial<OBMessage>, offsetMin = 0): OBMessage {
  obMsgId++;
  const ts = new Date(new Date(OB_BASE_TIME).getTime() + offsetMin * 60000).toISOString();
  return { id: `ob-${obMsgId}`, sender, content, timestamp: ts, ...extras };
}

function obPhaseLabel(label: string, offsetMin: number): OBMessage {
  return obMsg("ai", label, { isPhaseLabel: true }, offsetMin);
}

function buildInitialOBMessages(): OBMessage[] {
  obMsgId = 0;
  return [
    obPhaseLabel("Connect to your system", 0),
    obMsg("ai", "Hey! I'm your **Team Lead**. Let's get your AI support team set up — it takes about 3 minutes.\n\nFirst, let's connect your helpdesk and store.", {
      choices: [
        { label: "Connect Zendesk", value: "start_zendesk", icon: "arrow", variant: "primary" },
        { label: "Skip for now", value: "skip_zendesk", variant: "outline" },
      ],
    }, 1),
  ];
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function MessagesPage() {
  const [threadPanel, setThreadPanel] = useState<TopicCard | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [extraCards, setExtraCards] = useState<TopicCard[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Onboarding state ──
  const [obPhase, setObPhase] = useState<OBPhase>("welcome");
  const [obMessages, setObMessages] = useState<OBMessage[]>(() => buildInitialOBMessages());
  const [importProgress, setImportProgress] = useState(0);
  const [repName, setRepName] = useState("Alex");
  const obOffsetRef = useRef(2);

  const addObMsg = useCallback((sender: "ai" | "manager", content: string, extras?: Partial<OBMessage>) => {
    obOffsetRef.current += 1;
    const msg = obMsg(sender, content, extras, obOffsetRef.current);
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addPhaseLabel = useCallback((label: string) => {
    obOffsetRef.current += 1;
    setObMessages((prev) => [...prev, obPhaseLabel(label, obOffsetRef.current)]);
  }, []);

  // Onboarding choice handler
  const handleOnboardingAction = useCallback((value: string) => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const advance = async () => {
      switch (obPhase) {
        case "welcome":
          if (value === "skip_zendesk") {
            setObPhase("connect_shopify");
            addObMsg("manager", "I'll set this up later");
            await delay(500);
            addObMsg("ai", "No problem — you can connect Zendesk later in **Playbook → Integrations**.\n\nHow about Shopify?", {
              choices: [
                { label: "Connect Shopify", value: "start_shopify", icon: "arrow", variant: "primary" },
                { label: "Skip for now", value: "skip_shopify", variant: "outline" },
              ],
            });
          } else {
            setObPhase("connect_zendesk");
            addObMsg("ai", "", { widget: "connect_zendesk" });
          }
          break;

        case "connect_zendesk":
          setObPhase("connect_shopify");
          addObMsg("ai", "Connected to **Zendesk** — coastalliving.zendesk.com. I can see 1,247 tickets.\n\nNow let's connect Shopify.", {
            choices: [
              { label: "Connect Shopify", value: "start_shopify", icon: "arrow", variant: "primary" },
              { label: "Skip for now", value: "skip_shopify", variant: "outline" },
            ],
          });
          break;

        case "connect_shopify":
          if (value === "skip_shopify") {
            addObMsg("manager", "I'll set this up later");
            await delay(400);
          } else if (value === "shopify_connected") {
            addObMsg("ai", "Connected to **Shopify** — coastalliving.myshopify.com.");
            await delay(400);
          }
          addPhaseLabel("Set up a playbook");
          setObPhase("upload_doc");
          await delay(300);
          addObMsg("ai", "Now I need to learn your business rules. Upload a document — your SOP, return policy, or playbook — and I'll extract the rules.", { widget: "upload_doc" });
          break;

        case "upload_doc":
          setObPhase("importing");
          setImportProgress(0);
          addObMsg("manager", "📄 Seel_Return_Policy_v2.pdf");
          await delay(300);
          addObMsg("ai", "Got it! Reading through your return policy now...", { widget: "import_progress" });
          {
            const interval = setInterval(() => {
              setImportProgress((prev) => {
                if (prev >= 100) {
                  clearInterval(interval);
                  setTimeout(() => {
                    setObPhase("conflict");
                    addObMsg("ai", "I've extracted the rules. Here's what I found:", {
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
                    });
                    setTimeout(() => {
                      addObMsg("ai", "One conflict I need you to resolve:", { widget: "conflict" });
                    }, 600);
                  }, 400);
                  return 100;
                }
                return prev + Math.random() * 15;
              });
            }, 180);
          }
          break;

        case "conflict": {
          const choiceLabel = value === "30_days" ? "30 days from delivery" : "28 calendar days";
          addObMsg("manager", choiceLabel);
          await delay(400);
          addObMsg("ai", `Got it — I'll use "${choiceLabel}" as the rule.\n\nNow let's configure what your agent can do autonomously:`, { widget: "actions_form" });
          setObPhase("actions_form");
          break;
        }

        case "actions_form":
          addObMsg("manager", "Confirmed permissions");
          await delay(400);
          addObMsg("ai", "Great. Now — when should the agent escalate to you?", { widget: "escalation_form" });
          setObPhase("escalation_form");
          break;

        case "escalation_form":
          addObMsg("manager", "Confirmed escalation triggers");
          await delay(400);
          addPhaseLabel("Hire a rep");
          await delay(300);
          addObMsg("ai", "Setup complete! Now let's **hire your first rep**. What should your rep be called? This is the name customers will see.");
          setObPhase("rep_name");
          break;

        case "rep_tone":
          addObMsg("manager", value === "friendly" ? "Friendly and warm" : value === "professional" ? "Professional" : "Casual");
          await delay(500);
          addObMsg("ai", `Got it — ${repName} will keep it **${value}**.\n\nLet me run a quick sanity check:`, {
            widget: "scenario",
            widgetData: {
              title: `Scenario 1 — "Where is my order?"`,
              description: `Customer writes: "Where is my order #DBH-29174? It's been a week."`,
              response: `I'd look up **#DBH-29174** in Shopify, find it shipped via Royal Mail (tracking: RM29174UK, ETA Mar 25), and reply:\n\n"Hi Emma! Your order shipped via Royal Mail and is expected by March 25th. Here's your tracking link. Let me know if you need anything else!"`,
            },
            choices: [
              { label: "Looks good", value: "approve", variant: "primary" },
              { label: "Needs adjustment", value: "adjust", variant: "outline" },
            ],
          });
          setObPhase("scenario_1");
          break;

        case "scenario_1":
          addObMsg("manager", value === "approve" ? "Looks good" : "Needs adjustment");
          await delay(500);
          addObMsg("ai", `${value === "approve" ? "Great!" : "Noted, I'll adjust."} Next scenario:`, {
            widget: "scenario",
            widgetData: {
              title: `Scenario 2 — "I want a refund"`,
              description: `Customer writes: "I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."`,
              response: `I'd check the order — delivered 1 day ago, within return window. Item is $42.99, change-of-mind return.\n\nI'd reply: "Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label shortly. Your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days."`,
            },
            choices: [
              { label: "Looks good", value: "approve", variant: "primary" },
              { label: "Needs adjustment", value: "adjust", variant: "outline" },
            ],
          });
          setObPhase("scenario_2");
          break;

        case "scenario_2":
          addObMsg("manager", value === "approve" ? "Looks good" : "Needs adjustment");
          await delay(500);
          addObMsg("ai", `${value === "approve" ? "Nice." : "Got it."} One more:`, {
            widget: "scenario",
            widgetData: {
              title: `Scenario 3 — Escalation`,
              description: `Customer writes: "This is the THIRD time I'm contacting you. I want to speak to a manager RIGHT NOW."`,
              response: `I'd detect strong frustration + explicit manager request, and **escalate immediately**.\n\nI'd reply: "I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly."\n\nThen assign the ticket to you with a context summary.`,
            },
            choices: [
              { label: "Looks good", value: "approve", variant: "primary" },
              { label: "Needs adjustment", value: "adjust", variant: "outline" },
            ],
          });
          setObPhase("scenario_3");
          break;

        case "scenario_3":
          addObMsg("manager", value === "approve" ? "Looks good" : "Needs adjustment");
          await delay(500);
          addObMsg("ai", `**${repName} passed the sanity check.** One last question — how should ${repName} work?`, {
            choices: [
              { label: "Shadow Mode — check with me first", value: "shadow", icon: "eye", variant: "primary" },
              { label: "Production — handle it yourself", value: "production", icon: "rocket", variant: "outline" },
            ],
          });
          setObPhase("mode_select");
          break;

        case "mode_select": {
          const modeName = value === "shadow" ? "Shadow" : "Production";
          addObMsg("manager", `${modeName} Mode`);
          await delay(500);
          addObMsg("ai", `**${repName} is now in ${modeName} Mode.** ${value === "shadow" ? "They'll draft everything and wait for your approval." : "They'll handle tickets independently."}\n\nHere's how things work from here:\n- **Messages** — I'll message you here whenever ${repName} needs input\n- **Zendesk** — Check the sidebar to review ${repName}'s work\n- **Playbook** — Adjust knowledge, escalation rules, and integrations\n- **Agent** — Configure ${repName}'s identity, permissions, and mode`);
          setObPhase("complete");
          break;
        }
      }
    };

    advance();
  }, [obPhase, addObMsg, addPhaseLabel, repName]);

  // Handle rep name submit
  const handleNameSubmit = useCallback((name: string) => {
    setRepName(name);
    addObMsg("manager", name);
    setObPhase("rep_tone");
    setTimeout(() => {
      addObMsg("ai", `**${name}** — great name. What tone should ${name} use with customers?`, {
        choices: [
          { label: "Friendly and warm", value: "friendly", variant: "primary" },
          { label: "Professional", value: "professional", variant: "outline" },
          { label: "Casual", value: "casual", variant: "outline" },
        ],
      });
    }, 500);
  }, [addObMsg]);

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    obMsgId = 0;
    obOffsetRef.current = 2;
    setObPhase("welcome");
    setObMessages(buildInitialOBMessages());
    setImportProgress(0);
    setRepName("Alex");
    toast.success("Onboarding restarted");
  }, []);

  // ── Regular topic cards ──
  const baseCards = useMemo(() => buildTopicCards(TOPICS), []);
  const allRegularCards = [...baseCards, ...extraCards];

  // Combine: onboarding messages rendered as a special section, then topic cards
  const waitingCount = allRegularCards.filter((c) => c.status === "waiting" && c.hasActions).length;

  // Group regular cards by date
  const groupedCards = useMemo(() => {
    const groups: { date: string; cards: TopicCard[] }[] = [];
    let currentDate = "";
    for (const card of allRegularCards) {
      const dateKey = new Date(card.timestamp).toISOString().split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: card.timestamp, cards: [card] });
      } else {
        groups[groups.length - 1].cards.push(card);
      }
    }
    return groups;
  }, [allRegularCards]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [obMessages.length, allRegularCards.length]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    if (obPhase === "rep_name") {
      const name = inputValue.trim() || "Alex";
      handleNameSubmit(name);
      setInputValue("");
      return;
    }

    // Create a new topic card from the user's message
    const newCard: TopicCard = {
      id: `new-${Date.now()}`,
      title: inputValue.trim().slice(0, 60),
      status: "waiting",
      timestamp: new Date().toISOString(),
      messages: [{
        id: `cm-${Date.now()}`,
        sender: "manager",
        content: inputValue.trim(),
        timestamp: new Date().toISOString(),
      }],
      replies: [],
      hasActions: false,
    };
    setExtraCards((prev) => [...prev, newCard]);
    setInputValue("");

    // AI responds after a delay
    setTimeout(() => {
      setExtraCards((prev) => prev.map((c) =>
        c.id === newCard.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `cm-ai-${Date.now()}`,
                  sender: "ai" as const,
                  content: "I understand. Let me update the rules to reflect this change.",
                  timestamp: new Date().toISOString(),
                  ruleChange: {
                    type: "new" as const,
                    ruleName: newCard.title,
                    after: inputValue.trim(),
                    source: "Manager directive",
                  },
                },
              ],
            }
          : c
      ));
    }, 1500);
  };

  const handleAction = (cardId: string, action: string) => {
    console.log(`Action: ${action} on card ${cardId}`);
  };

  const handleOpenThread = (card: TopicCard) => {
    setThreadPanel(card);
    setShowTopics(false);
  };

  const handleSelectTopic = (card: TopicCard) => {
    const el = document.getElementById(`card-${card.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/30");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/30"), 2000);
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={resetOnboarding}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Restart onboarding (for testing)"
            >
              <RotateCcw className="w-3 h-3" /> Restart Setup
            </button>
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
          <div className="max-w-[720px] mx-auto px-5 py-4 space-y-3">

            {/* ── Onboarding Section ── */}
            {obMessages.length > 0 && (
              <div className="space-y-2.5">
                {obMessages.map((msg) => {
                  if (msg.isPhaseLabel) {
                    return (
                      <div key={msg.id} className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-primary/15" />
                        <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> {msg.content}
                        </span>
                        <div className="flex-1 h-px bg-primary/15" />
                      </div>
                    );
                  }

                  const isAi = msg.sender === "ai";

                  if (!isAi) {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[70%]">
                          <div className="rounded-lg bg-primary/6 border border-primary/10 px-3 py-2 text-[12px] leading-relaxed text-foreground">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex gap-2.5 max-w-[85%]">
                      <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.content && (
                          <div className="text-[12px] leading-relaxed text-foreground">
                            {renderMarkdown(msg.content)}
                          </div>
                        )}
                        {msg.widget && (
                          <div className="mt-2">
                            <OnboardingWidget
                              widget={msg.widget}
                              widgetData={msg.widgetData}
                              importProgress={importProgress}
                              onAction={handleOnboardingAction}
                            />
                          </div>
                        )}
                        {msg.choices && msg.choices.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.choices.map((c) => (
                              <button
                                key={c.value}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                                  c.variant === "primary"
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "border border-border text-foreground hover:bg-accent"
                                )}
                                onClick={() => handleOnboardingAction(c.value)}
                              >
                                {c.label}
                                {c.icon === "arrow" && <ArrowRight className="w-3 h-3" />}
                                {c.icon === "eye" && <Eye className="w-3 h-3" />}
                                {c.icon === "rocket" && <Rocket className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Divider between onboarding and topics ── */}
            {obMessages.length > 0 && groupedCards.length > 0 && (
              <div className="flex items-center gap-3 my-4 pt-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground px-2">Topics</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* ── Topic Cards ── */}
            {groupedCards.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground px-2">{formatDateGroup(group.date)}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {group.cards.map((card) => (
                    <div key={card.id} id={`card-${card.id}`} className="transition-all duration-300">
                      <TopicCardView
                        card={card}
                        onAction={handleAction}
                        onOpenThread={handleOpenThread}
                      />
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
          <div className="max-w-[720px] mx-auto">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={obPhase === "rep_name" ? `Type a name for your rep (e.g. Alex)...` : "Message Team Lead..."}
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
        <ThreadSidePanel card={threadPanel} onClose={() => setThreadPanel(null)} />
      )}

      {/* Topics panel */}
      {showTopics && !threadPanel && (
        <TopicsPanel
          cards={allRegularCards}
          onSelectTopic={handleSelectTopic}
          onClose={() => setShowTopics(false)}
        />
      )}
    </div>
  );
}
