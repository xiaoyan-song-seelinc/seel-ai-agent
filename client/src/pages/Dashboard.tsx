/**
 * Dashboard — V11
 * - UI style aligned with Seel product (clean white cards, indigo-blue accent, clear section titles)
 * - Has Agent: "Optimize Agent" + "Scale to more channels" split; value-driven wording; Active Agent count only
 * - Cold Start V1: original checklist flow (Hire Agent via separate page)
 * - Cold Start V2: inline RC Live Chat activation — one-click enable on Dashboard
 * - Demo toggle cycles: Has Agent → Cold Start V1 → Cold Start V2
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, ArrowRight, CheckCircle2, Plus,
  MessageCircle, Users, Gauge, SmilePlus,
  Mail, Instagram, Zap, Power,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

type DemoState = "has-agent" | "cold-v1" | "cold-v2";
const labels: Record<DemoState, string> = { "has-agent": "Has Agent", "cold-v1": "Cold Start V1", "cold-v2": "Cold Start V2" };
const cycle: Record<DemoState, DemoState> = { "has-agent": "cold-v1", "cold-v1": "cold-v2", "cold-v2": "has-agent" };

export default function Dashboard() {
  const [demo, setDemo] = useState<DemoState>("has-agent");

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 lg:p-8 max-w-[960px] space-y-6">
      {/* Page header */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <button
          onClick={() => setDemo(cycle[demo])}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-dashed border-muted-foreground/15 rounded px-2 py-0.5 transition-colors"
        >
          Demo: {labels[demo]}
        </button>
      </motion.div>

      {demo === "has-agent" && <HasAgentState />}
      {demo === "cold-v1" && <ColdStartV1 />}
      {demo === "cold-v2" && <ColdStartV2 />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Cold Start V1 — Original checklist ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartV1() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={iV}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
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
/* ── Cold Start V2 — Inline RC Live Chat activation ── */
/* ═══════════════════════════════════════════════════════════ */
function ColdStartV2() {
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = () => {
    setActivating(true);
    setTimeout(() => {
      setActivating(false);
      setActivated(true);
    }, 1500);
  };

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-5">
      {/* Activate RC Live Chat card */}
      <motion.div variants={iV}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-0.5">Activate RC Live Chat Agent</h2>
                <p className="text-sm text-muted-foreground">
                  Your AI agent is ready to handle live chat conversations. No additional configuration needed — activate it now to start resolving customer inquiries instantly.
                </p>
              </div>
            </div>

            {activated ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">RC Live Chat Agent is now active</p>
                  <p className="text-xs text-muted-foreground">Your agent is handling live chat conversations</p>
                </div>
                <Link href="/agents/rc-live-chat">
                  <span className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    View agent <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </motion.div>
            ) : (
              <Button
                onClick={handleActivate}
                disabled={activating}
                className="gap-2"
              >
                {activating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Activate RC Live Chat
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Setup checklist — same items, but "Hire Agent" is replaced by the inline activation above */}
      <motion.div variants={iV}>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Setup checklist</p>
            <div className="space-y-0.5">
              <CheckItem done label="Account created" />
              <CheckItem done label="Order system connected" note="Partial sync" noteHref="/settings" />
              <CheckItem done={activated} label="Activate AI Agent" />
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
    <motion.div variants={cV} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Core Metrics ── */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/agents">
            <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
                </div>
                <p className="text-2xl font-semibold leading-none">1</p>
              </CardContent>
            </Card>
          </Link>
          <MetricCard icon={Users} label="Sessions" value="847" sub="Last 7 days" change="+8%" />
          <MetricCard icon={Gauge} label="Service Scope" value="78%" sub="AI handled vs total" change="+5%" />
          <MetricCard icon={SmilePlus} label="Sentiment" value="+0.3" sub="CSAT change (30d)" />
        </div>

        {/* Analytics link */}
        <div className="flex justify-end mt-2">
          <Link href="/analytics">
            <span className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer transition-colors">
              View Agent Performance <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </motion.div>

      {/* ── What's Next ── */}
      <motion.div variants={iV} className="space-y-4">
        {/* Optimize Agent */}
        <div>
          <p className="text-sm font-semibold mb-2">Optimize Agent</p>
          <Card>
            <CardContent className="p-4 space-y-0.5">
              <CheckItem
                label="Sync all orders"
                desc="Ensure your agent has full order history for accurate responses"
                href="/settings"
                status="Partial sync"
              />
              <CheckItem
                label="Enrich knowledge base"
                desc="More articles help your agent resolve a wider range of inquiries"
                href="/knowledge"
                status="3 articles"
              />
              <CheckItem
                label="Activate skills"
                desc="Enable more capabilities like returns, exchanges, and tracking"
                href="/knowledge"
                status="2 skills enabled"
              />
            </CardContent>
          </Card>
        </div>

        {/* Scale to more channels */}
        <div>
          <p className="text-sm font-semibold mb-2">Scale to more channels</p>
          <Card>
            <CardContent className="p-4">
              <Link href="/agents/new">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/15 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">Hire another agent</p>
                    <p className="text-xs text-muted-foreground">Expand AI support to Email, Social Messaging, or Live Chat</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── Shared Components ── */
/* ═══════════════════════════════════════════════════════════ */

function MetricCard({ icon: Icon, label, value, sub, change }: {
  icon: React.ElementType; label: string; value: string; sub: string; change?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-semibold leading-none">{value}</p>
          {change && <span className="text-xs text-primary font-medium">{change}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CheckItem({ done, label, desc, note, noteHref, status, href }: {
  done?: boolean; label: string; desc?: string; note?: string; noteHref?: string; status?: string; href?: string;
}) {
  const inner = (
    <div className={cn(
      "flex items-start gap-3 p-2.5 rounded-lg transition-colors",
      !done && href ? "hover:bg-muted/50 cursor-pointer group" : ""
    )}>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        done ? "bg-primary" : "border-2 border-muted-foreground/20"
      )}>
        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-sm leading-tight",
            done ? "text-muted-foreground" : "font-medium group-hover:text-primary transition-colors"
          )}>{label}</p>
          {status && <span className="text-[11px] text-muted-foreground leading-tight shrink-0">{status}</span>}
        </div>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
        {note && noteHref && (
          <Link href={noteHref}>
            <span className="text-[11px] text-amber-600 hover:underline">{note}</span>
          </Link>
        )}
        {note && !noteHref && (
          <p className="text-[11px] text-muted-foreground">{note}</p>
        )}
      </div>
      {!done && href && <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5" />}
    </div>
  );
  if (!done && href) return <Link href={href}>{inner}</Link>;
  return inner;
}
