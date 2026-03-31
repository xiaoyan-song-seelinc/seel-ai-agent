import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, ExternalLink } from "lucide-react";
import type { Topic } from "@/lib/mock-data";

interface QuestionCardProps {
  topic: Topic;
  onAnswer: (text: string) => void;
  onOpenTicket: (ticketId: string) => void;
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

export function QuestionCard({ topic, onAnswer, onOpenTicket }: QuestionCardProps) {
  const [answerText, setAnswerText] = useState("");
  const [sentAnswer, setSentAnswer] = useState<string | null>(null);
  const [tlConfirmed, setTlConfirmed] = useState(false);

  const firstMsg = topic.messages[0];

  // Check if already answered (has a manager message)
  const existingManagerMsg = topic.messages.find((m) => m.sender === "manager");
  const existingAiConfirm = topic.messages.find(
    (m, i) => m.sender === "ai" && i > 0,
  );

  useEffect(() => {
    if (existingManagerMsg && !sentAnswer) {
      setSentAnswer(existingManagerMsg.content);
    }
    if (existingAiConfirm && !tlConfirmed) {
      setTlConfirmed(true);
    }
  }, [existingManagerMsg, existingAiConfirm, sentAnswer, tlConfirmed]);

  const handleSend = () => {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    setSentAnswer(trimmed);
    onAnswer(trimmed);
    setAnswerText("");
    // Simulate TL confirmation after 1.5s
    setTimeout(() => {
      setTlConfirmed(true);
    }, 1500);
  };

  // Parse source ticket IDs from preview or messages
  const sourceTickets: string[] = [];
  if (topic.sourceTicketId) {
    sourceTickets.push(topic.sourceTicketId);
  }

  return (
    <div className="flex gap-2.5">
      {/* TL avatar */}
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-white">TL</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Sender row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[9px] text-muted-foreground/50">
            {formatRelativeTime(topic.createdAt)}
          </span>
          {!sentAnswer && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Needs your response" />
          )}
        </div>

        {/* Question bubble */}
        <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 mb-1.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[8px] px-1.5 py-0 h-4">
              QUESTION
            </Badge>
          </div>
          <p className="text-[12px] font-semibold text-foreground mb-1">{topic.title}</p>
          {firstMsg && (
            <p className="text-[12px] leading-relaxed text-foreground">
              {firstMsg.content}
            </p>
          )}
        </div>

        {/* Source tickets */}
        {sourceTickets.length > 0 && (
          <div className="mb-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Source tickets
            </p>
            <div className="flex flex-wrap gap-1">
              {sourceTickets.map((ticketId) => (
                <button
                  key={ticketId}
                  onClick={() => onOpenTicket(ticketId)}
                  className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                >
                  #{ticketId}
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer input or answered state */}
        {!sentAnswer ? (
          <div className="mt-1.5">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Reply to Team Lead..."
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-[11px] leading-5 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 focus:border-indigo-300 mb-1.5"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="sm"
              className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700"
              disabled={!answerText.trim()}
              onClick={handleSend}
            >
              <Send className="w-3 h-3 mr-1" /> Send
            </Button>
          </div>
        ) : (
          <div className="space-y-2 mt-1.5">
            {/* Manager's reply (right-aligned) */}
            <div className="flex justify-end">
              <div
                className={cn(
                  "rounded-xl rounded-tr-sm px-3.5 py-2 max-w-[85%]",
                  "bg-indigo-600 text-white",
                )}
              >
                <p className="text-[11px] leading-relaxed">{sentAnswer}</p>
              </div>
            </div>

            {/* TL confirmation */}
            {tlConfirmed && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-white">TL</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
                    <span className="text-[9px] text-muted-foreground/50">just now</span>
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
                    <p className="text-[12px] leading-relaxed text-foreground">
                      Got it. I've updated the knowledge base with this information.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
