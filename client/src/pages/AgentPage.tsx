/* ── Agent Config Page ────────────────────────────────────────
   Unified multi-agent configuration: left agent list + right config panels.
   Content mirrors RepProfilePanel edit mode: Mode, Identity, Actions.
   ──────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  HelpCircle,
  Eye,
  Rocket,
  Power,
  ChevronRight,
  Bot,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

/* ── Agent definitions ── */
interface AgentDef {
  id: string;
  name: string;
  role: string;
  emoji: string;
  level: string;
  color: string;
  hasConfig: boolean;
}

const AGENTS: AgentDef[] = [
  {
    id: "alex",
    name: "Alex",
    role: "Team Lead",
    emoji: "👔",
    level: "Orchestrator",
    color: "indigo",
    hasConfig: false,
  },
  {
    id: "ava",
    name: "Ava",
    role: "Support Rep",
    emoji: "💬",
    level: "Rep",
    color: "violet",
    hasConfig: true,
  },
];

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
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {tip && <Tip text={tip} />}
        </div>
      </div>
      <div className="px-5 pb-4">{children}</div>
    </section>
  );
}

/* ── Mode config ── */
const modeConfig: {
  mode: AgentMode;
  icon: typeof Rocket;
  color: string;
  desc: string;
}[] = [
  {
    mode: "production",
    icon: Rocket,
    color: "emerald",
    desc: "Replies directly to customers.",
  },
  {
    mode: "training",
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

export default function AgentPage() {
  const [selectedAgent, setSelectedAgent] = useState("ava");
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [identity, setIdentity] = useState<AgentIdentity>({
    ...AGENT_IDENTITY,
    name: "Ava",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const currentAgent = useMemo(
    () => AGENTS.find((a) => a.id === selectedAgent)!,
    [selectedAgent]
  );

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              permission:
                p.permission === "disabled" ? "autonomous" : "disabled",
            }
          : p
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    setShowConfirm(true);
  };

  const confirmSave = () => {
    setShowConfirm(false);
    setHasChanges(false);
    toast.success("Agent configuration saved");
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, ActionPermission[]>>(
      (acc, p) => {
        (acc[p.category] = acc[p.category] || []).push(p);
        return acc;
      },
      {}
    );
  }, [permissions]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-[calc(100vh-48px)]">
        {/* ── Left: Agent List ── */}
        <div className="w-[220px] shrink-0 border-r border-border bg-[#fafafa] flex flex-col">
          <div className="px-3 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-foreground">
              Agents
            </h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedAgent === agent.id
                      ? "bg-white border border-border shadow-sm"
                      : "hover:bg-white/60"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0",
                      agent.color === "indigo" && "bg-indigo-100",
                      agent.color === "violet" && "bg-violet-100"
                    )}
                  >
                    {agent.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-foreground truncate">
                        {agent.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4 text-[8px] px-1.5 shrink-0"
                      >
                        {agent.level}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {agent.role}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Add agent placeholder */}
          <div className="p-2 border-t border-border">
            <button
              onClick={() =>
                toast.info("Adding new agents — coming soon")
              }
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Agent</span>
            </button>
          </div>
        </div>

        {/* ── Right: Config Panels ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-[14px]",
                  currentAgent.color === "indigo" && "bg-indigo-100",
                  currentAgent.color === "violet" && "bg-violet-100"
                )}
              >
                {currentAgent.emoji}
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-foreground leading-tight">
                  {currentAgent.name}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {currentAgent.level} · {currentAgent.role}
                </p>
              </div>
            </div>
            {currentAgent.hasConfig && (
              <Button
                className="gap-1.5 h-8 text-[12px]"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </Button>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {!currentAgent.hasConfig ? (
              /* Alex — no editable config */
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-[24px] mb-4">
                  👔
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">
                  Alex — Team Lead
                </h3>
                <p className="text-[12px] text-muted-foreground text-center max-w-[360px] leading-relaxed">
                  Alex manages your playbook, monitors performance, and surfaces insights. Configuration is automatic.
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground">
                    System-managed agent
                  </span>
                </div>
              </div>
            ) : (
              /* Ava — full config */
              <div className="max-w-[720px] mx-auto px-5 py-5 space-y-4">
                {/* ═══ 1. Mode ═══ */}
                <Section
                  id="section-mode"
                  title="Mode"
                  tip="Training: drafts replies as internal notes for review. Production: replies to customers directly."
                >
                  <div className="grid grid-cols-3 gap-3">
                    {modeConfig.map(({ mode, icon: Icon, color, desc }) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setAgentMode(mode);
                          setHasChanges(true);
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
                  tip="How the rep presents itself to customers in conversations."
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 flex-1">
                        <Label className="text-[12px] font-medium text-muted-foreground shrink-0">
                          Name
                        </Label>
                        <Input
                          value={identity.name}
                          onChange={(e) => {
                            setIdentity({ ...identity, name: e.target.value });
                            setHasChanges(true);
                          }}
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
                          ) => {
                            setIdentity({ ...identity, tone: val });
                            setHasChanges(true);
                          }}
                        >
                          <SelectTrigger className="h-8 text-[13px] max-w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[12px] font-medium text-muted-foreground shrink-0">
                          AI disclosure
                        </Label>
                        <Tip text="If enabled, the rep will tell customers it's an AI when directly asked." />
                        <Switch
                          checked={identity.transparentAboutAI}
                          onCheckedChange={(checked) => {
                            setIdentity({
                              ...identity,
                              transparentAboutAI: checked,
                            });
                            setHasChanges(true);
                          }}
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
                      <Textarea
                        value={identity.greeting}
                        onChange={(e) => {
                          setIdentity({
                            ...identity,
                            greeting: e.target.value,
                          });
                          setHasChanges(true);
                        }}
                        className="text-[13px] min-h-[60px]"
                        rows={2}
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
                        onChange={(e) => {
                          setIdentity({
                            ...identity,
                            signature: e.target.value,
                          });
                          setHasChanges(true);
                        }}
                        className="h-8 text-[13px]"
                      />
                    </div>
                  </div>
                </Section>

                {/* ═══ 3. Actions & Permissions ═══ */}
                <Section
                  id="section-actions"
                  title="Actions & Permissions"
                  tip="Actions your rep can perform. Disabled actions are escalated to a human."
                >
                  {Object.entries(groupedPermissions).map(
                    ([category, actions]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          {category}
                        </p>
                        <div className="space-y-0 divide-y divide-border/30">
                          {actions.map((action) => {
                            const isOn = action.permission !== "disabled";
                            const isLocked = action.locked;
                            return (
                              <div
                                key={action.id}
                                className={cn(
                                  "flex items-center justify-between py-2.5 first:pt-0 last:pb-0",
                                  isLocked && "opacity-50"
                                )}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-[13px] font-medium text-foreground">
                                    {action.name}
                                  </span>
                                  <Tip text={action.description} />
                                  {isLocked && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[8px] px-1.5"
                                    >
                                      Locked
                                    </Badge>
                                  )}
                                  {isOn &&
                                    action.guardrails &&
                                    action.guardrails.length > 0 && (
                                      <div className="flex items-center gap-2 ml-2">
                                        {action.guardrails
                                          .filter((g) => g.enabled)
                                          .map((g) => (
                                            <div
                                              key={g.id}
                                              className="flex items-center gap-1"
                                            >
                                              <span className="text-[10px] text-muted-foreground font-medium">
                                                Guardrail:
                                              </span>
                                              <span className="text-[10px] text-foreground">
                                                {g.label}
                                              </span>
                                              {g.type === "number" && (
                                                <div className="flex items-center gap-0.5">
                                                  <Input
                                                    type="number"
                                                    defaultValue={g.value}
                                                    onChange={() =>
                                                      setHasChanges(true)
                                                    }
                                                    className="w-14 h-5 text-[10px] px-1.5"
                                                  />
                                                  {g.unit && (
                                                    <span className="text-[9px] text-muted-foreground">
                                                      {g.unit}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                </div>
                                <Switch
                                  checked={isOn}
                                  disabled={isLocked}
                                  onCheckedChange={() =>
                                    togglePermission(action.id)
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </Section>

                {/* Bottom spacer */}
                <div className="h-8" />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Save Confirmation Dialog ── */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-[14px]">
                Confirm Changes
              </DialogTitle>
              <DialogDescription className="text-[12px]">
                Changes apply immediately to new tickets.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={confirmSave}
              >
                Confirm & Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
