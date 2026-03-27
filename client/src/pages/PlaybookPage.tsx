/* ── Playbook Page ────────────────────────────────────────────
   Flat sections, screenshot-style visual. Descriptions hidden
   behind hover tooltips. No Ask Permission — only Auto/Off.
   Escalation as rule descriptions. Knowledge preview with
   expandable details. Conflicts shown as alerts.
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
  type AgentMode,
  type EscalationRule,
  type AgentIdentity,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  HelpCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  Sparkles,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

/* ── Tip icon — small ? that shows tooltip on hover ── */
function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">
          <HelpCircle className="w-3 h-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed bg-foreground text-background">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Section wrapper — white card on gray bg ── */
function Section({ title, tip, children, id }: {
  title: string;
  tip?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white rounded-md border border-border/60">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h2>
          {tip && <Tip text={tip} />}
        </div>
      </div>
      <div className="px-6 pb-5">
        {children}
      </div>
    </section>
  );
}

/* ── Conflict data ── */
const CONFLICTS = [
  {
    id: "cf-1",
    title: "Return window duration",
    ruleA: "30 days from purchase date",
    sourceA: "SOP Document (Section 2.1)",
    ruleB: "28 days from delivery date",
    sourceB: "Observed in 47 past tickets",
  },
];

export default function PlaybookPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(
    ACTION_PERMISSIONS.filter((a) => a.permission !== "ask_permission").length > 0
      ? ACTION_PERMISSIONS
      : ACTION_PERMISSIONS
  );
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>(ESCALATION_RULES);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<"documents" | "rules" | "escalation">("documents");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [conflictsDismissed, setConflictsDismissed] = useState(false);

  /* Map permissions to Auto/Off only (no Ask Permission in MVP) */
  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, permission: p.permission === "disabled" ? "autonomous" : "disabled" }
          : p
      )
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full bg-background">
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/60">
          <div className="max-w-[860px] mx-auto px-6 py-3.5 flex items-center justify-between">
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">Playbook</h1>
            <Button
              className="gap-1.5 h-8 text-[12px]"
              onClick={() => toast.success("All changes saved")}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Dismissible guide banner */}
        {showGuide && (
          <div className="max-w-[860px] mx-auto px-6 pt-5">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground leading-relaxed">
                  This is where you configure how I work. Each section controls a different part of my behavior.
                  You can also update rules by chatting with me in <a href="/inbox" className="text-primary font-medium hover:underline">Inbox</a>.
                </p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="max-w-[860px] mx-auto px-6 py-5 space-y-4">

          {/* ═══ 1. Agent Mode ═══ */}
          <Section
            id="section-general"
            title="Agent Mode"
            tip="Controls how Alex handles incoming Zendesk tickets. Shadow mode drafts as internal notes; Production replies directly."
          >
            <div className="grid grid-cols-3 gap-3">
              {(["production", "shadow", "off"] as AgentMode[]).map((mode) => (
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
                        mode === "production" && "bg-emerald-400",
                        mode === "shadow" && "bg-amber-400",
                        mode === "off" && "bg-zinc-400"
                      )}
                    />
                    <span className="text-[13px] font-medium capitalize">{mode}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {mode === "production" && "Replies directly to customers."}
                    {mode === "shadow" && "Drafts as internal notes for review."}
                    {mode === "off" && "Inactive — all tickets go to humans."}
                  </p>
                </button>
              ))}
            </div>
          </Section>

          {/* ═══ 2. Integrations ═══ */}
          <Section
            id="section-integrations"
            title="Integrations"
            tip="Connect Zendesk to receive tickets and Shopify to look up order data."
          >
            <div className="divide-y divide-border/40">
              {INTEGRATIONS.map((intg) => (
                <div key={intg.platform} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-[11px]",
                        intg.platform === "zendesk" ? "bg-[#03363D]" : "bg-[#96BF48]"
                      )}
                    >
                      {intg.platform === "zendesk" ? "Z" : "S"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium capitalize">{intg.platform}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600">Connected</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-full px-3.5">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ 3. Action Permissions — Auto/Off toggle, compact ═══ */}
          <Section
            id="section-actions"
            title="Actions"
            tip="Toggle which actions Alex can perform autonomously. Disabled actions will be escalated to you."
          >
            {Object.entries(
              permissions.reduce<Record<string, ActionPermission[]>>((acc, p) => {
                (acc[p.category] = acc[p.category] || []).push(p);
                return acc;
              }, {})
            ).map(([category, actions]) => (
              <div key={category} className="mb-4 last:mb-0">
                <p className="text-[12px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">{category}</p>
                <div className="space-y-0 divide-y divide-border/30">
                  {actions.map((action) => {
                    const isOn = action.permission !== "disabled";
                    return (
                      <div key={action.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-foreground">{action.name}</span>
                          <Tip text={action.description} />
                          {/* Inline parameter if present and enabled */}
                          {isOn && action.parameters && Object.entries(action.parameters).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1 ml-2">
                              <span className="text-[11px] text-muted-foreground">
                                {key === "maxAmount" ? "max $" : key === "maxPercentage" ? "max %" : key === "maxValue" ? "max $" : key}
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
                                        ? { ...p, parameters: { ...p.parameters, [key]: newVal } }
                                        : p
                                    )
                                  );
                                }}
                              />
                            </div>
                          ))}
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

          {/* ═══ 4. Guardrails ═══ */}
          <Section
            id="section-guardrails"
            title="Guardrails"
            tip="Safety limits that override action permissions. When triggered, Alex auto-escalates to you."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">Refund/compensation amount limit</span>
                  <Tip text="When the total refund or compensation exceeds this amount, Alex will not process it and will escalate to you." />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Exceeds $</span>
                  <Input type="number" defaultValue={100} className="w-20 h-7 text-[12px]" />
                  <span className="text-[11px] text-muted-foreground">→ Escalate</span>
                </div>
              </div>
            </div>
          </Section>

          {/* ═══ 5. Escalation Rules — descriptive list, not switches ═══ */}
          <Section
            id="section-escalation"
            title="Escalation Rules"
            tip="Conditions that trigger automatic escalation to a human agent, regardless of action permissions."
          >
            <div className="space-y-0">
              {escalationRules.map((rule, idx) => (
                <div key={rule.id} className={cn("py-3", idx > 0 && "border-t border-border/30")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          rule.enabled ? "bg-emerald-400" : "bg-zinc-300"
                        )} />
                        <span className="text-[13px] font-medium text-foreground">{rule.label}</span>
                        <Tip text={rule.description} />
                        {rule.configurable && rule.enabled && (
                          <span className="text-[11px] text-muted-foreground">
                            threshold: <strong>{rule.value}</strong>
                          </span>
                        )}
                      </div>
                      {rule.routingTarget && rule.enabled && (
                        <div className="flex items-center gap-1.5 mt-1 ml-3.5">
                          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[11px] text-muted-foreground">→</span>
                          {rule.routingType === "external_link" ? (
                            <a href={rule.routingTarget} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                              External Zendesk <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">{rule.routingTarget}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        setEscalationRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, enabled: checked } : r))
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ 6. Agent Identity — no greeting ═══ */}
          <Section
            id="section-identity"
            title="Identity"
            tip="How Alex presents itself to customers in conversations."
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[12px] font-medium text-muted-foreground shrink-0">Name</Label>
                <Input
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  className="h-8 text-[13px] max-w-[180px]"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[12px] font-medium text-muted-foreground shrink-0">Tone</Label>
                <Select
                  value={identity.tone}
                  onValueChange={(val: "professional" | "friendly" | "casual") =>
                    setIdentity({ ...identity, tone: val })
                  }
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
                <Label className="text-[12px] font-medium text-muted-foreground shrink-0">Disclose AI</Label>
                <Tip text="If enabled, Alex will tell customers it's an AI when directly asked." />
                <Switch
                  checked={identity.transparentAboutAI}
                  onCheckedChange={(checked) =>
                    setIdentity({ ...identity, transparentAboutAI: checked })
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Signature</Label>
                <Tip text="Appended at the end of every customer-facing reply." />
              </div>
              <Input
                value={identity.signature}
                onChange={(e) => setIdentity({ ...identity, signature: e.target.value })}
                className="h-8 text-[13px]"
              />
            </div>
          </Section>

          {/* ═══ 7. Knowledge Base — with conflicts alert + escalation rules as a type ═══ */}
          <Section
            id="section-knowledge"
            title="Knowledge"
            tip="Source documents, extracted rules, and escalation rules. This is what Alex knows."
          >
            {/* Conflicts alert */}
            {!conflictsDismissed && CONFLICTS.length > 0 && (
              <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200/60">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-amber-800">
                      {CONFLICTS.length} unresolved conflict{CONFLICTS.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[12px] text-amber-700 mt-0.5">
                      Conflicting rules found between documents and observed behavior.
                    </p>
                    {CONFLICTS.map((c) => (
                      <div key={c.id} className="mt-2 p-2.5 bg-white rounded border border-amber-200/40">
                        <p className="text-[12px] font-medium text-foreground mb-1.5">{c.title}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">{c.sourceA}</p>
                            <p className="text-[12px] text-foreground">{c.ruleA}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">{c.sourceB}</p>
                            <p className="text-[12px] text-foreground">{c.ruleB}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2.5 rounded-full" onClick={() => toast.success("Applied: " + c.ruleA)}>
                            Use A
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2.5 rounded-full" onClick={() => toast.success("Applied: " + c.ruleB)}>
                            Use B
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setConflictsDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Sub-tab toggle */}
            <div className="flex gap-4 mb-4 border-b border-border/40">
              {([
                { key: "documents" as const, label: "Documents", count: KNOWLEDGE_DOCUMENTS.length },
                { key: "rules" as const, label: "Rules", count: SKILLS.length },
                { key: "escalation" as const, label: "Escalation Rules", count: escalationRules.filter(r => r.enabled).length },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setKnowledgeSubTab(tab.key)}
                  className={cn(
                    "pb-2 text-[12px] font-medium transition-colors border-b-2 -mb-px",
                    knowledgeSubTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Documents */}
            {knowledgeSubTab === "documents" && (
              <div className="space-y-0 divide-y divide-border/30">
                {KNOWLEDGE_DOCUMENTS.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={cn(
                        "w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold uppercase shrink-0",
                        doc.type === "pdf" && "bg-red-50 text-red-500",
                        doc.type === "doc" && "bg-blue-50 text-blue-500",
                        doc.type === "csv" && "bg-emerald-50 text-emerald-500",
                        doc.type === "url" && "bg-purple-50 text-purple-500"
                      )}>
                        {doc.type}
                      </div>
                      <span className="text-[13px] font-medium text-foreground truncate">{doc.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{doc.size}</span>
                      <span className="text-[11px] text-emerald-600 shrink-0">{doc.extractedRules} rules</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                <button
                  onClick={() => toast.info("File upload dialog would open here")}
                  className="w-full border border-dashed border-border/60 rounded-md p-4 text-center hover:border-primary/40 transition-colors mt-3"
                >
                  <Upload className="w-4 h-4 mx-auto text-muted-foreground/50 mb-1" />
                  <p className="text-[12px] font-medium text-foreground">Upload Document</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOC, CSV</p>
                </button>
              </div>
            )}

            {/* Learned Rules — compact with expandable details */}
            {knowledgeSubTab === "rules" && (
              <div className="space-y-0 divide-y divide-border/30">
                {SKILLS.map((skill) => {
                  const isExpanded = expandedRule === skill.id;
                  return (
                    <div key={skill.id} className="py-2.5 first:pt-0 last:pb-0">
                      <button
                        onClick={() => setExpandedRule(isExpanded ? null : skill.id)}
                        className="w-full flex items-center gap-2 text-left group"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                          : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        }
                        <span className="text-[13px] font-medium text-foreground flex-1">{skill.name}</span>
                        <Badge variant="secondary" className="h-[16px] px-1.5 text-[10px] shrink-0">{skill.intent}</Badge>
                        {skill.updatedByTopicId && (
                          <Badge variant="outline" className="h-[16px] px-1 text-[9px] text-primary/70 border-primary/20 shrink-0">
                            via Inbox
                          </Badge>
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-5 mt-2 p-3 rounded-md bg-muted/30 border border-border/30">
                          <p className="text-[12px] text-foreground leading-relaxed">{skill.ruleText}</p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                            <span>Updated {new Date(skill.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            <span>Confidence: {Math.round(skill.confidence * 100)}%</span>
                            {skill.updatedByTopicId && (
                              <a href={`/inbox?topic=${skill.updatedByTopicId}`} className="text-primary hover:underline">
                                View source conversation
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-3 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    Rules are updated through conversations in <a href="/inbox" className="text-primary hover:underline">Inbox</a> or by uploading documents above.
                  </p>
                </div>
              </div>
            )}

            {/* Escalation Rules as Knowledge type */}
            {knowledgeSubTab === "escalation" && (
              <div className="space-y-0 divide-y divide-border/30">
                {escalationRules.map((rule) => (
                  <div key={rule.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        rule.enabled ? "bg-emerald-400" : "bg-zinc-300"
                      )} />
                      <span className="text-[13px] font-medium text-foreground">{rule.label}</span>
                      {rule.configurable && rule.enabled && (
                        <span className="text-[11px] text-muted-foreground">
                          (threshold: {rule.value})
                        </span>
                      )}
                      {rule.routingTarget && (
                        <span className="text-[11px] text-muted-foreground">
                          → {rule.routingTarget}
                        </span>
                      )}
                      <Badge variant={rule.enabled ? "secondary" : "outline"} className="h-[16px] px-1.5 text-[10px] ml-auto shrink-0">
                        {rule.enabled ? "Active" : "Off"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-3 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    Edit escalation rules in the <a href="#section-escalation" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); document.getElementById("section-escalation")?.scrollIntoView({ behavior: "smooth" }); }}>Escalation Rules</a> section above.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </TooltipProvider>
  );
}
