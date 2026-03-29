/* ── SettingsPage ─────────────────────────────────────────
   Tabs: General | Actions | Identity | Knowledge
   (Escalation tab removed — escalation is now embedded in each SOP Rule)
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACTION_PERMISSIONS,
  AGENT_IDENTITY,
  INTEGRATIONS,
  RULES,
  KNOWLEDGE_DOCUMENTS,
  AGENT_MODE,
  type ActionPermission,
  type PermissionLevel,
  type AgentMode,
  type AgentIdentity,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Settings,
  Zap,
  UserCircle,
  BookOpen,
  Power,
  Link2,
  CheckCircle2,
  Lock,
  HelpCircle,
  Save,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "general" | "actions" | "identity" | "knowledge";

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "actions", label: "Action Permissions", icon: Zap },
  { id: "identity", label: "Agent Identity", icon: UserCircle },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
];

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; description: string; color: string }[] = [
  { value: "autonomous", label: "Autonomous", description: "AI executes without approval", color: "text-emerald-600 bg-emerald-50" },
  { value: "disabled", label: "Disabled", description: "AI cannot perform this action", color: "text-red-600 bg-red-50" },
];

/* ── Knowledge Sub-Tab Component ── */
function KnowledgeTab() {
  const [subTab, setSubTab] = useState<"documents" | "rules">("documents");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">Knowledge Base</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage source documents and view the SOP rules the rep has learned.
        </p>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setSubTab("documents")}
          className={cn(
            "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
            subTab === "documents" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Documents ({KNOWLEDGE_DOCUMENTS.length})
        </button>
        <button
          onClick={() => setSubTab("rules")}
          className={cn(
            "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
            subTab === "rules" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          SOP Rules ({RULES.length})
        </button>
      </div>

      {/* Documents sub-tab */}
      {subTab === "documents" && (
        <div className="space-y-3">
          {KNOWLEDGE_DOCUMENTS.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold uppercase shrink-0",
                      doc.type === "pdf" && "bg-red-50 text-red-600",
                      doc.type === "doc" && "bg-blue-50 text-blue-600",
                      doc.type === "csv" && "bg-emerald-50 text-emerald-600",
                      doc.type === "url" && "bg-purple-50 text-purple-600"
                    )}>
                      {doc.type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                        <span className="text-[11px] text-muted-foreground">
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <Badge variant="secondary" className="h-[16px] px-1.5 text-[10px]">
                          {doc.extractedRules} rules extracted
                        </Badge>
                        {doc.status === "processed" && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Processed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <button
            onClick={() => toast.info("File upload dialog would open here")}
            className="w-full border-2 border-dashed border-border/60 rounded-lg p-6 text-center hover:border-primary/40 hover:bg-primary/2 transition-colors"
          >
            <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-[13px] font-medium text-foreground">Upload Document</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOC, CSV — the rep will extract rules automatically</p>
          </button>
        </div>
      )}

      {/* Rules sub-tab — SOP Rule cards */}
      {subTab === "rules" && (
        <div className="space-y-3">
          {RULES.map((rule) => (
            <Card key={rule.id} className="overflow-hidden">
              <CardContent className="pt-4 pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] font-medium text-foreground">{rule.name}</span>
                    <Badge variant="secondary" className="h-[18px] px-1.5 text-[10px]">
                      {rule.intent}
                    </Badge>
                    {rule.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="h-[16px] px-1 text-[9px]">{tag}</Badge>
                    ))}
                  </div>

                  {/* Policy */}
                  <p className="text-[12px] text-foreground/80 leading-relaxed mb-2">{rule.policy}</p>

                  {/* Exceptions */}
                  {rule.exceptions.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/80">Exceptions</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {rule.exceptions.map((ex, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                            <span className="text-amber-500 mt-0.5 shrink-0">·</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Escalation */}
                  <div className="rounded-md bg-red-50/50 border border-red-100 px-2.5 py-1.5 mb-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500/80">Escalation</span>
                    </div>
                    <p className="text-[11px] text-red-800/70"><strong>Trigger:</strong> {rule.escalation.trigger}</p>
                    <p className="text-[11px] text-red-800/70"><strong>Action:</strong> {rule.escalation.action}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground/60">
                      Updated {new Date(rule.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {rule.updatedByTopicId && (
                      <Badge variant="outline" className="h-[16px] px-1 text-[9px] text-primary/70 border-primary/20">
                        Updated via Messages
                      </Badge>
                    )}
                    {rule.sourceDocId && (
                      <a href="#" onClick={(e) => { e.preventDefault(); toast.info("View source document"); }} className="text-[10px] text-primary hover:underline">
                        View Source
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
            <p className="text-[12px] text-muted-foreground">
              Rules are updated through conversations in <span className="font-medium text-primary">Messages</span>.
              The rep proposes rules, you confirm — and they appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [permissions, setPermissions] = useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [identity, setIdentity] = useState<AgentIdentity>(AGENT_IDENTITY);

  return (
    <div className="flex h-full">
      {/* Tab sidebar */}
      <div className="w-[200px] border-r border-border bg-white py-4 px-2.5 shrink-0">
        <h1 className="text-[14px] font-semibold text-foreground px-2.5 mb-4">Settings</h1>
        <nav className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-[680px] mx-auto px-6 py-6">

          {/* ── General Tab ── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">General Settings</h2>
                <p className="text-[12px] text-muted-foreground mt-1">Manage agent mode and integrations.</p>
              </div>

              {/* Agent Mode */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-primary" />
                    <CardTitle className="text-[15px]">Agent Mode</CardTitle>
                  </div>
                  <CardDescription className="text-[13px]">
                    Control how the rep operates on your Zendesk tickets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {(["production", "training", "off"] as AgentMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setAgentMode(mode);
                          toast.success(`Agent mode set to ${mode}`);
                        }}
                        className={cn(
                          "border rounded-lg p-4 text-left transition-all",
                          agentMode === mode
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              mode === "production" && "bg-emerald-400",
                              mode === "training" && "bg-amber-400",
                              mode === "off" && "bg-zinc-400"
                            )}
                          />
                          <span className="text-[13px] font-semibold capitalize">{mode}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {mode === "production" && "Rep handles tickets and executes actions autonomously."}
                          {mode === "training" && "Rep drafts responses and sends internal notes only. You review and approve."}
                          {mode === "off" && "Rep is inactive. All tickets go to human agents."}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-[15px]">Integrations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {INTEGRATIONS.map((intg) => (
                    <div
                      key={intg.platform}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-white font-sans font-bold text-[13px]",
                            intg.platform === "zendesk" ? "bg-[#03363D]" : "bg-[#96BF48]"
                          )}
                        >
                          {intg.platform === "zendesk" ? "Z" : "S"}
                        </div>
                        <div>
                          <span className="text-[13px] font-medium capitalize">{intg.platform}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[11px] text-emerald-600">Connected</span>
                            {intg.webhookStatus && (
                              <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                                Webhook {intg.webhookStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-[11px]">
                        Manage
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Actions Tab ── */}
          {activeTab === "actions" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Action Permissions</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Control what the rep can do autonomously and what's disabled.
                </p>
              </div>

              {/* Group by category */}
              {Object.entries(
                permissions.reduce<Record<string, ActionPermission[]>>((acc, p) => {
                  (acc[p.category] = acc[p.category] || []).push(p);
                  return acc;
                }, {})
              ).map(([category, actions]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[14px] text-foreground/80">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y divide-border/40">
                    {actions.map((action) => {
                      const permConf = PERMISSION_OPTIONS.find((p) => p.value === action.permission)!;
                      return (
                        <div key={action.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-foreground">{action.name}</span>
                                {action.dependsOn && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Lock className="w-3 h-3 text-muted-foreground/50" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Depends on another action being enabled
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <p className="text-[12px] text-muted-foreground mt-0.5">{action.description}</p>
                              {/* Guardrails */}
                              {action.guardrails && action.guardrails.length > 0 && action.permission !== "disabled" && (
                                <div className="mt-2 space-y-1.5 ml-0.5">
                                  {action.guardrails.map((g) => (
                                    <div key={g.id} className="flex items-center gap-2">
                                      <Switch
                                        checked={g.enabled}
                                        className="scale-75"
                                        onCheckedChange={(checked) => {
                                          setPermissions((prev) =>
                                            prev.map((p) =>
                                              p.id === action.id
                                                ? {
                                                    ...p,
                                                    guardrails: p.guardrails?.map((gr) =>
                                                      gr.id === g.id ? { ...gr, enabled: checked } : gr
                                                    ),
                                                  }
                                                : p
                                            )
                                          );
                                        }}
                                      />
                                      <span className="text-[11px] text-muted-foreground font-medium">Guardrail:</span>
                                      <span className="text-[11px] text-foreground">{g.label}</span>
                                      {g.type === "number" && g.enabled && (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            defaultValue={g.value}
                                            className="w-16 h-6 text-[11px]"
                                          />
                                          {g.unit && <span className="text-[10px] text-muted-foreground">{g.unit}</span>}
                                        </div>
                                      )}
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
                                toast.success(`${action.name} set to ${val}`);
                              }}
                            >
                              <SelectTrigger className={cn("w-[140px] h-8 text-[12px]", permConf?.color)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PERMISSION_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                                    <div>
                                      <span className="font-medium">{opt.label}</span>
                                      <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button className="gap-1.5" onClick={() => toast.success("Permissions saved")}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* ── Identity Tab ── */}
          {activeTab === "identity" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Agent Identity</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Customize how the rep presents itself to customers.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-5">
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
                      className="mt-1.5 text-[13px] min-h-[80px]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      This is the first message customers see when the rep starts a conversation.
                    </p>
                  </div>

                  <div>
                    <Label className="text-[12px] font-medium">Signature</Label>
                    <Textarea
                      value={identity.signature}
                      onChange={(e) => setIdentity({ ...identity, signature: e.target.value })}
                      className="mt-1.5 text-[13px] min-h-[60px]"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[13px] font-medium">Transparent about AI</Label>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        If enabled, the rep will disclose that it's an AI assistant when asked.
                      </p>
                    </div>
                    <Switch
                      checked={identity.transparentAboutAI}
                      onCheckedChange={(checked) =>
                        setIdentity({ ...identity, transparentAboutAI: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="gap-1.5" onClick={() => toast.success("Identity settings saved")}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* ── Knowledge Tab ── */}
          {activeTab === "knowledge" && (
            <KnowledgeTab />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
