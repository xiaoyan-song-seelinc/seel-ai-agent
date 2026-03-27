/* ── Instruct Page ────────────────────────────────────────────
   Left: Topic list with status filters
   Right: Conversation thread with action buttons
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TOPICS, type Topic, type TopicStatus, type TopicType, type MessageSender } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MessageSquare,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  FileEdit,
  Search,
  Circle,
  CheckCircle2,
  Eye,
  Send,
  Lightbulb,
  Bot,
  User,
  ChevronRight,
  Sparkles,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_CONFIG: Record<TopicType, { label: string; icon: typeof MessageSquare; color: string }> = {
  knowledge_gap: { label: "Knowledge Gap", icon: Lightbulb, color: "text-amber-500" },
  performance_report: { label: "Performance", icon: BarChart3, color: "text-teal-500" },
  open_question: { label: "Question", icon: HelpCircle, color: "text-blue-500" },
  escalation_review: { label: "Escalation Review", icon: AlertTriangle, color: "text-orange-500" },
  rule_update: { label: "Rule Update", icon: FileEdit, color: "text-violet-500" },
};

const STATUS_CONFIG: Record<TopicStatus, { label: string; icon: typeof Circle; color: string }> = {
  unread: { label: "Unread", icon: Circle, color: "text-amber-400" },
  read: { label: "Read", icon: Eye, color: "text-muted-foreground" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-emerald-500" },
};

type FilterStatus = "all" | TopicStatus;
type FilterType = "all" | TopicType;

const PRIORITY_ORDER: Record<TopicType, number> = {
  knowledge_gap: 0,
  escalation_review: 1,
  open_question: 2,
  rule_update: 3,
  performance_report: 4,
};

export default function Instruct() {
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredTopics = topics
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Unread first, then by priority
      if (a.status === "unread" && b.status !== "unread") return -1;
      if (a.status !== "unread" && b.status === "unread") return 1;
      return PRIORITY_ORDER[a.type] - PRIORITY_ORDER[b.type];
    });

  const selectedTopic = topics.find((t) => t.id === selectedId);

  // Auto-scroll to bottom when topic changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selectedTopic?.messages.length]);

  // Mark as read when selected
  useEffect(() => {
    if (selectedId) {
      setTopics((prev) =>
        prev.map((t) => (t.id === selectedId && t.status === "unread" ? { ...t, status: "read" as TopicStatus } : t))
      );
    }
  }, [selectedId]);

  const handleAcceptRule = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    const ruleSummary = topic?.proposedRule?.text || "the proposed rule";
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const newMsg = {
          id: `m-${Date.now()}`,
          sender: "manager" as MessageSender,
          content: "Approved. Please update the rule.",
          timestamp: new Date().toISOString(),
        };
        const aiConfirm = {
          id: `m-${Date.now() + 1}`,
          sender: "ai" as MessageSender,
          content: `Got it! I've updated the rule. Here's my understanding to confirm:\n\n> ${ruleSummary}\n\nI'll apply this going forward. If anything needs adjustment, just let me know in this thread.`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...t,
          status: "resolved" as TopicStatus,
          messages: [...t.messages, newMsg, aiConfirm],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "accepted" as const } : undefined,
        };
      })
    );
    toast.success("Rule accepted — Alex confirmed understanding");
  };

  const handleRejectRule = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const newMsg = {
          id: `m-${Date.now()}`,
          sender: "manager" as MessageSender,
          content: "Rejected. This doesn't match our policy.",
          timestamp: new Date().toISOString(),
        };
        const aiAck = {
          id: `m-${Date.now() + 1}`,
          sender: "ai" as MessageSender,
          content: "Understood. I'll continue escalating these cases. Could you let me know what the correct approach should be?",
          timestamp: new Date().toISOString(),
        };
        return {
          ...t,
          messages: [...t.messages, newMsg, aiAck],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "rejected" as const } : undefined,
        };
      })
    );
    toast.info("Rule rejected");
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedId) return;
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const newMsg = {
          id: `m-${Date.now()}`,
          sender: "manager" as MessageSender,
          content: replyText.trim(),
          timestamp: new Date().toISOString(),
        };
        // Simulate AI response after a beat
        const aiReply = {
          id: `m-${Date.now() + 1}`,
          sender: "ai" as MessageSender,
          content: "Thanks for the guidance! I'll incorporate this into my handling. Let me know if there's anything else you'd like me to adjust.",
          timestamp: new Date().toISOString(),
        };
        return { ...t, messages: [...t.messages, newMsg, aiReply], updatedAt: new Date().toISOString() };
      })
    );
    setReplyText("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    if (diffH < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = topics.filter((t) => t.status === "unread").length;
  const readCount = topics.filter((t) => t.status === "read").length;

  return (
    <div className="flex h-full">
      {/* ── Left: Topic List ── */}
      <div className="w-[360px] border-r border-border flex flex-col bg-card/50 shrink-0">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">Instruct</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} topics need your attention` : "All caught up"}
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                const newTopic: Topic = {
                  id: `t-new-${Date.now()}`,
                  type: "rule_update",
                  title: "New Rule Update",
                  status: "read",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  preview: "You started a new topic...",
                  messages: [],
                };
                setTopics((prev) => [newTopic, ...prev]);
                setSelectedId(newTopic.id);
                toast.info("New topic created — type your rule update below");
              }}
            >
              <FileEdit className="w-3.5 h-3.5" />
              New Rule
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] bg-background border-border/60"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 mt-3">
            {(["all", "unread", "read", "resolved"] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
                  filter === f
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1 text-[10px] text-amber-500">({unreadCount})</span>
                )}
                {f === "read" && readCount > 0 && (
                  <span className="ml-1 text-[10px] opacity-50">({readCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-1 mt-2 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                typeFilter === "all"
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
              )}
            >
              All Types
            </button>
            {(Object.keys(TYPE_CONFIG) as TopicType[]).map((t) => {
              const conf = TYPE_CONFIG[t];
              const count = topics.filter((tp) => tp.type === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                    typeFilter === t
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {conf.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Topic list */}
        <ScrollArea className="flex-1">
          <div className="py-1">
            {filteredTopics.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-foreground">No topics found</p>
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const typeConf = TYPE_CONFIG[topic.type];
                const TypeIcon = typeConf.icon;
                const isSelected = selectedId === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedId(topic.id)}
                    className={cn(
                      "w-full text-left px-5 py-3.5 border-b border-border/40 transition-colors",
                      isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40 border-l-2 border-l-transparent",
                      topic.status === "unread" && !isSelected && "bg-amber-50/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 shrink-0", typeConf.color)}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={cn(
                              "text-[13px] font-medium truncate block flex-1",
                              topic.status === "unread" ? "text-foreground font-semibold" : "text-foreground/80"
                            )}
                          >
                            {topic.title}
                          </span>
                          {topic.status === "unread" && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {topic.preview}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="h-[18px] px-1.5 text-[10px] font-normal">
                            {typeConf.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/60">
                            {formatTime(topic.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Right: Conversation ── */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedTopic ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-[320px]">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/instruct-empty-Hido4BsXSs6rMTNL2vy8Q3.webp"
                alt="Select a topic"
                className="w-40 h-40 mx-auto mb-6 rounded-2xl object-cover opacity-60"
              />
              <h3 className="text-sm font-heading font-semibold text-foreground/70 mb-1">
                Your conversation hub with Alex
              </h3>
              <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
                Alex posts topics when discovering knowledge gaps, completing performance reports, or needing your input. You can also create new topics to update rules.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("shrink-0", TYPE_CONFIG[selectedTopic.type].color)}>
                  {(() => {
                    const Icon = TYPE_CONFIG[selectedTopic.type].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-heading font-semibold text-foreground truncate">
                    {selectedTopic.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-[18px] px-1.5 text-[10px]",
                        selectedTopic.status === "resolved" && "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {selectedTopic.status === "resolved" ? "Resolved" : "Open"}
                    </Badge>
                    {selectedTopic.sourceTicketId && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Ticket #{selectedTopic.sourceTicketId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-5">
              <div className="max-w-[680px] mx-auto space-y-5">
                {selectedTopic.messages.map((msg) => {
                  const isAI = msg.sender === "ai";
                  return (
                    <div key={msg.id} className={cn("flex gap-3", !isAI && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isAI ? "bg-primary/10" : "bg-amber-100"
                        )}
                      >
                        {isAI ? (
                          <Bot className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-amber-700" />
                        )}
                      </div>
                      <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-foreground/70">
                            {isAI ? "Alex" : "You"}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-xl px-4 py-3 text-[13px] leading-relaxed",
                            isAI
                              ? "bg-card border border-border/60 text-foreground/85"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {/* Render markdown-like content */}
                          {msg.content.split("\n").map((line, i) => {
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={i}
                                  className={cn(
                                    "border-l-2 pl-3 my-2 italic",
                                    isAI ? "border-primary/30 text-foreground/70" : "border-white/40 text-white/80"
                                  )}
                                >
                                  {line.slice(2)}
                                </blockquote>
                              );
                            }
                            if (line.startsWith("- ")) {
                              return (
                                <div key={i} className="flex gap-2 ml-1">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                                  <span>{renderBold(line.slice(2))}</span>
                                </div>
                              );
                            }
                            if (line === "") return <div key={i} className="h-2" />;
                            return <p key={i}>{renderBold(line)}</p>;
                          })}
                        </div>

                        {/* Action buttons */}
                        {msg.actions && msg.actions.length > 0 && selectedTopic.proposedRule?.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            {msg.actions.map((action) => (
                              <Button
                                key={action.label}
                                size="sm"
                                variant={action.type === "accept" ? "default" : "outline"}
                                className={cn(
                                  "h-8 text-xs gap-1.5",
                                  action.type === "accept" && "bg-emerald-600 hover:bg-emerald-700"
                                )}
                                onClick={() => {
                                  if (action.type === "accept") handleAcceptRule(selectedTopic.id);
                                  if (action.type === "reject") handleRejectRule(selectedTopic.id);
                                }}
                              >
                                {action.type === "accept" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply input */}
            <div className="px-6 py-4 border-t border-border bg-card/30 shrink-0">
              <div className="max-w-[680px] mx-auto flex gap-3">
                <Input
                  placeholder="Reply to Alex..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                  className="flex-1 h-10 text-[13px] bg-background"
                />
                <Button
                  size="sm"
                  className="h-10 px-4 gap-1.5"
                  disabled={!replyText.trim()}
                  onClick={handleSendReply}
                >
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper: render **bold** text
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
