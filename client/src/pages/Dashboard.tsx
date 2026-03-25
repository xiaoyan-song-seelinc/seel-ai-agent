/**
 * Dashboard: Overview page with Setup Progress Card for onboarding
 * - Cold start: Shows setup checklist guiding merchant to configure Knowledge, Skills, Actions, then Hire Agent
 * - Active state: Shows operational metrics, agent team status, alerts
 * Entity model: Agent 1:1 Channel, Knowledge global, Skill global, Guardrail split
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  BookOpen,
  Zap,
  Shield,
  Plus,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";

/* ── Setup steps ── */
const setupSteps = [
  { id: "knowledge", title: "Enrich Your Knowledge Base", desc: "Upload policies, FAQs, and product docs so agents can answer accurately.", cta: "Add Knowledge", href: "/knowledge", icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50", completed: true },
  { id: "skills", title: "Review & Activate Skills", desc: "Skills define business scenarios like refunds, WISMO, and order changes.", cta: "Review Skills", href: "/knowledge", icon: Target, color: "text-violet-600", bg: "bg-violet-50", completed: false },
  { id: "actions", title: "Enable Actions", desc: "Connect Shopify, Zendesk so agents can take real actions for customers.", cta: "Setup Actions", href: "/knowledge", icon: Zap, color: "text-amber-600", bg: "bg-amber-50", completed: false },
  { id: "agent", title: "Hire a New Agent", desc: "Deploy an AI agent to Email, Social, or other channels.", cta: "Hire Agent", href: "/agents", icon: Plus, color: "text-blue-600", bg: "bg-blue-50", completed: false },
  { id: "guardrails", title: "Set Global Guardrails", desc: "Define safety rules — escalation triggers, brand voice, risk detection.", cta: "Configure", href: "/settings", icon: Shield, color: "text-red-600", bg: "bg-red-50", completed: false },
];

/* ── Existing agent (RC Live Chat) ── */
const existingAgent = {
  id: "rc-chat", name: "RC Live Chat Agent", channel: "Live Chat", channelIcon: MessageCircle, channelColor: "text-teal-500",
  status: "active", ticketsToday: 847, csat: 4.6, resolutionRate: 91.2, avgResponse: "1.1s",
};

/* ── Chart data ── */
const ticketData = [
  { date: "Mon", resolved: 145, escalated: 12 }, { date: "Tue", resolved: 168, escalated: 8 },
  { date: "Wed", resolved: 152, escalated: 15 }, { date: "Thu", resolved: 189, escalated: 11 },
  { date: "Fri", resolved: 201, escalated: 9 }, { date: "Sat", resolved: 98, escalated: 5 },
  { date: "Sun", resolved: 87, escalated: 3 },
];
const csatData = [
  { hour: "00:00", score: 4.2 }, { hour: "04:00", score: 4.5 }, { hour: "08:00", score: 4.1 },
  { hour: "12:00", score: 4.6 }, { hour: "16:00", score: 4.3 }, { hour: "20:00", score: 4.7 }, { hour: "Now", score: 4.5 },
];

const topTopics = [
  { topic: "WISMO", count: 342, pct: 31 }, { topic: "Refund", count: 276, pct: 25 },
  { topic: "Return", count: 198, pct: 18 }, { topic: "Cancellation", count: 154, pct: 14 }, { topic: "Other", count: 133, pct: 12 },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Dashboard() {
  const [setupExpanded, setSetupExpanded] = useState(true);
  const completedCount = setupSteps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / setupSteps.length) * 100);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what needs your attention.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> 5 Live
          </Badge>
          <Link href="/agents">
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Hire Agent
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Setup Progress Card ── */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm border-teal-200/60 bg-gradient-to-r from-teal-50/40 via-white to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Setup Your AI Support Team</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{setupSteps.length} steps completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Progress value={progressPct} className="w-20 h-2" />
                  <span className="text-xs font-semibold text-teal-700">{progressPct}%</span>
                </div>
                <button onClick={() => setSetupExpanded(!setupExpanded)} className="p-1.5 rounded-lg hover:bg-teal-100 transition-colors">
                  {setupExpanded ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-teal-600" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {setupExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  {setupSteps.map((step, idx) => (
                    <div key={step.id} className={cn(
                      "flex items-center gap-4 p-3 rounded-lg transition-all",
                      step.completed ? "bg-teal-50/40 opacity-60" : "bg-white border border-border hover:border-teal-200 hover:shadow-sm"
                    )}>
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                        step.completed ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", step.completed && "line-through text-muted-foreground")}>{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.desc}</p>
                      </div>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", step.bg)}>
                        <step.icon className={cn("w-3.5 h-3.5", step.color)} />
                      </div>
                      {!step.completed && (
                        <Link href={step.href}>
                          <Button size="sm" variant="outline" className="text-xs gap-1 h-7 shrink-0">{step.cta} <ArrowRight className="w-3 h-3" /></Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── KPI Row ── */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Conversations", value: "847", trend: "+12%", up: true, icon: MessageSquare },
          { label: "Resolution Rate", value: "91.2%", trend: "+2.3%", up: true, icon: CheckCircle2 },
          { label: "CSAT Score", value: "4.6", trend: "+0.1", up: true, icon: TrendingUp },
          { label: "Avg Response Time", value: "1.1s", trend: "-0.2s", up: true, icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <span className={cn("flex items-center gap-0.5 text-xs font-medium", kpi.up ? "text-teal-600" : "text-red-500")}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{kpi.trend}
                </span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Agent Team + Hire Prompt ── */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <CardTitle className="text-sm font-semibold">Your Agent Team</CardTitle>
                <Badge variant="secondary" className="text-[9px]">1 agent</Badge>
              </div>
              <Link href="/agents"><Button size="sm" variant="outline" className="text-xs gap-1 h-7"><Plus className="w-3 h-3" /> Hire Agent</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Link href={`/agents/${existingAgent.id}`}>
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors border-b border-border">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{existingAgent.name}</p>
                    <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Active</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <existingAgent.channelIcon className={cn("w-3 h-3", existingAgent.channelColor)} />
                    <span className="text-xs text-muted-foreground">{existingAgent.channel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 text-center">
                  <MiniStat label="Today" value={String(existingAgent.ticketsToday)} />
                  <MiniStat label="Resolution" value={`${existingAgent.resolutionRate}%`} />
                  <MiniStat label="CSAT" value={String(existingAgent.csat)} />
                  <MiniStat label="Avg Resp" value={existingAgent.avgResponse} />
                </div>
              </div>
            </Link>
            {/* Hire prompt */}
            <div className="px-5 py-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Expand your team</p>
                  <p className="text-xs text-muted-foreground/70">Hire agents for Email, Social Media, and other channels.</p>
                </div>
                <Link href="/agents"><Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs gap-1"><Plus className="w-3 h-3" /> Hire Agent</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Charts ── */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Conversation Volume (7 Days)</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Resolved</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Escalated</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Bar dataKey="resolved" fill="oklch(0.56 0.11 175)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalated" fill="oklch(0.80 0.15 80)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">CSAT Trend (Today)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={csatData}>
                <defs>
                  <linearGradient id="csatG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.56 0.11 175)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.006 80)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis domain={[3.5, 5]} tick={{ fontSize: 10 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.91 0.006 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="oklch(0.56 0.11 175)" fill="url(#csatG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom: Topics ── */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Topics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {topTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{t.topic}</span>
                    <span className="text-xs text-muted-foreground">{t.pct}%</span>
                  </div>
                  <Progress value={t.pct} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">{t.count} conversations</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
