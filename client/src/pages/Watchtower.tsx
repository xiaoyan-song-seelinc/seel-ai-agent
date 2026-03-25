/**
 * Watchtower: Real-time monitoring and quality assurance
 * Live conversation monitoring, anomaly detection, A/B testing dashboard
 */
import { motion } from "framer-motion";
import {
  Eye,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const abTestData = [
  { day: "Day 1", alpha: 4.2, beta: 4.0 },
  { day: "Day 2", alpha: 4.3, beta: 4.1 },
  { day: "Day 3", alpha: 4.5, beta: 3.9 },
  { day: "Day 4", alpha: 4.4, beta: 4.2 },
  { day: "Day 5", alpha: 4.6, beta: 4.3 },
  { day: "Day 6", alpha: 4.5, beta: 4.1 },
  { day: "Day 7", alpha: 4.6, beta: 4.2 },
];

const liveConversations = [
  { id: "C-1001", customer: "Sarah J.", agent: "Alpha", topic: "WISMO", sentiment: 0.8, status: "active", duration: "2:34" },
  { id: "C-1002", customer: "Mike C.", agent: "Alpha", topic: "Refund", sentiment: 0.3, status: "active", duration: "5:12" },
  { id: "C-1003", customer: "Emily D.", agent: "Beta", topic: "Return", sentiment: -0.4, status: "warning", duration: "8:45" },
  { id: "C-1004", customer: "James W.", agent: "Alpha", topic: "Shipping", sentiment: 0.6, status: "active", duration: "1:20" },
  { id: "C-1005", customer: "Lisa P.", agent: "Beta", topic: "Cancellation", sentiment: -0.1, status: "active", duration: "3:55" },
];

const anomalies = [
  { type: "CSAT Drop", detail: "Agent Beta CSAT dropped 0.4 points in last 2 hours", severity: "high", time: "10 min ago" },
  { type: "Response Delay", detail: "Average response time increased to 2.8s (threshold: 2s)", severity: "medium", time: "25 min ago" },
  { type: "Escalation Spike", detail: "3 consecutive escalations from Agent Beta", severity: "high", time: "1 hour ago" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function Watchtower() {
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
          <h1 className="text-2xl font-bold tracking-tight">Watchtower</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time monitoring, anomaly detection, and A/B testing</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Monitoring Active
          </Badge>
        </div>
      </motion.div>

      <Tabs defaultValue="live">
        <TabsList className="bg-muted">
          <TabsTrigger value="live" className="gap-1.5"><Activity className="w-3.5 h-3.5" /> Live Monitor</TabsTrigger>
          <TabsTrigger value="abtest" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> A/B Testing</TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Anomalies</TabsTrigger>
        </TabsList>

        {/* Live Monitor */}
        <TabsContent value="live" className="mt-4 space-y-4">
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Active Conversations" value="5" color="teal" />
            <StatCard icon={<Zap className="w-4 h-4" />} label="Avg Response Time" value="1.3s" color="blue" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Current CSAT" value="4.5" color="teal" />
            <StatCard icon={<Shield className="w-4 h-4" />} label="Guardrail Triggers" value="2" color="amber" />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Live Conversations</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-7 gap-4 px-5 py-2 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>ID</span>
                    <span>Customer</span>
                    <span>Agent</span>
                    <span>Topic</span>
                    <span>Sentiment</span>
                    <span>Duration</span>
                    <span>Status</span>
                  </div>
                  {liveConversations.map((conv) => (
                    <div key={conv.id} className="grid grid-cols-7 gap-4 px-5 py-3 items-center hover:bg-muted/30 transition-colors">
                      <span className="text-xs font-mono">{conv.id}</span>
                      <span className="text-xs">{conv.customer}</span>
                      <span className="text-xs">{conv.agent}</span>
                      <Badge variant="secondary" className="text-[9px] w-fit">{conv.topic}</Badge>
                      <SentimentIndicator score={conv.sentiment} />
                      <span className="text-xs font-mono">{conv.duration}</span>
                      <Badge variant="outline" className={`text-[9px] w-fit ${
                        conv.status === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
                      }`}>
                        {conv.status === "warning" ? "Warning" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* A/B Testing */}
        <TabsContent value="abtest" className="mt-4 space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">A/B Test: Agent Alpha vs Agent Beta</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">CSAT comparison over 7 days · Traffic split: 70/30</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Running</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={abTestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                    <YAxis domain={[3.5, 5]} tick={{ fontSize: 12 }} stroke="oklch(0.65 0.02 260)" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid oklch(0.91 0.006 80)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="alpha" stroke="oklch(0.56 0.11 175)" strokeWidth={2} name="Agent Alpha" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="beta" stroke="oklch(0.70 0.15 50)" strokeWidth={2} name="Agent Beta" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-teal-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-1-5Cg5ZwWmEXaFkczkGxLsLd.webp" className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <p className="text-sm font-bold">Agent Alpha</p>
                    <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Winner</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricItem label="CSAT" value="4.6" trend="+0.4" />
                  <MetricItem label="Resolution" value="91.2%" trend="+6.7%" />
                  <MetricItem label="Response" value="1.1s" trend="-0.3s" />
                  <MetricItem label="Escalation" value="8.8%" trend="-3.2%" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/agent-avatar-2-MogZTfSmY2RosF8fVB5Z8c.webp" className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <p className="text-sm font-bold">Agent Beta</p>
                    <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Challenger</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricItem label="CSAT" value="4.2" trend="+0.2" />
                  <MetricItem label="Resolution" value="84.5%" trend="+2.1%" />
                  <MetricItem label="Response" value="1.4s" trend="-0.1s" />
                  <MetricItem label="Escalation" value="15.5%" trend="-1.5%" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Anomalies */}
        <TabsContent value="anomalies" className="mt-4">
          <motion.div variants={itemVariants} className="space-y-3">
            {anomalies.map((a, i) => (
              <Card key={i} className={`shadow-sm border-l-4 ${a.severity === "high" ? "border-l-red-400" : "border-l-amber-400"}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{a.type}</p>
                      <Badge variant="outline" className={`text-[9px] ${a.severity === "high" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => toast("Investigating anomaly...")}>
                    Investigate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function SentimentIndicator({ score }: { score: number }) {
  const color = score > 0.5 ? "text-teal-600" : score > 0 ? "text-blue-600" : score > -0.3 ? "text-amber-600" : "text-red-600";
  const bg = score > 0.5 ? "bg-teal-50" : score > 0 ? "bg-blue-50" : score > -0.3 ? "bg-amber-50" : "bg-red-50";
  return (
    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${bg} ${color}`}>
      {score > 0 ? "+" : ""}{score.toFixed(1)}
    </span>
  );
}

function MetricItem({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-teal-600">{trend}</p>
    </div>
  );
}
