/**
 * Conversations: Real-time conversation view with customer interactions
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  User,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const conversations = [
  {
    id: "C-1001",
    customer: "Sarah Johnson",
    agent: "Agent Alpha",
    topic: "WISMO",
    status: "resolved" as const,
    startTime: "14:32",
    messages: [
      { role: "customer" as const, text: "Hi, I placed an order 3 days ago and haven't received any shipping updates. Order #8834.", time: "14:32" },
      { role: "agent" as const, text: "Hello Sarah! Let me check the status of your order #8834 right away.", time: "14:32", action: "get_order_status" },
      { role: "agent" as const, text: "I found your order. It's currently in transit with FedEx. Tracking number: FX-2847391. The estimated delivery is March 27th. Here's your tracking link: https://tracking.fedex.com/FX-2847391", time: "14:33" },
      { role: "customer" as const, text: "Oh great, thank you so much! That's very helpful.", time: "14:33" },
      { role: "agent" as const, text: "You're welcome, Sarah! Is there anything else I can help you with?", time: "14:33" },
    ],
    sentiment: 0.85,
    csat: 5,
  },
  {
    id: "C-1002",
    customer: "Mike Chen",
    agent: "Agent Alpha",
    topic: "Cancellation",
    status: "resolved" as const,
    startTime: "14:28",
    messages: [
      { role: "customer" as const, text: "I need to cancel order #7721. I ordered the wrong size.", time: "14:28" },
      { role: "agent" as const, text: "I understand, Mike. Let me look into order #7721 for you.", time: "14:28", action: "get_order_status" },
      { role: "agent" as const, text: "I can see your order hasn't shipped yet, so I can cancel it right away. Would you like me to proceed with the cancellation and full refund of $32.00?", time: "14:29" },
      { role: "customer" as const, text: "Yes please, cancel it.", time: "14:29" },
      { role: "agent" as const, text: "Done! Order #7721 has been cancelled and a full refund of $32.00 will be processed within 3-5 business days. Would you like help placing a new order with the correct size?", time: "14:29", action: "cancel_order" },
    ],
    sentiment: 0.6,
    csat: 4,
  },
  {
    id: "C-1003",
    customer: "Emily Davis",
    agent: "Agent Beta",
    topic: "Return",
    status: "escalated" as const,
    startTime: "14:20",
    messages: [
      { role: "customer" as const, text: "I received the completely wrong item! This is unacceptable. I ordered a blue dress and got a red scarf. Order #9945.", time: "14:20" },
      { role: "agent" as const, text: "I'm really sorry about this mix-up, Emily. That must be very frustrating. Let me check your order details.", time: "14:20", action: "get_order_status" },
      { role: "agent" as const, text: "I can confirm there was an error with your order #9945. The total was $128.50. I'd like to arrange a return and full refund for you. However, since the refund amount exceeds my authorization limit, I'm connecting you with a specialist who can process this immediately.", time: "14:21", action: "escalate_to_human" },
      { role: "system" as const, text: "Escalated to human agent — Guardrail triggered: refund amount $128.50 exceeds $100 limit", time: "14:21" },
    ],
    sentiment: -0.4,
    csat: null,
  },
];

export default function Conversations() {
  const [selectedConv, setSelectedConv] = useState(conversations[0]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <h1 className="text-xl font-bold tracking-tight">Conversations</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Review AI agent conversations with customers</p>
      </div>

      {/* Split View */}
      <div className="flex-1 flex mt-3 overflow-hidden border-t border-border">
        {/* Conversation List */}
        <div className="w-[320px] border-r border-border overflow-y-auto custom-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                "w-full text-left px-4 py-3.5 border-b border-border hover:bg-muted/50 transition-colors",
                selectedConv.id === conv.id && "bg-teal-50/50 border-l-2 border-l-teal-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{conv.id}</span>
                <span className="text-[10px] text-muted-foreground">{conv.startTime}</span>
              </div>
              <p className="text-sm font-medium">{conv.customer}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[9px]">{conv.topic}</Badge>
                <ConvStatusBadge status={conv.status} />
                <span className="text-[10px] text-muted-foreground ml-auto">{conv.agent}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Conv Header */}
          <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedConv.customer}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{selectedConv.agent}</span>
                  <ConvStatusBadge status={selectedConv.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => toast("Flagging conversation for review")}>
                <Flag className="w-3 h-3" /> Flag
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => toast("Opening in ticket view")}>
                <ExternalLink className="w-3 h-3" /> View Ticket
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {selectedConv.messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "system" ? (
                  <div className="flex items-center gap-2 justify-center py-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{msg.text}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                ) : (
                  <div className={`flex gap-3 ${msg.role === "customer" ? "" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "customer" ? "bg-muted" : "bg-teal-100"
                    }`}>
                      {msg.role === "customer" ? (
                        <User className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <BotIcon className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.role === "customer" ? selectedConv.customer : selectedConv.agent}
                        </span>
                        {msg.role === "agent" && (
                          <Badge variant="outline" className="text-[8px] bg-teal-50 text-teal-600 border-teal-200">AI</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      </div>
                      <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                        msg.role === "customer" ? "bg-muted" : "bg-teal-50 border border-teal-100"
                      }`}>
                        {msg.text}
                      </div>
                      {"action" in msg && msg.action && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[8px] font-mono bg-blue-50 text-blue-600 border-blue-200">
                            Action: {msg.action}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feedback Bar */}
          <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Sentiment:</span>
                <SentimentBadge score={selectedConv.sentiment} />
              </div>
              {selectedConv.csat && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">CSAT:</span>
                  <span className="text-xs font-semibold">{selectedConv.csat}/5</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => toast("Marked as good response")}>
                <ThumbsUp className="w-3 h-3" /> Good
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => toast("Marked for improvement")}>
                <ThumbsDown className="w-3 h-3" /> Needs Work
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BotIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  );
}

function ConvStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    resolved: { label: "Resolved", className: "bg-teal-50 text-teal-700 border-teal-200" },
    escalated: { label: "Escalated", className: "bg-amber-50 text-amber-700 border-amber-200" },
    active: { label: "Active", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const c = config[status] || config.resolved;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}

function SentimentBadge({ score }: { score: number }) {
  const color = score > 0.5 ? "text-teal-600 bg-teal-50" : score > 0 ? "text-blue-600 bg-blue-50" : score > -0.3 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return (
    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${color}`}>
      {score > 0 ? "+" : ""}{score.toFixed(2)}
    </span>
  );
}
