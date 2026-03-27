/* ── Playbook Page ────────────────────────────────────────────
   Knowledge, Integrations, Escalation Rules, Guardrails.
   Agent Mode/Identity/Actions moved to Agent page.
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  ESCALATION_RULES,
  INTEGRATIONS,
  SKILLS,
  KNOWLEDGE_DOCUMENTS,
  type EscalationRule,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Save,
  Upload,
  Trash2,
  ExternalLink,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  Bot,
  CheckCircle2,
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
      <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed bg-foreground text-background">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Section wrapper ── */
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
  const [, navigate] = useLocation();
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>(ESCALATION_RULES);
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<"documents" | "rules">("documents");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [conflictsDismissed, setConflictsDismissed] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full bg-background">
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/60">
          <div className="max-w-[860px] mx-auto px-6 py-3.5 flex items-center justify-between">
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">Playbook</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-1.5 h-8 text-[12px]"
                onClick={() => navigate("/agent")}
              >
                <User className="w-3.5 h-3.5" />
                Agent
              </Button>
              <Button
                className="gap-1.5 h-8 text-[12px]"
                onClick={() => toast.success("All changes saved")}
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
            </div>
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
                  This is where you manage knowledge, integrations, and escalation rules.
                  For agent identity, mode, and actions, go to <a href="/agent" className="text-primary font-medium hover:underline">Agent</a>.
                  You can also update rules by chatting in <a href="/messages" className="text-primary font-medium hover:underline">Messages</a>.
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

          {/* ═══ 1. Integrations ═══ */}
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

          {/* ═══ 2. Knowledge Base ═══ */}
          <Section
            id="section-knowledge"
            title="Knowledge"
            tip="Source documents and extracted rules. This is what your agent knows."
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

            {/* Learned Rules */}
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
                            via Messages
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
                              <a href={`/messages?topic=${skill.updatedByTopicId}`} className="text-primary hover:underline">
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
                    Rules are updated through conversations in <a href="/messages" className="text-primary hover:underline">Messages</a> or by uploading documents above.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* ═══ 3. Escalation Rules ═══ */}
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

          {/* ═══ 4. Guardrails ═══ */}
          <Section
            id="section-guardrails"
            title="Guardrails"
            tip="Safety limits that override action permissions. When triggered, the agent auto-escalates to you."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">Refund/compensation amount limit</span>
                  <Tip text="When the total refund or compensation exceeds this amount, the agent will not process it and will escalate to you." />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Exceeds $</span>
                  <Input type="number" defaultValue={100} className="w-20 h-7 text-[12px]" />
                  <span className="text-[11px] text-muted-foreground">→ Escalate</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </TooltipProvider>
  );
}
