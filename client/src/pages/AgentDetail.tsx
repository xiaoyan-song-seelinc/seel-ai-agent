/**
 * AgentDetail: Individual agent profile, config, and chat management
 * Includes conversational management interface (Chat with Agent)
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Settings,
  MessageSquare,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  TrendingUp,
  Send,
  Sliders,
  FileText,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const agentData: Record<string, any> = {
  alpha: {
    name: "Agent Alpha",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp",
    mode: "Production",
    strategy: "Conservative",
    refundLimit: 50,
    csat: 4.6,
    resolutionRate: 91.2,
    avgResponseTime: "1.1s",
    ticketsToday: 847,
    trafficShare: 70,
  },
  beta: {
    name: "Agent Beta",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp",
    mode: "Training",
    strategy: "Aggressive",
    refundLimit: 150,
    csat: 4.2,
    resolutionRate: 84.5,
    avgResponseTime: "1.4s",
    ticketsToday: 256,
    trafficShare: 30,
  },
};

const chatMessages = [
  { role: "manager" as const, text: "Why did you give that customer a direct refund just now?", time: "2:34 PM" },
  { role: "agent" as const, text: "The customer's order total was $32, which is below the $50 auto-refund threshold set in the SOP. Additionally, the customer had been waiting for over 48 hours, so I processed the refund directly per the escalation policy.", time: "2:34 PM" },
  { role: "manager" as const, text: "Good. From now on, for VIP customers' refund requests, process them immediately regardless of amount. No need to escalate.", time: "2:35 PM" },
  { role: "agent" as const, text: "Understood. I've updated my handling policy: VIP customer refund requests will be prioritized and processed immediately without escalation review.", time: "2:35 PM" },
];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentData[params.id || "alpha"] || agentData.alpha;
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(chatMessages);
  const [refundLimit, setRefundLimit] = useState([agent.refundLimit]);
  const [trafficShare, setTrafficShare] = useState([agent.trafficShare]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { role: "manager", text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Understood. I've noted your instruction and will apply it to future interactions. Would you like me to update the corresponding SOP entry as well?",
        time: "Now",
      }]);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-background" />
          <div>
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
                {agent.mode}
              </Badge>
              <span className="text-xs text-muted-foreground">{agent.strategy} Strategy</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast("Shadow Mode toggle coming soon")}>
          <Shield className="w-3.5 h-3.5" />
          Shadow Mode
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat">
        <TabsList className="bg-muted">
          <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chat</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Sliders className="w-3.5 h-3.5" /> Configuration</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Performance</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Audit Log</TabsTrigger>
        </TabsList>

        {/* Chat Tab - Conversational Management */}
        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Conversational Management</CardTitle>
                <p className="text-xs text-muted-foreground">Train and instruct your agent through natural conversation</p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "manager" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "manager"
                            ? "bg-teal-600 text-white rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.role === "manager" ? "text-teal-200" : "text-muted-foreground"}`}>
                            {msg.role === "manager" ? "CX Manager" : agent.name} · {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Instruct, question, or review your agent..."
                      className="flex-1 px-4 py-2.5 bg-muted rounded-lg text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="icon" className="bg-teal-600 hover:bg-teal-700 shrink-0" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Sidebar */}
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                  <StatRow icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Resolution Rate" value={`${agent.resolutionRate}%`} />
                  <StatRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="CSAT Score" value={`${agent.csat}/5.0`} />
                  <StatRow icon={<Clock className="w-3.5 h-3.5" />} label="Avg Response" value={agent.avgResponseTime} />
                  <StatRow icon={<Zap className="w-3.5 h-3.5" />} label="Tickets Today" value={String(agent.ticketsToday)} />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Instructions</h4>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-xs">
                      <p className="text-teal-800">VIP refund requests: process immediately without escalation</p>
                      <p className="text-teal-600/70 text-[10px] mt-1">Updated 5 min ago</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted text-xs">
                      <p>Always address customers by first name</p>
                      <p className="text-muted-foreground text-[10px] mt-1">Updated 2 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Behavior Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Refund Limit</Label>
                    <span className="text-sm font-mono font-semibold">${refundLimit[0]}</span>
                  </div>
                  <Slider value={refundLimit} onValueChange={setRefundLimit} min={0} max={500} step={10} />
                  <p className="text-[10px] text-muted-foreground mt-1">Maximum auto-approved refund amount per ticket</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Traffic Share</Label>
                    <span className="text-sm font-mono font-semibold">{trafficShare[0]}%</span>
                  </div>
                  <Slider value={trafficShare} onValueChange={setTrafficShare} min={0} max={100} step={5} />
                  <p className="text-[10px] text-muted-foreground mt-1">Percentage of incoming tickets routed to this agent</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Store Credit First</Label>
                      <p className="text-[10px] text-muted-foreground">Offer store credit before cash refund</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Auto-Escalate on Negative Sentiment</Label>
                      <p className="text-[10px] text-muted-foreground">Transfer to human when customer is upset</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Proactive Follow-up</Label>
                      <p className="text-[10px] text-muted-foreground">Send follow-up message after resolution</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Permissions & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: "Read Tickets", enabled: true, level: "L1" },
                  { action: "Reply to Customer", enabled: true, level: "L1" },
                  { action: "Cancel Order", enabled: true, level: "L1" },
                  { action: "Process Refund", enabled: agent.mode === "Production", level: "L2" },
                  { action: "Modify Order", enabled: true, level: "L1" },
                  { action: "Update Shipping Address", enabled: true, level: "L1" },
                  { action: "Apply Discount Code", enabled: false, level: "L2" },
                  { action: "Access Customer PII", enabled: false, level: "L3" },
                ].map((perm) => (
                  <div key={perm.action} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{perm.action}</span>
                      <Badge variant="outline" className="text-[9px]">{perm.level}</Badge>
                    </div>
                    <Switch checked={perm.enabled} onCheckedChange={() => toast(`Permission updated`)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricBox label="Resolution Rate" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <MetricBox label="CSAT Score" value={`${agent.csat}`} trend="+0.1" />
            <MetricBox label="Avg Response" value={agent.avgResponseTime} trend="-0.2s" />
            <MetricBox label="Escalation Rate" value="8.8%" trend="-1.2%" />
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center py-12">
                Detailed performance charts and A/B test comparisons will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[
                  { time: "14:35:22", action: "reply_to_customer", ticket: "#4521", detail: "Sent tracking info for order #8834", status: "success" },
                  { time: "14:34:18", action: "get_order_status", ticket: "#4521", detail: "Fetched Shopify order #8834 details", status: "success" },
                  { time: "14:33:45", action: "cancel_order", ticket: "#4520", detail: "Cancelled order #7721 via Shopify API", status: "success" },
                  { time: "14:30:12", action: "process_refund", ticket: "#4519", detail: "Refund $120 blocked by guardrail (limit: $100)", status: "blocked" },
                  { time: "14:28:55", action: "escalate_to_human", ticket: "#4519", detail: "Customer sentiment negative, escalated to human agent", status: "escalated" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                    <span className="text-xs font-mono text-muted-foreground w-16">{log.time}</span>
                    <Badge variant="outline" className="text-[10px] font-mono w-36 justify-center">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground w-14">{log.ticket}</span>
                    <span className="text-sm flex-1">{log.detail}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      log.status === "success" ? "bg-teal-50 text-teal-700 border-teal-200" :
                      log.status === "blocked" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function MetricBox({ label, value, trend }: { label: string; value: string; trend: string }) {
  const isPositive = trend.startsWith("+") || trend.startsWith("-0");
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className={`text-xs mt-1 ${isPositive ? "text-teal-600" : "text-destructive"}`}>{trend} vs last week</p>
      </CardContent>
    </Card>
  );
}
