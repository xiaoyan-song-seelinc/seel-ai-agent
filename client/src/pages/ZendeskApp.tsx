/* ── Zendesk App Sidebar Simulation ───────────────────────────
   Compact Zendesk sidebar (320px). Two ticket states (MVP):
   1. handling  — AI handling, no attention needed
   2. escalated — AI can't handle, manager takes over
   All states support "Notes to Rep" for teaching AI.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ZENDESK_TICKETS,
  type ZendeskTicket,
} from "@/lib/zendesk-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ── Helpers ──────────────────────────────────────────────

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Sidebar: Status Badge ────────────────────────────────

function StatusBadge({ state }: { state: ZendeskTicket["state"] }) {
  if (state === "handling") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium text-emerald-700">AI is handling this</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="w-3 h-3 text-red-500" />
      <span className="text-[11px] font-medium text-red-600">Needs your attention</span>
    </div>
  );
}

// ── Sidebar Content ──────────────────────────────────────

function SidebarContent({
  ticket,
  onInstruct,
}: {
  ticket: ZendeskTicket;
  onInstruct: (text: string) => void;
}) {
  const [instructText, setInstructText] = useState("");
  const [showInstruct, setShowInstruct] = useState(false);
  const [instructSent, setInstructSent] = useState(!!ticket.instruction);

  return (
    <div className="space-y-3">
      {/* Status */}
      <StatusBadge state={ticket.state} />

      {/* AI Handling Info */}
      {ticket.state === "handling" && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5 space-y-1.5">
          {ticket.intentDetected && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Intent</span>
              <span className="text-[#2f3941] font-medium">{ticket.intentDetected}</span>
            </div>
          )}
          {ticket.confidence !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Confidence</span>
              <span className="text-[#2f3941] font-medium">{Math.round(ticket.confidence * 100)}%</span>
            </div>
          )}
          {ticket.currentStep && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[#68737d]">Status</span>
              <span className="text-[#2f3941] font-medium text-right max-w-[160px]">{ticket.currentStep}</span>
            </div>
          )}
        </div>
      )}

      {/* Escalation Info */}
      {ticket.state === "escalated" && ticket.internalNote && (
        <div className="rounded-md bg-[#f8f9fa] border border-[#e9ebed] p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot className="w-3 h-3 text-[#68737d]" />
            <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">Rep's Handoff Note</span>
          </div>
          <p className="text-[11.5px] text-[#2f3941] leading-relaxed">{ticket.internalNote}</p>
          {ticket.escalationReason && (
            <div className="mt-2 pt-2 border-t border-[#e9ebed]">
              <span className="text-[10px] font-semibold text-[#68737d] uppercase tracking-wider">Reason</span>
              <p className="text-[11px] text-[#87929d] mt-0.5">{ticket.escalationReason}</p>
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
                className="flex-1 py-1.5 rounded text-[11px] font-medium bg-[#1f73b7] text-white hover:bg-[#1565a0] disabled:opacity-40 transition-colors"
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

  const handleInstruct = (ticketId: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, instruction: text } : t))
    );
    toast.success("Note saved — rep will learn from this");
  };

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
                const needsAttention = ticket.state === "escalated";
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
                      {needsAttention && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
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
          {escalatedCount > 0 && (
            <span className="w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold min-w-[18px] px-1">
              {escalatedCount}
            </span>
          )}
        </div>

        {selectedTicket && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              <SidebarContent
                ticket={selectedTicket}
                onInstruct={(text) => handleInstruct(selectedTicket.id, text)}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
