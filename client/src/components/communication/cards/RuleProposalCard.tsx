import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, MessageCircle, ChevronDown, ChevronRight, ExternalLink, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatBubble, formatRelativeTime } from "../TeamLeadConversation";
import type { Topic } from "@/lib/mock-data";

interface RuleProposalCardProps {
  topic: Topic;
  onAccept: () => void;
  onReject: () => void;
  onReply: (text: string) => void;
  onOpenTicket: (ticketId: string) => void;
  onReviewRule: (topicId: string) => void;
}

export function RuleProposalCard({
  topic,
  onAccept,
  onReject,
  onReply,
  onOpenTicket,
  onReviewRule,
}: RuleProposalCardProps) {
  const [ruleExpanded, setRuleExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const rule = topic.proposedRule;
  if (!rule) return null;

  const isPending = rule.status === "pending";
  const isAccepted = rule.status === "accepted";

  const confidenceBadge =
    rule.confidence === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : rule.confidence === "medium"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  const handleReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(trimmed);
    setReplyText("");
    setReplyOpen(false);
  };

  const sourceTickets = rule.evidence ?? [];

  // All messages after the first TL message (which is the proposal card itself)
  const threadMessages = topic.messages.slice(1);

  return (
    <div className="space-y-3">
      {/* TL avatar + name row */}
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white">TL</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
            <span className="text-[9px] text-muted-foreground/50">{formatRelativeTime(topic.createdAt)}</span>
            {isPending && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Needs your response" />
            )}
          </div>

          {/* Context message if present */}
          {topic.messages[0] && (
            <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-2 text-[12px] leading-relaxed text-foreground">
              {topic.messages[0].content}
            </div>
          )}

          {/* Proposal card */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-3.5 py-2.5 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[8px] px-1.5 py-0 h-4 bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-wide"
                >
                  {rule.type === "new" ? "Proposed New Rule" : "Proposed Rule Update"}
                </Badge>
                {rule.confidence && (
                  <Badge
                    variant="outline"
                    className={cn("text-[8px] px-1.5 py-0 h-4", confidenceBadge)}
                  >
                    {rule.confidence.charAt(0).toUpperCase() + rule.confidence.slice(1)} confidence
                  </Badge>
                )}
              </div>
              <p className="text-[12px] font-semibold text-foreground mt-1">{rule.ruleName}</p>
            </div>

            {/* Rule content */}
            <div className="px-3.5 py-2.5">
              {rule.type === "update" && rule.before && (
                <div className="mb-2.5">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Current
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic line-clamp-2">
                    {rule.before}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {rule.type === "update" ? "Proposed" : "Content"}
                </p>
                <p className={cn("text-[11px] text-foreground leading-relaxed", !ruleExpanded && "line-clamp-3")}>
                  {rule.after}
                </p>
                {rule.after.length > 120 && (
                  <button
                    onClick={() => setRuleExpanded(!ruleExpanded)}
                    className="mt-1 text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    {ruleExpanded ? <>Show less <ChevronRight className="w-3 h-3 rotate-90" /></> : <>Show full rule <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
              </div>
            </div>

            {/* Source tickets */}
            {sourceTickets.length > 0 && (
              <div className="px-3.5 py-2 border-t border-border/30">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Source tickets
                </p>
                <div className="flex flex-wrap gap-1">
                  {sourceTickets.map((evidence, i) => {
                    const ticketMatch = evidence.match(/#(\d+)/);
                    const ticketId = ticketMatch ? ticketMatch[1] : null;
                    return (
                      <button
                        key={i}
                        onClick={() => ticketId && onOpenTicket(ticketId)}
                        className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        {ticketId ? `#${ticketId}` : evidence.slice(0, 30)}
                        {ticketId && <ExternalLink className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review rule link */}
            <div className="px-3.5 py-2 border-t border-border/30">
              <button
                onClick={() => onReviewRule(topic.id)}
                className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Review full rule diff
              </button>
            </div>

            {/* Status / Actions */}
            <div className="px-3.5 py-2.5 border-t border-border/50 bg-muted/10">
              {isPending ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onAccept}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button
                    onClick={onReject}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                  <button
                    onClick={() => setReplyOpen(!replyOpen)}
                    className="px-3 py-1.5 rounded-md text-[10.5px] font-medium text-muted-foreground hover:bg-accent transition-colors inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> Reply
                  </button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("text-[9px]", isAccepted
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200")}
                >
                  {isAccepted ? "✓ Accepted" : "✗ Rejected"}
                </Badge>
              )}
            </div>

            {/* Inline reply input */}
            {replyOpen && (
              <div className="px-3.5 py-2.5 border-t border-border/30 bg-muted/10">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to Team Lead..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-[11px] leading-5 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 focus:border-indigo-300 mb-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  }}
                />
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700" disabled={!replyText.trim()} onClick={handleReply}>
                    <Send className="w-2.5 h-2.5 mr-1" /> Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thread replies — left-aligned for all participants */}
      {threadMessages.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border/30 pl-4">
          {threadMessages.map((msg) => (
            <ChatBubble
              key={msg.id}
              sender={msg.sender}
              name={msg.sender === "ai" ? "Team Lead" : (msg.managerName ?? "Jordan Chen")}
              content={msg.content}
              timestamp={msg.timestamp}
              small
            />
          ))}
        </div>
      )}
    </div>
  );
}
