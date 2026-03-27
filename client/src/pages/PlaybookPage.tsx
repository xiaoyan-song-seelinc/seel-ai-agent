/* ── Playbook Page ────────────────────────────────────────────
   Single scrollable page with all config sections stacked vertically.
   Visual: Seel Issues/Rules screenshot style — light gray bg,
   white section cards, no nesting, flat controls, generous spacing.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACTION_PERMISSIONS,
  ESCALATION_RULES,
  AGENT_IDENTITY,
  INTEGRATIONS,
  SKILLS,
  KNOWLEDGE_DOCUMENTS,
  AGENT_MODE,
  type ActionPermission,
  type PermissionLevel,
  type AgentMode,
  type EscalationRule,
  type AgentIdentity,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Power,
  Link2,
  CheckCircle2,
  Save,
  FileText,
  Upload,
  Trash2,
  BookOpen,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import OnboardingGuide from "@/components/OnboardingGuide";

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; color: string }[] = [
  { value: "autonomous", label: "Autonomous", color: "text-emerald-600 bg-emerald-50" },
  { value: "ask_permission", label: "Ask Permission", color: "text-amber-600 bg-amber-50" },
  { value: "disabled", label: "Disabled", color: "text-red-600 bg-red-50" },
];

/* ── Section wrapper — white card on gray bg ── */
function Section({ title, description, children, id }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white rounded-md border border-border/60">
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-[16px] font-semibold text-foreground leading-tight">{title}</h2>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="px-6 pb-5">
        {children}
      </div>
    </section>
  );
}

/* ── Sub-section divider inside a Section ── */
function SubSection({ title, description, children }: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pt-5 first:pt-0">
      <div className="border-t border-border/40 pt-5 first:border-t-0 first:pt-0">
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

export default function PlaybookPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>(ESCALATION_RULES);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<"documents" | "rules">("documents");

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60">
        <div className="max-w-[860px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Playbook</h1>
          </div>
          <Button
            className="gap-1.5 h-8 text-[13px]"
            onClick={() => toast.success("All changes saved")}
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-[860px] mx-auto px-6 py-6 space-y-5">

        {/* ═══ 1. General — Agent Mode & Integrations ═══ */}
        <Section
          id="section-general"
          title="Agent Mode"
          description="Control how Alex operates on your Zendesk tickets."
        >
          <div className="grid grid-cols-3 gap-3">
            {(["production", "shadow", "off"] as AgentMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAgentMode(mode);
                  toast.success(`Agent mode set to ${mode}`);
                }}
                className={cn(
                  "border rounded-md p-4 text-left transition-all",
                  agentMode === mode
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      mode === "production" && "bg-emerald-400",
                      mode === "shadow" && "bg-amber-400",
                      mode === "off" && "bg-zinc-400"
                    )}
                  />
                  <span className="text-[13px] font-semibold capitalize">{mode}</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {mode === "production" && "Handles tickets and executes actions autonomously."}
                  {mode === "shadow" && "Drafts responses as internal notes. You review and approve."}
                  {mode === "off" && "Inactive. All tickets go to human agents."}
                </p>
              </button>
            ))}
          </div>
        </Section>

        <Section
          id="section-integrations"
          title="Integrations"
          description="Connect your tools so Alex can read tickets and look up orders."
        >
          <div className="space-y-3">
            {INTEGRATIONS.map((intg) => (
              <div
                key={intg.platform}
                className="flex items-center justify-between py-3 border-b border-border/40 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-[12px]",
                      intg.platform === "zendesk" ? "bg-[#03363D]" : "bg-[#96BF48]"
                    )}
                  >
                    {intg.platform === "zendesk" ? "Z" : "S"}
                  </div>
                  <div>
                    <span className="text-[13px] font-medium capitalize">{intg.platform}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-[12px] text-emerald-600">Connected</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[12px] rounded-full px-4">
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ 2. Action Permissions ═══ */}
        <Section
          id="section-actions"
          title="Action Permissions"
          description="Control what Alex can do autonomously, what requires your approval, and what's disabled."
        >
          {Object.entries(
            permissions.reduce<Record<string, ActionPermission[]>>((acc, p) => {
              (acc[p.category] = acc[p.category] || []).push(p);
              return acc;
            }, {})
          ).map(([category, actions]) => (
            <SubSection key={category} title={category}>
              <div className="space-y-0 divide-y divide-border/40">
                {actions.map((action) => {
                  const permConf = PERMISSION_OPTIONS.find((p) => p.value === action.permission)!;
                  return (
                    <div key={action.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-foreground">{action.name}</span>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{action.description}</p>
                        {action.parameters && action.permission !== "disabled" && (
                          <div className="mt-2 flex items-center gap-2">
                            {Object.entries(action.parameters).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-1.5">
                                <Label className="text-[11px] text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </Label>
                                <Input
                                  type="number"
                                  defaultValue={val as number}
                                  className="w-20 h-7 text-[12px]"
                                  onChange={(e) => {
                                    const newVal = Number(e.target.value);
                                    setPermissions((prev) =>
                                      prev.map((p) =>
                                        p.id === action.id
                                          ? { ...p, parameters: { ...p.parameters, [key]: newVal } }
                                          : p
                                      )
                                    );
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Select
                        value={action.permission}
                        onValueChange={(val: PermissionLevel) => {
                          setPermissions((prev) =>
                            prev.map((p) => (p.id === action.id ? { ...p, permission: val } : p))
                          );
                          toast.success(`${action.name} → ${val}`);
                        }}
                      >
                        <SelectTrigger className={cn("w-[150px] h-8 text-[12px] rounded-md", permConf.color)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </SubSection>
          ))}
        </Section>

        {/* ═══ 3. Escalation Rules ═══ */}
        <Section
          id="section-escalation"
          title="Escalation Rules"
          description="Define when Alex should escalate a ticket to a human agent instead of handling it."
        >
          <div className="space-y-0 divide-y divide-border/40">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        setEscalationRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, enabled: checked } : r))
                        );
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-[13px] font-medium text-foreground">{rule.label}</span>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{rule.description}</p>
                      {rule.enabled && rule.routingTarget && (
                        <div className="mt-2 flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">Route to:</span>
                          {rule.routingType === "external_link" ? (
                            <a href={rule.routingTarget} target="_blank" rel="noreferrer" className="text-[11px] text-primary flex items-center gap-1 hover:underline">
                              External Zendesk <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <Badge variant="secondary" className="h-[18px] px-1.5 text-[10px]">
                              {rule.routingTarget}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {rule.configurable && rule.enabled && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-[11px] text-muted-foreground">Threshold:</Label>
                      <Input
                        type="number"
                        value={rule.value}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEscalationRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, value: val } : r))
                          );
                        }}
                        className="w-20 h-7 text-[12px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ 4. Agent Identity ═══ */}
        <Section
          id="section-identity"
          title="Agent Identity"
          description="Customize how Alex presents itself to customers."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px] font-medium">Agent Name</Label>
                <Input
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  className="mt-1.5 h-9 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] font-medium">Tone</Label>
                <Select
                  value={identity.tone}
                  onValueChange={(val: "professional" | "friendly" | "casual") =>
                    setIdentity({ ...identity, tone: val })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[12px] font-medium">Greeting Message</Label>
              <Textarea
                value={identity.greeting}
                onChange={(e) => setIdentity({ ...identity, greeting: e.target.value })}
                className="mt-1.5 text-[13px] min-h-[72px]"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                First message customers see when Alex starts a conversation.
              </p>
            </div>

            <div>
              <Label className="text-[12px] font-medium">Signature</Label>
              <Textarea
                value={identity.signature}
                onChange={(e) => setIdentity({ ...identity, signature: e.target.value })}
                className="mt-1.5 text-[13px] min-h-[56px]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div>
                <Label className="text-[13px] font-medium">Transparent about AI</Label>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  If enabled, Alex will disclose that it's an AI assistant when asked.
                </p>
              </div>
              <Switch
                checked={identity.transparentAboutAI}
                onCheckedChange={(checked) =>
                  setIdentity({ ...identity, transparentAboutAI: checked })
                }
              />
            </div>
          </div>
        </Section>

        {/* ═══ 5. Knowledge Base ═══ */}
        <Section
          id="section-knowledge"
          title="Knowledge Base"
          description="Manage source documents and view the rules Alex has learned."
        >
          {/* Sub-tab toggle */}
          <div className="flex gap-4 mb-4 border-b border-border/40">
            <button
              onClick={() => setKnowledgeSubTab("documents")}
              className={cn(
                "pb-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
                knowledgeSubTab === "documents"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Documents ({KNOWLEDGE_DOCUMENTS.length})
            </button>
            <button
              onClick={() => setKnowledgeSubTab("rules")}
              className={cn(
                "pb-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
                knowledgeSubTab === "rules"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Learned Rules ({SKILLS.length})
            </button>
          </div>

          {/* Documents */}
          {knowledgeSubTab === "documents" && (
            <div className="space-y-2">
              {KNOWLEDGE_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold uppercase shrink-0",
                      doc.type === "pdf" && "bg-red-50 text-red-500",
                      doc.type === "doc" && "bg-blue-50 text-blue-500",
                      doc.type === "csv" && "bg-emerald-50 text-emerald-500",
                      doc.type === "url" && "bg-purple-50 text-purple-500"
                    )}>
                      {doc.type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[11px] text-emerald-600">{doc.extractedRules} rules</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <button
                onClick={() => toast.info("File upload dialog would open here")}
                className="w-full border border-dashed border-border/60 rounded-md p-5 text-center hover:border-primary/40 transition-colors mt-3"
              >
                <Upload className="w-5 h-5 mx-auto text-muted-foreground/50 mb-1.5" />
                <p className="text-[13px] font-medium text-foreground">Upload Document</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOC, CSV — Alex will extract rules automatically</p>
              </button>
            </div>
          )}

          {/* Learned Rules */}
          {knowledgeSubTab === "rules" && (
            <div className="space-y-0 divide-y divide-border/30">
              {SKILLS.map((skill) => (
                <div key={skill.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium text-foreground">{skill.name}</span>
                    <Badge variant="secondary" className="h-[16px] px-1.5 text-[10px]">{skill.intent}</Badge>
                    {skill.updatedByTopicId && (
                      <Badge variant="outline" className="h-[16px] px-1 text-[9px] text-primary/70 border-primary/20">
                        Updated via Inbox
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{skill.ruleText}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-muted-foreground/60">
                      Updated {new Date(skill.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/50"
                          style={{ width: `${skill.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{Math.round(skill.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 text-center">
                <p className="text-[12px] text-muted-foreground">
                  Rules are updated through conversations in <span className="font-medium text-primary">Inbox</span>.
                </p>
              </div>
            </div>
          )}
        </Section>

        {/* Bottom spacer for guide bubble */}
        <div className="h-16" />
      </div>

      {/* Onboarding Guide Bubble */}
      <OnboardingGuide />
    </div>
  );
}
