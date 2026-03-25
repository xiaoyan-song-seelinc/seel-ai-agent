/**
 * Dashboard — Production-grade MVP
 * Two states:
 *   1. Zero Agent (cold start): Welcome + invite to hire first Agent
 *   2. Has Agent(s): Minimal KPIs + What's Next (By Task: Improve → Scale)
 * Design: Clean, minimal, no excessive colors. Real production system feel.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, BookOpen, Shield, Plus, CheckCircle2, ArrowRight,
  TrendingUp, Clock, MessageSquare, Star, ArrowUpRight,
  Target, Mail, Instagram, MessageCircle, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

/* ── Mock state toggle (for prototype demo) ── */
const HAS_AGENTS = true; // Toggle to false to see cold-start state
const ORDER_SYNCED = false; // Toggle to show order system prompt

/* ── Data ── */
const volumeData = [
  { day: "Mon", resolved: 145, escalated: 12 }, { day: "Tue", resolved: 168, escalated: 8 },
  { day: "Wed", resolved: 152, escalated: 15 }, { day: "Thu", resolved: 189, escalated: 11 },
  { day: "Fri", resolved: 201, escalated: 9 }, { day: "Sat", resolved: 98, escalated: 5 },
  { day: "Sun", resolved: 87, escalated: 3 },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function Dashboard() {
  const [hasAgents, setHasAgents] = useState(HAS_AGENTS);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasAgents ? "Your AI support team at a glance." : "Get started with AI-powered customer support."}
          </p>
        </div>
        {/* Demo toggle for prototype */}
        <button
          onClick={() => setHasAgents(!hasAgents)}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground border border-dashed border-muted-foreground/20 rounded px-2 py-1"
        >
          Demo: {hasAgents ? "Has Agent" : "No Agent"} — click to toggle
        </button>
      </motion.div>

      {hasAgents ? <HasAgentState /> : <ColdStartState />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── STATE 1: Cold Start — No Agents Yet ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartState() {
  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome Card */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-7 h-7 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Set up your first AI Agent</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Deploy an AI agent to handle customer conversations on Email, Live Chat, or Social Media. It takes less than 5 minutes.
            </p>
            <Link href="/agents/new">
              <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                <Plus className="w-4 h-4" /> Hire Your First Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Setup Checklist */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Setup Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ChecklistItem done={true} label="Account created" />
            <ChecklistItem done={true} label="Order system connected (partial sync)" sub={!ORDER_SYNCED ? "Sync all orders for better coverage" : undefined} subHref="/settings" />
            <ChecklistItem done={false} label="Hire your first AI Agent" href="/agents/new" />
            <ChecklistItem done={false} label="Add knowledge base articles" href="/knowledge" />
            <ChecklistItem done={false} label="Configure skills and actions" href="/knowledge" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel Preview */}
      <motion.div variants={itemV}>
        <p className="text-xs font-medium text-muted-foreground mb-3">Available channels</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ChannelPreview icon={Mail} label="Email" desc="Via Zendesk Email" available />
          <ChannelPreview icon={MessageCircle} label="Live Chat" desc="RC Widget" available />
          <ChannelPreview icon={Instagram} label="Social Messaging" desc="Via Zendesk Messaging" available />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── STATE 2: Has Agent(s) — Live & Creating Value ── */
/* ═══════════════════════════════════════════════════════════ */
function HasAgentState() {
  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      {/* KPI Row */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Conversations Today" value="847" change="+12%" />
        <KPICard label="Auto-Resolved" value="91.2%" change="+2.3%" />
        <KPICard label="CSAT Score" value="4.6" change="+0.1" />
        <KPICard label="Hours Saved (7d)" value="132h" change="+18h" />
      </motion.div>

      {/* Active Agent Summary */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center">
                    <Bot className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-teal-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">RC Live Chat Agent</p>
                  <p className="text-xs text-muted-foreground">Live Chat · Production · 847 conversations today</p>
                </div>
              </div>
              <Link href="/agents/rc-chat">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                  View <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Order System Prompt (if not fully synced) */}
      {!ORDER_SYNCED && (
        <motion.div variants={itemV}>
          <Card className="shadow-sm border-amber-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sync all orders for better accuracy</p>
                <p className="text-xs text-muted-foreground">Your order system is partially connected. Full sync enables order lookup, refund processing, and WISMO handling.</p>
              </div>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="text-xs shrink-0">Configure</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* What's Next — By Task */}
      <motion.div variants={itemV}>
        <p className="text-xs font-medium text-muted-foreground mb-3">What's next</p>
        <div className="space-y-4">
          {/* Improve */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Improve your agent
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-1">
                <TaskRow icon={BookOpen} label="Enrich knowledge base" desc="Add policies and FAQs to improve answer accuracy" href="/knowledge" />
                <TaskRow icon={Target} label="Activate more skills" desc="Enable Order Changes, Cancellation handling, and more" href="/knowledge" />
                <TaskRow icon={MessageSquare} label="Review conversations" desc="QA recent conversations and coach your agent" href="/conversations" />
                <TaskRow icon={Shield} label="Tune guardrails" desc="Adjust escalation rules and safety thresholds" href="/settings" />
              </div>
            </CardContent>
          </Card>

          {/* Scale */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Scale to new channels
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                <ScaleCard
                  icon={Mail}
                  label="Email Agent"
                  desc="Handle email tickets via Zendesk"
                  channel="Email"
                />
                <ScaleCard
                  icon={Instagram}
                  label="Social Agent"
                  desc="Manage social DMs via Zendesk Messaging"
                  channel="Social Messaging"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Conversation Volume (7 Days)</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-teal-500" /> Resolved</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-400" /> Escalated</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volumeData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 286)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.65 0.02 260)" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.92 0.004 286)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "12px" }} />
                <Bar dataKey="resolved" fill="oklch(0.56 0.11 175)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="escalated" fill="oklch(0.80 0.15 80)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared Components ── */

function KPICard({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold">{value}</p>
          <span className="text-xs text-teal-600 font-medium">{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ icon: Icon, label, desc, href }: { icon: React.ElementType; label: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-2.5 -mx-1 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-teal-500 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function ScaleCard({ icon: Icon, label, desc, channel }: { icon: React.ElementType; label: string; desc: string; channel: string }) {
  return (
    <Link href="/agents/new">
      <div className="min-w-[220px] p-4 rounded-xl border border-border hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer group">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">{label}</p>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
          <Plus className="w-3 h-3" /> Hire Agent
          <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function ChecklistItem({ done, label, sub, subHref, href }: { done: boolean; label: string; sub?: string; subHref?: string; href?: string }) {
  const inner = (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-colors",
      !done && href ? "hover:bg-muted/50 cursor-pointer" : ""
    )}>
      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        done ? "bg-teal-500" : "border-2 border-muted-foreground/25"
      )}>
        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1">
        <p className={cn("text-sm", done ? "text-muted-foreground" : "font-medium")}>{label}</p>
        {sub && (
          subHref ? (
            <Link href={subHref}>
              <span className="text-xs text-amber-600 hover:underline">{sub}</span>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">{sub}</p>
          )
        )}
      </div>
      {!done && href && <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />}
    </div>
  );

  if (!done && href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function ChannelPreview({ icon: Icon, label, desc, available }: { icon: React.ElementType; label: string; desc: string; available: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      {available && (
        <Badge variant="secondary" className="text-[10px] mt-1">Available</Badge>
      )}
    </div>
  );
}
