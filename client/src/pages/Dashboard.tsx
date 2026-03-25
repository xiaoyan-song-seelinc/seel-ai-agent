/**
 * Dashboard: Overview of AI Agent performance
 * Shows key metrics, agent status, recent tickets, and alerts
 */
import { motion } from "framer-motion";
import {
  Bot,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const ticketData = [
  { date: "Mon", resolved: 145, escalated: 12, total: 157 },
  { date: "Tue", resolved: 168, escalated: 8, total: 176 },
  { date: "Wed", resolved: 152, escalated: 15, total: 167 },
  { date: "Thu", resolved: 189, escalated: 11, total: 200 },
  { date: "Fri", resolved: 201, escalated: 9, total: 210 },
  { date: "Sat", resolved: 98, escalated: 5, total: 103 },
  { date: "Sun", resolved: 87, escalated: 3, total: 90 },
];

const csatData = [
  { hour: "00:00", score: 4.2 },
  { hour: "04:00", score: 4.5 },
  { hour: "08:00", score: 4.1 },
  { hour: "12:00", score: 4.6 },
  { hour: "16:00", score: 4.3 },
  { hour: "20:00", score: 4.7 },
  { hour: "Now", score: 4.5 },
];

const recentTickets = [
  { id: "#4521", subject: "Where is my package?", agent: "Agent Alpha", status: "resolved", time: "2m ago", type: "WISMO" },
  { id: "#4520", subject: "I want to cancel order #8834", agent: "Agent Alpha", status: "resolved", time: "5m ago", type: "Cancellation" },
  { id: "#4519", subject: "Wrong item received", agent: "Agent Beta", status: "escalated", time: "8m ago", type: "Return" },
  { id: "#4518", subject: "Refund not received yet", agent: "Agent Alpha", status: "in_progress", time: "12m ago", type: "Refund" },
  { id: "#4517", subject: "Change shipping address", agent: "Agent Alpha", status: "resolved", time: "15m ago", type: "Address Change" },
];

const alerts = [
  { type: "warning", message: "Agent Beta CSAT dropped below 4.0 in the last hour", time: "10m ago" },
  { type: "info", message: "Agent Alpha resolved 200+ tickets today - new record!", time: "1h ago" },
  { type: "error", message: "Guardrail triggered: Refund amount $120 exceeds $100 limit", time: "2h ago" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor your AI agent team performance in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Live
          </Badge>
          <span className="text-xs text-muted-foreground">Last updated: just now</span>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Ticket className="w-4 h-4" />}
          label="Tickets Today"
          value="1,103"
          change="+12.3%"
          trend="up"
          detail="vs. yesterday"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Auto-Resolved"
          value="87.2%"
          change="+3.1%"
          trend="up"
          detail="resolution rate"
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Avg Response"
          value="1.2s"
          change="-0.3s"
          trend="up"
          detail="response time"
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="CSAT Score"
          value="4.5"
          change="+0.2"
          trend="up"
          detail="out of 5.0"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Ticket Volume (7 Days)</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                    Resolved
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    Escalated
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ticketData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.91 0.006 80)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="resolved" fill="oklch(0.56 0.11 175)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="escalated" fill="oklch(0.80 0.15 80)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">CSAT Trend (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={csatData}>
                  <defs>
                    <linearGradient id="csatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                  <YAxis domain={[3.5, 5]} tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.91 0.006 80)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="oklch(0.56 0.11 175)"
                    fill="url(#csatGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tickets */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Tickets</CardTitle>
                <a href="/tickets" className="text-xs text-primary hover:underline font-medium">View all</a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentTickets.map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/tickets/${ticket.id.replace("#", "")}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-12">{ticket.id}</span>
                      <div>
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ticket.agent} · {ticket.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs text-muted-foreground w-14 text-right">{ticket.time}</span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Agent Status */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Agent Quick Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AgentStatusRow
                name="Agent Alpha"
                mode="Production"
                load={72}
                status="active"
                avatar="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp"
              />
              <AgentStatusRow
                name="Agent Beta"
                mode="Training"
                load={30}
                status="training"
                avatar="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp"
              />
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/50">
                  {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  {alert.type === "info" && <Zap className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
                  {alert.type === "error" && <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  trend,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  detail: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">{icon}</div>
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-teal-600" : "text-destructive"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label} · {detail}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    resolved: { label: "Resolved", className: "bg-teal-50 text-teal-700 border-teal-200" },
    escalated: { label: "Escalated", className: "bg-amber-50 text-amber-700 border-amber-200" },
    in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const c = config[status] || config.resolved;
  return <Badge variant="outline" className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

function AgentStatusRow({
  name,
  mode,
  load,
  status,
  avatar,
}: {
  name: string;
  mode: string;
  load: number;
  status: string;
  avatar: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
            status === "active" ? "bg-teal-500" : "bg-amber-400"
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline" className={`text-[10px] ${mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {mode}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Progress value={load} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground w-8">{load}%</span>
        </div>
      </div>
    </div>
  );
}
