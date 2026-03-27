/* ── Zendesk App Sidebar Simulation ───────────────────────────
   Simulates the Zendesk sidebar iframe (320px wide).
   Features:
   - Approval cards (Approve / Deny with reason)
   - Bad Case marking with note
   - AI Activity timeline with "View reasoning" link
   Note: Takeover uses Zendesk native reassignment (not in App)
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ZENDESK_TICKETS,
  type ZendeskTicket,
} from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Flag,
  Send,
  DollarSign,
  Package,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ZendeskApp() {
  const [tickets, setTickets] = useState<ZendeskTicket[]>(ZENDESK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ZENDESK_TICKETS[0]?.id || "");
  const [badCaseNote, setBadCaseNote] = useState("");
  const [showBadCaseInput, setShowBadCaseInput] = useState(false);
  const [showDenyReason, setShowDenyReason] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [denyTargetTicketId, setDenyTargetTicketId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleApproval = (ticketId: string, status: "approved" | "denied", reason?: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, approval: t.approval ? { ...t.approval, status, respondedAt: new Date().toISOString() } : t.approval }
          : t
      )
    );
    if (status === "approved") {
      toast.success("Action approved — Alex will proceed");
    } else {
      toast.success(reason ? "Action denied with feedback — Alex will learn from this" : "Action denied — Alex will escalate");
    }
    setShowDenyReason(false);
    setDenyReason("");
    setDenyTargetTicketId(null);
  };

  const handleDenyClick = (ticketId: string) => {
    setDenyTargetTicketId(ticketId);
    setShowDenyReason(true);
  };

  const handleDenyConfirm = () => {
    if (denyTargetTicketId) {
      handleApproval(denyTargetTicketId, "denied", denyReason || undefined);
    }
  };

  const handleBadCase = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, markedBadCase: true, badCaseNote } : t))
    );
    setBadCaseNote("");
    setShowBadCaseInput(false);
    toast.success("Marked as bad case — Alex will learn from this");
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Left: Simulated Zendesk ticket view */}
      <div className="flex-1 bg-white border-r border-[#d8dcde]">
        <div className="h-12 bg-[#03363D] flex items-center px-4 gap-3">
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
          <span className="text-[11px] text-white/50">Zendesk Simulation</span>
        </div>

        <div className="flex h-[calc(100%-48px)]">
          {/* Ticket list */}
          <div className="w-[260px] border-r border-[#e9ebed] bg-[#f8f9fa]">
            <div className="p-3 border-b border-[#e9ebed]">
              <span className="text-[12px] font-medium text-[#2f3941]">Open Tickets ({tickets.length})</span>
            </div>
            <ScrollArea className="h-[calc(100%-44px)]">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setShowBadCaseInput(false);
                    setShowDenyReason(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-[#e9ebed] transition-colors",
                    selectedTicketId === ticket.id ? "bg-[#edf7ff]" : "hover:bg-[#f0f1f2]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-[#2f3941]">#{ticket.id.slice(-4)}</span>
                    {ticket.approval && ticket.approval.status === "pending" && (
                      <Badge className="h-[14px] px-1 text-[8px] bg-amber-100 text-amber-700 border-0">
                        Needs Approval
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-[#2f3941] font-medium truncate">{ticket.subject}</p>
                  <p className="text-[10px] text-[#68737d] mt-0.5">{ticket.customerName}</p>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Ticket detail */}
          {selectedTicket && (
            <div className="flex-1 p-6">
              <div className="max-w-[560px]">
                <h2 className="text-[16px] font-semibold text-[#2f3941] mb-1">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[12px] text-[#68737d]">{selectedTicket.customerName}</span>
                  <span className="text-[10px] text-[#87929d]">·</span>
                  <span className="text-[12px] text-[#68737d]">{selectedTicket.customerEmail}</span>
                </div>

                <div className="space-y-4">
                  {selectedTicket.messages.map((msg: { from: string; text: string; timestamp: string }, idx: number) => (
                    <div key={idx} className={cn("flex gap-3", msg.from === "agent" && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                          msg.from === "customer" && "bg-[#e9ebed] text-[#68737d]",
                          msg.from === "agent" && "bg-[#03363D] text-white",
                          msg.from === "internal" && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {msg.from === "customer" ? selectedTicket.customerName[0] : msg.from === "agent" ? <Bot className="w-3.5 h-3.5" /> : "!"}
                      </div>
                      <div
                        className={cn(
                          "max-w-[400px] rounded-lg px-3 py-2 text-[13px]",
                          msg.from === "customer" && "bg-[#f8f9fa] text-[#2f3941] border border-[#e9ebed]",
                          msg.from === "agent" && "bg-[#edf7ff] text-[#2f3941] border border-[#c2e0f4]",
                          msg.from === "internal" && "bg-amber-50 text-amber-900 border border-amber-200"
                        )}
                      >
                        {msg.from === "internal" && (
                          <span className="text-[9px] font-medium text-amber-600 uppercase tracking-wider block mb-1">Internal Note</span>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className="text-[9px] text-[#87929d] mt-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Zendesk App Sidebar (320px) */}
      <div className="w-[320px] bg-white flex flex-col shrink-0">
        <div className="h-12 bg-[#03363D] flex items-center px-4 gap-2">
          <Sparkles className="w-4 h-4 text-teal-300" />
          <span className="text-[13px] font-semibold text-white">Seel AI Agent</span>
        </div>

        {selectedTicket && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {/* Agent Status Bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#f8f9fa] border border-[#e9ebed]">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-[#2f3941] font-medium flex-1">Alex is handling this ticket</span>
              </div>

              {/* Approval Card */}
              {selectedTicket.approval && (
                <Card className={cn(
                  "border-l-[3px]",
                  selectedTicket.approval.status === "pending" && "border-l-amber-400",
                  selectedTicket.approval.status === "approved" && "border-l-emerald-400",
                  selectedTicket.approval.status === "denied" && "border-l-red-400"
                )}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTicket.approval.status === "pending" && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                      {selectedTicket.approval.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {selectedTicket.approval.status === "denied" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className="text-[12px] font-semibold text-[#2f3941]">
                        {selectedTicket.approval.status === "pending" ? "Approval Required" :
                         selectedTicket.approval.status === "approved" ? "Approved" : "Denied"}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#68737d] mb-2">{selectedTicket.approval.reason}</p>

                    {/* Action details */}
                    <div className="rounded bg-[#f8f9fa] p-2.5 mb-2 border border-[#e9ebed]">
                      <div className="flex items-center gap-1.5 mb-1">
                        {selectedTicket.approval.actionType === "refund" && <DollarSign className="w-3 h-3 text-[#68737d]" />}
                        {selectedTicket.approval.actionType === "replacement" && <Package className="w-3 h-3 text-[#68737d]" />}
                        <span className="text-[11px] font-medium text-[#2f3941] capitalize">{selectedTicket.approval.actionType}</span>
                      </div>
                      {selectedTicket.approval.details && (
                        <div className="space-y-0.5">
                          {Object.entries(selectedTicket.approval.details).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-[10px]">
                              <span className="text-[#87929d] capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              <span className="text-[#2f3941] font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timeout warning */}
                    {selectedTicket.approval.status === "pending" && selectedTicket.approval.timeoutMinutes && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Auto-escalates in {selectedTicket.approval.timeoutMinutes} min
                      </div>
                    )}

                    {/* Approve / Deny buttons */}
                    {selectedTicket.approval.status === "pending" && !showDenyReason && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 gap-1"
                          onClick={() => handleApproval(selectedTicket.id, "approved")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-[12px] text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => handleDenyClick(selectedTicket.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Deny
                        </Button>
                      </div>
                    )}

                    {/* Deny reason input */}
                    {showDenyReason && denyTargetTicketId === selectedTicket.id && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-[#68737d]">Why are you denying? Helps Alex learn. (Optional)</p>
                        <Textarea
                          placeholder="e.g. We don't offer refunds on sale items..."
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          className="text-[11px] min-h-[44px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-7 text-[11px] bg-red-600 hover:bg-red-700" onClick={handleDenyConfirm}>
                            Deny{denyReason.trim() ? " with Feedback" : ""}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => { setShowDenyReason(false); setDenyReason(""); setDenyTargetTicketId(null); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bad Case */}
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-8 text-[12px] gap-2 justify-start",
                    selectedTicket.markedBadCase ? "text-red-600" : "text-[#68737d] hover:text-[#2f3941]"
                  )}
                  onClick={() => {
                    if (selectedTicket.markedBadCase) return;
                    setShowBadCaseInput(!showBadCaseInput);
                  }}
                >
                  <Flag className={cn("w-3.5 h-3.5", selectedTicket.markedBadCase && "fill-red-600")} />
                  {selectedTicket.markedBadCase ? "Marked as Bad Case" : "Mark as Bad Case"}
                </Button>

                {showBadCaseInput && !selectedTicket.markedBadCase && (
                  <div className="mt-2 space-y-2 px-1">
                    <Textarea
                      placeholder="What went wrong? (optional)"
                      value={badCaseNote}
                      onChange={(e) => setBadCaseNote(e.target.value)}
                      className="text-[11px] min-h-[44px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-7 text-[11px]" onClick={() => handleBadCase(selectedTicket.id)}>
                        Submit
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setShowBadCaseInput(false); setBadCaseNote(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTicket.markedBadCase && selectedTicket.badCaseNote && (
                  <p className="text-[10px] text-[#87929d] mt-1 px-3">Note: "{selectedTicket.badCaseNote}"</p>
                )}
              </div>

              <Separator />

              {/* AI Activity Timeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-semibold text-[#2f3941]">AI Activity</h4>
                  <button
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    onClick={() => {
                      toast.info("Opens detailed reasoning in Seel Backend");
                      navigate("/messages");
                    }}
                  >
                    View reasoning
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {selectedTicket.aiActivity.map((activity: { type: string; description: string; timestamp: string }, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                            activity.type === "classify" && "bg-blue-100 text-blue-600",
                            activity.type === "respond" && "bg-emerald-100 text-emerald-600",
                            activity.type === "action" && "bg-amber-100 text-amber-600",
                            activity.type === "escalate" && "bg-red-100 text-red-600"
                          )}
                        >
                          {activity.type === "classify" && <MessageSquare className="w-2.5 h-2.5" />}
                          {activity.type === "respond" && <Send className="w-2.5 h-2.5" />}
                          {activity.type === "action" && <Zap className="w-2.5 h-2.5" />}
                          {activity.type === "escalate" && <AlertTriangle className="w-2.5 h-2.5" />}
                        </div>
                        {idx < selectedTicket.aiActivity.length - 1 && (
                          <div className="w-px h-full bg-[#e9ebed] mt-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-[11px] text-[#2f3941]">{activity.description}</p>
                        <span className="text-[9px] text-[#87929d]">
                          {new Date(activity.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zendesk native hint */}
              <div className="px-3 py-2 rounded bg-[#f8f9fa] border border-[#e9ebed]">
                <p className="text-[10px] text-[#87929d] leading-relaxed">
                  To take over this ticket, use Zendesk's native Assignee field to reassign it to yourself.
                </p>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
