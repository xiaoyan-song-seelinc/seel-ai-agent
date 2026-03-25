/**
 * Agents — Default tab for AI Support module
 * Top: Agent cards (with inline metrics) + Hire New Agent card
 * Bottom: Opportunities — lightweight suggestions list
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Plus, MessageCircle, Mail, Instagram,
  ArrowRight, CheckCircle2, Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

const statusCfg: Record<AgentStatus, { label: string; color: string }> = {
  "setting-up": { label: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "ready-to-test": { label: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "live": { label: "Live", color: "text-primary bg-primary/10 border-primary/20" },
  "paused": { label: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channel: "Live Chat", channelType: "chat",
    integration: "RC Widget", status: "live" as AgentStatus,
    sessions: 847, csat: 4.6, resolution: 91.2,
    setupSteps: null as null | { done: number; total: number; next: string },
  },
  {
    id: "email-agent", name: "Email Support Agent", channel: "Email", channelType: "email",
    integration: "Zendesk Email", status: "setting-up" as AgentStatus,
    sessions: 0, csat: 0, resolution: 0,
    setupSteps: { done: 1, total: 3, next: "Connect Zendesk" },
  },
];

const opportunities = [
  {
    id: "sync-orders",
    label: "Sync all orders",
    desc: "Give your agent full order history for accurate responses",
    status: "Partial sync",
    href: "/seel/integrations",
    done: false,
  },
  {
    id: "enrich-kb",
    label: "Enrich knowledge base",
    desc: "More articles help your agent resolve a wider range of inquiries",
    status: "3 articles",
    href: "/playbook",
    done: false,
  },
  {
    id: "activate-skills",
    label: "Activate skills",
    desc: "Enable capabilities like returns, exchanges, and tracking",
    status: "2 skills enabled",
    href: "/playbook/skills",
    done: false,
  },
];

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-8">
      {/* ── Agent Cards ── */}
      <motion.div variants={iV}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => {
            const sc = statusCfg[agent.status];
            const isLive = agent.status === "live";
            const channelColors: Record<string, string> = {
              chat: "text-primary bg-primary/10",
              email: "text-blue-600 bg-blue-50",
              social: "text-pink-600 bg-pink-50",
            };
            const cc = channelColors[agent.channelType] || channelColors.chat;

            return (
              <motion.div key={agent.id} variants={iV}>
                <Link href={`/agents/${agent.id}`}>
                  <Card className="shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cc)}>
                          <ChannelIcon type={agent.channelType} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{agent.name}</p>
                          <p className="text-[11px] text-muted-foreground">{agent.channel} · {agent.integration}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] shrink-0 font-medium", sc.color)}>{sc.label}</Badge>
                      </div>

                      {/* Metrics or Setup Progress */}
                      {isLive ? (
                        <div className="grid grid-cols-3 gap-3 mt-auto">
                          <div>
                            <p className="text-lg font-semibold leading-none">{agent.sessions}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Sessions (7d)</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold leading-none">{agent.resolution}%</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Resolution</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold leading-none">{agent.csat}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">CSAT</p>
                          </div>
                        </div>
                      ) : agent.setupSteps ? (
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-muted-foreground">{agent.setupSteps.done} of {agent.setupSteps.total} steps</span>
                            <span className="text-amber-600 font-medium">Next: {agent.setupSteps.next}</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(agent.setupSteps.done / agent.setupSteps.total) * 100}%` }} />
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}

          {/* Hire New Agent Card */}
          <motion.div variants={iV}>
            <Link href="/agents/new">
              <Card className="shadow-sm border-dashed hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2.5 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Hire New Agent</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Email, Social, or Live Chat</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Opportunities ── */}
      <motion.div variants={iV}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
        </div>
        <div className="space-y-1">
          {opportunities.map((item) => (
            <Link key={item.id} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                  item.done ? "bg-primary" : "border-[1.5px] border-muted-foreground/20"
                )}>
                  {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[13px] leading-tight",
                    item.done ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary transition-colors"
                  )}>{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{item.status}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/15 group-hover:text-primary/50 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
