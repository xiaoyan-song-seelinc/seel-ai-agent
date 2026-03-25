/**
 * Agents: Virtual employee team management
 * Shows agent cards with status, performance, and lifecycle controls
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Bot,
  Plus,
  MoreVertical,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Pause,
  Play,
  Trash2,
  Settings,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const agents = [
  {
    id: "alpha",
    name: "Agent Alpha",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp",
    mode: "Production" as const,
    status: "active" as const,
    strategy: "Conservative",
    refundLimit: 50,
    ticketsToday: 847,
    resolutionRate: 91.2,
    avgResponseTime: "1.1s",
    csat: 4.6,
    trafficShare: 70,
    channels: ["Email", "Live Chat"],
    skills: ["WISMO", "Cancellation", "Address Change", "Refund"],
    uptime: "99.8%",
    createdAt: "2025-03-01",
  },
  {
    id: "beta",
    name: "Agent Beta",
    avatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp",
    mode: "Training" as const,
    status: "training" as const,
    strategy: "Aggressive",
    refundLimit: 150,
    ticketsToday: 256,
    resolutionRate: 84.5,
    avgResponseTime: "1.4s",
    csat: 4.2,
    trafficShare: 30,
    channels: ["Email"],
    skills: ["WISMO", "Cancellation", "Refund", "Return"],
    uptime: "98.5%",
    createdAt: "2025-03-15",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Agents() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your virtual support team — hire, train, promote, and evaluate</p>
        </div>
        <Button className="gap-2 bg-teal-600 hover:bg-teal-700" onClick={() => toast("Create Agent wizard coming soon")}>
          <Plus className="w-4 h-4" />
          Hire New Agent
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<Bot className="w-4 h-4" />} label="Total Agents" value="2" />
        <MiniStat icon={<Play className="w-4 h-4" />} label="In Production" value="1" />
        <MiniStat icon={<Zap className="w-4 h-4" />} label="In Training" value="1" />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Avg Resolution" value="87.9%" />
      </motion.div>

      {/* Agent Cards */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All Agents</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="production" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agents.filter(a => a.mode === "Production").map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="training" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agents.filter(a => a.mode === "Training").map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Lifecycle Legend */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Agent Lifecycle</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "Hire", icon: Plus, desc: "Create new Agent" },
                { label: "Train", icon: Settings, desc: "Training Mode" },
                { label: "Promote", icon: ArrowUpRight, desc: "To Production" },
                { label: "Evaluate", icon: BarChart3, desc: "Compare CSAT & metrics" },
                { label: "Retire", icon: Trash2, desc: "Deactivate poor performers" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                    <step.icon className="w-3.5 h-3.5 text-teal-600" />
                    <div>
                      <span className="text-xs font-semibold">{step.label}</span>
                      <span className="text-[10px] text-muted-foreground block">{step.desc}</span>
                    </div>
                  </div>
                  {i < 4 && <span className="text-muted-foreground text-xs">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AgentCard({ agent }: { agent: typeof agents[0] }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-background" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  agent.status === "active" ? "bg-teal-500" : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <Link href={`/agents/${agent.id}`} className="text-base font-bold hover:text-primary transition-colors">
                {agent.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    agent.mode === "Production"
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {agent.mode}
                </Badge>
                <span className="text-xs text-muted-foreground">{agent.strategy}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast("Opening agent config...")}>
                <Settings className="w-4 h-4 mr-2" /> Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Opening chat with agent...")}>
                <MessageSquare className="w-4 h-4 mr-2" /> Chat with Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Opening performance report...")}>
                <BarChart3 className="w-4 h-4 mr-2" /> Performance Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {agent.mode === "Training" ? (
                <DropdownMenuItem onClick={() => toast("Promoting to Production...")}>
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Promote to Production
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => toast("Pausing agent...")}>
                  <Pause className="w-4 h-4 mr-2" /> Pause Agent
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => toast("This will retire the agent")}>
                <Trash2 className="w-4 h-4 mr-2" /> Retire Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tickets Today</p>
            <p className="text-lg font-bold mt-0.5">{agent.ticketsToday}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolution Rate</p>
            <p className="text-lg font-bold mt-0.5">{agent.resolutionRate}%</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CSAT</p>
            <p className="text-lg font-bold mt-0.5">{agent.csat}/5.0</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Response</p>
            <p className="text-lg font-bold mt-0.5">{agent.avgResponseTime}</p>
          </div>
        </div>

        {/* Traffic Share */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Traffic Share</span>
            <span className="font-semibold">{agent.trafficShare}%</span>
          </div>
          <Progress value={agent.trafficShare} className="h-2" />
        </div>

        {/* Skills & Channels */}
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-[10px] font-normal">{skill}</Badge>
          ))}
          {agent.channels.map((ch) => (
            <Badge key={ch} variant="outline" className="text-[10px] font-normal">{ch}</Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Refund Limit: ${agent.refundLimit}</span>
          <span className="text-[10px] text-muted-foreground">Uptime: {agent.uptime}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="p-2 rounded-lg bg-teal-50 text-teal-600">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
