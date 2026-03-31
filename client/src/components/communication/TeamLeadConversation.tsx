import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInputBar } from "./MessageInputBar";
import { DailyDigestCard } from "./cards/DailyDigestCard";
import { RuleProposalCard } from "./cards/RuleProposalCard";
import { QuestionCard } from "./cards/QuestionCard";
import type { Topic } from "@/lib/mock-data";

interface TeamLeadConversationProps {
  topics: Topic[];
  onAcceptProposal: (topicId: string) => void;
  onRejectProposal: (topicId: string) => void;
  onReplyToTopic: (topicId: string, text: string) => void;
  onSendNewMessage: (text: string) => void;
  onOpenTicket: (ticketId: string) => void;
  onReviewRule: (topicId: string) => void;
  isOnboarding: boolean;
}

// ── Helpers ────────────────────────────────────────────────

export function formatRelativeTime(d: string) {
  const diff = Math.floor(
    (new Date("2026-03-30T10:00:00Z").getTime() - new Date(d).getTime()) / 60000,
  );
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**"))
        return <strong key={j} className="font-semibold">{seg.slice(2, -2)}</strong>;
      // blockquote marker >
      if (j === 0 && seg.startsWith("> "))
        return <span key={j} className="text-muted-foreground italic">{seg.slice(2)}</span>;
      return <span key={j}>{seg}</span>;
    });
    return <p key={i} className="leading-relaxed">{parts}</p>;
  });
}

// ── Avatar helpers ─────────────────────────────────────────

const MANAGER_COLORS: Record<string, string> = {
  "Jordan Chen": "bg-violet-500",
  "Alex Song": "bg-sky-500",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Left-aligned bubble for any participant ────────────────

export function ChatBubble({
  sender,
  name,
  content,
  timestamp,
  small = false,
}: {
  sender: "ai" | "manager";
  name: string;
  content: string;
  timestamp: string;
  small?: boolean;
}) {
  const isAI = sender === "ai";
  const avatarBg = isAI ? "bg-indigo-600" : (MANAGER_COLORS[name] ?? "bg-violet-500");
  const initials = isAI ? "TL" : getInitials(name);

  return (
    <div className="flex gap-2.5">
      <div className={cn(
        "rounded-full flex items-center justify-center shrink-0 mt-0.5",
        small ? "w-6 h-6" : "w-7 h-7",
        avatarBg,
      )}>
        <span className={cn("font-bold text-white", small ? "text-[8px]" : "text-[10px]")}>
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className={cn("font-semibold text-foreground", small ? "text-[10px]" : "text-[11px]")}>
            {name}
          </span>
          <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(timestamp)}</span>
        </div>
        <div className={cn(
          "rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5",
          small ? "text-[11px]" : "text-[12px]",
          "leading-relaxed text-foreground",
        )}>
          {renderMd(content)}
        </div>
      </div>
    </div>
  );
}

// ── Generic topic (knowledge_gap, escalation_review, etc.) ─

function GenericTopicThread({ topic }: { topic: Topic }) {
  const msgs = topic.messages;
  return (
    <div className="space-y-3">
      {msgs.map((msg) => (
        <ChatBubble
          key={msg.id}
          sender={msg.sender}
          name={msg.sender === "ai" ? "Team Lead" : (msg.managerName ?? "Jordan Chen")}
          content={msg.content}
          timestamp={msg.timestamp}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export function TeamLeadConversation({
  topics,
  onAcceptProposal,
  onRejectProposal,
  onReplyToTopic,
  onSendNewMessage,
  onOpenTicket,
  onReviewRule,
  isOnboarding,
}: TeamLeadConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const sorted = [...topics].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [topics.length]);

  if (isOnboarding) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
          <span className="text-[24px]">💬</span>
        </div>
        <p className="text-[13px] font-semibold text-foreground mb-1">Complete onboarding first</p>
        <p className="text-[12px] text-muted-foreground text-center max-w-xs leading-relaxed">
          Follow the onboarding flow to connect your tools and set up your AI rep.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1">
        <div className="px-5 py-5 space-y-6 max-w-2xl">
          {sorted.map((topic) => {
            const isPerformanceSummary = topic.type === "performance_summary" || !!topic.dailyDigest;
            const isRuleProposal = !!topic.proposedRule;
            const isQuestion = topic.type === "question";

            if (isPerformanceSummary && topic.dailyDigest) {
              return (
                <DailyDigestCard
                  key={topic.id}
                  digest={{
                    date: topic.dailyDigest.periodLabel,
                    kpis: topic.dailyDigest.kpis,
                    actionItemCount: topics.filter(
                      (t) => t.proposedRule?.status === "pending" || t.type === "question",
                    ).length,
                  }}
                />
              );
            }

            if (isRuleProposal) {
              return (
                <RuleProposalCard
                  key={topic.id}
                  topic={topic}
                  onAccept={() => onAcceptProposal(topic.id)}
                  onReject={() => onRejectProposal(topic.id)}
                  onReply={(text) => onReplyToTopic(topic.id, text)}
                  onOpenTicket={onOpenTicket}
                  onReviewRule={onReviewRule}
                />
              );
            }

            if (isQuestion) {
              return (
                <QuestionCard
                  key={topic.id}
                  topic={topic}
                  onAnswer={(text) => onReplyToTopic(topic.id, text)}
                  onOpenTicket={onOpenTicket}
                />
              );
            }

            return <GenericTopicThread key={topic.id} topic={topic} />;
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageInputBar onSend={onSendNewMessage} placeholder="Message Team Lead..." />
    </div>
  );
}
