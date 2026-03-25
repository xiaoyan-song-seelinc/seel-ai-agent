/**
 * Agents: Team management page
 * Status system: Setting Up → Ready to Test → Live → Paused
 * Design: Compact list, production-grade, no decorative elements
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, MessageCircle, Mail, Instagram,
  ArrowRight, Settings2, FlaskConical, Circle, Pause,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Agent status type ── */
type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

const statusConfig: Record<AgentStatus, { label: string; color: string; dotColor: string; icon: typeof Circle }> = {
  "setting-up": { label: "Setting Up", color: "text-amber-600 bg-amber-50 border-amber-200", dotColor: "bg-amber-400", icon: Settings2 },
  "ready-to-test": { label: "Ready to Test", color: "text-blue-600 bg-blue-50 border-blue-200", dotColor: "bg-blue-400", icon: FlaskConical },
  "live": { label: "Live", color: "text-teal-600 bg-teal-50 border-teal-200", dotColor: "bg-teal-500", icon: Circle },
  "paused": { label: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200", dotColor: "bg-gray-400", icon: Pause },
};

/* ── Agents data ── */
const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channelLabel: "Live Chat", channelType: "chat" as string,
    integration: "RC Widget", status: "live" as AgentStatus,
    sessionsToday: 847, csat: 4.6, resolution: 91.2,
    setupProgress: null as null | { done: number; total: number },
  },
  {
    id: "email-agent", name: "Email Support Agent", channelLabel: "Email", channelType: "email" as string,
    integration: "Zendesk Email", status: "setting-up" as AgentStatus,
    sessionsToday: 0, csat: 0, resolution: 0,
    setupProgress: { done: 1, total: 4 },
  },
];

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  const liveCount = agents.filter(a => a.status === "live").length;

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 max-w-4xl space-y-4">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{agents.length} agents · {liveCount} live</p>
        </div>
        <Link href="/agents/new">
          <Button size="sm" className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700"><Plus className="w-3.5 h-3.5" /> Hire Agent</Button>
        </Link>
      </motion.div>

      {/* Agent List */}
      <motion.div variants={itemV} className="space-y-2">
        {agents.map((agent) => {
          const sc = statusConfig[agent.status];
          return (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className="shadow-sm hover:shadow-md hover:border-teal-200/60 transition-all cursor-pointer group">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar + status dot */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <ChannelIcon type={agent.channelType} className={cn("w-4 h-4",
                          agent.channelType === "email" ? "text-blue-500" :
                          agent.channelType === "social" ? "text-pink-500" : "text-teal-600"
                        )} />
                      </div>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", sc.dotColor)} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium group-hover:text-teal-700 transition-colors truncate">{agent.name}</p>
                        <Badge variant="outline" className={cn("text-[9px] shrink-0", sc.color)}>{sc.label}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{agent.channelLabel} · {agent.integration}</p>
                    </div>

                    {/* Metrics or Setup Progress */}
                    {agent.status === "live" ? (
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        <span>{agent.sessionsToday} sessions</span>
                        <span>{agent.resolution}% resolved</span>
                        <span>CSAT {agent.csat}</span>
                      </div>
                    ) : agent.setupProgress ? (
                      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span>{agent.setupProgress.done}/{agent.setupProgress.total} steps done</span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(agent.setupProgress.done / agent.setupProgress.total) * 100}%` }} />
                        </div>
                      </div>
                    ) : null}

                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-teal-500 transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {/* Add Agent */}
        <Link href="/agents/new">
          <Card className="shadow-sm border-dashed hover:border-teal-200 hover:bg-teal-50/10 transition-all cursor-pointer group">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-teal-700 transition-colors">Hire New Agent</p>
                  <p className="text-[11px] text-muted-foreground/60">Email, Social Messaging, or Live Chat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  );
}
