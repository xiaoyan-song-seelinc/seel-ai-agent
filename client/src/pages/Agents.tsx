/**
 * Agents: Team management page
 * - Agent list with 1:1 Channel binding
 * - "Hire Agent" 3-step wizard dialog (Identity → Channel → Review & Deploy)
 * - Per-Agent onboarding flow
 * Entity: Agent 1:1 Channel, references global Knowledge, uses global Skills
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bot, Plus, MessageCircle, Mail, Instagram, Power,
  ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Zap,
  BookOpen, Target, Shield, Settings2, Sparkles, Globe,
  Clock, Play, BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Agents data ── */
const agents = [
  {
    id: "rc-chat", name: "RC Live Chat Agent", channelLabel: "Live Chat", channelType: "chat",
    provider: "RC Widget", status: "active" as const, mode: "Production" as const,
    ticketsToday: 847, csat: 4.6, resolution: 91.2, avgResponse: "1.1s",
    skills: ["Refund Processing", "WISMO", "Order Changes"],
    personality: "Friendly and professional",
  },
];

/* ── Channel options ── */
const channelOptions = [
  { type: "email", label: "Email", icon: Mail, color: "text-blue-500", bg: "bg-blue-50", desc: "Handle email tickets from Zendesk, Gorgias, or other helpdesks", responseTime: "Within 4 hours", tone: "Structured, professional" },
  { type: "chat", label: "Live Chat", icon: MessageCircle, color: "text-teal-500", bg: "bg-teal-50", desc: "Respond to live chat conversations in real-time", responseTime: "Instant (<3s)", tone: "Conversational, friendly" },
  { type: "social", label: "Social Media", icon: Instagram, color: "text-pink-500", bg: "bg-pink-50", desc: "Manage DMs from Instagram, Facebook, and Twitter", responseTime: "Within 1 hour", tone: "Brief, casual" },
];

/* ── Ticketing systems ── */
const ticketingSystems = [
  { id: "zendesk", name: "Zendesk", connected: true },
  { id: "gorgias", name: "Gorgias", connected: false },
  { id: "intercom", name: "Intercom", connected: false },
];

/* ── Personality presets ── */
const personalities = [
  { value: "professional", label: "Professional", desc: "Formal, precise, corporate tone" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "casual", label: "Casual", desc: "Relaxed, informal, emoji-friendly" },
];

/* ── Global resources summary ── */
const globalResources = { knowledgeCount: 12, skillsActive: 3, skillsTotal: 5, actionsEnabled: 4, actionsTotal: 7, globalGuardrails: 3 };

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function ChannelIcon({ type, className }: { type: string; className?: string }) {
  if (type === "email") return <Mail className={className} />;
  if (type === "social") return <Instagram className={className} />;
  return <MessageCircle className={className} />;
}

export default function Agents() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [personality, setPersonality] = useState("");
  const [customPersonality, setCustomPersonality] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [emailSignature, setEmailSignature] = useState("");

  const resetWizard = () => { setWizardStep(1); setAgentName(""); setPersonality(""); setCustomPersonality(""); setSelectedChannel(""); setSelectedProvider(""); setEmailSignature(""); };
  const openWizard = () => { resetWizard(); setWizardOpen(true); };

  const channelInfo = channelOptions.find(c => c.type === selectedChannel);
  const providerInfo = ticketingSystems.find(p => p.id === selectedProvider);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your AI support team. Each agent is deployed to one channel.</p>
        </div>
        <Button onClick={openWizard} className="gap-2 bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4" /> Hire Agent</Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemV} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<Bot className="w-4 h-4" />} label="Total Agents" value={String(agents.length)} />
        <MiniStat icon={<Play className="w-4 h-4" />} label="In Production" value={String(agents.filter(a => a.mode === "Production").length)} />
        <MiniStat icon={<BarChart3 className="w-4 h-4" />} label="Avg Resolution" value={`${(agents.reduce((s, a) => s + a.resolution, 0) / agents.length).toFixed(1)}%`} />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Avg CSAT" value={`${(agents.reduce((s, a) => s + a.csat, 0) / agents.length).toFixed(1)}`} />
      </motion.div>

      {/* Guidance card */}
      {agents.length <= 1 && (
        <motion.div variants={itemV}>
          <Card className="shadow-sm border-blue-200/60 bg-blue-50/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Your team has {agents.length} agent</p>
                <p className="text-xs text-muted-foreground mt-0.5">Hire more agents to cover Email, Social Media, and other channels. Each agent specializes in one channel.</p>
              </div>
              <Button onClick={openWizard} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs gap-1 shrink-0"><Plus className="w-3 h-3" /> Hire Agent</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Agent Cards */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="shadow-sm hover:shadow-md transition-all hover:border-teal-200 group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-teal-600" />
                      </div>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", agent.status === "active" ? "bg-teal-500" : "bg-gray-300")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-teal-700 transition-colors">{agent.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ChannelIcon type={agent.channelType} className={cn("w-3 h-3", agent.channelType === "email" ? "text-blue-500" : agent.channelType === "social" ? "text-pink-500" : "text-teal-500")} />
                        <span className="text-xs text-muted-foreground">{agent.channelLabel} · {agent.provider}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px]", agent.mode === "Production" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200")}>{agent.mode}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <MetricCell label="Today" value={String(agent.ticketsToday)} />
                  <MetricCell label="CSAT" value={String(agent.csat)} />
                  <MetricCell label="Resolution" value={`${agent.resolution}%`} />
                  <MetricCell label="Resp" value={agent.avgResponse} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map(s => <Badge key={s} variant="secondary" className="text-[9px] font-normal">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Add Agent Card */}
        <Card className="shadow-sm border-dashed border-2 border-muted-foreground/20 hover:border-teal-300 hover:bg-teal-50/20 transition-all cursor-pointer group" onClick={openWizard}>
          <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-teal-700 transition-colors">Hire New Agent</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Deploy to Email, Social, or Chat</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Hire Agent Wizard ── */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-teal-600" /> Hire New Agent</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && "Step 1 of 3 — Define your agent's identity"}
              {wizardStep === 2 && "Step 2 of 3 — Choose where this agent will work"}
              {wizardStep === 3 && "Step 3 of 3 — Review and deploy"}
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                  s < wizardStep ? "bg-teal-500 text-white" : s === wizardStep ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500" : "bg-muted text-muted-foreground"
                )}>{s < wizardStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}</div>
                {s < 3 && <div className={cn("h-0.5 flex-1 rounded-full", s < wizardStep ? "bg-teal-500" : "bg-muted")} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Identity ── */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center"><Bot className="w-7 h-7 text-teal-600" /></div>
                <div>
                  <p className="text-sm font-semibold">{agentName || "New Agent"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{personality ? personalities.find(p => p.value === personality)?.label : "No personality set"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agent Name</Label>
                <Input placeholder='e.g. "Email Support Agent"' value={agentName} onChange={e => setAgentName(e.target.value)} />
                <p className="text-xs text-muted-foreground">Visible to your CX team, not to customers.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Personality</Label>
                <div className="grid grid-cols-3 gap-3">
                  {personalities.map(p => (
                    <button key={p.value} onClick={() => setPersonality(p.value)} className={cn("p-3 rounded-lg border text-left transition-all", personality === p.value ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-border hover:border-teal-200")}>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Instructions <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Textarea placeholder="Add specific instructions for this agent's behavior..." value={customPersonality} onChange={e => setCustomPersonality(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { if (!agentName) { toast.error("Please enter an agent name"); return; } if (!personality) { toast.error("Please select a personality"); return; } setWizardStep(2); }} className="gap-1 bg-teal-600 hover:bg-teal-700">Next: Choose Channel <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Channel ── */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ticketing System</Label>
                <p className="text-xs text-muted-foreground">Select the helpdesk this agent will connect to.</p>
                <div className="grid grid-cols-3 gap-3">
                  {ticketingSystems.map(ts => (
                    <button key={ts.id} onClick={() => setSelectedProvider(ts.id)} className={cn("p-3 rounded-lg border text-left transition-all", selectedProvider === ts.id ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-border hover:border-teal-200", !ts.connected && "opacity-70")}>
                      <p className="text-sm font-medium">{ts.name}</p>
                      <Badge variant="outline" className={cn("text-[9px] mt-1", ts.connected ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-gray-50 text-gray-500 border-gray-200")}>{ts.connected ? "Connected" : "Not Connected"}</Badge>
                    </button>
                  ))}
                </div>
                {selectedProvider && !ticketingSystems.find(t => t.id === selectedProvider)?.connected && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 flex-1">This system is not connected yet.</p>
                    <Link href="/settings"><Button size="sm" variant="ghost" className="text-xs h-6 text-amber-700">Connect in Settings →</Button></Link>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Channel Type</Label>
                <p className="text-xs text-muted-foreground">Choose the type of tickets this agent will handle.</p>
                <div className="grid grid-cols-3 gap-3">
                  {channelOptions.map(ch => {
                    const isOccupied = ch.type === "chat";
                    return (
                      <button key={ch.type} onClick={() => !isOccupied && setSelectedChannel(ch.type)} disabled={isOccupied}
                        className={cn("p-3 rounded-lg border text-left transition-all", selectedChannel === ch.type ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-border hover:border-teal-200", isOccupied && "opacity-50 cursor-not-allowed")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", ch.bg)}><ch.icon className={cn("w-4 h-4", ch.color)} /></div>
                        <p className="text-sm font-medium">{ch.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ch.responseTime}</p>
                        {isOccupied && <Badge variant="outline" className="text-[9px] mt-2 bg-gray-50 text-gray-500">Occupied</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Channel-specific config */}
              {selectedChannel === "email" && (
                <div className="space-y-3 p-4 rounded-lg border border-blue-200 bg-blue-50/30">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Channel Settings</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Email Signature</Label>
                    <Textarea placeholder={"Best regards,\nSeel Support Team"} value={emailSignature} onChange={e => setEmailSignature(e.target.value)} rows={3} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Responses are structured and detailed, sent within 4 hours.</p>
                </div>
              )}
              {selectedChannel === "social" && (
                <div className="p-4 rounded-lg border border-pink-200 bg-pink-50/30 space-y-2">
                  <p className="text-xs font-semibold text-pink-700 flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /> Social Media Channel Settings</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Responses within 1 hour, brief and casual tone.</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Globe className="w-3 h-3" /> Supports Instagram DM, Facebook Messenger, Twitter DM.</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => { if (!selectedProvider) { toast.error("Please select a ticketing system"); return; } if (!selectedChannel) { toast.error("Please select a channel type"); return; } setWizardStep(3); }} className="gap-1 bg-teal-600 hover:bg-teal-700">Next: Review <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & Deploy ── */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-muted/30 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center"><Bot className="w-7 h-7 text-teal-600" /></div>
                  <div>
                    <p className="text-base font-bold">{agentName}</p>
                    <p className="text-xs text-muted-foreground">{personalities.find(p => p.value === personality)?.label} · {channelInfo?.label} · {providerInfo?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ReviewItem icon={channelInfo ? <channelInfo.icon className="w-3.5 h-3.5" /> : null} label="Channel" value={channelInfo?.label || ""} />
                  <ReviewItem icon={<Settings2 className="w-3.5 h-3.5" />} label="Provider" value={providerInfo?.name || ""} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Global Resources</p>
                <p className="text-xs text-muted-foreground">This agent will have access to the following shared resources:</p>
                <div className="space-y-2">
                  <ResourceRow icon={<BookOpen className="w-3.5 h-3.5 text-teal-600" />} label="Knowledge Articles" value={`${globalResources.knowledgeCount} articles`} ok />
                  <ResourceRow icon={<Target className="w-3.5 h-3.5 text-violet-600" />} label="Active Skills" value={`${globalResources.skillsActive}/${globalResources.skillsTotal} skills`} ok={globalResources.skillsActive > 0} />
                  <ResourceRow icon={<Zap className="w-3.5 h-3.5 text-amber-600" />} label="Enabled Actions" value={`${globalResources.actionsEnabled}/${globalResources.actionsTotal} actions`} ok={globalResources.actionsEnabled > 0} />
                  <ResourceRow icon={<Shield className="w-3.5 h-3.5 text-red-600" />} label="Global Guardrails" value={`${globalResources.globalGuardrails} rules`} ok />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { toast.success(`${agentName} saved as draft`); setWizardOpen(false); }}>Save as Draft</Button>
                  <Button onClick={() => { toast.success(`${agentName} deployed to ${channelInfo?.label}!`); setWizardOpen(false); }} className="gap-1 bg-teal-600 hover:bg-teal-700"><Power className="w-4 h-4" /> Deploy Agent</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-3 flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div><p className="text-lg font-bold leading-none">{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{label}</p></div>
    </CardContent></Card>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return <div className="text-center"><p className="text-sm font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}

function ReviewItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-border">
      <span className="text-muted-foreground">{icon}</span>
      <div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-xs font-medium">{value}</p></div>
    </div>
  );
}

function ResourceRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
      {icon}<span className="text-sm flex-1">{label}</span><span className="text-xs text-muted-foreground">{value}</span>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
    </div>
  );
}
