/**
 * Tickets: Ticket management view similar to Gorgias/Zendesk
 * Left panel: ticket list, Right panel: ticket detail preview
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  User,
  Package,
  RefreshCw,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const tickets = [
  {
    id: "4521",
    subject: "Where is my package? Order #8834",
    customer: "Sarah Johnson",
    email: "sarah.j@gmail.com",
    channel: "live_chat" as const,
    status: "resolved" as const,
    priority: "normal" as const,
    agent: "Agent Alpha",
    type: "WISMO",
    created: "2 min ago",
    lastMessage: "Your package is currently in transit and expected to arrive by March 27th. Here's your tracking link...",
    orderAmount: "$45.99",
    tags: ["WISMO", "Shipping"],
  },
  {
    id: "4520",
    subject: "I want to cancel my order #7721",
    customer: "Mike Chen",
    email: "mike.chen@outlook.com",
    channel: "email" as const,
    status: "resolved" as const,
    priority: "normal" as const,
    agent: "Agent Alpha",
    type: "Cancellation",
    created: "5 min ago",
    lastMessage: "Your order #7721 has been successfully cancelled and a full refund of $32.00 has been initiated...",
    orderAmount: "$32.00",
    tags: ["Cancellation", "Refund"],
  },
  {
    id: "4519",
    subject: "Wrong item received - need return",
    customer: "Emily Davis",
    email: "emily.d@yahoo.com",
    channel: "email" as const,
    status: "escalated" as const,
    priority: "high" as const,
    agent: "Agent Beta",
    type: "Return",
    created: "8 min ago",
    lastMessage: "I'm sorry to hear you received the wrong item. I'm escalating this to our specialist team who will...",
    orderAmount: "$128.50",
    tags: ["Return", "Wrong Item", "Escalated"],
  },
  {
    id: "4518",
    subject: "Refund not received after 5 days",
    customer: "James Wilson",
    email: "j.wilson@gmail.com",
    channel: "live_chat" as const,
    status: "in_progress" as const,
    priority: "high" as const,
    agent: "Agent Alpha",
    type: "Refund",
    created: "12 min ago",
    lastMessage: "I understand your concern about the pending refund. Let me check the status of your refund...",
    orderAmount: "$89.00",
    tags: ["Refund", "Follow-up"],
  },
  {
    id: "4517",
    subject: "Change shipping address for order #9012",
    customer: "Lisa Park",
    email: "lisa.park@gmail.com",
    channel: "email" as const,
    status: "resolved" as const,
    priority: "normal" as const,
    agent: "Agent Alpha",
    type: "Address Change",
    created: "15 min ago",
    lastMessage: "Great news! I've updated the shipping address for your order #9012. The new address is...",
    orderAmount: "$67.50",
    tags: ["Address Change"],
  },
  {
    id: "4516",
    subject: "Product quality complaint",
    customer: "Tom Brown",
    email: "tom.b@hotmail.com",
    channel: "email" as const,
    status: "waiting" as const,
    priority: "normal" as const,
    agent: "Agent Beta",
    type: "Complaint",
    created: "25 min ago",
    lastMessage: "Thank you for bringing this to our attention. Could you please share a photo of the product...",
    orderAmount: "$55.00",
    tags: ["Complaint", "Quality"],
  },
];

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState(tickets[0]);
  const [filter, setFilter] = useState("all");

  const filteredTickets = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 pb-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tickets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tickets.length} tickets · {tickets.filter(t => t.status === "resolved").length} resolved today</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Sort
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-muted h-8">
            <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs h-7">In Progress</TabsTrigger>
            <TabsTrigger value="waiting" className="text-xs h-7">Waiting</TabsTrigger>
            <TabsTrigger value="escalated" className="text-xs h-7">Escalated</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs h-7">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Split View */}
      <div className="flex-1 flex mt-3 overflow-hidden border-t border-border">
        {/* Ticket List */}
        <div className="w-[380px] border-r border-border overflow-y-auto custom-scrollbar">
          {filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={cn(
                "w-full text-left px-4 py-3.5 border-b border-border hover:bg-muted/50 transition-colors",
                selectedTicket.id === ticket.id && "bg-teal-50/50 border-l-2 border-l-teal-500"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {ticket.channel === "email" ? (
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-mono text-muted-foreground">#{ticket.id}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{ticket.created}</span>
              </div>
              <p className="text-sm font-medium line-clamp-1">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ticket.customer}</p>
              <div className="flex items-center gap-2 mt-2">
                <TicketStatusBadge status={ticket.status} />
                {ticket.priority === "high" && (
                  <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">High</Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">{ticket.agent}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Ticket Detail Preview */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl">
              {/* Ticket Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">#{selectedTicket.id}</span>
                    <TicketStatusBadge status={selectedTicket.status} />
                    {selectedTicket.priority === "high" && (
                      <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">High Priority</Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                </div>
              </div>

              {/* Customer Info */}
              <Card className="shadow-sm mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedTicket.customer}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{selectedTicket.orderAmount}</p>
                    <p className="text-[10px] text-muted-foreground">Order value</p>
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Thread */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{selectedTicket.customer}</span>
                      <span className="text-[10px] text-muted-foreground">{selectedTicket.created}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-sm leading-relaxed">
                      {selectedTicket.subject}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-teal-700">{selectedTicket.agent}</span>
                      <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-600 border-teal-200">AI</Badge>
                      <span className="text-[10px] text-muted-foreground">1 min later</span>
                    </div>
                    <div className="p-3 rounded-lg bg-teal-50 text-sm leading-relaxed border border-teal-100">
                      {selectedTicket.lastMessage}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                {selectedTicket.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Context */}
          <div className="w-64 border-l border-border p-4 overflow-y-auto custom-scrollbar bg-muted/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ticket Details</h4>
            <div className="space-y-3">
              <DetailRow label="Status" value={selectedTicket.status} />
              <DetailRow label="Channel" value={selectedTicket.channel === "email" ? "Email" : "Live Chat"} />
              <DetailRow label="Agent" value={selectedTicket.agent} />
              <DetailRow label="Type" value={selectedTicket.type} />
              <DetailRow label="Priority" value={selectedTicket.priority} />
              <DetailRow label="Created" value={selectedTicket.created} />
            </div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-3">Agent Actions</h4>
            <div className="space-y-1.5">
              {[
                { action: "get_order_status", status: "done" },
                { action: "check_shipping_info", status: "done" },
                { action: "reply_to_customer", status: "done" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-teal-500" />
                  <span className="font-mono text-muted-foreground">{a.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Bot(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    resolved: { label: "Resolved", className: "bg-teal-50 text-teal-700 border-teal-200" },
    escalated: { label: "Escalated", className: "bg-amber-50 text-amber-700 border-amber-200" },
    in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
    waiting: { label: "Waiting", className: "bg-gray-50 text-gray-600 border-gray-200" },
  };
  const c = config[status] || config.resolved;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium capitalize">{value.replace("_", " ")}</p>
    </div>
  );
}
