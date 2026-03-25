/**
 * Hire Agent — Independent full-page flow
 * Channel → Integration → Touchpoint three-layer model
 * Step 1: Choose Channel Type (Email / Live Chat / Social Messaging)
 *         → Auto-match Integration (MVP: one per channel)
 * Step 2: Name + Deploy Mode
 * Step 3: Done + Next Steps
 *
 * MVP Channels:
 *   Email       → Zendesk Email (requires Zendesk connection)
 *   Live Chat   → Seel Chat Service (RC Widget default, WebChat SDK coming soon)
 *   Social Messaging → Zendesk Messaging (requires Zendesk connection)
 *
 * Non-essential config deferred to Agent Detail.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bot, CheckCircle2, Mail, MessageCircle,
  Instagram, Sparkles, BookOpen, Target, Shield, Settings2, ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
type ChannelType = "email" | "live-chat" | "social-messaging";
type DeployMode = "shadow" | "production";

interface ChannelOption {
  id: ChannelType;
  label: string;
  desc: string;
  icon: typeof Mail;
  integration: string;
  integrationNote: string;
  requiresZendesk: boolean;
  available: boolean;
  traits: string[];
}

const ZENDESK_CONNECTED = true; // Mock: whether Zendesk is connected

const channelOptions: ChannelOption[] = [
  {
    id: "email",
    label: "Email",
    desc: "Handle email tickets with detailed, thoughtful responses",
    icon: Mail,
    integration: "Zendesk Email",
    integrationNote: "Connects via your Zendesk account",
    requiresZendesk: true,
    available: true,
    traits: ["Longer, detailed replies", "Email signature support", "Thread context awareness"],
  },
  {
    id: "live-chat",
    label: "Live Chat",
    desc: "Real-time chat conversations via RC Widget",
    icon: MessageCircle,
    integration: "Seel Chat Service",
    integrationNote: "Deployed via RC Widget (WebChat SDK coming soon)",
    requiresZendesk: false,
    available: true,
    traits: ["Real-time responses", "Quick, conversational tone", "Multiple touchpoints"],
  },
  {
    id: "social-messaging",
    label: "Social Messaging",
    desc: "Respond to DMs across Instagram, Facebook, WhatsApp",
    icon: Instagram,
    integration: "Zendesk Messaging",
    integrationNote: "Aggregates all social channels via Zendesk",
    requiresZendesk: true,
    available: true,
    traits: ["Quick, concise replies", "Multi-platform (IG, FB, WhatsApp)", "Emoji-friendly tone"],
  },
];

const steps = [
  { id: 1, label: "Channel" },
  { id: 2, label: "Name & Deploy" },
  { id: 3, label: "Done" },
];

export default function HireAgent() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState<ChannelType | "">("");
  const [agentName, setAgentName] = useState("");
  const [deployMode, setDeployMode] = useState<DeployMode>("shadow");

  const selectedChannel = channelOptions.find((c) => c.id === channel);
  const needsZendesk = selectedChannel?.requiresZendesk && !ZENDESK_CONNECTED;
  const canProceedStep1 = channel !== "" && !needsZendesk;
  const canProceedStep2 = agentName.trim().length > 0;

  const suggestedNames: Record<string, string> = {
    email: "Email Support Agent",
    "live-chat": "Live Chat Agent",
    "social-messaging": "Social Media Agent",
  };

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      if (!agentName && channel) setAgentName(suggestedNames[channel] || "");
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
      toast.success(`${agentName} has been created!`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Back */}
        <Link href="/agents">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Agents
          </Button>
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight">Hire a New Agent</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Set up a new AI agent. You can fine-tune settings after creation.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                step > s.id ? "bg-teal-50 text-teal-700" :
                step === s.id ? "bg-foreground text-background" :
                "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.id}</span>}
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("w-8 h-px", step > s.id ? "bg-teal-300" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ── Step 1: Channel ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                <p className="text-sm font-medium mb-1">What type of conversations will this agent handle?</p>
                {channelOptions.map((ch) => {
                  const selected = channel === ch.id;
                  const blocked = ch.requiresZendesk && !ZENDESK_CONNECTED;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => !blocked && setChannel(ch.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        blocked ? "opacity-50 cursor-not-allowed" :
                        selected ? "border-foreground bg-muted/40" :
                        "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <ch.icon className="w-4.5 h-4.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{ch.label}</p>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>

                          {/* Integration info */}
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-medium">Integration:</span> {ch.integration}
                            {blocked && (
                              <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200 ml-1 gap-1">
                                <AlertCircle className="w-2.5 h-2.5" /> Zendesk not connected
                              </Badge>
                            )}
                          </div>

                          {/* Channel traits (show when selected) */}
                          {selected && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 flex flex-wrap gap-1.5">
                              {ch.traits.map((t) => (
                                <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {needsZendesk && (
                  <Card className="border-amber-200">
                    <CardContent className="p-3 flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        This channel requires a Zendesk connection.{" "}
                        <Link href="/settings" className="text-teal-600 hover:underline font-medium">Connect in Settings →</Link>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Name & Deploy ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium">Agent Name</label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">A recognizable name for this agent. You can change it later.</p>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder={suggestedNames[channel] || "Agent name"}
                    className="max-w-sm"
                  />
                  {agentName === suggestedNames[channel] && (
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-suggested based on channel
                    </p>
                  )}
                </div>

                {/* Deploy Mode */}
                <div>
                  <label className="text-sm font-medium">Deploy Mode</label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">You can switch modes anytime from Agent Detail.</p>
                  <RadioGroup value={deployMode} onValueChange={(v) => setDeployMode(v as DeployMode)} className="space-y-2">
                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      deployMode === "shadow" ? "border-foreground bg-muted/30" : "border-border hover:border-muted-foreground/30"
                    )}>
                      <RadioGroupItem value="shadow" className="mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Shadow Mode</p>
                          <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Recommended</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Agent drafts responses for your review before sending.</p>
                      </div>
                    </label>
                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      deployMode === "production" ? "border-foreground bg-muted/30" : "border-border hover:border-muted-foreground/30"
                    )}>
                      <RadioGroupItem value="production" className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Production Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Agent responds to customers automatically.</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Summary</p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-muted-foreground text-xs">Channel</div>
                    <div className="text-xs font-medium">{selectedChannel?.label}</div>
                    <div className="text-muted-foreground text-xs">Integration</div>
                    <div className="text-xs font-medium">{selectedChannel?.integration}</div>
                    <div className="text-muted-foreground text-xs">Name</div>
                    <div className="text-xs font-medium">{agentName || "—"}</div>
                    <div className="text-muted-foreground text-xs">Mode</div>
                    <div className="text-xs font-medium capitalize">{deployMode}</div>
                  </div>
                </div>

                {/* Deferred config note */}
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Settings2 className="w-3 h-3" />
                  Personality, email signature, escalation rules, and skill selection can be configured in Agent Detail after creation.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold mb-1">{agentName} is ready</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Deployed in <span className="font-medium capitalize">{deployMode}</span> mode on <span className="font-medium">{selectedChannel?.label}</span> via {selectedChannel?.integration}.
                </p>

                {/* Next Steps */}
                <div className="max-w-md mx-auto text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recommended next steps</p>
                  <div className="space-y-1.5">
                    <NextStepRow icon={BookOpen} label="Enrich knowledge base" desc="Add policies and FAQs for better accuracy" href="/knowledge" />
                    <NextStepRow icon={Target} label="Review active skills" desc="Check which scenarios the agent can handle" href="/knowledge" />
                    <NextStepRow icon={Shield} label="Set guardrails" desc="Configure safety rules and escalation thresholds" href="/settings" />
                    <NextStepRow icon={Settings2} label="Fine-tune agent settings" desc="Adjust personality, tone, and channel config" href={`/agents/${channel}-agent`} />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mt-8">
                  <Link href="/agents">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
                    </Button>
                  </Link>
                  <Link href={`/agents/${channel}-agent`}>
                    <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700">
                      Go to Agent Detail <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Nav */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1} className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              {step === 2 ? "Create Agent" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function NextStepRow({ icon: Icon, label, desc, href }: { icon: React.ElementType; label: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-teal-500 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
