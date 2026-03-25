/**
 * AgentDetail V10 — Flat config page for setup, production-style UX.
 * No wizard steps. All config sections visible on one page.
 * Test panel opens as a right-side Sheet drawer.
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageSquare, BarChart3, CheckCircle2,
  Send, Zap, BookOpen, Mail, MessageCircle, Bot,
  Target, Power, Eye, Play, Instagram,
  ExternalLink, Plus, X,
  Loader2, Package, Shield, ShoppingCart,
  Lock, Copy, HelpCircle, Globe, RefreshCw,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
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

const allSkills: Skill[] = [
  { id: "s1", name: "Post-purchase Claims", desc: "Refund requests, damaged items, missing orders", enabled: true, isDefault: true },
  { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking, shipping updates, delivery inquiries", enabled: true, isDefault: true },
  { id: "s3", name: "Order Changes", desc: "Cancellations, address changes, item swaps", enabled: false },
  { id: "s4", name: "Returns & Exchanges", desc: "Returns, labels, exchanges", enabled: false },
  { id: "s5", name: "Subscription Management", desc: "Pause, resume, upgrade, cancel subscriptions", enabled: false },
  { id: "s6", name: "Product Inquiry", desc: "Product questions, recommendations", enabled: false },
];

const agentsDb: Record<string, AgentData> = {
  "rc-chat": {
    name: "RC Live Chat Agent",
    status: "live",
    channel: { type: "chat", label: "Live Chat", provider: "RC Widget", integration: "RC Widget" },
    skills: [
      { id: "s1", name: "Post-purchase Claims", desc: "Refund requests", enabled: true, isDefault: true, conversations: 276, successRate: 94.2 },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking", enabled: true, isDefault: true, conversations: 342, successRate: 97.1 },
      { id: "s3", name: "Order Changes", desc: "Cancellations", enabled: true, conversations: 154, successRate: 88.5 },
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
      { id: "s1", name: "Post-purchase Claims", desc: "Refund requests, damaged items, missing orders", enabled: true, isDefault: true },
      { id: "s2", name: "Where Is My Order (WISMO)", desc: "Order tracking, shipping updates, delivery inquiries", enabled: true, isDefault: true },
    ],
    csat: 0, resolutionRate: 0, avgResponseTime: "—", sessionsToday: 0, escalationRate: 0,
    recentConversations: [],
    auditLog: [],
  },
};

const defaultAgent = agentsDb["rc-chat"];

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

/* ═══════════════════════════════════════════════════════ */
/* ── Setting Up View — Flat config page, no wizard ──    */
/* ═══════════════════════════════════════════════════════ */
function SettingUpView({ agent }: { agent: AgentData }) {
  // Zendesk connection
  const [zdConnected, setZdConnected] = useState(false);
  const [zdSubdomain, setZdSubdomain] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Channel config
  const [deployMode, setDeployMode] = useState("shadow");
  const [escalationGroup, setEscalationGroup] = useState("tier-2-support");

  // Webhook status
  const [webhookStatus, setWebhookStatus] = useState<"waiting" | "connected" | "testing">("waiting");

  // Skills
  const [skills, setSkills] = useState<Skill[]>(agent.skills);
  const [showAddSkill, setShowAddSkill] = useState(false);

  // Trigger guide
  const [triggerGuideOpen, setTriggerGuideOpen] = useState(false);

  // Test drawer
  const [testOpen, setTestOpen] = useState(false);

  const handleConnectZendesk = () => {
    if (!zdSubdomain.trim()) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setZdConnected(true);
      toast.success(`Connected to ${zdSubdomain}.zendesk.com`);
    }, 1200);
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

  return (
    <div className="space-y-8">

      {/* ═══ Integration ═══ */}
      <section>
        <h2 className="text-base font-semibold mb-4">Integration</h2>

        {/* Zendesk connection */}
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Zendesk account</h3>
            {!zdConnected ? (
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-[260px]">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={zdSubdomain}
                      onChange={e => setZdSubdomain(e.target.value)}
                      placeholder="your-company"
                      className="h-9"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">.zendesk.com</span>
                  </div>
                </div>
                <Button onClick={handleConnectZendesk} disabled={!zdSubdomain.trim() || connecting} className="h-9 gap-1.5">
                  {connecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting</> : <><ExternalLink className="w-3.5 h-3.5" /> Authorize</>}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm flex-1">{zdSubdomain}.zendesk.com</span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/20">Connected</Badge>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setZdConnected(false); setZdSubdomain(""); }}>Disconnect</Button>
              </div>
            )}
          </div>

          {/* Ticket routing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Ticket routing</h3>
              <button className="text-xs text-primary hover:underline" onClick={() => setTriggerGuideOpen(true)}>Setup guide</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Webhook URL</Label>
                <div className="flex items-center gap-1.5">
                  <Input readOnly value="https://api.seel.com/webhooks/zendesk/acme" className="h-8 text-xs bg-muted/30 font-mono" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("https://api.seel.com/webhooks/zendesk/acme"); toast.success("Copied"); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Webhook Secret</Label>
                <div className="flex items-center gap-1.5">
                  <Input readOnly value="whsec_••••••••••••" className="h-8 text-xs bg-muted/30 font-mono" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("whsec_abc123xyz"); toast.success("Copied"); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", webhookStatus === "connected" ? "bg-primary" : webhookStatus === "testing" ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/30")} />
              <span className="text-[11px] text-muted-foreground flex-1">
                {webhookStatus === "connected" ? "Last received: 2 min ago" : webhookStatus === "testing" ? "Testing..." : "Waiting for first webhook..."}
              </span>
              <button className="text-[11px] text-primary hover:underline flex items-center gap-1" onClick={() => {
                setWebhookStatus("testing");
                setTimeout(() => { setWebhookStatus("connected"); toast.success("Webhook connection verified"); }, 1500);
              }}>
                <RefreshCw className="w-3 h-3" /> Test
              </button>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* ═══ Agent behavior ═══ */}
      <section>
        <h2 className="text-base font-semibold mb-4">Agent behavior</h2>

        <div className="space-y-5">
          {/* Deploy mode */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Deploy mode</h3>
            <div className="space-y-2">
              <label className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                deployMode === "shadow" ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80"
              )} onClick={() => setDeployMode("shadow")}>
                <div className={cn("w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center",
                  deployMode === "shadow" ? "border-primary" : "border-muted-foreground/30"
                )}>
                  {deployMode === "shadow" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Shadow</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">AI drafts are added as internal notes. Human agents review and send.</p>
                </div>
              </label>
              <label className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                deployMode === "autopilot" ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80"
              )} onClick={() => setDeployMode("autopilot")}>
                <div className={cn("w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center",
                  deployMode === "autopilot" ? "border-primary" : "border-muted-foreground/30"
                )}>
                  {deployMode === "autopilot" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Autopilot</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">AI replies directly to customers. No human review required.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Escalation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Escalation group</h3>
            <Select value={escalationGroup} onValueChange={setEscalationGroup}>
              <SelectTrigger className="h-9 max-w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tier-2-support">Tier 2 Support</SelectItem>
                <SelectItem value="senior-agents">Senior Agents</SelectItem>
                <SelectItem value="cx-managers">CX Managers</SelectItem>
                <SelectItem value="billing-team">Billing Team</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">Tickets the agent can't resolve are reassigned to this group.</p>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Skills</h3>
              <div className="flex items-center gap-2">
                <button className="text-xs text-primary hover:underline" onClick={() => setShowAddSkill(true)}>+ Add</button>
                <Link href="/playbook/skills"><span className="text-xs text-muted-foreground hover:underline cursor-pointer">Manage</span></Link>
              </div>
            </div>
            <div className="space-y-0 border rounded-lg divide-y">
              {skills.map(skill => (
                <div key={skill.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-sm flex-1">{skill.name}</span>
                  {skill.isDefault && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Default</Badge>}
                  <Switch
                    checked={skill.enabled}
                    onCheckedChange={() => handleToggleSkill(skill.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Actions bar ═══ */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTestOpen(true)}>
          <MessageSquare className="w-3.5 h-3.5" /> Test Agent
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Settings saved")}>Save</Button>
          <Button size="sm" className="gap-1.5" disabled={!zdConnected} onClick={() => toast.success(`${agent.name} deployed in ${deployMode === "shadow" ? "Shadow" : "Autopilot"} mode!`)}>
            <Play className="w-3.5 h-3.5" /> Deploy
          </Button>
        </div>
      </div>

      {/* ── Test Agent Sheet (right drawer) ── */}
      <Sheet open={testOpen} onOpenChange={setTestOpen}>
        <SheetContent className="sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm">Test Agent</SheetTitle>
          </SheetHeader>
          <TestPanel agentName={agent.name} />
        </SheetContent>
      </Sheet>

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
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zendesk Trigger Setup</DialogTitle>
            <DialogDescription>Create a Trigger in Zendesk to route tickets to Seel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-sm">
            <div>
              <p className="font-medium mb-1">1. Go to Triggers</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">Admin Center → Objects and rules → Triggers</code>
            </div>
            <div>
              <p className="font-medium mb-1">2. Create Trigger</p>
              <div className="p-3 rounded border bg-muted/20 space-y-2 text-xs">
                <div><span className="font-medium">Name:</span> <code className="bg-muted px-1 rounded">Seel AI Agent - Route New Tickets</code></div>
                <div>
                  <span className="font-medium">Conditions (ALL):</span>
                  <ul className="mt-1 ml-4 list-disc text-muted-foreground">
                    <li>Status is New</li>
                    <li>Channel is Email</li>
                    <li>Tags does not contain <code className="bg-muted px-1 rounded">seel_skip</code></li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Actions:</span>
                  <ul className="mt-1 ml-4 list-disc text-muted-foreground">
                    <li>Notify target: Seel AI Webhook</li>
                    <li>Add tags: <code className="bg-muted px-1 rounded">seel_ai_processing</code></li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">3. Create Webhook</p>
              <div className="p-3 rounded border bg-muted/20 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">URL:</span>
                  <code className="bg-muted px-1 rounded flex-1">https://api.seel.com/webhooks/zendesk/acme</code>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText("https://api.seel.com/webhooks/zendesk/acme"); toast.success("Copied"); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div><span className="font-medium">Method:</span> POST &nbsp; <span className="font-medium">Format:</span> JSON</div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">4. Test</p>
              <p className="text-xs text-muted-foreground">Create a test ticket in Zendesk to verify the webhook fires correctly.</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Need help? <a href="https://support.zendesk.com/hc/en-us/articles/203662246" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Zendesk docs</a> · <a href="mailto:support@seel.com" className="text-primary hover:underline">support@seel.com</a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Test Panel (used inside Sheet) ── */
function TestPanel({ agentName }: { agentName: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(testMessages);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "customer" as const, text: input, time: "Test" }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "agent" as const,
        text: "Thank you for reaching out. Let me look into that for you. I can see the details of your order and I'll help resolve this right away.",
        time: "Test",
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "customer" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-xl px-3 py-2",
              msg.role === "customer" ? "bg-muted" : "bg-primary/10 border border-primary/15"
            )}>
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.role === "customer" ? "Test Customer" : agentName}</p>
              <p className="text-xs leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3 border-t">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type as a customer..." className="text-xs h-8" />
        <Button size="sm" onClick={handleSend} className="h-8 px-3"><Send className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ── Ready to Test View ── */
/* ═══════════════════════════════════════════ */
function ReadyToTestView({ agent }: { agent: AgentData }) {
  const [testOpen, setTestOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);

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
          <p className="text-xs text-blue-800">Setup complete. Test your agent before going live.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setTestOpen(true)}>
            <MessageSquare className="w-3 h-3" /> Test
          </Button>
          <Button size="sm" className="text-xs gap-1" onClick={handleDeploy} disabled={deploying}>
            {deploying ? "Deploying..." : <><Play className="w-3 h-3" /> Deploy Live</>}
          </Button>
        </div>
      </div>

      <Sheet open={testOpen} onOpenChange={setTestOpen}>
        <SheetContent className="sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm">Test Agent</SheetTitle>
          </SheetHeader>
          <TestPanel agentName={agent.name} />
        </SheetContent>
      </Sheet>
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
                  skill.id === "s1" ? "bg-blue-50" : skill.id === "s2" ? "bg-primary/10" : "bg-amber-50"
                )}>
                  {skill.id === "s1" ? <Package className="w-4 h-4 text-blue-600" /> :
                   skill.id === "s2" ? <Shield className="w-4 h-4 text-primary" /> :
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
