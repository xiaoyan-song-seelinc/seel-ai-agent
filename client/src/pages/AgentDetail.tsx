/**
 * AgentDetail: Agent profile page — 1:1 Channel binding
 * Tabs: Overview / Skills & Actions / Channel Config / Conversations
 * Entity: Agent 1:1 Channel, global Knowledge, global Skills, Guardrail split
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageSquare, BarChart3, Shield, Clock,
  CheckCircle2, TrendingUp, Send, Sliders, Zap, BookOpen,
  Mail, MessageCircle, Bot, AlertTriangle, Target,
  Power, PowerOff, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Agent data (1:1 Channel) ── */
const agentData: Record<string, any> = {
  "rc-chat": {
    name: "RC Live Chat Agent",
    mode: "Production",
    status: "active",
    personality: "Friendly",
    customInstructions: "Always greet customers by name when available. Use emoji sparingly.",
    channel: { type: "chat", label: "Live Chat", provider: "RC Widget", responseTime: "Instant (<3s)", tone: "Conversational, friendly" },
    csat: 4.6, resolutionRate: 91.2, avgResponseTime: "1.1s", ticketsToday: 847,
    escalationRate: 8.8,
    skills: [
      { name: "Refund Processing", status: "active", conversations: 276, successRate: 94.2 },
      { name: "WISMO", status: "active", conversations: 342, successRate: 97.1 },
      { name: "Order Changes", status: "active", conversations: 154, successRate: 88.5 },
    ],
    recentConversations: [
      { id: "C-1001", customer: "Sarah Johnson", topic: "WISMO", sentiment: "positive", status: "resolved", time: "14:33", summary: "Provided tracking info for order #8834" },
      { id: "C-1002", customer: "Mike Chen", topic: "Refund", sentiment: "neutral", status: "active", time: "14:30", summary: "Processing partial refund for damaged item" },
      { id: "C-1003", customer: "Emma Davis", topic: "Order Change", sentiment: "positive", status: "resolved", time: "14:28", summary: "Updated shipping address before dispatch" },
      { id: "C-1004", customer: "James Wilson", topic: "WISMO", sentiment: "negative", status: "escalated", time: "14:25", summary: "Order delayed 10 days — escalated to human" },
    ],
    auditLog: [
      { time: "14:35:22", action: "reply_to_customer", ticket: "C-1001", detail: "Sent tracking info for order #8834", status: "success" },
      { time: "14:34:18", action: "check_order_status", ticket: "C-1001", detail: "Fetched Shopify order #8834 details", status: "success" },
      { time: "14:33:45", action: "process_refund", ticket: "C-1002", detail: "Partial refund $45 processed via Shopify", status: "success" },
      { time: "14:30:12", action: "process_refund", ticket: "C-1003", detail: "Refund $120 blocked by guardrail (limit: $100)", status: "blocked" },
      { time: "14:28:55", action: "escalate_to_human", ticket: "C-1004", detail: "Escalated — order >14 days late", status: "escalated" },
    ],
  },
};

/* ── Fallback for unknown IDs ── */
const defaultAgent = agentData["rc-chat"];

/* ── Chat messages for conversational management ── */
const initialChatMessages = [
  { role: "manager" as const, text: "Why did you give that customer a direct refund just now?", time: "2:34 PM" },
  { role: "agent" as const, text: "The customer's order total was $32, which is below the $50 auto-refund threshold. Additionally, the customer had been waiting for over 48 hours, so I processed the refund directly per the escalation policy.", time: "2:34 PM" },
  { role: "manager" as const, text: "Good. From now on, for VIP customers' refund requests, process them immediately regardless of amount.", time: "2:35 PM" },
  { role: "agent" as const, text: "Understood. I've updated my handling policy: VIP customer refund requests will be prioritized and processed immediately without escalation review.", time: "2:35 PM" },
];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentData[params.id || "rc-chat"] || defaultAgent;
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(initialChatMessages);
  const [agentEnabled, setAgentEnabled] = useState(agent.status === "active");

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: "manager" as const, text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Understood. I've noted your instruction and will apply it to future interactions. Would you like me to update the corresponding SOP entry as well?",
        time: "Now",
      }]);
    }, 1200);
  };

  const ChannelIcon = agent.channel.type === "email" ? Mail : MessageCircle;
  const channelColor = agent.channel.type === "email" ? "text-blue-500" : agent.channel.type === "social" ? "text-pink-500" : "text-teal-500";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center"><Bot className="w-6 h-6 text-teal-600" /></div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", agentEnabled ? "bg-teal-500" : "bg-gray-300")} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={cn("text-[10px]", agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200")}>{agent.mode}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ChannelIcon className={cn("w-3 h-3", channelColor)} />{agent.channel.label}</span>
              <span className="text-xs text-muted-foreground">· {agent.channel.provider}</span>
              <span className="text-xs text-muted-foreground">· {agent.personality}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{agentEnabled ? "Active" : "Paused"}</Label>
            <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5 text-xs"><Target className="w-3.5 h-3.5" /> Skills & Actions</TabsTrigger>
          <TabsTrigger value="channel" className="gap-1.5 text-xs"><ChannelIcon className="w-3.5 h-3.5" /> Channel Config</TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Conversations</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricBox label="Tickets Today" value={String(agent.ticketsToday)} trend="+12%" />
            <MetricBox label="Resolution Rate" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <MetricBox label="CSAT Score" value={String(agent.csat)} trend="+0.1" />
            <MetricBox label="Avg Response" value={agent.avgResponseTime} trend="-0.2s" />
            <MetricBox label="Escalation" value={`${agent.escalationRate}%`} trend="-1.2%" />
          </div>

          {/* Conversational Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Conversational Management</CardTitle>
                <p className="text-xs text-muted-foreground">Train and instruct your agent through natural conversation</p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "manager" ? "justify-end" : "justify-start"}`}>
                        <div className={cn("max-w-[80%] rounded-xl px-3.5 py-2.5",
                          msg.role === "manager" ? "bg-teal-600 text-white" : "bg-muted"
                        )}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={cn("text-[10px] mt-1", msg.role === "manager" ? "text-teal-200" : "text-muted-foreground")}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Instruct your agent..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} className="text-sm" />
                    <Button onClick={handleSendMessage} size="icon" className="bg-teal-600 hover:bg-teal-700 shrink-0"><Send className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {agent.auditLog.map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      log.status === "success" ? "bg-teal-500" : log.status === "blocked" ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{log.detail}</p>
                      <p className="text-[10px] text-muted-foreground">{log.time} · {log.ticket}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Skills & Actions ── */}
        <TabsContent value="skills" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50 border border-violet-200/60">
            <Target className="w-4 h-4 text-violet-600 shrink-0" />
            <p className="text-xs text-violet-700">Skills and Actions are <strong>globally shared</strong>. All active skills are available to this agent. Manage them in the <Link href="/knowledge"><span className="underline font-medium cursor-pointer">Knowledge</span></Link> page.</p>
          </div>

          <p className="text-sm font-semibold">Active Skills</p>
          <div className="space-y-3">
            {agent.skills.map((skill: any) => (
              <Card key={skill.name} className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", skill.status === "active" ? "bg-violet-100" : "bg-muted")}>
                        <Target className={cn("w-4 h-4", skill.status === "active" ? "text-violet-600" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{skill.name}</p>
                        <Badge variant={skill.status === "active" ? "default" : "secondary"} className={cn("text-[9px]", skill.status === "active" ? "bg-violet-100 text-violet-700" : "")}>{skill.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="p-2 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm font-bold">{skill.conversations}</p>
                      <p className="text-[10px] text-muted-foreground">Conversations</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm font-bold">{skill.successRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Channel Config ── */}
        <TabsContent value="channel" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                  agent.channel.type === "email" ? "bg-blue-100" : agent.channel.type === "social" ? "bg-pink-100" : "bg-teal-100"
                )}>
                  <ChannelIcon className={cn("w-6 h-6", channelColor)} />
                </div>
                <div>
                  <p className="text-base font-bold">{agent.channel.label}</p>
                  <p className="text-xs text-muted-foreground">via {agent.channel.provider}</p>
                </div>
                <Badge variant="outline" className="ml-auto bg-teal-50 text-teal-700 border-teal-200 text-xs">Connected</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Response Time</p>
                  <p className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{agent.channel.responseTime}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Tone</p>
                  <p className="text-sm font-medium">{agent.channel.tone}</p>
                </div>
              </div>

              {/* Channel-specific settings */}
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-sm font-semibold">Channel-specific Settings</p>
                {agent.channel.type === "chat" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Welcome Message</Label>
                      <Textarea defaultValue="Hi there! How can I help you today?" rows={2} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label className="text-xs">Rich Text Formatting</Label><p className="text-[10px] text-muted-foreground">Allow bold, links, and lists in responses</p></div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label className="text-xs">Typing Indicator</Label><p className="text-[10px] text-muted-foreground">Show typing animation before responses</p></div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
                {agent.channel.type === "email" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Signature</Label>
                      <Textarea defaultValue={"Best regards,\nSeel Support Team"} rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reply-to Address</Label>
                      <Input defaultValue="support@seel.com" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-xs" onClick={() => toast.success("Channel settings saved")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conversations ── */}
        <TabsContent value="conversations" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox label="Active" value={String(agent.recentConversations.filter((c: any) => c.status === "active").length)} color="text-teal-600" />
            <StatBox label="Resolved Today" value={String(agent.recentConversations.filter((c: any) => c.status === "resolved").length)} color="text-blue-600" />
            <StatBox label="Escalated" value={String(agent.recentConversations.filter((c: any) => c.status === "escalated").length)} color="text-amber-600" />
          </div>

          <div className="space-y-2">
            {agent.recentConversations.map((conv: any) => (
              <Card key={conv.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => toast.info("Conversation detail coming soon")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full shrink-0",
                    conv.status === "active" ? "bg-teal-500 animate-pulse" : conv.status === "resolved" ? "bg-blue-400" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{conv.customer}</p>
                      <Badge variant="outline" className="text-[9px]">{conv.topic}</Badge>
                      <Badge variant={conv.status === "active" ? "default" : conv.status === "resolved" ? "secondary" : "destructive"} className="text-[9px]">{conv.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.summary}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function MetricBox({ label, value, trend }: { label: string; value: string; trend: string }) {
  const isPositive = trend.startsWith("+") || trend.startsWith("-");
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between mt-1">
          <p className="text-xl font-bold">{value}</p>
          <span className={cn("text-[10px] font-medium", isPositive ? "text-teal-600" : "text-muted-foreground")}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-3 text-center">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent></Card>
  );
}
