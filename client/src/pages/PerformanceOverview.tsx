/**
 * Performance > Overview
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearch } from "wouter";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus,
  MessageSquare, CheckCircle2, Clock,
  Target, Shield, Package, ShoppingCart, HelpCircle,
  Calendar, Bot, SmilePlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MetricSet {
  totalSessions: { value: string; change: string };
  resolutionRate: { value: string; change: string };
  firstResponseTime: { value: string; change: string };
  csatScore: { value: string; change: string };
  sentimentChange: { value: string; change: string };
}
interface SkillRow {
  id: string; name: string; icon: typeof Package; iconColor: string;
  tickets: number; resolutionRate: number; firstResponseTime: string;
  csat: number; avgTurns: number; trend: "up" | "down" | "flat";
}
interface AgentRow { name: string; sessions: number; resolution: number; csat: number; }

const allMetrics: MetricSet = {
  totalSessions: { value: "2,847", change: "+12.3%" },
  resolutionRate: { value: "91.2%", change: "+2.1%" },
  firstResponseTime: { value: "1.1s", change: "-0.3s" },
  csatScore: { value: "4.6", change: "+0.1" },
  sentimentChange: { value: "+0.8", change: "+0.2" },
};
const agentMetrics: Record<string, MetricSet> = {
  "RC Live Chat Agent": {
    totalSessions: { value: "2,134", change: "+14.1%" },
    resolutionRate: { value: "92.4%", change: "+2.5%" },
    firstResponseTime: { value: "0.8s", change: "-0.2s" },
    csatScore: { value: "4.7", change: "+0.2" },
    sentimentChange: { value: "+0.9", change: "+0.3" },
  },
  "Email Support Agent": {
    totalSessions: { value: "713", change: "+8.2%" },
    resolutionRate: { value: "87.8%", change: "+1.3%" },
    firstResponseTime: { value: "2.4s", change: "-0.5s" },
    csatScore: { value: "4.4", change: "+0.1" },
    sentimentChange: { value: "+0.5", change: "+0.1" },
  },
};
const userIntentData = [
  { name: "Order Tracking", value: 34.2, count: 974 },
  { name: "Protection Claims", value: 18.6, count: 530 },
  { name: "After-sales", value: 13.6, count: 387 },
  { name: "Order Status", value: 8.0, count: 228 },
  { name: "Logistics Issues", value: 6.8, count: 194 },
  { name: "Cancel Order", value: 6.6, count: 188 },
  { name: "Return Request", value: 5.1, count: 145 },
  { name: "General Inquiry", value: 4.7, count: 134 },
  { name: "Other", value: 2.4, count: 67 },
];
const resolutionResultData = [
  { name: "Resolved", value: 55.6, color: "#6366f1" },
  { name: "Escalated", value: 30.9, color: "#f59e0b" },
  { name: "Not Resolved", value: 13.5, color: "#ef4444" },
];
const resolutionApproachData = [
  { name: "Info", value: 38.9, color: "#3b82f6" },
  { name: "Seel", value: 24.1, color: "#6366f1" },
  { name: "Merchant", value: 24.7, color: "#f59e0b" },
  { name: "Other", value: 12.1, color: "#94a3b8" },
  { name: "Confirm", value: 0.2, color: "#d1d5db" },
];
const sentimentChangeData = [
  { name: "0 (No change)", value: 67.9, color: "#94a3b8" },
  { name: "+2", value: 10.1, color: "#22c55e" },
  { name: "+1", value: 8.0, color: "#86efac" },
  { name: "-1", value: 7.8, color: "#fbbf24" },
  { name: "-2", value: 4.7, color: "#f97316" },
  { name: "+3 or more", value: 0.9, color: "#059669" },
  { name: "-3 or worse", value: 0.6, color: "#ef4444" },
];
const INTENT_COLORS = ["#6366f1","#3b82f6","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#94a3b8"];

const allSkillPerformance: SkillRow[] = [
  { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 1243, resolutionRate: 97.1, firstResponseTime: "0.8s", csat: 4.8, avgTurns: 2.1, trend: "up" },
  { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 876, resolutionRate: 94.2, firstResponseTime: "1.2s", csat: 4.6, avgTurns: 3.4, trend: "up" },
  { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 428, resolutionRate: 88.5, firstResponseTime: "1.5s", csat: 4.3, avgTurns: 4.2, trend: "down" },
  { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 300, resolutionRate: 82.0, firstResponseTime: "1.8s", csat: 4.1, avgTurns: 5.1, trend: "flat" },
];
const agentSkillPerformance: Record<string, SkillRow[]> = {
  "RC Live Chat Agent": [
    { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 987, resolutionRate: 97.8, firstResponseTime: "0.6s", csat: 4.9, avgTurns: 1.9, trend: "up" },
    { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 724, resolutionRate: 95.1, firstResponseTime: "1.0s", csat: 4.7, avgTurns: 3.2, trend: "up" },
    { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 312, resolutionRate: 90.2, firstResponseTime: "1.3s", csat: 4.4, avgTurns: 4.0, trend: "flat" },
    { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 111, resolutionRate: 84.0, firstResponseTime: "1.5s", csat: 4.2, avgTurns: 4.8, trend: "flat" },
  ],
  "Email Support Agent": [
    { id: "s1", name: "Order Tracking (WISMO)", icon: Package, iconColor: "text-blue-600 bg-blue-50", tickets: 256, resolutionRate: 94.5, firstResponseTime: "2.0s", csat: 4.5, avgTurns: 2.8, trend: "up" },
    { id: "s2", name: "Seel Protection Claims", icon: Shield, iconColor: "text-primary bg-primary/10", tickets: 152, resolutionRate: 90.1, firstResponseTime: "2.8s", csat: 4.3, avgTurns: 4.1, trend: "flat" },
    { id: "s3", name: "Order Cancellation", icon: ShoppingCart, iconColor: "text-amber-600 bg-amber-50", tickets: 116, resolutionRate: 83.6, firstResponseTime: "3.2s", csat: 4.0, avgTurns: 5.3, trend: "down" },
    { id: "s4", name: "General Inquiry", icon: HelpCircle, iconColor: "text-gray-600 bg-gray-100", tickets: 189, resolutionRate: 80.4, firstResponseTime: "2.5s", csat: 3.9, avgTurns: 5.8, trend: "down" },
  ],
};
const agentBreakdown: AgentRow[] = [
  { name: "RC Live Chat Agent", sessions: 2134, resolution: 92.4, csat: 4.7 },
  { name: "Email Support Agent", sessions: 713, resolution: 87.8, csat: 4.4 },
];
const agentNames = agentBreakdown.map(a => a.name);
const hasMultipleAgents = agentNames.length >= 2;
const trendIcon = (t: "up" | "down" | "flat") => {
  if (t === "up") return <TrendingUp className="w-3 h-3 text-primary" />;
  if (t === "down") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};
const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{d.value}%</p>
    </div>
  );
}

function DonutChartCard({ title, data, centerLabel }: {
  title: string;
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-1 px-4 pt-3">
        <CardTitle className="text-xs font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-[130px] h-[130px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={1} dataKey="value" stroke="none">
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RTooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {centerLabel && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-muted-foreground">{centerLabel}</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate flex-1">{item.name}</span>
                <span className="font-medium tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IntentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{d.value}% ({d.count} sessions)</p>
    </div>
  );
}

export default function PerformanceOverview() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const agentFromUrl = urlParams.get("agent") || "all";
  const [timeRange, setTimeRange] = useState("7d");
  const [agentFilter, setAgentFilter] = useState(agentFromUrl);

  const metrics = useMemo(() => {
    if (agentFilter === "all") return allMetrics;
    return agentMetrics[agentFilter] || allMetrics;
  }, [agentFilter]);

  const skillData = useMemo(() => {
    if (agentFilter === "all") return allSkillPerformance;
    return agentSkillPerformance[agentFilter] || allSkillPerformance;
  }, [agentFilter]);

  const metricCards = [
    { label: "Total Sessions", value: metrics.totalSessions.value, change: metrics.totalSessions.change, icon: MessageSquare, desc: "vs previous 7 days" },
    { label: "Resolution Rate", value: metrics.resolutionRate.value, change: metrics.resolutionRate.change, icon: CheckCircle2, desc: "auto-resolved without escalation" },
    { label: "First Response Time", value: metrics.firstResponseTime.value, change: metrics.firstResponseTime.change, icon: Clock, desc: "time to first agent reply" },
    { label: "CSAT Score", value: metrics.csatScore.value, change: metrics.csatScore.change, icon: Target, desc: "average customer satisfaction" },
    { label: "Sentiment Change", value: metrics.sentimentChange.value, change: metrics.sentimentChange.change, icon: SmilePlus, desc: "avg sentiment shift per session" },
  ];

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[1100px] space-y-6">
      {/* Header */}
      <motion.div variants={iV} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor AI agent performance across all skills and conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {hasMultipleAgents && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Bot className="w-3 h-3 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agentNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {agentFilter !== "all" && (
        <motion.div variants={iV} className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1"><Bot className="w-2.5 h-2.5" />Filtered: {agentFilter}</Badge>
          <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground" onClick={() => setAgentFilter("all")}>Clear filter</Button>
        </motion.div>
      )}

      {/* Core Metrics */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metricCards.map((m) => (
            <Card key={m.label} className="shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/[0.06] flex items-center justify-center">
                    <m.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[10px] font-medium text-primary">{m.change}</span>
                  </div>
                </div>
                <p className="text-xl font-bold leading-none">{m.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div variants={iV} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Intent - Horizontal Bar Chart */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-1 px-4 pt-3">
            <CardTitle className="text-xs font-semibold">User Intent Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userIntentData} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <RTooltip content={<IntentTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {userIntentData.map((_, i) => <Cell key={i} fill={INTENT_COLORS[i % INTENT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Result */}
        <DonutChartCard title="Resolution Result" data={resolutionResultData} centerLabel="2,847" />

        {/* Resolution Approach */}
        <DonutChartCard title="Resolution Approach" data={resolutionApproachData} />

        {/* Sentiment Change */}
        <DonutChartCard title="Sentiment Change" data={sentimentChangeData} centerLabel="Avg +0.8" />
      </motion.div>

      {/* Skill Performance Table */}
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Performance by Skill</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{skillData.length} skills active</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground w-[240px]">Skill</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Tickets</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Resolution Rate</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">First Response</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">CSAT</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Avg Turns</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-center w-[60px]">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillData.map((skill) => (
                  <TableRow key={skill.id} className="group cursor-pointer">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", skill.iconColor)}>
                          <skill.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium group-hover:text-primary transition-colors">{skill.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><span className="text-xs font-semibold">{skill.tickets.toLocaleString()}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn("text-xs font-semibold", skill.resolutionRate >= 95 ? "text-primary" : skill.resolutionRate >= 90 ? "text-foreground" : "text-amber-600")}>{skill.resolutionRate}%</span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", skill.resolutionRate >= 95 ? "bg-primary" : skill.resolutionRate >= 90 ? "bg-blue-400" : "bg-amber-400")} style={{ width: `${skill.resolutionRate}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><span className="text-xs text-muted-foreground">{skill.firstResponseTime}</span></TableCell>
                    <TableCell className="text-right"><span className="text-xs font-semibold">{skill.csat}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={cn("text-xs font-semibold", skill.avgTurns <= 3 ? "text-primary" : skill.avgTurns <= 4 ? "text-foreground" : "text-amber-600")}>{skill.avgTurns}</span>
                        <span className="text-[8px] text-muted-foreground/50">avg 3.5</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{trendIcon(skill.trend)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Breakdown */}
      {agentFilter === "all" && hasMultipleAgents && (
        <motion.div variants={iV}>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Agent Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">Agent</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Sessions</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">Resolution Rate</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">CSAT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentBreakdown.map((agent) => (
                    <TableRow key={agent.name} className="cursor-pointer hover:bg-muted/30" onClick={() => setAgentFilter(agent.name)}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium hover:text-primary transition-colors">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right"><span className="text-xs font-semibold">{agent.sessions.toLocaleString()}</span></TableCell>
                      <TableCell className="text-right"><span className="text-xs font-semibold">{agent.resolution}%</span></TableCell>
                      <TableCell className="text-right"><span className="text-xs font-semibold">{agent.csat}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
