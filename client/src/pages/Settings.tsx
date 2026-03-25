/**
 * Settings: Platform configuration, integrations, team, and Global Guardrails
 * Global Guardrails: Rules that apply across ALL agents (escalation, brand voice, risk detection)
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Plug, Users, Bell, Shield,
  Key, Mail, MessageSquare, CheckCircle2, Plus, AlertTriangle,
  Pencil, Trash2, Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const integrations = [
  { name: "Zendesk", category: "Ticketing", status: "connected" as const, icon: "Z" },
  { name: "Shopify", category: "Ecommerce", status: "connected" as const, icon: "S" },
  { name: "Gorgias", category: "Ticketing", status: "available" as const, icon: "G" },
  { name: "Freshdesk", category: "Ticketing", status: "available" as const, icon: "F" },
  { name: "ShipStation", category: "Shipping", status: "available" as const, icon: "SS" },
  { name: "Slack", category: "Notification", status: "available" as const, icon: "Sl" },
];

const teamMembers = [
  { name: "CX Manager", email: "cx@seel.com", role: "Admin", status: "active" },
  { name: "Support Lead", email: "lead@seel.com", role: "Manager", status: "active" },
  { name: "QA Analyst", email: "qa@seel.com", role: "Viewer", status: "active" },
];

const globalGuardrails = [
  { id: "gg1", name: "Risk Word Escalation", desc: "Escalate to human when customer uses threatening, legal, or profanity language.", type: "escalation" as const, enabled: true, severity: "high" as const, triggers: ["lawsuit", "attorney", "BBB complaint", "profanity detected"] },
  { id: "gg2", name: "Brand Voice Enforcement", desc: "Ensure all agent responses follow brand tone guidelines. No slang, no excessive emoji, professional but warm.", type: "tone" as const, enabled: true, severity: "medium" as const, triggers: ["tone deviation detected"] },
  { id: "gg3", name: "PII Protection", desc: "Block any attempt to access, display, or share customer PII (SSN, full credit card, etc.).", type: "security" as const, enabled: true, severity: "critical" as const, triggers: ["PII access attempt"] },
  { id: "gg4", name: "Repeated Failure Escalation", desc: "Escalate if agent fails to resolve after 3 consecutive attempts in the same conversation.", type: "escalation" as const, enabled: true, severity: "medium" as const, triggers: ["3+ failed resolution attempts"] },
  { id: "gg5", name: "After-hours Auto-response", desc: "Outside business hours, inform customer of expected response time and offer self-service options.", type: "workflow" as const, enabled: false, severity: "low" as const, triggers: ["message received outside 9am-6pm PST"] },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const typeColors: Record<string, string> = {
  escalation: "bg-amber-50 text-amber-600",
  tone: "bg-violet-50 text-violet-600",
  security: "bg-red-50 text-red-600",
  workflow: "bg-teal-50 text-teal-600",
};

export default function Settings() {
  const [guardrailDialogOpen, setGuardrailDialogOpen] = useState(false);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      <motion.div variants={itemV}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration, integrations, and global guardrails</p>
      </motion.div>

      <Tabs defaultValue="integrations">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="integrations" className="gap-1.5 text-xs"><Plug className="w-3.5 h-3.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="guardrails" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> Global Guardrails</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Team</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5 text-xs"><SettingsIcon className="w-3.5 h-3.5" /> General</TabsTrigger>
        </TabsList>

        {/* ── Integrations ── */}
        <TabsContent value="integrations" className="mt-4">
          <motion.div variants={itemV} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((int) => (
              <Card key={int.name} className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                      int.status === "connected" ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                    )}>{int.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{int.name}</p>
                        <Badge variant="outline" className="text-[9px]">{int.category}</Badge>
                      </div>
                      <div className="mt-2">
                        {int.status === "connected" ? (
                          <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</Badge>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast(`Connecting to ${int.name}...`)}>Connect</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        {/* ── Global Guardrails ── */}
        <TabsContent value="guardrails" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-200/60">
            <Shield className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700"><strong>Global Guardrails</strong> apply to ALL agents regardless of channel. They define platform-wide safety rules like escalation triggers, brand voice enforcement, and PII protection. For action-specific guardrails, configure them within each Action.</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1"><Shield className="w-3 h-3" />{globalGuardrails.filter(g => g.enabled).length} Active</Badge>
              <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-200">{globalGuardrails.filter(g => g.severity === "critical").length} Critical</Badge>
            </div>
            <Button size="sm" className="gap-1 bg-teal-600 hover:bg-teal-700 text-xs h-8" onClick={() => setGuardrailDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Guardrail
            </Button>
          </div>

          <div className="space-y-3">
            {globalGuardrails.map((g) => (
              <Card key={g.id} className={cn("shadow-sm transition-all", g.enabled ? "hover:shadow-md" : "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeColors[g.type])}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{g.name}</p>
                        <Badge variant="outline" className={cn("text-[9px]", severityColors[g.severity])}>{g.severity}</Badge>
                        <Badge variant="outline" className="text-[9px]">{g.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{g.desc}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground font-medium">Triggers:</span>
                        {g.triggers.map(t => <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Edit guardrail coming soon")}><Pencil className="w-3 h-3" /></Button>
                      <Switch checked={g.enabled} onCheckedChange={() => toast.info("Guardrail toggled")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Team ── */}
        <TabsContent value="team" className="mt-4">
          <motion.div variants={itemV}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => toast("Invite member dialog coming soon")}>Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center gap-4 px-6 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center"><span className="text-xs font-semibold text-teal-700">{member.name.charAt(0)}</span></div>
                      <div className="flex-1"><p className="text-sm font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
                      <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-4">
          <motion.div variants={itemV}>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Guardrail Triggers", desc: "Get notified when a guardrail is triggered", icon: Shield, enabled: true },
                  { label: "Agent Escalations", desc: "Notifications when agents escalate to human", icon: Users, enabled: true },
                  { label: "CSAT Alerts", desc: "Alert when CSAT drops below threshold", icon: Bell, enabled: true },
                  { label: "Daily Performance Report", desc: "Daily summary of agent performance", icon: Mail, enabled: false },
                  { label: "New Ticket Notifications", desc: "Real-time notifications for new tickets", icon: MessageSquare, enabled: false },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted"><pref.icon className="w-4 h-4 text-muted-foreground" /></div>
                      <div><Label className="text-sm">{pref.label}</Label><p className="text-[10px] text-muted-foreground">{pref.desc}</p></div>
                    </div>
                    <Switch defaultChecked={pref.enabled} onCheckedChange={() => toast("Preference updated")} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── General ── */}
        <TabsContent value="general" className="mt-4">
          <motion.div variants={itemV} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">Platform Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-sm">Company Name</Label><Input className="mt-1.5" defaultValue="Seel Inc." /></div>
                <div>
                  <Label className="text-sm">Default Language</Label>
                  <Select defaultValue="en"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="zh">Chinese</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent></Select>
                </div>
                <div>
                  <Label className="text-sm">Timezone</Label>
                  <Select defaultValue="utc-8"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem><SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem><SelectItem value="utc+8">China Standard Time (UTC+8)</SelectItem></SelectContent></Select>
                </div>
                <div className="pt-2"><Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("Settings saved!")}>Save Changes</Button></div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold">API Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label className="text-sm">API Key</Label><div className="flex gap-2 mt-1.5"><Input className="flex-1 font-mono" value="sk-seel-****-****-****-a8f2" readOnly /><Button variant="outline" size="sm" onClick={() => toast("API key copied!")}>Copy</Button></div></div>
                <div><Label className="text-sm">Webhook URL</Label><Input className="mt-1.5 font-mono" defaultValue="https://api.seel.com/webhooks/agent" /></div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Add Guardrail Dialog ── */}
      <Dialog open={guardrailDialogOpen} onOpenChange={setGuardrailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Add Global Guardrail</DialogTitle>
            <DialogDescription>Global guardrails apply to all agents across all channels.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-sm">Guardrail Name</Label><Input className="mt-1.5" placeholder="e.g. Risk Word Escalation" /></div>
            <div><Label className="text-sm">Description</Label><Textarea className="mt-1.5" placeholder="Describe when and how this guardrail should trigger..." rows={3} /></div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select defaultValue="escalation"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escalation">Escalation</SelectItem><SelectItem value="tone">Tone / Brand Voice</SelectItem><SelectItem value="security">Security</SelectItem><SelectItem value="workflow">Workflow</SelectItem></SelectContent></Select>
            </div>
            <div>
              <Label className="text-sm">Severity</Label>
              <Select defaultValue="high"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
            </div>
            <div><Label className="text-sm">Trigger Keywords (comma-separated)</Label><Input className="mt-1.5" placeholder="e.g. lawsuit, attorney, BBB" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGuardrailDialogOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { toast.success("Guardrail created"); setGuardrailDialogOpen(false); }}>Create Guardrail</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
