/* ── Onboarding Page ──────────────────────────────────────────
   Conversational wizard: Connect → Import → Confirm → Permissions
   → Capability Boundary → Escalation → Identity → Go Live
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_PARSED_RULES,
  CAPABILITY_SUMMARY,
  ACTION_PERMISSIONS,
  ESCALATION_RULES,
  type ParsedRule,
  type OnboardingStep,
  type PermissionLevel,
} from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Circle,
  Link2,
  FileText,
  Shield,
  AlertTriangle,
  UserCircle,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Upload,
  Zap,
  Lock,
  Check,
  X,
  HelpCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const STEPS: { id: OnboardingStep; label: string; icon: typeof Link2 }[] = [
  { id: "connect_zendesk", label: "Connect Zendesk", icon: Link2 },
  { id: "connect_shopify", label: "Connect Shopify", icon: Link2 },
  { id: "import_rules", label: "Import & Parse", icon: FileText },
  { id: "confirm_rules", label: "Confirm Rules", icon: CheckCircle2 },
  { id: "set_permissions", label: "Set Permissions", icon: Zap },
  { id: "capability_boundary", label: "Capability Review", icon: Eye },
  { id: "escalation_rules", label: "Escalation Rules", icon: Shield },
  { id: "agent_identity", label: "Agent Identity", icon: UserCircle },
  { id: "go_live", label: "Go Live", icon: Rocket },
];

export default function Onboarding() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [parsedRules, setParsedRules] = useState<ParsedRule[]>(ONBOARDING_PARSED_RULES);
  const [agentName, setAgentName] = useState("Alex");
  const [agentTone, setAgentTone] = useState<"professional" | "friendly" | "casual">("friendly");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [, navigate] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  const currentStep = STEPS[currentStepIdx];
  const progressPercent = ((currentStepIdx) / (STEPS.length - 1)) * 100;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStepIdx]);

  const goNext = () => {
    setCompletedSteps((prev) => new Set(Array.from(prev).concat(currentStepIdx)));
    if (currentStepIdx < STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const goBack = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1);
  };

  const simulateImport = () => {
    setImporting(true);
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          toast.success("SOP parsed successfully — 10 rules extracted");
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Progress sidebar */}
        <div className="w-[280px] border-r border-border bg-card/50 flex flex-col shrink-0">
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-sans font-bold text-foreground">Seel AI</span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-2">Let's set up your AI support agent.</p>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446549828/ZnnRRhGjRupXpf5q3zCYHR/onboarding-hero-8bXsqZEJAqywKVavvGcH44.webp"
              alt="Onboarding"
              className="w-full h-24 object-cover rounded-lg mt-4 opacity-70"
            />
          </div>

        <div className="flex-1 px-3 py-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStepIdx;
            const isCompleted = completedSteps.has(idx);
            const isAccessible = idx <= currentStepIdx || isCompleted;

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setCurrentStepIdx(idx)}
                disabled={!isAccessible}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-0.5",
                  isActive && "bg-primary/10 text-primary",
                  !isActive && isAccessible && "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  !isAccessible && "text-gray-300 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-medium border transition-colors",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                    isActive && !isCompleted && "border-primary bg-primary/20 text-primary",
                    !isActive && !isCompleted && "border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span className="text-[12px] font-medium">{step.label}</span>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Step {currentStepIdx + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Right: Step content */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1" ref={contentRef}>
          <div className="max-w-[640px] mx-auto px-8 py-10">
            {/* ── Connect Zendesk ── */}
            {currentStep.id === "connect_zendesk" && (
              <StepContainer
                icon={<Link2 className="w-5 h-5 text-primary" />}
                title="Connect your Zendesk account"
                description="We'll use Zendesk to read tickets, post internal notes, and manage the AI agent seat."
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label className="text-[12px]">Zendesk Subdomain</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input defaultValue="coastalliving" className="h-9 text-[13px] flex-1" />
                        <span className="text-[13px] text-muted-foreground">.zendesk.com</span>
                      </div>
                    </div>
                    <Button className="w-full gap-2" onClick={goNext}>
                      <Link2 className="w-4 h-4" />
                      Connect with OAuth
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      We'll request read/write access to tickets and user profiles.
                    </p>
                  </CardContent>
                </Card>
              </StepContainer>
            )}

            {/* ── Connect Shopify ── */}
            {currentStep.id === "connect_shopify" && (
              <StepContainer
                icon={<Link2 className="w-5 h-5 text-primary" />}
                title="Connect your Shopify store"
                description="Alex needs Shopify access to look up orders, process refunds, and track shipments."
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label className="text-[12px]">Shopify Store URL</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input defaultValue="coastalliving" className="h-9 text-[13px] flex-1" />
                        <span className="text-[13px] text-muted-foreground">.myshopify.com</span>
                      </div>
                    </div>
                    <Button className="w-full gap-2" onClick={goNext}>
                      <Link2 className="w-4 h-4" />
                      Connect with OAuth
                    </Button>
                  </CardContent>
                </Card>
              </StepContainer>
            )}

            {/* ── Import Rules ── */}
            {currentStep.id === "import_rules" && (
              <StepContainer
                icon={<FileText className="w-5 h-5 text-primary" />}
                title="Import your SOP & knowledge"
                description="Upload your SOP documents and we'll analyze your historical tickets to extract business rules."
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {!importing && importProgress < 100 && (
                      <>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-[13px] font-medium text-foreground">Drop your SOP document here</p>
                          <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, or TXT — up to 10MB</p>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] text-muted-foreground">and</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] text-foreground mb-2">Analyze historical tickets</p>
                          <p className="text-[11px] text-muted-foreground mb-3">
                            We'll scan your last 500 resolved tickets to learn patterns from your team.
                          </p>
                        </div>
                        <Button className="w-full gap-2" onClick={simulateImport}>
                          <Sparkles className="w-4 h-4" />
                          Start Analysis
                        </Button>
                      </>
                    )}

                    {importing && (
                      <div className="py-8 text-center">
                        <Bot className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
                        <p className="text-[14px] font-sans font-semibold text-foreground mb-2">
                          Analyzing your knowledge base...
                        </p>
                        <p className="text-[12px] text-muted-foreground mb-4">
                          Parsing SOP document and scanning historical tickets
                        </p>
                        <Progress value={Math.min(importProgress, 100)} className="h-2 max-w-[300px] mx-auto" />
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {importProgress < 30 && "Reading SOP document..."}
                          {importProgress >= 30 && importProgress < 60 && "Scanning historical tickets..."}
                          {importProgress >= 60 && importProgress < 90 && "Extracting business rules..."}
                          {importProgress >= 90 && "Finalizing..."}
                        </p>
                      </div>
                    )}

                    {!importing && importProgress >= 100 && (
                      <div className="py-4 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <p className="text-[14px] font-sans font-semibold text-foreground mb-1">
                          Analysis Complete
                        </p>
                        <p className="text-[12px] text-muted-foreground mb-4">
                          Extracted <strong>10 rules</strong> from your SOP and historical tickets.
                          <br />
                          Found <strong>1 conflict</strong> that needs your input.
                        </p>
                        <Button className="gap-2" onClick={goNext}>
                          Review Rules
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </StepContainer>
            )}

            {/* ── Confirm Rules ── */}
            {currentStep.id === "confirm_rules" && (
              <StepContainer
                icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
                title="Review extracted rules"
                description="Alex found these rules from your SOP and historical tickets. Confirm, edit, or reject each one."
              >
                {/* Conflict alert */}
                {parsedRules.some((r) => r.status === "conflicted") && (
                  <Card className="border-amber-200 bg-amber-50/50 mb-4">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[13px] font-medium text-amber-800">Conflict detected</p>
                          <p className="text-[12px] text-amber-700/80 mt-0.5">
                            Your SOP says 30-day refund window for all customers, but 23% of your agents extend to 45 days for VIP customers. Which should Alex follow?
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-amber-300 hover:bg-amber-100"
                              onClick={() => {
                                setParsedRules((prev) =>
                                  prev.map((r) =>
                                    r.conflictGroupId === "cg-1"
                                      ? { ...r, status: r.id === "opr-4" ? "confirmed" : "rejected" }
                                      : r
                                  )
                                );
                                toast.success("Using SOP rule: 30 days for all");
                              }}
                            >
                              Use SOP (30 days)
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] bg-amber-600 hover:bg-amber-700"
                              onClick={() => {
                                setParsedRules((prev) =>
                                  prev.map((r) =>
                                    r.conflictGroupId === "cg-1"
                                      ? { ...r, status: r.id === "opr-5" ? "confirmed" : "rejected" }
                                      : r
                                  )
                                );
                                toast.success("Using VIP rule: 45 days for 3+ orders");
                              }}
                            >
                              Use VIP Rule (45 days)
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rules list */}
                <div className="space-y-2">
                  {parsedRules
                    .filter((r) => r.status !== "rejected")
                    .map((rule) => (
                      <Card
                        key={rule.id}
                        className={cn(
                          "transition-all",
                          rule.status === "conflicted" && "border-amber-200 bg-amber-50/30",
                          rule.status === "confirmed" && "border-emerald-200/50"
                        )}
                      >
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {rule.status === "confirmed" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {rule.status === "pending" && <Circle className="w-4 h-4 text-muted-foreground/40" />}
                              {rule.status === "conflicted" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-foreground leading-relaxed">{rule.text}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="secondary" className="h-[16px] px-1 text-[9px]">
                                  {rule.category.replace("_", " ")}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{rule.source}</span>
                              </div>
                            </div>
                            {rule.status === "pending" && (
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                                  onClick={() =>
                                    setParsedRules((prev) =>
                                      prev.map((r) => (r.id === rule.id ? { ...r, status: "confirmed" } : r))
                                    )
                                  }
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                  onClick={() =>
                                    setParsedRules((prev) =>
                                      prev.map((r) => (r.id === rule.id ? { ...r, status: "rejected" } : r))
                                    )
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button className="gap-2" onClick={goNext}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* ── Set Permissions ── */}
            {currentStep.id === "set_permissions" && (
              <StepContainer
                icon={<Zap className="w-5 h-5 text-primary" />}
                title="Set action permissions"
                description="For each action Alex can take, decide if it should be autonomous, require your approval, or be disabled."
              >
                <div className="space-y-2">
                  {ACTION_PERMISSIONS.map((action) => (
                    <Card key={action.id}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-foreground">{action.name}</span>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
                            {action.parameters && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {Object.entries(action.parameters).map(([key, val]) => (
                                  <div key={key} className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground capitalize">
                                      {key.replace(/([A-Z])/g, " $1")}:
                                    </span>
                                    <Input type="number" defaultValue={val as number} className="w-16 h-6 text-[11px]" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Select defaultValue={action.permission}>
                            <SelectTrigger className="w-[140px] h-8 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="autonomous" className="text-[11px]">Autonomous</SelectItem>
                              <SelectItem value="ask_permission" className="text-[11px]">Ask Permission</SelectItem>
                              <SelectItem value="disabled" className="text-[11px]">Disabled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" className="gap-2" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2" onClick={goNext}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* ── Capability Boundary ── */}
            {currentStep.id === "capability_boundary" && (
              <StepContainer
                icon={<Eye className="w-5 h-5 text-primary" />}
                title="What Alex can and can't do"
                description="Based on your rules and permissions, here's what Alex can handle — and what will still need human help."
              >
                {/* Coverage summary */}
                <Card className="mb-4">
                  <CardContent className="pt-5 pb-5 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.90 0.005 80)" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="oklch(0.48 0.09 195)" strokeWidth="8"
                          strokeDasharray={`${CAPABILITY_SUMMARY.estimatedCoverage * 2.64} ${264 - CAPABILITY_SUMMARY.estimatedCoverage * 2.64}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-sans font-bold text-foreground">
                          {CAPABILITY_SUMMARY.estimatedCoverage}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] font-medium text-foreground">Estimated Coverage</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Alex can auto-resolve approximately {CAPABILITY_SUMMARY.estimatedCoverage}% of incoming tickets.
                    </p>
                  </CardContent>
                </Card>

                {/* Can handle */}
                <div className="mb-4">
                  <h3 className="text-[13px] font-sans font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Alex can handle
                  </h3>
                  <div className="space-y-1.5">
                    {CAPABILITY_SUMMARY.canHandle.map((item) => (
                      <div key={item.scenario} className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[12px] text-foreground">{item.scenario}</span>
                        <span className="text-[12px] font-medium text-emerald-600">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Will escalate */}
                <div className="mb-6">
                  <h3 className="text-[13px] font-sans font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Alex will escalate
                  </h3>
                  <div className="space-y-1.5">
                    {CAPABILITY_SUMMARY.willEscalate.map((item) => (
                      <div key={item.scenario} className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50/50 border border-amber-100">
                        <span className="text-[12px] text-foreground">{item.scenario}</span>
                        <span className="text-[11px] text-amber-600">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" className="gap-2" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2" onClick={goNext}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* ── Escalation Rules ── */}
            {currentStep.id === "escalation_rules" && (
              <StepContainer
                icon={<Shield className="w-5 h-5 text-primary" />}
                title="Set escalation rules"
                description="Define when Alex should stop and hand off to a human agent."
              >
                <Card>
                  <CardContent className="pt-5 space-y-0 divide-y divide-border/40">
                    {ESCALATION_RULES.map((rule) => (
                      <div key={rule.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Switch defaultChecked={rule.enabled} className="mt-0.5" />
                            <div>
                              <span className="text-[13px] font-medium text-foreground">{rule.label}</span>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{rule.description}</p>
                            </div>
                          </div>
                          {rule.configurable && (
                            <Input type="number" defaultValue={rule.value} className="w-20 h-7 text-[12px] shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" className="gap-2" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2" onClick={goNext}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* ── Agent Identity ── */}
            {currentStep.id === "agent_identity" && (
              <StepContainer
                icon={<UserCircle className="w-5 h-5 text-primary" />}
                title="Set up Alex's identity"
                description="Customize how your AI agent presents itself to customers."
              >
                <Card>
                  <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[12px]">Agent Name</Label>
                        <Input
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          className="mt-1.5 h-9 text-[13px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[12px]">Tone</Label>
                        <Select value={agentTone} onValueChange={(v: typeof agentTone) => setAgentTone(v)}>
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

                    {/* Preview */}
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                      <p className="text-[11px] text-muted-foreground mb-2 font-medium">Preview greeting:</p>
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-card rounded-lg px-3 py-2 border border-border/40">
                          <p className="text-[13px] text-foreground">
                            Hi there! I'm {agentName} from Coastal Living Co support. How can I help you today?
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" className="gap-2" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2" onClick={goNext}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* ── Go Live ── */}
            {currentStep.id === "go_live" && (
              <StepContainer
                icon={<Rocket className="w-5 h-5 text-primary" />}
                title="Ready to go live!"
                description="Choose how you want Alex to start handling tickets."
              >
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="cursor-pointer border-2 hover:border-primary/40 transition-all group">
                    <CardContent className="pt-6 pb-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-100 transition-colors">
                        <Eye className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-[14px] font-sans font-semibold text-foreground mb-1">Shadow Mode</h3>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        Alex drafts responses but doesn't send them. You review and approve each one.
                      </p>
                      <Badge className="mt-3 bg-amber-100 text-amber-700 border-0">Recommended for start</Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer border-2 hover:border-primary/40 transition-all group">
                    <CardContent className="pt-6 pb-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                        <Rocket className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-[14px] font-sans font-semibold text-foreground mb-1">Production Mode</h3>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        Alex handles tickets autonomously, following the rules and permissions you've set.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-medium text-foreground mb-1">
                          Alex is ready with:
                        </p>
                        <ul className="text-[12px] text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {parsedRules.filter((r) => r.status === "confirmed").length} confirmed business rules
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {ACTION_PERMISSIONS.filter((a) => a.permission !== "disabled").length} enabled actions
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {ESCALATION_RULES.filter((r) => r.enabled).length} escalation safeguards
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            ~{CAPABILITY_SUMMARY.estimatedCoverage}% estimated ticket coverage
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" className="gap-2" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      toast.success("Alex is now live! Redirecting to dashboard...");
                      setTimeout(() => navigate("/instruct"), 1500);
                    }}
                  >
                    <Rocket className="w-4 h-4" />
                    Launch Alex
                  </Button>
                </div>
              </StepContainer>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ── Step Container ──
function StepContainer({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">{icon}</div>
        <div>
          <h2 className="text-[17px] font-sans font-bold text-foreground">{title}</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
