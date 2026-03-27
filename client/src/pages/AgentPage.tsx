/* ── Agent Page ───────────────────────────────────────────────
   Rep-level configuration: Mode, Identity, Actions.
   Split from Playbook — Playbook keeps Knowledge, Escalation,
   Integrations, Guardrails.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACTION_PERMISSIONS,
  AGENT_IDENTITY,
  AGENT_MODE,
  type ActionPermission,
  type AgentMode,
  type AgentIdentity,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Save,
  HelpCircle,
  Bot,
  Eye,
  Rocket,
  Power,
  Zap,
  User,
} from "lucide-react";
import { toast } from "sonner";

/* ── Tip icon ── */
function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">
          <HelpCircle className="w-3 h-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[260px] text-[12px] leading-relaxed bg-foreground text-background"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Section wrapper ── */
function Section({
  title,
  tip,
  children,
  id,
}: {
  title: string;
  tip?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white rounded-md border border-border/60">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {tip && <Tip text={tip} />}
        </div>
      </div>
      <div className="px-6 pb-5">{children}</div>
    </section>
  );
}

export default function AgentPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              permission: p.permission === "disabled" ? "autonomous" : "disabled",
            }
          : p
      )
    );
  };

  const modeConfig: { mode: AgentMode; icon: typeof Rocket; color: string; desc: string }[] = [
    {
      mode: "production",
      icon: Rocket,
      color: "emerald",
      desc: "Replies directly to customers.",
    },
    {
      mode: "shadow",
      icon: Eye,
      color: "amber",
      desc: "Drafts as internal notes for review.",
    },
    {
      mode: "off",
      icon: Power,
      color: "zinc",
      desc: "Inactive — all tickets go to humans.",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full bg-background">
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/60">
          <div className="max-w-[860px] mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                Agent
              </h1>
              <Badge
                variant="secondary"
                className="h-5 text-[10px] px-2 capitalize"
              >
                {identity.name}
              </Badge>
            </div>
            <Button
              className="gap-1.5 h-8 text-[12px]"
              onClick={() => toast.success("All changes saved")}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-[860px] mx-auto px-6 py-5 space-y-4">
          {/* ═══ 1. Agent Mode ═══ */}
          <Section
            id="section-mode"
            title="Mode"
            tip="Controls how the agent handles incoming Zendesk tickets. Shadow mode drafts as internal notes; Production replies directly."
          >
            <div className="grid grid-cols-3 gap-3">
              {modeConfig.map(({ mode, icon: Icon, color, desc }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAgentMode(mode);
                    toast.success(`Mode → ${mode}`);
                  }}
                  className={cn(
                    "border rounded-md px-4 py-3 text-left transition-all",
                    agentMode === mode
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        color === "emerald" && "bg-emerald-400",
                        color === "amber" && "bg-amber-400",
                        color === "zinc" && "bg-zinc-400"
                      )}
                    />
                    <span className="text-[13px] font-medium capitalize">
                      {mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </Section>

          {/* ═══ 2. Identity ═══ */}
          <Section
            id="section-identity"
            title="Identity"
            tip="How the agent presents itself to customers in conversations."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-[12px] font-medium text-muted-foreground shrink-0">
                    Name
                  </Label>
                  <Input
                    value={identity.name}
                    onChange={(e) =>
                      setIdentity({ ...identity, name: e.target.value })
                    }
                    className="h-8 text-[13px] max-w-[180px]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-[12px] font-medium text-muted-foreground shrink-0">
                    Tone
                  </Label>
                  <Select
                    value={identity.tone}
                    onValueChange={(
                      val: "professional" | "friendly" | "casual"
                    ) => setIdentity({ ...identity, tone: val })}
                  >
                    <SelectTrigger className="h-8 text-[13px] max-w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[12px] font-medium text-muted-foreground shrink-0">
                    Disclose AI
                  </Label>
                  <Tip text="If enabled, the agent will tell customers it's an AI when directly asked." />
                  <Switch
                    checked={identity.transparentAboutAI}
                    onCheckedChange={(checked) =>
                      setIdentity({ ...identity, transparentAboutAI: checked })
                    }
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">
                    Greeting
                  </Label>
                  <Tip text="The first message sent to customers when a new conversation starts." />
                </div>
                <Input
                  value={identity.greeting}
                  onChange={(e) =>
                    setIdentity({ ...identity, greeting: e.target.value })
                  }
                  className="h-8 text-[13px]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">
                    Signature
                  </Label>
                  <Tip text="Appended at the end of every customer-facing reply." />
                </div>
                <Input
                  value={identity.signature}
                  onChange={(e) =>
                    setIdentity({ ...identity, signature: e.target.value })
                  }
                  className="h-8 text-[13px]"
                />
              </div>
            </div>
          </Section>

          {/* ═══ 3. Actions ═══ */}
          <Section
            id="section-actions"
            title="Actions"
            tip="Toggle which actions the agent can perform autonomously. Disabled actions will be escalated to you."
          >
            {Object.entries(
              permissions.reduce<Record<string, ActionPermission[]>>(
                (acc, p) => {
                  (acc[p.category] = acc[p.category] || []).push(p);
                  return acc;
                },
                {}
              )
            ).map(([category, actions]) => (
              <div key={category} className="mb-4 last:mb-0">
                <p className="text-[12px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {category}
                </p>
                <div className="space-y-0 divide-y divide-border/30">
                  {actions.map((action) => {
                    const isOn = action.permission !== "disabled";
                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-foreground">
                            {action.name}
                          </span>
                          <Tip text={action.description} />
                          {isOn &&
                            action.parameters &&
                            Object.entries(action.parameters).map(
                              ([key, val]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-1 ml-2"
                                >
                                  <span className="text-[11px] text-muted-foreground">
                                    {key === "maxAmount"
                                      ? "max $"
                                      : key === "maxPercentage"
                                      ? "max %"
                                      : key === "maxValue"
                                      ? "max $"
                                      : key}
                                  </span>
                                  <Input
                                    type="number"
                                    defaultValue={val as number}
                                    className="w-16 h-6 text-[11px] px-2"
                                    onChange={(e) => {
                                      const newVal = Number(e.target.value);
                                      setPermissions((prev) =>
                                        prev.map((p) =>
                                          p.id === action.id
                                            ? {
                                                ...p,
                                                parameters: {
                                                  ...p.parameters,
                                                  [key]: newVal,
                                                },
                                              }
                                            : p
                                        )
                                      );
                                    }}
                                  />
                                </div>
                              )
                            )}
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => togglePermission(action.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Section>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </TooltipProvider>
  );
}
