/**
 * Dashboard — V10 Production MVP
 * - Cold Start: single card with welcome header + checklist
 * - Has Agent: Metrics → Analytics link → What's Next (Improve checklist + Scale section, visually separated)
 * - Status copy: shows current config state only (e.g. "3 articles", "2 skills enabled")
 * - CheckItem component shared across both states for visual consistency
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, ArrowRight, CheckCircle2, Plus,
  MessageCircle, Users, Gauge, SmilePlus,
  Mail, Instagram,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Dashboard() {
  const [hasAgents, setHasAgents] = useState(true);

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-4xl space-y-5">
      <motion.div variants={iV} className="flex items-center justify-between">
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
/* ── Cold Start ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartState() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={iV}>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-0.5">Get started with your AI Agent</h2>
                <p className="text-sm text-muted-foreground">Complete these steps to deploy your first agent. Takes less than 5 minutes.</p>
              </div>
            </div>
            <div className="space-y-0.5">
              <CheckItem done label="Account created" />
              <CheckItem done label="Order system connected" note="Partial sync" noteHref="/settings" />
              <CheckItem label="Hire your first AI Agent" href="/agents/new" />
              <CheckItem label="Add knowledge articles" href="/knowledge" status="0 articles" />
            </div>
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
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-5">
      {/* ── Metrics Row ── */}
      <motion.div variants={iV} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/agents">
          <Card className="shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer h-full">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Active Agents</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-semibold leading-none">1</p>
                <span className="text-[10px] text-muted-foreground">of 2</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center">
                  <MessageCircle className="w-2.5 h-2.5 text-teal-600" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate">RC Live Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <MetricCard icon={Users} label="Sessions" value="847" sub="Last 7 days" change="+8%" />
        <MetricCard icon={Gauge} label="Service Scope" value="78%" sub="AI handled vs total" change="+5%" />
        <MetricCard icon={SmilePlus} label="Sentiment" value="+0.3" sub="CSAT change (30d)" />
      </motion.div>

      {/* ── Analytics link ── */}
      <motion.div variants={iV} className="flex justify-end -mt-2">
        <Link href="/analytics">
          <span className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer">
            View Agent Performance <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </Link>
      </motion.div>

      {/* ── What's Next ── */}
      <motion.div variants={iV}>
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">What's next</p>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            {/* Improve section */}
            <div className="space-y-0.5">
              <CheckItem label="Sync all orders" href="/settings" status="Partial sync" />
              <CheckItem label="Enrich knowledge base" href="/knowledge" status="3 articles" />
              <CheckItem label="Activate skills" href="/knowledge" status="2 skills enabled" />
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-border/50" />

            {/* Scale section */}
            <Link href="/agents/new">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
                <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center shrink-0">
                  <Plus className="w-2.5 h-2.5 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium group-hover:text-teal-700 transition-colors leading-tight">Hire another agent</p>
                    <span className="text-[11px] text-muted-foreground leading-tight">Email, Social Messaging, or Live Chat</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-teal-500 transition-colors shrink-0" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared Components ── */

function MetricCard({ icon: Icon, label, value, sub, change }: {
  icon: React.ElementType; label: string; value: string; sub: string; change?: string;
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

function CheckItem({ done, label, note, noteHref, status, href }: {
  done?: boolean; label: string; note?: string; noteHref?: string; status?: string; href?: string;
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
        <div className="flex items-baseline gap-2">
          <p className={cn("text-sm leading-tight", done ? "text-muted-foreground" : "font-medium")}>{label}</p>
          {status && <span className="text-[11px] text-muted-foreground leading-tight shrink-0">{status}</span>}
        </div>
        {note && noteHref && (
          <Link href={noteHref}>
            <span className="text-[11px] text-amber-600 hover:underline">{note}</span>
          </Link>
        )}
        {note && !noteHref && (
          <p className="text-[11px] text-muted-foreground">{note}</p>
        )}
      </div>
      {!done && href && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />}
    </div>
  );
  if (!done && href) return <Link href={href}>{inner}</Link>;
  return inner;
}
