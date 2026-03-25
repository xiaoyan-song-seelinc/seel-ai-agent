/**
 * Hire Agent — Single-page progressive disclosure
 *
 * All config on one page, sections expand as user progresses:
 *   Section 1: Channel Type (always visible)
 *   Section 2: Integration (expands after channel selected, shows options even if only one)
 *   Section 3: Agent Name (expands after integration confirmed)
 *
 * On "Create Agent" → Agent enters "Setting Up" status → navigates to Agent Detail
 * Deploy is NOT part of this flow. Agent goes through:
 *   Setting Up → Ready to Test → Live → Paused
 *
 * Design: Compact, production-grade, no decorative elements.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bot, CheckCircle2, Mail, MessageCircle,
  Instagram, Sparkles, AlertCircle, ExternalLink, Loader2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
type ChannelType = "email" | "live-chat" | "social-messaging";

interface ChannelOption {
  id: ChannelType;
  label: string;
  desc: string;
  icon: typeof Mail;
}

interface IntegrationOption {
  id: string;
  label: string;
  provider: string;
  desc: string;
  available: boolean;
  requiresConnection: boolean;
  connected: boolean;
  comingSoon?: boolean;
}

/* ── Data ── */
const ZENDESK_CONNECTED = true;

const channelOptions: ChannelOption[] = [
  { id: "email", label: "Email", desc: "Handle email tickets", icon: Mail },
  { id: "live-chat", label: "Live Chat", desc: "Real-time chat conversations", icon: MessageCircle },
  { id: "social-messaging", label: "Social Messaging", desc: "Instagram, Facebook, WhatsApp DMs", icon: Instagram },
];

const integrationsByChannel: Record<ChannelType, IntegrationOption[]> = {
  email: [
    { id: "zendesk-email", label: "Zendesk Email", provider: "Zendesk", desc: "Process email tickets from your Zendesk account", available: true, requiresConnection: true, connected: ZENDESK_CONNECTED },
    { id: "gorgias-email", label: "Gorgias Email", provider: "Gorgias", desc: "Process email tickets from Gorgias", available: false, requiresConnection: true, connected: false, comingSoon: true },
  ],
  "live-chat": [
    { id: "rc-widget", label: "RC Widget", provider: "Seel", desc: "Built-in live chat widget for your store", available: true, requiresConnection: false, connected: true },
    { id: "webchat-sdk", label: "WebChat SDK", provider: "Seel", desc: "Embed chat in any web page via SDK", available: false, requiresConnection: false, connected: false, comingSoon: true },
  ],
  "social-messaging": [
    { id: "zendesk-messaging", label: "Zendesk Messaging", provider: "Zendesk", desc: "Aggregates Instagram, Facebook, WhatsApp via Zendesk", available: true, requiresConnection: true, connected: ZENDESK_CONNECTED },
  ],
};

const suggestedNames: Record<ChannelType, string> = {
  email: "Email Support Agent",
  "live-chat": "Live Chat Agent",
  "social-messaging": "Social Media Agent",
};

export default function HireAgent() {
  const [, navigate] = useLocation();

  // State
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [integration, setIntegration] = useState<string>("");
  const [integrationConfirmed, setIntegrationConfirmed] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [creating, setCreating] = useState(false);

  // Derived
  const integrations = channel ? integrationsByChannel[channel] : [];
  const selectedIntegration = integrations.find(i => i.id === integration);
  const canConfirmIntegration = selectedIntegration?.available && (!selectedIntegration.requiresConnection || selectedIntegration.connected);
  const canCreate = integrationConfirmed && agentName.trim().length > 0;

  // Handlers
  const handleChannelSelect = (id: ChannelType) => {
    setChannel(id);
    setIntegration("");
    setIntegrationConfirmed(false);
    setAgentName("");
    // Auto-select if only one available integration
    const avail = integrationsByChannel[id].filter(i => i.available);
    if (avail.length === 1) {
      setIntegration(avail[0].id);
    }
  };

  const handleConfirmIntegration = () => {
    if (canConfirmIntegration) {
      setIntegrationConfirmed(true);
      if (!agentName && channel) {
        setAgentName(suggestedNames[channel as ChannelType] || "");
      }
    }
  };

  const handleCreate = () => {
    if (!canCreate) return;
    setCreating(true);
    setTimeout(() => {
      toast.success(`${agentName} created in Setting Up status`);
      navigate("/agents/rc-chat"); // In real app, navigate to new agent's detail
    }, 800);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/agents">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
        </Button>
      </Link>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Hire a New Agent</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure and create a new AI agent. You can fine-tune all settings after creation.</p>
      </div>

      <div className="space-y-4">
        {/* ── Section 1: Channel ── */}
        <SectionCard
          number={1}
          title="Channel"
          subtitle="What type of conversations will this agent handle?"
          completed={!!channel}
          open={true}
        >
          <div className="space-y-2">
            {channelOptions.map((ch) => {
              const selected = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleChannelSelect(ch.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                    selected ? "border-foreground bg-muted/30" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    selected ? "bg-teal-50" : "bg-muted"
                  )}>
                    <ch.icon className={cn("w-4 h-4", selected ? "text-teal-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ch.label}</p>
                    <p className="text-[11px] text-muted-foreground">{ch.desc}</p>
                  </div>
                  {selected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Section 2: Integration ── */}
        <AnimatePresence>
          {channel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SectionCard
                number={2}
                title="Integration"
                subtitle="How will this agent connect to the channel?"
                completed={integrationConfirmed}
                open={!integrationConfirmed}
              >
                {!integrationConfirmed ? (
                  <div className="space-y-2">
                    {integrations.map((intg) => {
                      const selected = integration === intg.id;
                      const blocked = intg.requiresConnection && !intg.connected;
                      return (
                        <button
                          key={intg.id}
                          onClick={() => !intg.comingSoon && !blocked && setIntegration(intg.id)}
                          disabled={intg.comingSoon || blocked}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                            intg.comingSoon ? "opacity-50 cursor-not-allowed" :
                            blocked ? "opacity-60 cursor-not-allowed" :
                            selected ? "border-foreground bg-muted/30" :
                            "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                            selected ? "bg-teal-50 text-teal-700" : "bg-muted text-muted-foreground"
                          )}>
                            {intg.provider.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{intg.label}</p>
                              {intg.comingSoon && <Badge variant="secondary" className="text-[9px]">Coming Soon</Badge>}
                              {intg.connected && !intg.comingSoon && <Badge variant="outline" className="text-[9px] text-teal-600 border-teal-200">Connected</Badge>}
                              {blocked && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200 gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> Not connected</Badge>}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{intg.desc}</p>
                          </div>
                          {selected && !intg.comingSoon && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}

                    {/* Zendesk not connected warning */}
                    {selectedIntegration?.requiresConnection && !selectedIntegration.connected && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-muted-foreground">
                          {selectedIntegration.provider} is not connected.{" "}
                          <Link href="/settings" className="text-teal-600 hover:underline font-medium">Connect in Settings</Link>
                        </span>
                      </div>
                    )}

                    {/* Confirm button */}
                    {integration && canConfirmIntegration && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          onClick={handleConfirmIntegration}
                          className="text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Confirm Integration
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Collapsed summary */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-700">
                        {selectedIntegration?.provider.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{selectedIntegration?.label}</span>
                      <Badge variant="outline" className="text-[9px] text-teal-600 border-teal-200">Connected</Badge>
                    </div>
                    <button
                      onClick={() => setIntegrationConfirmed(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </button>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section 3: Agent Name ── */}
        <AnimatePresence>
          {integrationConfirmed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SectionCard
                number={3}
                title="Agent Name"
                subtitle="Give this agent a recognizable name"
                completed={false}
                open={true}
              >
                <div className="space-y-3">
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder={channel ? suggestedNames[channel as ChannelType] : "Agent name"}
                    className="max-w-sm"
                  />
                  {agentName && channel && agentName === suggestedNames[channel as ChannelType] && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-suggested based on channel
                    </p>
                  )}

                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs">
                    <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
                      <span className="text-muted-foreground">Channel</span>
                      <span className="font-medium">{channelOptions.find(c => c.id === channel)?.label}</span>
                      <span className="text-muted-foreground">Integration</span>
                      <span className="font-medium">{selectedIntegration?.label}</span>
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{agentName || "—"}</span>
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Setting Up
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Agent will be created in <strong>Setting Up</strong> status. Complete remaining configuration in Agent Detail to move to <strong>Ready to Test</strong>.
                  </p>

                  {/* Create */}
                  <Button
                    onClick={handleCreate}
                    disabled={!canCreate || creating}
                    className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-sm"
                  >
                    {creating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : (
                      <><Bot className="w-4 h-4" /> Create Agent</>
                    )}
                  </Button>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({ number, title, subtitle, completed, open, children }: {
  number: number; title: string; subtitle: string; completed: boolean; open: boolean; children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
            completed ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : number}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{title}</p>
            {open && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {open && <div className="ml-9">{children}</div>}
      </CardContent>
    </Card>
  );
}
