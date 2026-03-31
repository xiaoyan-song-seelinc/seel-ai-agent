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

function formatRelativeTime(d: string) {
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
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**"))
        return (
          <strong key={j} className="font-semibold">
            {seg.slice(2, -2)}
          </strong>
        );
      return <span key={j}>{seg}</span>;
    });
    return <p key={i}>{parts}</p>;
  });
}

function MessageBubble({ msg, small }: { msg: { sender: string; content: string }; small?: boolean }) {
  if (msg.sender === "manager") {
    return (
      <div className="flex justify-end">
        <div className={cn("rounded-xl rounded-tr-sm bg-indigo-600 text-white max-w-[85%]", small ? "px-3 py-2" : "px-3.5 py-2.5")}>
          <p className={cn("leading-relaxed", small ? "text-[11px]" : "text-[12px]")}>{msg.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <div className={cn("rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5", small ? "w-5 h-5" : "w-6 h-6")}>
        <span className={cn("font-bold text-white", small ? "text-[7px]" : "text-[9px]")}>TL</span>
      </div>
      <div className={cn("rounded-xl rounded-tl-sm bg-muted/40 max-w-[85%]", small ? "px-3 py-2" : "px-3.5 py-2.5")}>
        <p className={cn("leading-relaxed text-foreground", small ? "text-[11px]" : "text-[12px]")}>{msg.content}</p>
      </div>
    </div>
  );
}

function GenericMessageBubble({ topic }: { topic: Topic }) {
  const allMsgs = topic.messages;

  return (
    <div className="space-y-1.5">
      {/* Header — only show for first AI message */}
      {allMsgs[0]?.sender === "ai" && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">TL</span>
          </div>
          <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(topic.createdAt)}</span>
        </div>
      )}
      {allMsgs.map((msg, i) => (
        <div key={msg.id} className={msg.sender === "ai" && i === 0 ? "pl-9" : ""}>
          <MessageBubble msg={msg} small={!(i === 0 && msg.sender === "ai")} />
        </div>
      ))}
    </div>
  );
}

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
          Follow the onboarding flow to connect your tools and set up your AI rep. Once done, your Team Lead conversation will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {sorted.map((topic) => {
            const isPerformanceSummary =
              topic.type === "performance_summary" || !!topic.dailyDigest;
            const isRuleProposal = !!topic.proposedRule;
            const isQuestion = topic.type === "question";

            if (isPerformanceSummary && topic.dailyDigest) {
              return (
                <DailyDigestCard
                  key={topic.id}
                  digest={{
                    date: topic.dailyDigest.periodLabel,
                    kpis: topic.dailyDigest.kpis,
                    actionItemCount:
                      topics.filter(
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

            return <GenericMessageBubble key={topic.id} topic={topic} />;
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageInputBar onSend={onSendNewMessage} placeholder="Message Team Lead..." />
    </div>
  );
}
