/**
 * Guardrails: Safety rules and boundary configuration
 * Manages refund limits, escalation triggers, and action permissions
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  AlertTriangle,
  DollarSign,
  Users,
  Clock,
  Ban,
  CheckCircle2,
  Edit3,
  Trash2,
  ToggleLeft,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const guardrails = [
  {
    id: "GR-001",
    name: "Maximum Refund Amount",
    description: "Single refund cannot exceed the specified amount. Exceeding triggers escalation to human agent.",
    category: "Financial",
    icon: DollarSign,
    threshold: "$100",
    status: "active" as const,
    triggerCount: 23,
    lastTriggered: "2 hours ago",
  },
  {
    id: "GR-002",
    name: "Negative Sentiment Escalation",
    description: "When customer sentiment score drops below threshold, automatically escalate to human agent.",
    category: "Sentiment",
    icon: Users,
    threshold: "Score < -0.5",
    status: "active" as const,
    triggerCount: 15,
    lastTriggered: "45 min ago",
  },
  {
    id: "GR-003",
    name: "Response Time Limit",
    description: "Agent must respond within the specified time. Exceeding triggers alert to CX Manager.",
    category: "Performance",
    icon: Clock,
    threshold: "< 30 seconds",
    status: "active" as const,
    triggerCount: 3,
    lastTriggered: "1 day ago",
  },
  {
    id: "GR-004",
    name: "Prohibited Actions",
    description: "Agent cannot access customer PII, modify payment methods, or override manager decisions.",
    category: "Security",
    icon: Ban,
    threshold: "Hard Block",
    status: "active" as const,
    triggerCount: 0,
    lastTriggered: "Never",
  },
  {
    id: "GR-005",
    name: "Daily Refund Cap",
    description: "Total refunds processed by a single agent cannot exceed daily limit.",
    category: "Financial",
    icon: DollarSign,
    threshold: "$5,000/day",
    status: "active" as const,
    triggerCount: 1,
    lastTriggered: "3 days ago",
  },
  {
    id: "GR-006",
    name: "Consecutive Escalation Alert",
    description: "If agent escalates 3+ tickets in a row, pause agent and notify CX Manager.",
    category: "Performance",
    icon: AlertTriangle,
    threshold: "3 consecutive",
    status: "paused" as const,
    triggerCount: 2,
    lastTriggered: "1 week ago",
  },
];

const recentTriggers = [
  { guardrail: "Maximum Refund Amount", ticket: "#4519", agent: "Agent Beta", detail: "Refund $128.50 exceeds $100 limit", time: "2h ago", action: "Escalated to human" },
  { guardrail: "Negative Sentiment", ticket: "#4515", agent: "Agent Alpha", detail: "Customer sentiment: -0.72", time: "3h ago", action: "Escalated to human" },
  { guardrail: "Maximum Refund Amount", ticket: "#4510", agent: "Agent Alpha", detail: "Refund $115 exceeds $100 limit", time: "5h ago", action: "Escalated to human" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function Guardrails() {
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
          <h1 className="text-2xl font-bold tracking-tight">Guardrails</h1>
          <p className="text-muted-foreground text-sm mt-1">Safety boundaries and automated protection rules for your AI agents</p>
        </div>
        <Button className="gap-2 bg-teal-600 hover:bg-teal-700" onClick={() => toast("Create Guardrail wizard coming soon")}>
          <Plus className="w-4 h-4" />
          Add Guardrail
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600"><Shield className="w-4 h-4" /></div>
          <div>
            <p className="text-lg font-bold leading-none">6</p>
            <p className="text-[10px] text-muted-foreground mt-1">Active Rules</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="w-4 h-4" /></div>
          <div>
            <p className="text-lg font-bold leading-none">44</p>
            <p className="text-[10px] text-muted-foreground mt-1">Triggers (30d)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><ArrowUpRight className="w-4 h-4" /></div>
          <div>
            <p className="text-lg font-bold leading-none">38</p>
            <p className="text-[10px] text-muted-foreground mt-1">Escalations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-green-50 text-green-600"><CheckCircle2 className="w-4 h-4" /></div>
          <div>
            <p className="text-lg font-bold leading-none">100%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Compliance</p>
          </div>
        </div>
      </motion.div>

      {/* Guardrail Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardrails.map((gr) => (
          <Card key={gr.id} className="shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${gr.status === "active" ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
                    <gr.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{gr.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px]">{gr.category}</Badge>
                      <Badge variant="outline" className={`text-[9px] ${gr.status === "active" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {gr.status === "active" ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Switch checked={gr.status === "active"} onCheckedChange={() => toast(`Guardrail ${gr.status === "active" ? "paused" : "activated"}`)} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{gr.description}</p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div>
                  <p className="text-[10px] text-muted-foreground">Threshold</p>
                  <p className="text-xs font-semibold font-mono">{gr.threshold}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Triggered</p>
                  <p className="text-xs font-semibold">{gr.triggerCount}x · {gr.lastTriggered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Recent Triggers */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Guardrail Triggers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTriggers.map((t, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.guardrail}</p>
                    <p className="text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{t.ticket}</span>
                  <span className="text-xs text-muted-foreground">{t.agent}</span>
                  <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">{t.action}</Badge>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{t.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
