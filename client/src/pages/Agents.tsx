import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageCircle, Mail, Instagram,
  ArrowRight, CheckCircle2,
  Bot, Loader2, ArrowUpRight,
  Zap, Clock, Sparkles, Globe,
  X, Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AgentStatus = "setting-up" | "ready-to-test" | "live" | "paused";

const statusCfg: Record<AgentStatus, { label: string; color: string }> = {
  "setting-up": { label: "Setting Up", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "ready-to-test": { label: "Ready to Test", color: "text-blue-700 bg-blue-50 border-blue-200" },
  live: { label: "Live", color: "text-primary bg-primary/10 border-primary/20" },
  paused: { label: "Paused", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channel: "Live Chat", channelType: "chat",
    integration: "RC Widget", status: "live" as AgentStatus,
    sessions: 847, csat: 4.6, resolution: 91.2,
    setupSteps: null as null | { done: number; total: number; next: string; steps: string[] },
  },
  {
    id: "email-agent", name: "Email Support Agent", channel: "Email", channelType: "email",
    integration: "Zendesk Email", status: "setting-up" as AgentStatus,
    sessions: 0, csat: 0, resolution: 0,
    setupSteps: { done: 1, total: 3, next: "Connect Zendesk", steps: ["Create agent", "Connect Zendesk", "Test & go live"] },
  },
];

interface OpportunityItem {
  id: string;
  label: string;
  statusVar: string;
  statusText: string;
  benefit: string;
  href: string;
  done: boolean;
}

const opportunities: OpportunityItem[] = [
  {
    id: "sync-orders",
    label: "Sync all orders",
    statusVar: "60% synced",
    statusText: " \u2014 sync all for better accuracy",
    benefit: "Full order history enables more accurate responses",
    href: "/seel/integrations",
    done: false,
  },
  {
    id: "enrich-kb",
    label: "Enrich knowledge base",
    statusVar: "3 articles",
    statusText: " added \u2014 add more to improve coverage",
    benefit: "More articles help resolve a wider range of inquiries",
    href: "/playbook",
    done: false,
  },
  {
    id: "activate-skills",
    label: "Activate more skills",
    statusVar: "2 of 6",
    statusText: " skills enabled",
    benefit: "Unlock returns, exchanges, and tracking capabilities",
    href: "/playbook/skills",
    done: false,
  },
  {
    id: "review-knowledge-gaps",
    label: "Review knowledge gaps",
    statusVar: "21 gaps",
    statusText: " detected this week — suggest articles to improve coverage",
    benefit: "Filling knowledge gaps reduces escalations and improves resolution rate",
    href: "/performance/conversations",
    done: false,
  },
];

type ChannelType = "email" | "live-chat" | "social-messaging" | "live-chat-widget";

const allChannels: { id: ChannelType; label: string; icon: typeof Mail; desc: string; integration: string; comingSoonAlt?: string }[] = [
  { id: "email", label: "Email", icon: Mail, desc: "Email tickets via ticketing system", integration: "Zendesk Email", comingSoonAlt: "Gorgias Email" },
  { id: "live-chat", label: "Live Chat", icon: MessageCircle, desc: "Real-time chat on your site", integration: "RC Widget" },
  { id: "live-chat-widget", label: "Live Chat Widget", icon: Globe, desc: "Standalone chat widget for any website", integration: "Seel Widget" },
  { id: "social-messaging", label: "Social Messaging", icon: Instagram, desc: "Instagram, Facebook, WhatsApp", integration: "Zendesk Messaging" },
];

const defaultNames: Record<ChannelType, string> = {
  email: "Email Support Agent",
  "live-chat": "Live Chat Agent",
  "live-chat-widget": "Website Chat Agent",
  "social-messaging": "Social Media Agent",
};

const channelTypeToId: Record<string, ChannelType> = {
  chat: "live-chat",
  email: "email",
  social: "social-messaging",
};
const existingChannelIds = new Set(agents.map(a => channelTypeToId[a.channelType]).filter(Boolean));

const expandableChannels = [
  { id: "email" as ChannelType, label: "Email", icon: Mail, desc: "Resolve tickets from Zendesk, Gorgias, or Freshdesk", color: "bg-blue-50 text-blue-600" },
  { id: "live-chat" as ChannelType, label: "Live Chat", icon: MessageCircle, desc: "Real-time support via RC Widget", color: "bg-primary/10 text-primary" },
  { id: "live-chat-widget" as ChannelType, label: "Live Chat Widget", icon: Globe, desc: "Standalone AI chat widget for any page", color: "bg-teal-50 text-teal-600" },
  { id: "social-messaging" as ChannelType, label: "Social", icon: Instagram, desc: "Instagram, Facebook, WhatsApp", color: "bg-pink-50 text-pink-600" },
].filter(ch => !existingChannelIds.has(ch.id));

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  if (type === "widget") return <Globe className={className} />;
  return <MessageCircle className={className} />;
}

const INTRO_KEY = "seel-ai-intro-seen";
const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Agents() {
  const [, navigate] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [agentName, setAgentName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(INTRO_KEY)) setShowIntro(true);
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    localStorage.setItem(INTRO_KEY, "true");
  };

  const enableAI = () => {
    dismissIntro();
    toast.success("AI Support enabled \u2014 let\u2019s get started!");
  };

  const liveAgents = agents.filter(a => a.status === "live");
  const hasLiveAgent = liveAgents.length > 0;

  const handleChannelSelect = (id: ChannelType) => {
    setChannel(id);
    setAgentName(defaultNames[id]);
  };

  const handleCreate = () => {
    if (!agentName.trim() || !channel) return;
    setCreating(true);
    setTimeout(() => {
      toast.success(`${agentName} created \u2014 let\u2019s set it up`);
      setCreating(false);
      setCreateOpen(false);
      navigate("/agents/email-agent");
    }, 800);
  };

  const handleOpenCreate = (preselect?: ChannelType) => {
    if (preselect) {
      setChannel(preselect);
      setAgentName(defaultNames[preselect]);
    } else {
      setChannel("");
      setAgentName("");
    }
    setCreating(false);
    setCreateOpen(true);
  };

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[960px] space-y-6">

      {/* Page Header \u2014 no description */}
      <motion.div variants={iV}>
        <h1 className="text-lg font-semibold">AI Agents</h1>
      </motion.div>

      {/* Live Agent Status Banner */}
      {hasLiveAgent && (
        <motion.div variants={iV}>
          <div className="rounded-xl bg-primary/[0.04] border border-primary/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">
                  Your agent resolved <span className="text-primary font-semibold">91%</span> of <span className="text-primary font-semibold">847 conversations</span> this week
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Avg response time 1.1s \u00b7 CSAT 4.6/5.0
                </p>
              </div>
              <Link href="/performance/overview">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary">
                  View Performance <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Agent Cards */}
      <motion.div variants={iV}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your Agents</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground" onClick={() => handleOpenCreate()}>
            <Plus className="w-3 h-3" /> New Agent
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => {
            const sc = statusCfg[agent.status];
            const isLive = agent.status === "live";
            const isSettingUp = agent.status === "setting-up";
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
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cc)}>
                          <ChannelIcon type={agent.channelType} className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{agent.name}</p>
                          <p className="text-[11px] text-muted-foreground">{agent.channel} \u00b7 {agent.integration}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] shrink-0 font-medium", sc.color)}>{sc.label}</Badge>
                      </div>

                      {isLive && (
                        <div className="grid grid-cols-3 gap-2 mt-auto">
                          {[
                            { value: agent.sessions, label: "Sessions (7d)" },
                            { value: `${agent.resolution}%`, label: "Resolution" },
                            { value: agent.csat, label: "CSAT" },
                          ].map((m, i) => (
                            <div key={i} className="bg-primary/[0.03] rounded-md px-2.5 py-1.5 text-center">
                              <p className="text-sm font-bold text-primary">{m.value}</p>
                              <p className="text-[9px] text-muted-foreground">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isSettingUp && agent.setupSteps && (
                        <div className="mt-auto space-y-2.5">
                          <div className="space-y-1">
                            {agent.setupSteps.steps.map((step, i) => {
                              const isDone = i < agent.setupSteps!.done;
                              const isCurrent = i === agent.setupSteps!.done;
                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                                    isDone ? "bg-primary text-white" : isCurrent ? "border-2 border-amber-400 text-amber-600" : "border border-muted-foreground/20 text-muted-foreground/40"
                                  )}>
                                    {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : <span>{i + 1}</span>}
                                  </div>
                                  <span className={cn(
                                    "text-[11px]",
                                    isDone ? "text-muted-foreground line-through" : isCurrent ? "font-medium text-amber-800" : "text-muted-foreground/60"
                                  )}>{step}</span>
                                  {isCurrent && <ArrowUpRight className="w-3 h-3 text-amber-500 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(agent.setupSteps.done / agent.setupSteps.total) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Expand to More Channels */}
      {expandableChannels.length > 0 && (
        <motion.div variants={iV}>
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold">Expand to more channels</h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Your AI agent\u2019s skills and knowledge carry over \u2014 set up a new channel in under 5 minutes.
            </p>
            <div className={cn("grid gap-2", expandableChannels.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
              {expandableChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => handleOpenCreate(ch.id)}
                  className="text-left p-3 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", ch.color)}>
                      <ch.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-medium group-hover:text-primary transition-colors">{ch.label}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{ch.desc}</p>
                  <p className="text-[10px] text-primary mt-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Set up now <ArrowRight className="w-2.5 h-2.5" />
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Better Your Customer Experience */}
      <motion.div variants={iV}>
        <div className="rounded-xl bg-muted/40 border border-border/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-sm font-semibold">Better Your Customer Experience</p>
          </div>
          <div className="space-y-0.5">
            {opportunities.map((item) => (
              <Link key={item.id} href={item.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background/80 transition-colors cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                    item.done ? "bg-primary" : "border-[1.5px] border-muted-foreground/20"
                  )}>
                    {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-[13px] leading-tight",
                        item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"
                      )}>
                        {item.label}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      <span className="text-primary font-semibold">{item.statusVar}</span>{item.statusText}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/15 group-hover:text-primary/50 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* V3 Prototype Demo */}
      <motion.div variants={iV}>
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">V3 Prototype Demo</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">New architecture: Management HQ + Zendesk Sidebar · Single Agent · SOP + Ticket Analysis Onboarding</p>
              </div>
            </div>
            <a href="/prototype/index.html" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5">
                Open Demo <ArrowUpRight className="w-3 h-3" />
              </Button>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Create Agent Dialog */}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>Choose a channel and name your agent. Your existing skills and knowledge base will be available automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-medium mb-2.5 block">Channel</label>
              <div className="grid grid-cols-2 gap-2.5">
                {allChannels.map(ch => {
                  const selected = channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch.id)}
                      className={cn(
                        "text-left p-3.5 rounded-lg border transition-all",
                        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <ch.icon className={cn("w-4.5 h-4.5 mb-1.5", selected ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-[13px] font-medium leading-tight">{ch.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ch.desc}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5">{ch.integration}</p>
                      {ch.comingSoonAlt && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-muted-foreground/50">{ch.comingSoonAlt}</span>
                          <Badge variant="secondary" className="text-[7px] px-1 py-0">Soon</Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {channel && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
                <Input
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder={channel ? defaultNames[channel] : "Agent name"}
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">You can change this later in agent settings.</p>
              </motion.div>
            )}

            {channel && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: 0.05 }}>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Agent will start in <strong>Setting Up</strong> mode. Takes about 5 minutes.
                  </p>
                  <Button onClick={handleCreate} disabled={!agentName.trim() || creating} className="gap-1.5">
                    {creating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</>
                    ) : (
                      <><Bot className="w-3.5 h-3.5" /> Create Agent</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Intro Dialog for new merchants */}
      <Dialog open={showIntro} onOpenChange={(open) => { if (!open) dismissIntro(); }}>
        <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Left content */}
            <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-bold tracking-tight leading-tight">
                Introduce AI Support for{" "}
                <span className="text-primary">E-commerce</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Your new team member that drives sales and automates support in 1:1 conversations.
              </p>
              <div className="mt-5 space-y-2.5">
                {[
                  "Leads customers to fast resolutions in seconds, not hours.",
                  "Enhances team productivity, reducing workload & response times by automating up to 60% of your tickets.",
                  "Offers tailored discounts and product recommendations to drive personalized shopping experiences.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={enableAI} className="gap-2 px-5">
                  Enable AI Support <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={dismissIntro} className="gap-1.5">
                  Learn more <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                No complex setup required. Our AI learns from your existing store data.
              </p>
              <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xl font-bold text-primary">98%</p>
                  <p className="text-[10px] text-muted-foreground">Resolution Accuracy</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">24/7</p>
                  <p className="text-[10px] text-muted-foreground">Active Monitoring</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">&lt;2s</p>
                  <p className="text-[10px] text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </div>

            {/* Right illustration */}
            <div className="md:col-span-2 bg-muted/30 p-5 flex flex-col justify-center border-l border-border/50">
              <div className="rounded-xl bg-card border border-border/80 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">AI Assistant</p>
                    <p className="text-[9px] text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Processing in real-time
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%]">
                    <p className="text-[11px] text-foreground/80">"Hey, where is my order #4829? It was supposed to arrive yesterday."</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 max-w-[90%]">
                    <p className="text-[10px] font-semibold text-primary mb-1">Seel AI Agent</p>
                    <p className="text-[11px] text-foreground/80">"Checking your status... I see order #4829 is currently with the courier. It's scheduled for delivery by 4 PM today."</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[8px] gap-1 px-1.5"><MessageCircle className="w-2.5 h-2.5" /> TRACKING INFO</Badge>
                      <Badge variant="secondary" className="text-[8px] gap-1 px-1.5"><Mail className="w-2.5 h-2.5" /> ENABLE SMS</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-5 h-5 rounded-full bg-muted" />
                  <span className="text-[10px] text-muted-foreground italic">Typing...</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 bg-card border border-border/80 rounded-lg px-3 py-2 shadow-sm">
                <div className="text-right">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Conversion</p>
                  <p className="text-lg font-bold text-primary">+24%</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
