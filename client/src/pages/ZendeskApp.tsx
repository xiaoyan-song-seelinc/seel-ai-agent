/* ── Zendesk App Sidebar Simulation ───────────────────────────
   Compact Zendesk sidebar (320px). Three ticket states:
   1. handling  — AI handling, no attention needed
   2. approval  — AI suggests action/reply, manager approves
   3. escalated — AI can't handle, manager takes over
   All states support "Give Instruction" for teaching AI.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ZENDESK_TICKETS,
  type ZendeskTicket,
  type ApprovalStatus,
} from "@/lib/zendesk-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ── Helpers ──────────────────────────────────────────────

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Sidebar: Status Badge ────────────────────────────────

function StatusBadge({ state, approvalStatus }: { state: ZendeskTicket["state"]; approvalStatus?: ApprovalStatus }) {
  if (state === "handling") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-medium text-emerald-700">AI is handling this</span>
      </div>
    );
  }
  if (state === "approval") {
    if (approvalStatus === "approved") {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="text-[11px] font-medium text-emerald-700">Approved</span>
        </div>
      );
    }
    if (approvalStatus === "denied") {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200">
          <XCircle className="w-3 h-3 text-red-500" />
          <span className="text-[11px] font-medium text-red-600">Denied</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        <span className="text-[11px] font-medium text-amber-700">Waiting for your approval</span>
      </div>
    );
  }
  // escalated
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="w-3 h-3 text-red-500" />
      <span className="text-[11px] font-medium text-red-600">Needs your attention</span>
    </div>
  );
}

// ── Draft with Copy Button ───────────────────────────────

function DraftWithCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <p className="text-[11.5px] text-[#2f3941] leading-relaxed whitespace-pre-wrap pr-7">
        {text}
      </p>
      <button
        onClick={handleCopy}
        className="absolute top-0 right-0 p-1 rounded text-[#87929d] hover:text-[#2f3941] hover:bg-[#e9ebed] transition-colors opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

// ── Sidebar Content ──────────────────────────────────────

function SidebarContent({
  ticket,
  onApprove,
  onDeny,
  onInstruct,
}: {
  ticket: ZendeskTicket;
  onApprove: () => void;
  onDeny: (reason?: string) => void;
  onInstruct: (text: string) => void;
}) {
  const [showDeny, setShowDeny] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [instructText, setInstructText] = useState("");
  const [showInstruct, setShowInstruct] = useState(false);
  const [instructSent, setInstructSent] = useState(!!ticket.instruction);

  const isPending = ticket.state === "approval" && ticket.approvalStatus === "pending";

  return (
    <div className="space-y-3">
      {/* Status */}
      <StatusBadge state={ticket.state} approvalStatus={ticket.approvalStatus} />

      {/* Internal Note — for approval & escalated */}
      {ticket.internalNote && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot className="w-3 h-3 text-[#68737d]" />
            <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">Rep's Note</span>
          </div>
          <p className="text-[11.5px] text-[#2f3941] leading-relaxed">{ticket.internalNote}</p>
        </div>
      )}

      {/* Suggested Action — only for approval state */}
      {ticket.state === "approval" && ticket.suggestedAction && (
        <div className="rounded-md border border-[#d8dcde] overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#f8f9fa] border-b border-[#e9ebed]">
            <span className="text-[10px] font-semibold text-[#2f3941] uppercase tracking-wider">
              Suggested: {ticket.suggestedAction.label}
            </span>
          </div>
          <div className="p-2.5">
            {ticket.suggestedAction.type === "reply" && ticket.suggestedAction.draft ? (
              <DraftWithCopy text={ticket.suggestedAction.draft} />
            ) : ticket.suggestedAction.details ? (
              <div className="space-y-1">
                {Object.entries(ticket.suggestedAction.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-[#68737d] capitalize">{key}</span>
                    <span className="text-[#2f3941] font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Approve / Deny */}
          {isPending && !showDeny && (
            <div className="flex border-t border-[#e9ebed]">
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11.5px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors border-r border-[#e9ebed]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => setShowDeny(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11.5px] font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Deny
              </button>
            </div>
          )}

          {/* Deny reason */}
          {showDeny && (
            <div className="p-2.5 border-t border-[#e9ebed] space-y-2">
              <textarea
                placeholder="Why? (optional — helps Alex learn)"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                className="w-full text-[11px] border border-[#d8dcde] rounded px-2 py-1.5 resize-none min-h-[48px] outline-none focus:border-[#1f73b7] placeholder:text-[#b0b8c0]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onDeny(denyReason || undefined); setShowDeny(false); setDenyReason(""); }}
                  className="flex-1 py-1.5 rounded text-[11px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Deny{denyReason.trim() ? " with feedback" : ""}
                </button>
                <button
                  onClick={() => { setShowDeny(false); setDenyReason(""); }}
                  className="px-3 py-1.5 rounded text-[11px] text-[#68737d] hover:bg-[#f0f1f2] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approved / Denied result for non-pending */}
      {ticket.state === "approval" && ticket.approvalStatus && ticket.approvalStatus !== "pending" && ticket.suggestedAction && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5">
          <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">
            {ticket.suggestedAction.label}
          </span>
          {ticket.suggestedAction.details && (
            <div className="mt-1.5 space-y-0.5">
              {Object.entries(ticket.suggestedAction.details).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-[#68737d] capitalize">{key}</span>
                  <span className="text-[#2f3941] font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-[#e9ebed]" />

      {/* Give Instruction */}
      {!instructSent ? (
        showInstruct ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MessageSquarePlus className="w-3 h-3 text-[#68737d]" />
              <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">Notes to Rep</span>
            </div>
            <textarea
              placeholder="Leave a note for how to handle this in the future..."
              value={instructText}
              onChange={(e) => setInstructText(e.target.value)}
              className="w-full text-[11px] border border-[#d8dcde] rounded px-2 py-1.5 resize-none min-h-[56px] outline-none focus:border-[#1f73b7] placeholder:text-[#b0b8c0]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!instructText.trim()) return;
                  onInstruct(instructText.trim());
                  setInstructSent(true);
                  setInstructText("");
                }}
                disabled={!instructText.trim()}
                className="flex-1 py-1.5 rounded text-[11px] font-medium bg-[#1f73b7] text-white hover:bg-[#1a6aab] transition-colors disabled:opacity-40"
              >
                Send
              </button>
              <button
                onClick={() => { setShowInstruct(false); setInstructText(""); }}
                className="px-3 py-1.5 rounded text-[11px] text-[#68737d] hover:bg-[#f0f1f2] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInstruct(true)}
            className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md text-[11px] text-[#68737d] hover:text-[#2f3941] hover:bg-[#f0f1f2] transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Notes to Rep
          </button>
        )
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-blue-50 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          <span className="text-[11px] text-blue-700 font-medium">Instruction sent</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

export default function ZendeskApp() {
  const [tickets, setTickets] = useState<ZendeskTicket[]>(ZENDESK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ZENDESK_TICKETS[0]?.id || "");
  const [, navigate] = useLocation();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleApprove = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, approvalStatus: "approved" as ApprovalStatus } : t))
    );
    toast.success("Approved — rep will proceed");
  };

  const handleDeny = (ticketId: string, reason?: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, approvalStatus: "denied" as ApprovalStatus } : t))
    );
    toast.success(reason ? "Denied with feedback" : "Denied — rep will escalate");
  };

  const handleInstruct = (ticketId: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, instruction: text } : t))
    );
    toast.success("Note saved — rep will learn from this");
  };

  const pendingCount = tickets.filter((t) => t.state === "approval" && t.approvalStatus === "pending").length;
  const escalatedCount = tickets.filter((t) => t.state === "escalated").length;

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Left: Simulated Zendesk ticket view */}
      <div className="flex-1 bg-white border-r border-[#d8dcde]">
        <div className="h-11 bg-[#03363D] flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-white/70 hover:text-white hover:bg-white/10 gap-1 text-[11px]"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Seel
          </Button>
          <div className="flex-1" />
          <span className="text-[10px] text-white/40 font-mono">Zendesk Simulation</span>
        </div>

        <div className="flex h-[calc(100%-44px)]">
          {/* Ticket list */}
          <div className="w-[240px] border-r border-[#e9ebed] bg-[#f8f9fa]">
            <div className="px-3 py-2.5 border-b border-[#e9ebed] flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#2f3941]">Tickets</span>
              <span className="text-[10px] text-[#87929d]">{tickets.length}</span>
            </div>
            <ScrollArea className="h-[calc(100%-38px)]">
              {tickets.map((ticket) => {
                const needsAttention = (ticket.state === "approval" && ticket.approvalStatus === "pending") || ticket.state === "escalated";
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-[#e9ebed] transition-colors",
                      selectedTicketId === ticket.id ? "bg-[#edf7ff]" : "hover:bg-[#f0f1f2]"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {needsAttention && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      <span className="text-[10px] text-[#87929d]">#{ticket.id.slice(-4)}</span>
                    </div>
                    <p className="text-[11.5px] text-[#2f3941] font-medium truncate">{ticket.subject}</p>
                    <p className="text-[10px] text-[#87929d] mt-0.5">{ticket.customerName}</p>
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* Ticket detail */}
          {selectedTicket && (
            <div className="flex-1 flex flex-col">
              <div className="px-5 py-3 border-b border-[#e9ebed]">
                <h2 className="text-[14px] font-semibold text-[#2f3941]">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[#68737d]">{selectedTicket.customerName}</span>
                  <span className="text-[9px] text-[#b0b8c0]">·</span>
                  <span className="text-[11px] text-[#87929d]">{selectedTicket.customerEmail}</span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-5 py-4 space-y-3 max-w-[560px]">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex gap-2.5", msg.from === "agent" && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                          msg.from === "customer" && "bg-[#e9ebed] text-[#68737d]",
                          msg.from === "agent" && "bg-[#03363D] text-white",
                          msg.from === "internal" && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {msg.from === "customer" ? selectedTicket.customerName[0] : msg.from === "agent" ? <Bot className="w-3 h-3" /> : "!"}
                      </div>
                      <div
                        className={cn(
                          "max-w-[420px] rounded-lg px-3 py-2 text-[12px]",
                          msg.from === "customer" && "bg-[#f8f9fa] text-[#2f3941] border border-[#e9ebed]",
                          msg.from === "agent" && "bg-[#edf7ff] text-[#2f3941] border border-[#c2e0f4]",
                          msg.from === "internal" && "bg-amber-50 text-amber-900 border border-amber-200"
                        )}
                      >
                        {msg.from === "internal" && (
                          <span className="text-[9px] font-medium text-amber-600 uppercase tracking-wider block mb-0.5">Internal Note</span>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className="text-[9px] text-[#b0b8c0] mt-1 block">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right: Zendesk App Sidebar (300px) */}
      <div className="w-[300px] bg-white flex flex-col shrink-0">
        {/* App header — mimics Zendesk app chrome */}
        <div className="flex items-center gap-2 px-3 h-10 border-b border-[#d8dcde] bg-white">
          <Bot className="w-4 h-4 text-[#1f73b7]" />
          <span className="text-[12px] font-semibold text-[#2f3941] flex-1">Seel AI Agent</span>
          {(pendingCount + escalatedCount) > 0 && (
            <span className="w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold min-w-[18px] px-1">
              {pendingCount + escalatedCount}
            </span>
          )}
        </div>

        {selectedTicket && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              <SidebarContent
                ticket={selectedTicket}
                onApprove={() => handleApprove(selectedTicket.id)}
                onDeny={(reason) => handleDeny(selectedTicket.id, reason)}
                onInstruct={(text) => handleInstruct(selectedTicket.id, text)}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
