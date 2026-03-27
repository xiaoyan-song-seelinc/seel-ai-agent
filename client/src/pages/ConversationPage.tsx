/* ── ConversationPage v2 ─────────────────────────────────────
   Slack-like IM interface: DM with Team Lead
   - Main flow: continuous message stream with tags
   - Thread panel: slides in from right on "Reply in thread"
   - Inline actions: Approve/Reject directly on message cards
   - Scribe messages: title only, no preview
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  MessageSquare,
  X,
  Check,
  XCircle,
  AlertTriangle,
  BookOpen,
  BarChart3,
  HelpCircle,
  RefreshCw,
  FileText,
  ChevronDown,
  Bot,
  List,
} from "lucide-react";
import { TOPICS, type Topic, type Message, type TopicType } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────

interface ConversationMessage {
  id: string;
  topicId: string;
  topicTitle: string;
  topicType: TopicType;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  actions?: { label: string; type: "accept" | "reject" | "link"; targetUrl?: string }[];
  threadMessages?: { id: string; sender: "ai" | "manager"; content: string; timestamp: string }[];
  isScribe?: boolean; // performance_report or rule_update — show title only
}

// ── Helpers ────────────────────────────────────────────────

const TYPE_CONFIG: Record<TopicType, { label: string; color: string; icon: typeof BookOpen }> = {
  knowledge_gap: { label: "Knowledge Gap", color: "bg-amber-50 text-amber-700 border-amber-200", icon: BookOpen },
  performance_report: { label: "Performance", color: "bg-blue-50 text-blue-700 border-blue-200", icon: BarChart3 },
  escalation_review: { label: "Escalation", color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  open_question: { label: "Question", color: "bg-purple-50 text-purple-700 border-purple-200", icon: HelpCircle },
  rule_update: { label: "Rule Update", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: RefreshCw },
};

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

// ── Build flat message list from topics ────────────────────

function buildConversationMessages(topics: Topic[]): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  for (const topic of topics) {
    const isScribe = topic.type === "performance_report" || topic.type === "rule_update";

    // First AI message becomes the "card" in the main flow
    const firstAiMsg = topic.messages.find((m) => m.sender === "ai");
    const firstManagerMsg = topic.messages.find((m) => m.sender === "manager");

    if (firstAiMsg) {
      // Thread = remaining messages after the first AI message
      const threadMsgs = topic.messages
        .filter((m) => m.id !== firstAiMsg.id)
        .map((m) => ({ id: m.id, sender: m.sender, content: m.content, timestamp: m.timestamp }));

      messages.push({
        id: firstAiMsg.id,
        topicId: topic.id,
        topicTitle: topic.title,
        topicType: topic.type,
        sender: "ai",
        content: firstAiMsg.content,
        timestamp: firstAiMsg.timestamp,
        actions: firstAiMsg.actions,
        threadMessages: threadMsgs.length > 0 ? threadMsgs : undefined,
        isScribe,
      });
    }

    // If topic was initiated by manager (rule_update), show manager message as card
    if (!firstAiMsg && firstManagerMsg) {
      const threadMsgs = topic.messages
        .filter((m) => m.id !== firstManagerMsg.id)
        .map((m) => ({ id: m.id, sender: m.sender, content: m.content, timestamp: m.timestamp }));

      messages.push({
        id: firstManagerMsg.id,
        topicId: topic.id,
        topicTitle: topic.title,
        topicType: topic.type,
        sender: "manager",
        content: firstManagerMsg.content,
        timestamp: firstManagerMsg.timestamp,
        threadMessages: threadMsgs.length > 0 ? threadMsgs : undefined,
        isScribe,
      });
    }
  }

  // Sort by timestamp descending (newest first at bottom)
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return messages;
}

// ── Components ─────────────────────────────────────────────

function MessageCard({
  msg,
  onOpenThread,
  onAction,
}: {
  msg: ConversationMessage;
  onOpenThread: (msg: ConversationMessage) => void;
  onAction: (msgId: string, action: string) => void;
}) {
  const config = TYPE_CONFIG[msg.topicType];
  const Icon = config.icon;
  const isAi = msg.sender === "ai";
  const threadCount = msg.threadMessages?.length || 0;
  const lastThreadMsg = msg.threadMessages?.[msg.threadMessages.length - 1];
  const [actioned, setActioned] = useState<string | null>(null);

  return (
    <div className={cn("group relative", !isAi && "flex flex-col items-end")}>
      {/* AI messages: left-aligned with avatar */}
      {isAi ? (
        <div className="flex gap-2.5 max-w-[85%]">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: name + tag + time */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-semibold text-foreground">Team Lead</span>
              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 font-normal border", config.color)}>
                <Icon className="w-2.5 h-2.5 mr-0.5" />
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
            </div>

            {/* Content card */}
            <div className="rounded-lg border border-border bg-white p-3 text-[12.5px] leading-relaxed text-foreground">
              {msg.isScribe ? (
                // Scribe: title only
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{msg.topicTitle}</span>
                </div>
              ) : (
                // Regular message: full content
                <div className="prose-sm prose-neutral max-w-none [&_strong]:font-semibold [&_p]:mb-2 [&_p:last-child]:mb-0 whitespace-pre-wrap">
                  {msg.content.split("\n").map((line, i) => {
                    if (line.startsWith("> ")) {
                      return (
                        <blockquote key={i} className="border-l-2 border-primary/30 pl-2.5 my-1.5 text-muted-foreground italic text-[11.5px]">
                          {line.slice(2)}
                        </blockquote>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <div key={i} className="flex gap-1.5 ml-1">
                          <span className="text-muted-foreground mt-0.5">·</span>
                          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        </div>
                      );
                    }
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return (
                      <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inline actions */}
            {msg.actions && !actioned && (
              <div className="flex gap-1.5 mt-1.5">
                {msg.actions.map((action) => (
                  <Button
                    key={action.label}
                    size="sm"
                    variant={action.type === "accept" ? "default" : "outline"}
                    className={cn(
                      "h-7 text-[11px] px-3 rounded-full",
                      action.type === "accept"
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      setActioned(action.label);
                      onAction(msg.id, action.label);
                    }}
                  >
                    {action.type === "accept" ? <Check className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {actioned && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600">
                <Check className="w-3 h-3" />
                <span>{actioned}</span>
              </div>
            )}

            {/* Thread indicator */}
            {threadCount > 0 && (
              <button
                onClick={() => onOpenThread(msg)}
                className="flex items-center gap-1.5 mt-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{threadCount} {threadCount === 1 ? "reply" : "replies"}</span>
                {lastThreadMsg && (
                  <span className="text-muted-foreground ml-1">
                    — {lastThreadMsg.sender === "ai" ? "Team Lead" : "You"} · {formatRelativeTime(lastThreadMsg.timestamp)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Manager messages: right-aligned */
        <div className="max-w-[70%]">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
            <span className="text-[12px] font-semibold text-foreground">You</span>
          </div>
          <div className="rounded-lg bg-primary/6 border border-primary/10 p-3 text-[12.5px] leading-relaxed text-foreground">
            <div className="whitespace-pre-wrap">
              {msg.content.split("\n").map((line, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadPanel({
  msg,
  onClose,
}: {
  msg: ConversationMessage;
  onClose: () => void;
}) {
  const [threadInput, setThreadInput] = useState("");
  const [localReplies, setLocalReplies] = useState<{ id: string; sender: "ai" | "manager"; content: string; timestamp: string }[]>([]);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const config = TYPE_CONFIG[msg.topicType];
  const Icon = config.icon;

  const allReplies = [...(msg.threadMessages || []), ...localReplies];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allReplies.length]);

  const handleSendReply = () => {
    if (!threadInput.trim()) return;
    const newReply = {
      id: `tr-${Date.now()}`,
      sender: "manager" as const,
      content: threadInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setLocalReplies((prev) => [...prev, newReply]);
    setThreadInput("");

    // Simulate AI reply after 1.5s
    setTimeout(() => {
      setLocalReplies((prev) => [
        ...prev,
        {
          id: `tr-ai-${Date.now()}`,
          sender: "ai" as const,
          content: "Got it, I'll update my rules accordingly. Thanks for the guidance!",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-[380px] border-l border-border bg-white flex flex-col h-full shrink-0">
      {/* Thread header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground">Thread</span>
          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 font-normal border", config.color)}>
            <Icon className="w-2.5 h-2.5 mr-0.5" />
            {config.label}
          </Badge>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Original message */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center">
            <Bot className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-3">
          {msg.content.replace(/\*\*/g, "").slice(0, 200)}...
        </p>
      </div>

      {/* Thread replies */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-3 space-y-3">
          {allReplies.map((reply) => (
            <div key={reply.id} className={cn("flex gap-2", reply.sender === "manager" && "flex-row-reverse")}>
              {reply.sender === "ai" ? (
                <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-2.5 h-2.5 text-primary" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-medium text-white">JC</span>
                </div>
              )}
              <div className={cn("max-w-[80%]", reply.sender === "manager" && "text-right")}>
                <div className={cn("flex items-center gap-1.5 mb-0.5", reply.sender === "manager" && "justify-end")}>
                  <span className="text-[10px] font-medium text-foreground">
                    {reply.sender === "ai" ? "Team Lead" : "You"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{formatTime(reply.timestamp)}</span>
                </div>
                <div
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11.5px] leading-relaxed",
                    reply.sender === "ai"
                      ? "bg-muted/50 text-foreground"
                      : "bg-primary/6 text-foreground"
                  )}
                >
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: reply.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  }} />
                </div>
              </div>
            </div>
          ))}
          <div ref={threadEndRef} />
        </div>
      </ScrollArea>

      {/* Thread input */}
      <div className="px-3 py-2.5 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40">
          <input
            value={threadInput}
            onChange={(e) => setThreadInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
            placeholder="Reply in thread..."
            className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSendReply}
            disabled={!threadInput.trim()}
            className="p-1 rounded text-primary hover:bg-primary/8 transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Thread List Panel ──────────────────────────────────────

function ThreadListPanel({
  messages,
  onSelectThread,
  onClose,
}: {
  messages: ConversationMessage[];
  onSelectThread: (msg: ConversationMessage) => void;
  onClose: () => void;
}) {
  const threadsWithReplies = messages.filter((m) => m.threadMessages && m.threadMessages.length > 0);
  const openThreads = messages.filter((m) => !m.threadMessages || m.threadMessages.length === 0);

  return (
    <div className="w-[300px] border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground">All Threads</span>
          <span className="text-[10px] text-muted-foreground">({messages.length})</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* Open / needs attention */}
          {openThreads.length > 0 && (
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Needs Attention</span>
            </div>
          )}
          {openThreads.map((msg) => {
            const config = TYPE_CONFIG[msg.topicType];
            const Icon = config.icon;
            return (
              <button
                key={msg.id}
                onClick={() => onSelectThread(msg)}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-accent/50 transition-colors text-left"
              >
                <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5", config.color)}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{msg.topicTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelativeTime(msg.timestamp)}</p>
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </button>
            );
          })}

          {/* Resolved threads */}
          {threadsWithReplies.length > 0 && (
            <div className="px-3 py-1.5 mt-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolved</span>
            </div>
          )}
          {threadsWithReplies.map((msg) => {
            const config = TYPE_CONFIG[msg.topicType];
            const Icon = config.icon;
            return (
              <button
                key={msg.id}
                onClick={() => onSelectThread(msg)}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-accent/50 transition-colors text-left opacity-60"
              >
                <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5", config.color)}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{msg.topicTitle}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {msg.threadMessages?.length} replies · {formatRelativeTime(msg.threadMessages?.[msg.threadMessages.length - 1]?.timestamp || msg.timestamp)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function ConversationPage() {
  const [activeThread, setActiveThread] = useState<ConversationMessage | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [extraMessages, setExtraMessages] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const baseMessages = useMemo(() => buildConversationMessages(TOPICS), []);
  const allMessages = [...baseMessages, ...extraMessages];

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ConversationMessage[] }[] = [];
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
    const newMsg: ConversationMessage = {
      id: `cm-${Date.now()}`,
      topicId: `new-${Date.now()}`,
      topicTitle: inputValue.trim().slice(0, 50),
      topicType: "rule_update",
      sender: "manager",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };
    setExtraMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Simulate Team Lead reply
    setTimeout(() => {
      setExtraMessages((prev) => [
        ...prev,
        {
          id: `cm-ai-${Date.now()}`,
          topicId: newMsg.topicId,
          topicTitle: newMsg.topicTitle,
          topicType: "rule_update",
          sender: "ai",
          content: "Got it! I've noted this down. I'll apply this rule going forward. Let me know if you'd like to adjust anything.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  const handleAction = (msgId: string, action: string) => {
    // In a real app, this would update the backend
    console.log(`Action: ${action} on message ${msgId}`);
  };

  const handleOpenThread = (msg: ConversationMessage) => {
    setActiveThread(msg);
    setShowThreadList(false);
  };

  // Count unresolved items
  const unresolvedCount = allMessages.filter(
    (m) => m.sender === "ai" && m.actions && m.actions.length > 0
  ).length;

  return (
    <div className="flex h-full">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-border shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-foreground">Team Lead</span>
              <span className="text-[10px] text-muted-foreground ml-2">Your AI team's daily updates</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 border-amber-200 bg-amber-50 text-amber-700">
                {unresolvedCount} needs attention
              </Badge>
            )}
            <button
              onClick={() => { setShowThreadList(!showThreadList); setActiveThread(null); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] transition-colors",
                showThreadList
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Threads
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-[780px] mx-auto px-5 py-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground px-2">{formatDateGroup(group.date)}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages in this date group */}
                <div className="space-y-4">
                  {group.messages.map((msg) => (
                    <MessageCard
                      key={msg.id}
                      msg={msg}
                      onOpenThread={handleOpenThread}
                      onAction={handleAction}
                    />
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
            <p className="text-[9px] text-muted-foreground/50 mt-1 text-center">
              Messages go directly to your AI Team Lead. Reply to specific items using threads.
            </p>
          </div>
        </div>
      </div>

      {/* Thread panel (slides in from right) */}
      {activeThread && (
        <ThreadPanel msg={activeThread} onClose={() => setActiveThread(null)} />
      )}

      {/* Thread list panel */}
      {showThreadList && !activeThread && (
        <ThreadListPanel
          messages={allMessages.filter((m) => m.sender === "ai")}
          onSelectThread={handleOpenThread}
          onClose={() => setShowThreadList(false)}
        />
      )}
    </div>
  );
}
