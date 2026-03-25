/**
 * Dashboard — V6 Production-grade MVP
 * States:
 *   1. Cold Start (no agents): Welcome card + invite to hire first Agent
 *   2. Has Agent(s): Core Metrics + Active Agents + Improve Checklist + Scale entry
 *
 * Core Metrics: Interactions | Sessions | Seel Service Scope | Sentiment Change
 * Improve: Checklist items with completion state (progress-based visibility)
 * Scale: Single horizontal entry to hire next agent
 * Analytics: Link to dedicated page (placeholder in MVP)
 *
 * Design: Dense, compact, production-system feel. No decorative elements.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, ArrowRight, CheckCircle2,
  Mail, Instagram, MessageCircle,
  BookOpen, Target, Shield, Package, Settings2,
  BarChart3, MessageSquareText, Users, Gauge, SmilePlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ── Demo state toggle ── */
const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const itemV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Dashboard() {
  const [hasAgents, setHasAgents] = useState(true);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 max-w-4xl space-y-5">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        <button
          onClick={() => setHasAgents(!hasAgents)}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-dashed border-muted-foreground/15 rounded px-2 py-0.5"
        >
          Demo: {hasAgents ? "Has Agent" : "Cold Start"}
        </button>
      </motion.div>

      {hasAgents ? <HasAgentState /> : <ColdStartState />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Cold Start: No Agents ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartState() {
  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-4">
      {/* Welcome */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <Bot className="w-5.5 h-5.5 text-teal-600" />
            </div>
            <h2 className="text-base font-semibold mb-1">Deploy your first AI Agent</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              Set up an AI agent to handle customer conversations. Takes less than 5 minutes.
            </p>
            <Link href="/agents/new">
              <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Hire Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Checklist */}
      <motion.div variants={itemV}>
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Setup checklist</p>
            <CheckItem done label="Account created" />
            <CheckItem done label="Order system connected" note="Partial sync — full sync recommended" noteHref="/settings" />
            <CheckItem label="Hire your first AI Agent" href="/agents/new" />
            <CheckItem label="Add knowledge base articles" href="/knowledge" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Has Agent(s) ── */
/* ═══════════════════════════════════════════════════════════ */
function HasAgentState() {
  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-4">
      {/* Core Metrics */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={MessageSquareText} label="Interactions" value="3,241" sub="Last 7 days" change="+12%" />
        <MetricCard icon={Users} label="Sessions" value="847" sub="Last 7 days" change="+8%" />
        <MetricCard icon={Gauge} label="Service Scope" value="78%" sub="AI handled vs total" change="+5%" />
        <MetricCard icon={SmilePlus} label="Sentiment" value="+0.3" sub="CSAT change (30d)" positive />
      </motion.div>

      {/* Active Agents Row */}
      <motion.div variants={itemV}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Active agents · 1</p>
          <Link href="/agents" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <Link href="/agents/rc-chat">
              <div className="flex items-center gap-3 hover:bg-muted/30 rounded-lg p-1.5 -m-1.5 transition-colors cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">RC Live Chat Agent</p>
                  <p className="text-[11px] text-muted-foreground">Live Chat · RC Widget · Live</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>847 sessions today</span>
                  <span>91.2% resolved</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Improve Agent Performance — Checklist */}
      <motion.div variants={itemV}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Improve agent performance</p>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-3 space-y-0.5">
            <ImproveItem
              icon={Package}
              label="Sync all orders — enables refund, WISMO, and order lookup"
              progress={40}
              href="/settings"
            />
            <ImproveItem
              icon={BookOpen}
              label="Enrich knowledge base — 3 articles added, add more for better accuracy"
              progress={15}
              href="/knowledge"
            />
            <ImproveItem
              icon={Target}
              label="Activate more skills — 2 of 8 skills enabled"
              progress={25}
              href="/knowledge"
            />
            <ImproveItem
              icon={Shield}
              label="Configure guardrails — set escalation rules and safety thresholds"
              progress={0}
              href="/settings"
            />
            <ImproveItem
              icon={Settings2}
              label="Fine-tune agent personality — customize tone and response style"
              progress={0}
              href="/agents/rc-chat"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Scale — Hire Next Agent */}
      <motion.div variants={itemV}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Scale to new channels</p>
        </div>
        <Link href="/agents/new">
          <Card className="shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">Hire another agent</p>
                  <p className="text-[11px] text-muted-foreground">Deploy to Email, Social Messaging, or additional Live Chat touchpoints</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-white"><Mail className="w-2.5 h-2.5 text-blue-500" /></div>
                    <div className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center border border-white"><Instagram className="w-2.5 h-2.5 text-pink-500" /></div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-teal-500 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Analytics Link */}
      <motion.div variants={itemV}>
        <Link href="/analytics">
          <div className="flex items-center gap-2 text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer py-1">
            <BarChart3 className="w-3.5 h-3.5" />
            View detailed analytics
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ── Components ── */

function MetricCard({ icon: Icon, label, value, sub, change, positive }: {
  icon: React.ElementType; label: string; value: string; sub: string; change?: string; positive?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-xl font-semibold leading-none">{value}</p>
          {change && <span className="text-[10px] text-teal-600 font-medium">{change}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ImproveItem({ icon: Icon, label, progress, href }: {
  icon: React.ElementType; label: string; progress: number; href: string;
}) {
  const done = progress >= 100;
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
          done ? "bg-teal-50" : "bg-muted"
        )}>
          {done
            ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            : <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-snug",
            done ? "text-muted-foreground line-through" : "font-medium group-hover:text-teal-700 transition-colors"
          )}>{label}</p>
        </div>
        {!done && progress > 0 && (
          <div className="w-16 shrink-0">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        {!done && <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-teal-500 transition-colors shrink-0" />}
      </div>
    </Link>
  );
}

function CheckItem({ done, label, note, noteHref, href }: {
  done?: boolean; label: string; note?: string; noteHref?: string; href?: string;
}) {
  const inner = (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      !done && href ? "hover:bg-muted/40 cursor-pointer" : ""
    )}>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
        done ? "bg-teal-500" : "border-2 border-muted-foreground/20"
      )}>
        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", done ? "text-muted-foreground" : "font-medium")}>{label}</p>
        {note && (
          noteHref ? (
            <Link href={noteHref}>
              <span className="text-[11px] text-amber-600 hover:underline">{note}</span>
            </Link>
          ) : (
            <p className="text-[11px] text-muted-foreground">{note}</p>
          )
        )}
      </div>
      {!done && href && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />}
    </div>
  );
  if (!done && href) return <Link href={href}>{inner}</Link>;
  return inner;
}
