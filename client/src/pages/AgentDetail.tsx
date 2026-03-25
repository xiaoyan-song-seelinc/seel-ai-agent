/**
 * AgentDetail V9 — Redesigned Setup as step-by-step wizard
 * Each setup step is a full action section (not a checklist item).
 * Zendesk config (OAuth, Trigger guide, Reply Mode, Escalation Group) is Step 1-2.
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MessageSquare, BarChart3, CheckCircle2,
  Send, Zap, BookOpen, Mail, MessageCircle, Bot,
  Target, Power, Eye, Play, Instagram,
  ExternalLink, Pencil, Globe, Plus, X,
  Loader2, ArrowRight, Package, Shield, ShoppingCart,
  Lock, Copy, HelpCircle, RefreshCw, ChevronDown, ChevronRight,
  AlertTriangle, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

interface Skill {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  isDefault?: boolean;
  conversations?: number;
  successRate?: number;
}

interface AgentData {
  name: string;
  status: AgentStatus;
  channel: { type: string; label: string; provider: string; integration: string };
  skills: Skill[];
  csat: number;
  resolutionRate: number;
  avgResponseTime: string;
  sessionsToday: number;
  escalationRate: number;
  recentConversations: { id: string; customer: string; topic: string; sentiment: string; status: string; time: string; summary: string }[];
  auditLog: { time: string; action: string; ticket: string; detail: string; status: string }[];
}

/* ── Available skills for Add Skill dialog ── */
const allSkills: Skill[] = [
  { id: "s1", name: "Post-purchase Claims", desc: "Handle refund requests, damaged items, and missing orders", enabled: true, isDefault: true },
  { id: "s2", name: "Where Is My Order (WISMO)", desc: "Track order status, provide shipping updates, and handle delivery inquiries", enabled: true, isDefault: true },
  { id: "s3", name: "Order Changes", desc: "Process cancellations, address changes, and item swaps", enabled: false },
  { id: "s4", name: "Returns & Exchanges", desc: "Initiate returns, generate labels, and process exchanges", enabled: false },
  { id: "s5", name: "Subscription Management", desc: "Handle subscription pause, resume, upgrade, and cancellation", enabled: false },
  { id: "s6", name: "Product Inquiry", desc: "Answer product questions using knowledge base, recommend alternatives", enabled: false },
];

/* ── Mock agent data ── */
const agentsDb: Record<string, AgentData> = {
  "rc-chat": {
    name: "RC Live Chat Agent",
    status: "live",
    channel: { type: "chat", label: "Live Chat", provider: "RC Widget", integration: "RC Widget" },
    skills: [
      { id: "s1", name: "Post-purchase Claims", desc: "Handle refund requests", enabled: true, isDefault: true, conversations: 276, successRate: 94.2 },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Track order status", enabled: true, isDefault: true, conversations: 342, successRate: 97.1 },
      { id: "s3", name: "Order Changes", desc: "Process cancellations", enabled: true, conversations: 154, successRate: 88.5 },
    ],
    csat: 4.6, resolutionRate: 91.2, avgResponseTime: "1.1s", sessionsToday: 847, escalationRate: 8.8,
    recentConversations: [
      { id: "C-1001", customer: "Sarah Johnson", topic: "WISMO", sentiment: "positive", status: "resolved", time: "14:33", summary: "Provided tracking info for order #8834" },
      { id: "C-1002", customer: "Mike Chen", topic: "Refund", sentiment: "neutral", status: "active", time: "14:30", summary: "Processing partial refund for damaged item" },
      { id: "C-1003", customer: "Emma Davis", topic: "Order Change", sentiment: "positive", status: "resolved", time: "14:28", summary: "Updated shipping address before dispatch" },
      { id: "C-1004", customer: "James Wilson", topic: "WISMO", sentiment: "negative", status: "escalated", time: "14:25", summary: "Order delayed — escalated to human" },
    ],
    auditLog: [
      { time: "14:35", action: "reply", ticket: "C-1001", detail: "Sent tracking info for order #8834", status: "success" },
      { time: "14:34", action: "check_order", ticket: "C-1001", detail: "Fetched order #8834 details", status: "success" },
      { time: "14:33", action: "refund", ticket: "C-1002", detail: "Partial refund $45 processed", status: "success" },
      { time: "14:30", action: "refund", ticket: "C-1003", detail: "Refund $120 blocked by guardrail", status: "blocked" },
      { time: "14:28", action: "escalate", ticket: "C-1004", detail: "Escalated — order >14 days late", status: "escalated" },
    ],
  },
  "email-agent": {
    name: "Email Support Agent",
    status: "setting-up",
    channel: { type: "email", label: "Email", provider: "Zendesk", integration: "Zendesk Email" },
    skills: [
      { id: "s1", name: "Post-purchase Claims", desc: "Handle refund requests, damaged items, and missing orders", enabled: true, isDefault: true },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Track order status, provide shipping updates, and handle delivery inquiries", enabled: true, isDefault: true },
    ],
    csat: 0, resolutionRate: 0, avgResponseTime: "—", sessionsToday: 0, escalationRate: 0,
    recentConversations: [],
    auditLog: [],
  },
};

const defaultAgent = agentsDb["rc-chat"];

/* ── Test messages ── */
const testMessages = [
  { role: "customer" as const, text: "Hi, I ordered a pair of shoes last week and they arrived damaged. I'd like a refund please.", time: "Test" },
  { role: "agent" as const, text: "I'm sorry to hear about the damaged shoes. I can see your order #4521 — a pair of Classic Sneakers for $89. I'll process a full refund for you right away. You should see the refund in 3-5 business days. Is there anything else I can help with?", time: "Test" },
];

export default function AgentDetail() {
  const params = useParams<{ id: string }>();
  const agent = agentsDb[params.id || "rc-chat"] || defaultAgent;

  const ChannelIcon = agent.channel.type === "email" ? Mail : agent.channel.type === "social" ? Instagram : MessageCircle;
  const channelColor = agent.channel.type === "email" ? "text-blue-500" : agent.channel.type === "social" ? "text-pink-500" : "text-primary";

  const statusLabel: Record<AgentStatus, { text: string; color: string; dot: string }> = {
    "setting-up": { text: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400" },
    "ready-to-test": { text: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-400" },
    "live": { text: "Live", color: "text-primary bg-primary/10 border-primary/20", dot: "bg-primary" },
    "paused": { text: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  };
  const sl = statusLabel[agent.status];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-[960px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agents"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
              agent.channel.type === "email" ? "bg-blue-50" : agent.channel.type === "social" ? "bg-pink-50" : "bg-primary/10"
            )}>
              <ChannelIcon className={cn("w-5 h-5", channelColor)} />
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", sl.dot)} />
          </div>
          <div>
            <h1 className="text-base font-semibold">{agent.name}</h1>
            <p className="text-xs text-muted-foreground">{agent.channel.label} · {agent.channel.integration}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-medium", sl.color)}>{sl.text}</Badge>
      </div>

      {agent.status === "setting-up" && <SettingUpView agent={agent} />}
      {agent.status === "ready-to-test" && <ReadyToTestView agent={agent} />}
      {(agent.status === "live" || agent.status === "paused") && <LiveView agent={agent} />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Setting Up View — Step-by-step Wizard ── */
/* ═══════════════════════════════════════════ */
function SettingUpView({ agent }: { agent: AgentData }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });

  // Step 1: Connect Zendesk
  const [zdConnected, setZdConnected] = useState(false);
  const [zdSubdomain, setZdSubdomain] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Step 2: Configure
  const [replyMode, setReplyMode] = useState("internal_note");
  const [escalationGroup, setEscalationGroup] = useState("tier-2-support");
  const [triggerGuideOpen, setTriggerGuideOpen] = useState(false);

  // Step 3: Skills
  const [skills, setSkills] = useState<Skill[]>(agent.skills);
  const [showAddSkill, setShowAddSkill] = useState(false);

  const totalSteps = 4;
  const completedCount = Object.values(stepsCompleted).filter(Boolean).length;

  const handleConnectZendesk = () => {
    if (!zdSubdomain.trim()) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setZdConnected(true);
      toast.success(`Connected to ${zdSubdomain}.zendesk.com`);
    }, 1200);
  };

  const completeStep = (step: number) => {
    setStepsCompleted(prev => ({ ...prev, [step]: true }));
    if (step < totalSteps) {
      setCurrentStep(step + 1);
    }
    toast.success("Step completed");
  };

  const handleToggleSkill = (skillId: string) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, enabled: !s.enabled } : s));
  };

  const handleAddSkill = (skill: Skill) => {
    if (skills.find(s => s.id === skill.id)) return;
    setSkills(prev => [...prev, { ...skill, enabled: true }]);
    toast.success(`${skill.name} added`);
  };

  const availableToAdd = allSkills.filter(s => !skills.find(existing => existing.id === s.id));

  const steps = [
    { num: 1, title: "Connect Zendesk", desc: "Authorize Seel to access your Zendesk account" },
    { num: 2, title: "Configure Channel", desc: "Set up how the agent interacts with Zendesk" },
    { num: 3, title: "Review Skills", desc: "Choose which skills this agent can use" },
    { num: 4, title: "Test Agent", desc: "Verify your agent works as expected" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Step Navigation ── */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.num)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left",
                currentStep === step.num
                  ? "bg-primary/10 border border-primary/20"
                  : stepsCompleted[step.num]
                    ? "hover:bg-muted/50"
                    : "hover:bg-muted/30 opacity-70"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                stepsCompleted[step.num]
                  ? "bg-primary text-white"
                  : currentStep === step.num
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground"
              )}>
                {stepsCompleted[step.num] ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
              </div>
              <div className="hidden sm:block">
                <p className={cn("text-xs font-medium leading-tight", currentStep === step.num ? "text-primary" : "")}>{step.title}</p>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className={cn("w-6 h-px mx-1", stepsCompleted[step.num] ? "bg-primary/40" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(completedCount / totalSteps) * 100}%` }} />
        </div>
        <span>{completedCount} of {totalSteps} completed</span>
      </div>

      {/* ── Step Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* ══ Step 1: Connect Zendesk ══ */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    Connect Zendesk
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 ml-10">Authorize Seel to access your Zendesk account via the Seel App. This uses OAuth — no API tokens needed.</p>
                </div>

                {!zdConnected ? (
                  <div className="ml-10 space-y-4">
                    <div>
                      <Label className="text-sm">Zendesk Subdomain</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input
                          value={zdSubdomain}
                          onChange={e => setZdSubdomain(e.target.value)}
                          placeholder="your-company"
                          className="max-w-[220px] h-9"
                        />
                        <span className="text-sm text-muted-foreground">.zendesk.com</span>
                      </div>
                    </div>
                    <Button onClick={handleConnectZendesk} disabled={!zdSubdomain.trim() || connecting} className="gap-2">
                      {connecting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                      ) : (
                        <><ExternalLink className="w-4 h-4" /> Authorize with Zendesk</>
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      This will redirect you to Zendesk to approve the Seel App. Permissions include: read/write tickets, read users, read groups.
                    </p>
                  </div>
                ) : (
                  <div className="ml-10 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Connected to {zdSubdomain}.zendesk.com</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Authorized via Seel App (OAuth)</p>
                      </div>
                    </div>

                    {!stepsCompleted[1] && (
                      <Button onClick={() => completeStep(1)} className="gap-1.5">
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ══ Step 2: Configure Channel ══ */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    Configure Channel
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 ml-10">Set up how tickets are routed and how the agent responds.</p>
                </div>

                {/* Trigger Setup */}
                <div className="ml-10 p-4 rounded-lg border border-amber-200/60 bg-amber-50/30 space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Zendesk Trigger Setup</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You need to create a Trigger in your Zendesk admin panel to route tickets to Seel. This is a one-time setup in your Zendesk account.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setTriggerGuideOpen(true)}>
                      <BookOpen className="w-3 h-3" /> View Setup Guide
                    </Button>
                    <a
                      href="https://support.zendesk.com/hc/en-us/articles/203662246"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Zendesk Docs
                    </a>
                  </div>
                </div>

                {/* Reply Mode */}
                <div className="ml-10 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">Reply Mode</Label>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[280px]">
                        "Public reply" is visible to the customer. "Internal note" is only visible to your team — recommended for initial rollout.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={replyMode} onValueChange={setReplyMode}>
                    <SelectTrigger className="max-w-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_reply">
                        <span className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          Public Reply — visible to customer
                        </span>
                      </SelectItem>
                      <SelectItem value="internal_note">
                        <span className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          Internal Note — team only (recommended)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {replyMode === "internal_note" && (
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Human agents will review AI drafts before sending to customers.
                    </p>
                  )}
                  {replyMode === "public_reply" && (
                    <p className="text-[11px] text-primary flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI responses go directly to customers. Ensure guardrails are configured.
                    </p>
                  )}
                </div>

                {/* Escalation Group */}
                <div className="ml-10 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">Escalation Group</Label>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[280px]">
                        When the agent can't resolve an issue, the ticket is reassigned to this Zendesk group with an internal note.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={escalationGroup} onValueChange={setEscalationGroup}>
                    <SelectTrigger className="max-w-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier-2-support">Tier 2 Support</SelectItem>
                      <SelectItem value="senior-agents">Senior Agents</SelectItem>
                      <SelectItem value="cx-managers">CX Managers</SelectItem>
                      <SelectItem value="billing-team">Billing Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Groups are synced from your Zendesk account.{" "}
                    <button className="text-primary hover:underline" onClick={() => toast.success("Groups refreshed")}>Refresh</button>
                  </p>
                </div>

                {/* Continue */}
                {!stepsCompleted[2] && (
                  <div className="ml-10 pt-2">
                    <Button onClick={() => completeStep(2)} className="gap-1.5">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ══ Step 3: Review Skills ══ */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    Review Skills
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 ml-10">Choose which skills this agent can use. Default skills are pre-enabled based on your setup.</p>
                </div>

                <div className="ml-10 space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all",
                      skill.enabled ? "border-border" : "border-border/50 opacity-60"
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{skill.name}</p>
                          {skill.isDefault && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Default</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{skill.desc}</p>
                      </div>
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={() => handleToggleSkill(skill.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="ml-10 flex items-center gap-3">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowAddSkill(true)}>
                    <Plus className="w-3 h-3" /> Add Skill
                  </Button>
                  <Link href="/playbook/skills">
                    <span className="text-xs text-primary hover:underline cursor-pointer">Manage all skills →</span>
                  </Link>
                </div>

                {!stepsCompleted[3] && (
                  <div className="ml-10 pt-2">
                    <Button onClick={() => completeStep(3)} className="gap-1.5">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ══ Step 4: Test Agent ══ */}
          {currentStep === 4 && (
            <TestStep agent={agent} onComplete={() => completeStep(4)} completed={stepsCompleted[4]} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── All steps done banner ── */}
      {completedCount === totalSteps && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">Setup Complete</p>
              <p className="text-xs text-muted-foreground">Your agent is ready to go live.</p>
            </div>
          </div>
          <Button className="gap-1.5" onClick={() => toast.success(`${agent.name} is now Live!`)}>
            <Play className="w-4 h-4" /> Deploy Live
          </Button>
        </motion.div>
      )}

      {/* ── Add Skill Dialog ── */}
      <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>Choose a skill to add to this agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {availableToAdd.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All available skills have been added</p>
            ) : (
              availableToAdd.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => { handleAddSkill(skill); setShowAddSkill(false); }}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <p className="text-sm font-medium">{skill.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.desc}</p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Trigger Setup Guide Dialog ── */}
      <Dialog open={triggerGuideOpen} onOpenChange={setTriggerGuideOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Zendesk Trigger Setup Guide
            </DialogTitle>
            <DialogDescription>
              Follow these steps to route tickets to Seel AI Agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <GuideStep num={1} title="Open Zendesk Admin Center">
              <p className="text-xs text-muted-foreground">
                Navigate to <code className="bg-muted px-1 rounded text-[11px]">Admin Center &gt; Objects and rules &gt; Business rules &gt; Triggers</code>
              </p>
            </GuideStep>

            <GuideStep num={2} title="Create a New Trigger">
              <p className="text-xs text-muted-foreground mb-2">Click "Add trigger" and configure:</p>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2 text-xs">
                <div>
                  <p className="font-medium text-[11px]">Trigger Name</p>
                  <code className="bg-muted px-2 py-0.5 rounded text-[11px]">Seel AI Agent - Route New Tickets</code>
                </div>
                <div>
                  <p className="font-medium text-[11px]">Conditions (Meet ALL)</p>
                  <ul className="text-muted-foreground mt-1 space-y-0.5 ml-3 list-disc text-[11px]">
                    <li>Ticket: Status is New</li>
                    <li>Ticket: Channel is Email (or preferred channels)</li>
                    <li>Ticket: Tags does not contain <code className="bg-muted px-1 rounded">seel_skip</code></li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-[11px]">Actions</p>
                  <ul className="text-muted-foreground mt-1 space-y-0.5 ml-3 list-disc text-[11px]">
                    <li>Notify target: <code className="bg-muted px-1 rounded">Seel AI Webhook</code></li>
                    <li>Add tags: <code className="bg-muted px-1 rounded">seel_ai_processing</code></li>
                  </ul>
                </div>
              </div>
            </GuideStep>

            <GuideStep num={3} title="Create the Webhook Target">
              <p className="text-xs text-muted-foreground mb-2">
                In <code className="bg-muted px-1 rounded text-[11px]">Admin Center &gt; Apps and integrations &gt; Webhooks</code>:
              </p>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2 text-xs">
                <div>
                  <p className="font-medium text-[11px]">Endpoint URL</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="bg-muted px-2 py-0.5 rounded text-[11px] flex-1">https://api.seel.com/webhooks/zendesk/acme</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText("https://api.seel.com/webhooks/zendesk/acme"); toast.success("Copied"); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div><p className="font-medium text-[11px]">Method</p><code className="bg-muted px-2 py-0.5 rounded text-[11px]">POST</code></div>
                  <div><p className="font-medium text-[11px]">Format</p><code className="bg-muted px-2 py-0.5 rounded text-[11px]">JSON</code></div>
                </div>
              </div>
            </GuideStep>

            <GuideStep num={4} title="Test the Trigger">
              <p className="text-xs text-muted-foreground">
                Create a test ticket in Zendesk and verify the webhook is received. You can check the connection status in Step 1.
              </p>
            </GuideStep>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary">
                Need help? Contact <a href="mailto:support@seel.com" className="underline">support@seel.com</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Guide Step helper ── */
function GuideStep({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{num}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

/* ── Test Step Component ── */
function TestStep({ agent, onComplete, completed }: { agent: AgentData; onComplete: () => void; completed: boolean }) {
  const [testInput, setTestInput] = useState("");
  const [messages, setMessages] = useState(testMessages);

  const handleSend = () => {
    if (!testInput.trim()) return;
    setMessages(prev => [...prev, { role: "customer" as const, text: testInput, time: "Test" }]);
    setTestInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Thank you for reaching out. Let me look into that for you. I can see the details of your order and I'll help resolve this right away.",
        time: "Test",
      }]);
    }, 1000);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            Test Your Agent
          </h2>
          <p className="text-sm text-muted-foreground mt-1 ml-10">Send test messages to verify your agent responds correctly before going live.</p>
        </div>

        <div className="ml-10">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[280px] overflow-y-auto p-3 space-y-2.5 bg-muted/10">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-xl px-3 py-2",
                    msg.role === "customer" ? "bg-muted" : "bg-primary/10 border border-primary/15"
                  )}>
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agent.name}</p>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t bg-background">
              <Input value={testInput} onChange={e => setTestInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type a test message as a customer..." className="text-xs h-8" />
              <Button size="sm" onClick={handleSend} className="h-8 px-3"><Send className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>

        {!completed && (
          <div className="ml-10 pt-2">
            <Button onClick={onComplete} className="gap-1.5">
              Mark as Tested <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Ready to Test View ── */
/* ═══════════════════════════════════════════ */
function ReadyToTestView({ agent }: { agent: AgentData }) {
  const [testInput, setTestInput] = useState("");
  const [messages, setMessages] = useState(testMessages);
  const [deploying, setDeploying] = useState(false);

  const handleSend = () => {
    if (!testInput.trim()) return;
    setMessages(prev => [...prev, { role: "customer" as const, text: testInput, time: "Test" }]);
    setTestInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Thank you for reaching out. Let me look into that for you. I can see the details of your order and I'll help resolve this right away.",
        time: "Test",
      }]);
    }, 1000);
  };

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      toast.success(`${agent.name} is now Live!`);
      setDeploying(false);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Ready to Test</p>
            <p className="text-[10px] text-blue-600">All setup steps completed. Test your agent before going live.</p>
          </div>
        </div>
        <Button size="sm" className="text-xs gap-1" onClick={handleDeploy} disabled={deploying}>
          {deploying ? "Deploying..." : <><Play className="w-3 h-3" /> Deploy Live</>}
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold mb-1">Test Console</p>
          <p className="text-xs text-muted-foreground mb-3">Send test messages to see how your agent responds.</p>
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[280px] overflow-y-auto p-3 space-y-2.5 bg-muted/10">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-xl px-3 py-2",
                    msg.role === "customer" ? "bg-muted" : "bg-primary/10 border border-primary/15"
                  )}>
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agent.name}</p>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t bg-background">
              <Input value={testInput} onChange={e => setTestInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type a test message as a customer..." className="text-xs h-8" />
              <Button size="sm" onClick={handleSend} className="h-8 px-3"><Send className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Live View (also used for Paused) ── */
/* ═══════════════════════════════════════════ */
function LiveView({ agent }: { agent: AgentData }) {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "manager" as const, text: "Why did you give that customer a direct refund just now?", time: "2:34 PM" },
    { role: "agent" as const, text: "The customer's order total was $32, below the $50 auto-refund threshold. Additionally, the customer waited over 48 hours, so I processed the refund per the escalation policy.", time: "2:34 PM" },
  ]);
  const [agentEnabled, setAgentEnabled] = useState(agent.status === "live");

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: "manager" as const, text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Understood. I've noted your instruction and will apply it to future interactions.",
        time: "Now",
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {agent.status === "paused" && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600">Agent is paused. No new conversations will be assigned.</p>
          </div>
          <Button size="sm" className="text-xs gap-1" onClick={() => { setAgentEnabled(true); toast.success("Agent resumed"); }}>
            <Play className="w-3 h-3" /> Resume
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Label className="text-xs text-muted-foreground">{agentEnabled ? "Active" : "Paused"}</Label>
        <Switch checked={agentEnabled} onCheckedChange={(v) => { setAgentEnabled(v); toast.success(v ? "Agent activated" : "Agent paused"); }} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" /> Overview</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1 text-xs"><Target className="w-3 h-3" /> Skills</TabsTrigger>
          <TabsTrigger value="channel" className="gap-1 text-xs"><Mail className="w-3 h-3" /> Channel</TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1 text-xs"><MessageSquare className="w-3 h-3" /> Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <Metric label="Sessions" value={String(agent.sessionsToday)} trend="+12%" />
            <Metric label="Resolution" value={`${agent.resolutionRate}%`} trend="+2.3%" />
            <Metric label="CSAT" value={String(agent.csat)} trend="+0.1" />
            <Metric label="Response" value={agent.avgResponseTime} trend="-0.2s" />
            <Metric label="Escalation" value={`${agent.escalationRate}%`} trend="-1.2%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1 px-4 pt-3"><CardTitle className="text-xs font-semibold">Conversational Management</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="h-[220px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "manager" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-xl px-3 py-2",
                          msg.role === "manager" ? "bg-primary text-white" : "bg-muted"
                        )}>
                          <p className="text-xs leading-relaxed">{msg.text}</p>
                          <p className={cn("text-[9px] mt-0.5", msg.role === "manager" ? "text-white/60" : "text-muted-foreground")}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Instruct your agent..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="text-xs h-8" />
                    <Button onClick={handleSend} size="icon" className="h-8 w-8 shrink-0"><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 px-4 pt-3"><CardTitle className="text-xs font-semibold">Recent Activity</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {agent.auditLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      log.status === "success" ? "bg-primary" : log.status === "blocked" ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium truncate">{log.detail}</p>
                      <p className="text-[9px] text-muted-foreground">{log.time} · {log.ticket}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-3 space-y-3">
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-primary">Skills are globally configured in <Link href="/playbook/skills"><span className="underline font-medium cursor-pointer">Playbook &gt; Skills</span></Link>. Toggle which skills this agent can use below.</p>
          </div>
          <div className="space-y-2">
            {agent.skills.map(skill => (
              <div key={skill.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                skill.enabled ? "border-border bg-card" : "border-border/50 bg-muted/10 opacity-60"
              )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  skill.id === "order-tracking" ? "bg-blue-50" : skill.id === "seel-protection" ? "bg-primary/10" : "bg-amber-50"
                )}>
                  {skill.id === "order-tracking" ? <Package className="w-4 h-4 text-blue-600" /> :
                   skill.id === "seel-protection" ? <Shield className="w-4 h-4 text-primary" /> :
                   <ShoppingCart className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{skill.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{skill.conversations || 0} conversations</span>
                    <span className="text-[10px] text-muted-foreground">{skill.successRate || 0}% success</span>
                  </div>
                </div>
                <Switch
                  checked={skill.enabled}
                  onCheckedChange={() => {
                    toast.success(skill.enabled ? `${skill.name} disabled for this agent` : `${skill.name} enabled for this agent`);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Link href="/playbook/skills">
              <span className="text-xs text-primary hover:underline cursor-pointer">Manage all skills in Playbook →</span>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="channel" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  agent.channel.type === "email" ? "bg-blue-50" : "bg-primary/10"
                )}>
                  {agent.channel.type === "email" ? <Mail className="w-4 h-4 text-blue-500" /> : <MessageCircle className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{agent.channel.label}</p>
                  <p className="text-[11px] text-muted-foreground">via {agent.channel.integration}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] text-primary border-primary/20">Connected</Badge>
              </div>
              {agent.channel.type === "chat" && (
                <div className="space-y-3 pt-3 border-t">
                  <div><Label className="text-xs">Welcome Message</Label><Textarea defaultValue={"Hi there! I'm your support assistant. How can I help you today?"} rows={2} className="mt-1" /></div>
                  <div className="flex items-center justify-between"><Label className="text-xs">Typing Indicator</Label><Switch defaultChecked /></div>
                </div>
              )}
              {agent.channel.type === "email" && (
                <div className="space-y-3 pt-3 border-t">
                  <div><Label className="text-xs">Email Signature</Label><Textarea defaultValue={"Best regards,\nSeel Support Team"} rows={2} className="mt-1" /></div>
                  <div><Label className="text-xs">Reply-to Address</Label><Input defaultValue="support@seel.com" className="mt-1" /></div>
                </div>
              )}
              <div className="flex justify-end"><Button size="sm" className="text-xs" onClick={() => toast.success("Saved")}>Save</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Active" value={String(agent.recentConversations.filter(c => c.status === "active").length)} color="text-primary" />
            <StatBox label="Resolved" value={String(agent.recentConversations.filter(c => c.status === "resolved").length)} color="text-blue-600" />
            <StatBox label="Escalated" value={String(agent.recentConversations.filter(c => c.status === "escalated").length)} color="text-amber-600" />
          </div>
          <div className="space-y-1.5">
            {agent.recentConversations.map(conv => (
              <Card key={conv.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => toast.info("Conversation detail coming soon")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                    conv.status === "active" ? "bg-primary animate-pulse" : conv.status === "resolved" ? "bg-blue-400" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium">{conv.customer}</p>
                      <Badge variant="outline" className="text-[8px]">{conv.topic}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{conv.summary}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{conv.time}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card><CardContent className="p-2.5">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between mt-0.5">
        <p className="text-lg font-bold leading-none">{value}</p>
        <span className="text-[9px] text-primary font-medium">{trend}</span>
      </div>
    </CardContent></Card>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card><CardContent className="p-2.5 text-center">
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </CardContent></Card>
  );
}
