import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink } from "lucide-react";
import type { EscalationTicket } from "@/lib/mock-data";

interface EscalationMessageProps {
  ticket: EscalationTicket;
  agentName: string;
  onResolve: (id: string) => void;
  onOpenTicket: (url: string) => void;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const SENTIMENT_ICON: Record<string, string> = {
  frustrated: "😤",
  neutral: "😐",
  urgent: "🚨",
};

export function EscalationMessage({
  ticket,
  agentName,
  onResolve,
  onOpenTicket,
}: EscalationMessageProps) {
  const isResolved = ticket.status === "resolved";
  const initials = getInitials(agentName);

  return (
    <div className="flex gap-2.5">
      {/* Rep avatar */}
      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Sender row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">{agentName}</span>
          <span className="text-[9px] text-muted-foreground/50">
            {formatRelativeTime(ticket.createdAt)}
          </span>
        </div>

        {/* Escalation card */}
        <div
          className={cn(
            "rounded-xl border bg-white overflow-hidden transition-opacity",
            isResolved ? "border-border/40 opacity-60" : "border-border",
          )}
        >
          {/* Ticket header */}
          <div className="px-3.5 py-2.5 border-b border-border/40">
            <div className="flex items-center gap-1.5 mb-0.5">
              <button
                onClick={() => onOpenTicket(ticket.zendeskUrl)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
              >
                #{ticket.zendeskTicketId}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
              <span className="text-[11px] font-medium text-foreground truncate">
                · {ticket.subject}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {ticket.summary}
            </p>
          </div>

          {/* Meta row */}
          <div className="px-3.5 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px]" title={ticket.sentiment}>
                {SENTIMENT_ICON[ticket.sentiment] ?? "😐"}
              </span>
              <span className="text-[10px] text-muted-foreground">{ticket.sentiment}</span>
              {ticket.orderValue !== undefined && (
                <span className="text-[10px] font-medium text-foreground">
                  · ${ticket.orderValue.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px]",
                  isResolved
                    ? "bg-muted/30 text-muted-foreground border-border/40"
                    : "bg-amber-50 text-amber-700 border-amber-200",
                )}
              >
                {isResolved ? "Resolved" : "⚠ Needs attention"}
              </Badge>
              {!isResolved && (
                <button
                  onClick={() => onResolve(ticket.id)}
                  className="px-2 py-1 rounded text-[9px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-0.5"
                >
                  <Check className="w-2.5 h-2.5" /> Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
