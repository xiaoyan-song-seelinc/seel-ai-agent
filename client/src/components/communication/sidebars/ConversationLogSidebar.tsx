import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CONVERSATION_LOGS, ESCALATION_TICKETS } from "@/lib/mock-data";
import type { ConversationLog } from "@/lib/mock-data";

interface ConversationLogSidebarProps {
  ticketId: string | null;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const REASONING_STEP_COLOR: Record<string, string> = {
  classify: "bg-blue-50 text-blue-700 border-blue-200",
  rule_match: "bg-indigo-50 text-indigo-700 border-indigo-200",
  action_check: "bg-amber-50 text-amber-700 border-amber-200",
  decision: "bg-violet-50 text-violet-700 border-violet-200",
  gap_signal: "bg-orange-50 text-orange-700 border-orange-200",
  execute_action: "bg-emerald-50 text-emerald-700 border-emerald-200",
  generate_reply: "bg-teal-50 text-teal-700 border-teal-200",
};

function ConversationTab({ log }: { log: ConversationLog }) {
  return (
    <div className="px-4 py-3 space-y-2">
      {log.messages.map((msg, i) => {
        const isCustomer = msg.role === "customer";
        const isInternal = msg.role === "internal";

        if (isInternal) {
          return (
            <div key={i} className="flex justify-center">
              <div className="px-3 py-1.5 rounded-full bg-muted/40 border border-border/40">
                <p className="text-[10px] text-muted-foreground font-mono text-center">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={i}
            className={cn("flex", isCustomer ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "rounded-xl px-3 py-2 max-w-[85%]",
                isCustomer
                  ? "rounded-tl-sm bg-muted/40 text-foreground"
                  : "rounded-tr-sm bg-indigo-600 text-white",
              )}
            >
              <p className="text-[11px] leading-relaxed">{msg.text}</p>
              <p
                className={cn(
                  "text-[9px] mt-0.5",
                  isCustomer ? "text-muted-foreground/60" : "text-indigo-200",
                )}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReasoningTab({ log }: { log: ConversationLog }) {
  return (
    <div className="px-4 py-3 space-y-2">
      {log.reasoning.map((step, i) => {
        const colorClass =
          REASONING_STEP_COLOR[step.type] ??
          "bg-muted/30 text-muted-foreground border-border/40";

        return (
          <div key={i} className="rounded-lg border border-border bg-white overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-[8px] px-1.5 py-0 h-4 shrink-0", colorClass)}
              >
                {step.type.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <span className="text-[11px] font-medium text-foreground">{step.label}</span>
              <span className="text-[9px] text-muted-foreground/50 ml-auto shrink-0">
                {formatTime(step.timestamp)}
              </span>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed font-mono text-[10px]">
                {step.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ConversationLogSidebar({ ticketId }: ConversationLogSidebarProps) {
  if (!ticketId) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[12px] text-muted-foreground">No conversation selected.</p>
      </div>
    );
  }

  // Find by zendeskTicketId or id
  const log: ConversationLog | undefined =
    CONVERSATION_LOGS.find(
      (cl) => cl.zendeskTicketId === ticketId || cl.ticketId === ticketId,
    ) ??
    // Also try matching escalation ticket
    (() => {
      const esc = ESCALATION_TICKETS.find((t) => t.zendeskTicketId === ticketId || t.id === ticketId);
      if (!esc) return undefined;
      return CONVERSATION_LOGS.find((cl) => cl.zendeskTicketId === esc.zendeskTicketId);
    })();

  if (!log) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-center">
          <p className="text-[12px] text-muted-foreground">
            No conversation log found for ticket <span className="font-mono">#{ticketId}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Ticket info */}
      <div className="px-4 py-3 border-b border-border/40 space-y-1">
        <p className="text-[12px] font-semibold text-foreground">{log.subject}</p>
        <p className="text-[10px] text-muted-foreground">
          {log.customerName} · #{log.zendeskTicketId}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-[8px] px-1.5 py-0 h-4",
              log.outcome === "resolved"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : log.outcome === "escalated"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-muted/30 text-muted-foreground border-border/40",
            )}
          >
            {log.outcome}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[8px] px-1.5 py-0 h-4",
              log.mode === "production"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200",
            )}
          >
            {log.mode}
          </Badge>
          <span className="text-[9px] text-muted-foreground">
            {log.totalTurns} turns · {log.duration}s
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conversation" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2">
          <TabsList className="h-7 text-[11px]">
            <TabsTrigger value="conversation" className="text-[11px] h-6 px-3">
              Conversation
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="text-[11px] h-6 px-3">
              Reasoning
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversation" className="flex-1 overflow-y-auto mt-0">
          <ConversationTab log={log} />
        </TabsContent>

        <TabsContent value="reasoning" className="flex-1 overflow-y-auto mt-0">
          <ReasoningTab log={log} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
