/* ── Inbox Page (renamed from Instruct) ──────────────────────
   Left: Compact topic list with minimal preview
   Right: Conversation thread with action buttons
   Status: unread → pending (read but needs action) → resolved
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TOPICS, type Topic, type TopicStatus, type TopicType, type MessageSender } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  FileEdit,
  Search,
  Send,
  Bot,
  User,
  ExternalLink,
  Check,
  X,
  Plus,
  Inbox as InboxIcon,
} from "lucide-react";
import { toast } from "sonner";

/* ── Config ── */

const TYPE_ICON: Record<TopicType, typeof Lightbulb> = {
  knowledge_gap: Lightbulb,
  performance_report: BarChart3,
  open_question: HelpCircle,
  escalation_review: AlertTriangle,
  rule_update: FileEdit,
};

const TYPE_LABEL: Record<TopicType, string> = {
  knowledge_gap: "Knowledge Gap",
  performance_report: "Performance",
  open_question: "Question",
  escalation_review: "Escalation",
  rule_update: "Rule Update",
};

const TYPE_COLOR: Record<TopicType, string> = {
  knowledge_gap: "text-amber-500",
  performance_report: "text-blue-500",
  open_question: "text-slate-500",
  escalation_review: "text-orange-500",
  rule_update: "text-violet-500",
};

type FilterTab = "all" | "unread" | "pending" | "resolved";

const PRIORITY: Record<TopicType, number> = {
  knowledge_gap: 0,
  escalation_review: 1,
  open_question: 2,
  rule_update: 3,
  performance_report: 4,
};

/* ── Component ── */

export default function Inbox() {
  const [topics, setTopics] = useState<Topic[]>(
    TOPICS.map((t) => ({
      ...t,
      status: t.status === "read" ? ("pending" as TopicStatus) : t.status,
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const counts = {
    all: topics.length,
    unread: topics.filter((t) => t.status === "unread").length,
    pending: topics.filter((t) => t.status === ("pending" as TopicStatus) || t.status === "read").length,
    resolved: topics.filter((t) => t.status === "resolved").length,
  };

  const filtered = topics
    .filter((t) => {
      if (tab === "all") return true;
      if (tab === "pending") return t.status === ("pending" as TopicStatus) || t.status === "read";
      return t.status === tab;
    })
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status === "unread" && b.status !== "unread") return -1;
      if (a.status !== "unread" && b.status === "unread") return 1;
      return PRIORITY[a.type] - PRIORITY[b.type];
    });

  const selected = topics.find((t) => t.id === selectedId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);

  useEffect(() => {
    if (selectedId) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === selectedId && t.status === "unread"
            ? { ...t, status: "pending" as TopicStatus }
            : t
        )
      );
    }
  }, [selectedId]);

  const handleAccept = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    const rule = topic?.proposedRule?.text || "the proposed rule";
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: "resolved" as TopicStatus,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: "Approved. Please update the rule.", timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: `Got it! I've updated the rule. Here's my understanding:\n\n> ${rule}\n\nI'll apply this going forward. Let me know if anything needs adjustment.`, timestamp: new Date().toISOString() },
          ],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "accepted" as const } : undefined,
        };
      })
    );
    toast.success("Rule accepted");
  };

  const handleReject = (id: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: "Rejected. This doesn't match our policy.", timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Understood. I'll keep escalating these cases. Could you tell me the correct approach?", timestamp: new Date().toISOString() },
          ],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "rejected" as const } : undefined,
        };
      })
    );
    toast.info("Rule rejected");
  };

  const handleSend = () => {
    if (!replyText.trim() || !selectedId) return;
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: replyText.trim(), timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Thanks for the guidance! I'll incorporate this. Let me know if there's anything else.", timestamp: new Date().toISOString() },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setReplyText("");
  };

  const handleNewTopic = () => {
    const t: Topic = {
      id: `t-new-${Date.now()}`,
      type: "rule_update",
      title: "New Rule Update",
      status: "pending" as TopicStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preview: "",
      messages: [],
    };
    setTopics((prev) => [t, ...prev]);
    setSelectedId(t.id);
    toast.info("New topic created");
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const h = (Date.now() - d.getTime()) / 3.6e6;
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${Math.round(h)}h`;
    if (h < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /* ── Render ── */
  return (
    <div className="flex h-full">
      {/* ── Left Panel ── */}
      <div className="w-[320px] border-r border-border flex flex-col bg-card shrink-0">
        {/* Header: title + new button */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Inbox</h1>
            {counts.unread > 0 && (
              <span className="bg-primary text-primary-foreground text-[11px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                {counts.unread}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleNewTopic}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search + Tabs */}
        <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[13px] bg-background"
            />
          </div>
          <div className="flex gap-0.5 bg-muted/50 rounded-md p-0.5">
            {(["all", "unread", "pending", "resolved"] as FilterTab[]).map((f) => (
              <button
                key={f}
                onClick={() => setTab(f)}
                className={cn(
                  "flex-1 px-2 py-1 rounded text-[12px] font-medium transition-all",
                  tab === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {counts[f] > 0 && f !== "all" && (
                  <span className="ml-1 opacity-60">{counts[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Topic List */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No topics</div>
          ) : (
            filtered.map((topic) => {
              const Icon = TYPE_ICON[topic.type];
              const isActive = selectedId === topic.id;
              const isUnread = topic.status === "unread";

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 transition-colors",
                    isActive
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : "hover:bg-muted/30 border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 shrink-0", TYPE_COLOR[topic.type])} />
                    <span
                      className={cn(
                        "text-[13px] truncate flex-1",
                        isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                      )}
                    >
                      {topic.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {fmtTime(topic.updatedAt)}
                    </span>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* ── Right Panel: Conversation ── */}
      <div className="flex-1 flex flex-col bg-background">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-[280px]">
              <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <InboxIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground/70 mb-1">Select a topic</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Alex posts topics for knowledge gaps, performance reports, and questions. You can also create new rule updates.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-14 px-6 flex items-center gap-3 border-b border-border shrink-0">
              {(() => {
                const Icon = TYPE_ICON[selected.type];
                return <Icon className={cn("w-4 h-4 shrink-0", TYPE_COLOR[selected.type])} />;
              })()}
              <h2 className="text-sm font-semibold text-foreground truncate flex-1">
                {selected.title}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {selected.status === "resolved" ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">Open</Badge>
                )}
                {selected.sourceTicketId && (
                  <button className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    #{selected.sourceTicketId}
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-5">
              <div className="max-w-[640px] mx-auto space-y-4">
                {selected.messages.map((msg) => {
                  const isAI = msg.sender === "ai";
                  return (
                    <div key={msg.id} className={cn("flex gap-3", !isAI && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isAI ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        {isAI ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-foreground/60">
                            {isAI ? "Alex" : "You"}
                          </span>
                          <span className="text-[11px] text-muted-foreground/40">
                            {fmtTime(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
                            isAI
                              ? "bg-card border border-border text-foreground/85"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {msg.content.split("\n").map((line, i) => {
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={i}
                                  className={cn(
                                    "border-l-2 pl-3 my-1.5 italic text-[12px]",
                                    isAI ? "border-primary/30 text-foreground/60" : "border-white/40 text-white/80"
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
                            if (line === "") return <div key={i} className="h-1.5" />;
                            return <p key={i}>{renderBold(line)}</p>;
                          })}
                        </div>

                        {/* Action buttons for pending rules */}
                        {msg.actions && msg.actions.length > 0 && selected.proposedRule?.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            {msg.actions.map((action) => (
                              <Button
                                key={action.label}
                                size="sm"
                                variant={action.type === "accept" ? "default" : "outline"}
                                className={cn(
                                  "h-7 text-[12px] gap-1",
                                  action.type === "accept" && "bg-emerald-600 hover:bg-emerald-700"
                                )}
                                onClick={() => {
                                  if (action.type === "accept") handleAccept(selected.id);
                                  if (action.type === "reject") handleReject(selected.id);
                                }}
                              >
                                {action.type === "accept" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            {/* Reply */}
            {selected.status !== "resolved" && (
              <div className="px-6 py-3 border-t border-border shrink-0">
                <div className="max-w-[640px] mx-auto flex gap-2">
                  <Input
                    placeholder="Reply to Alex..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1 h-9 text-[13px]"
                  />
                  <Button size="sm" className="h-9 px-3" disabled={!replyText.trim()} onClick={handleSend}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
