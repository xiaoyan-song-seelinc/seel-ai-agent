import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";
import { EscalationMessage } from "./EscalationMessage";
import type { EscalationTicket, AgentMode } from "@/lib/mock-data";

interface RepEscalationFeedProps {
  tickets: EscalationTicket[];
  agentName: string;
  agentMode: AgentMode;
  repHired: boolean;
  onResolve: (id: string) => void;
  onOpenTicket: (url: string) => void;
  onOpenProfile: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MODE_BADGE: Record<AgentMode, { label: string; className: string }> = {
  production: {
    label: "Production",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  training: {
    label: "Training",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  off: {
    label: "Off",
    className: "bg-muted/30 text-muted-foreground border-border/40",
  },
};

export function RepEscalationFeed({
  tickets,
  agentName,
  agentMode,
  repHired,
  onResolve,
  onOpenTicket,
  onOpenProfile,
}: RepEscalationFeedProps) {
  const initials = getInitials(agentName);
  const modeBadge = MODE_BADGE[agentMode] ?? MODE_BADGE.training;

  if (!repHired) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3">
          <UserCircle2 className="w-7 h-7 text-indigo-500" />
        </div>
        <p className="text-[13px] font-semibold text-foreground mb-1">No rep hired yet</p>
        <p className="text-[12px] text-muted-foreground max-w-xs leading-relaxed">
          Complete the onboarding flow and hire your first AI rep to see escalations here.
        </p>
      </div>
    );
  }

  const needsAttention = tickets.filter((t) => t.status === "needs_attention");
  const resolved = tickets.filter((t) => t.status === "resolved");
  const sorted = [...needsAttention, ...resolved];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">{agentName}</span>
            <Badge
              variant="outline"
              className={cn("text-[8px] font-medium", modeBadge.className)}
            >
              {modeBadge.label}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] px-2.5"
          onClick={onOpenProfile}
        >
          Profile
        </Button>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <span className="text-[20px]">✓</span>
            </div>
            <p className="text-[13px] font-semibold text-foreground mb-1">All caught up</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              No escalations need your attention right now.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {sorted.map((ticket) => (
              <EscalationMessage
                key={ticket.id}
                ticket={ticket}
                agentName={agentName}
                onResolve={onResolve}
                onOpenTicket={onOpenTicket}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
