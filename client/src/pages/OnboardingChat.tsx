/* ── Onboarding Chat Version ─────────────────────────────────
   Conversational-style onboarding: AI guides Manager through
   setup via a chat-like interface with structured response options.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_PARSED_RULES,
  CAPABILITY_SUMMARY,
  ACTION_PERMISSIONS,
  ESCALATION_RULES,
  type ParsedRule,
  type PermissionLevel,
} from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Link2,
  FileText,
  Shield,
  AlertTriangle,
  UserCircle,
  Rocket,
  Upload,
  Zap,
  Check,
  X,
  Eye,
  Send,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ── Types ──
type MessageRole = "ai" | "manager" | "system";
type MessageContentType = "text" | "connect_form" | "import_upload" | "import_progress" | "import_done" |
  "rules_review" | "conflict_card" | "permissions_table" | "capability_summary" |
  "escalation_config" | "identity_form" | "go_live_choice" | "options";

interface ChatMessage {
  id: string;
  role: MessageRole;
  contentType: MessageContentType;
  text?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// ── Conversation Script ──
// Each "phase" maps to a set of messages the AI sends, and the user's response triggers the next phase.
type Phase = "welcome" | "connect_zendesk" | "connect_shopify" | "import" | "importing" | "import_done" |
  "confirm_rules" | "conflict" | "permissions" | "capability" | "escalation" | "identity" | "go_live" | "done";

let msgCounter = 0;
function makeMsg(role: MessageRole, contentType: MessageContentType, text?: string, data?: Record<string, unknown>): ChatMessage {
  msgCounter++;
  return { id: `msg-${msgCounter}`, role, contentType, text, data, timestamp: new Date() };
}

export default function OnboardingChat() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parsedRules, setParsedRules] = useState<ParsedRule[]>(ONBOARDING_PARSED_RULES);
  const [agentName, setAgentName] = useState("Alex");
  const [agentTone, setAgentTone] = useState<"professional" | "friendly" | "casual">("friendly");
  const [importProgress, setImportProgress] = useState(0);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInit = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingIndicator]);

  // Simulate AI typing delay then add messages
  const addAiMessages = (msgs: ChatMessage[], delayBetween = 600) => {
    setTypingIndicator(true);
    let i = 0;
    const addNext = () => {
      if (i < msgs.length) {
        setMessages((prev) => [...prev, msgs[i]]);
        i++;
        if (i < msgs.length) {
          setTimeout(addNext, delayBetween);
        } else {
          setTypingIndicator(false);
        }
      }
    };
    setTimeout(addNext, 500);
  };

  // Initialize welcome
  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    addAiMessages([
      makeMsg("ai", "text", "Hi! I'm here to help you set up your AI support agent. This will take about 10 minutes."),
      makeMsg("ai", "text", "We'll go through a few steps: connect your tools, import your knowledge, set permissions, and configure your agent's identity."),
      makeMsg("ai", "options", "Let's start by connecting your Zendesk account. Ready?", {
        options: [{ label: "Let's go!", value: "start" }],
      }),
    ]);
  }, []);

  // Handle user choices
  const handleChoice = (value: string) => {
    switch (phase) {
      case "welcome":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Let's go!")]);
        setPhase("connect_zendesk");
        addAiMessages([
          makeMsg("ai", "text", "Great! First, let's connect your Zendesk account so I can read and respond to tickets."),
          makeMsg("ai", "connect_form", undefined, { platform: "zendesk", placeholder: "coastalliving" }),
        ]);
        break;

      case "connect_zendesk":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Connected Zendesk ✓")]);
        setPhase("connect_shopify");
        addAiMessages([
          makeMsg("ai", "text", "Zendesk connected! Now let's connect Shopify so I can look up orders, process refunds, and track shipments."),
          makeMsg("ai", "connect_form", undefined, { platform: "shopify", placeholder: "coastalliving" }),
        ]);
        break;

      case "connect_shopify":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Connected Shopify ✓")]);
        setPhase("import");
        addAiMessages([
          makeMsg("ai", "text", "Both tools connected! Now I need to learn your business rules."),
          makeMsg("ai", "text", "You can upload your SOP document, and I'll also analyze your last 500 resolved tickets to learn how your team handles things."),
          makeMsg("ai", "import_upload"),
        ]);
        break;

      case "import":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Start analysis")]);
        setPhase("importing");
        addAiMessages([
          makeMsg("ai", "import_progress"),
        ]);
        // Simulate progress
        setImportProgress(0);
        const interval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setPhase("import_done");
                addAiMessages([
                  makeMsg("ai", "import_done", undefined, { ruleCount: 10, conflictCount: 1 }),
                  makeMsg("ai", "options", "Ready to review the rules I found?", {
                    options: [{ label: "Show me the rules", value: "review" }],
                  }),
                ]);
              }, 400);
              return 100;
            }
            return prev + Math.random() * 12;
          });
        }, 200);
        break;

      case "import_done":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Show me the rules")]);
        setPhase("confirm_rules");
        addAiMessages([
          makeMsg("ai", "text", "I extracted 10 business rules. I found 1 conflict that needs your input. Let me show you everything:"),
          makeMsg("ai", "conflict_card"),
          makeMsg("ai", "rules_review"),
        ]);
        break;

      case "confirm_rules":
        if (value === "rules_confirmed") {
          const confirmed = parsedRules.filter((r) => r.status === "confirmed").length;
          setMessages((prev) => [...prev, makeMsg("manager", "text", `Confirmed ${confirmed} rules`)]);
          setPhase("permissions");
          addAiMessages([
            makeMsg("ai", "text", `Great, ${confirmed} rules locked in! Now let's set up what actions I'm allowed to take.`),
            makeMsg("ai", "text", "For each action, you can choose: **Autonomous** (I do it myself), **Ask Permission** (I'll ask you first), or **Disabled** (I won't do it at all)."),
            makeMsg("ai", "permissions_table"),
          ]);
        }
        break;

      case "permissions":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Permissions configured ✓")]);
        setPhase("capability");
        addAiMessages([
          makeMsg("ai", "text", "Based on your rules and permissions, here's what I can and can't do:"),
          makeMsg("ai", "capability_summary"),
          makeMsg("ai", "options", "Does this look right? We can adjust permissions if you want to change the coverage.", {
            options: [
              { label: "Looks good, continue", value: "continue" },
              { label: "Go back to permissions", value: "back_permissions" },
            ],
          }),
        ]);
        break;

      case "capability":
        if (value === "back_permissions") {
          setMessages((prev) => [...prev, makeMsg("manager", "text", "Let me adjust permissions")]);
          setPhase("permissions");
          addAiMessages([makeMsg("ai", "permissions_table")]);
        } else {
          setMessages((prev) => [...prev, makeMsg("manager", "text", "Looks good, continue")]);
          setPhase("escalation");
          addAiMessages([
            makeMsg("ai", "text", "Now let's define when I should stop and hand off to a human. These are my safety rails:"),
            makeMsg("ai", "escalation_config"),
          ]);
        }
        break;

      case "escalation":
        setMessages((prev) => [...prev, makeMsg("manager", "text", "Escalation rules set ✓")]);
        setPhase("identity");
        addAiMessages([
          makeMsg("ai", "text", "Almost done! Last thing — let's set up my identity. What should customers call me, and what tone should I use?"),
          makeMsg("ai", "identity_form"),
        ]);
        break;

      case "identity":
        setMessages((prev) => [...prev, makeMsg("manager", "text", `Named the agent "${agentName}" with ${agentTone} tone`)]);
        setPhase("go_live");
        addAiMessages([
          makeMsg("ai", "text", `Love it! I'm ${agentName}, ready to help your customers.`),
          makeMsg("ai", "text", "Here's a summary of everything we set up:"),
          makeMsg("ai", "go_live_choice"),
        ]);
        break;

      case "go_live":
        if (value === "shadow") {
          setMessages((prev) => [...prev, makeMsg("manager", "text", "Start in Shadow Mode")]);
          setPhase("done");
          addAiMessages([
            makeMsg("ai", "text", "Shadow Mode activated! I'll draft responses for every ticket, but won't send anything until you approve. You can switch to Production anytime from Settings."),
            makeMsg("ai", "options", "Ready to see your dashboard?", {
              options: [{ label: "Go to Dashboard", value: "dashboard" }],
            }),
          ]);
        } else if (value === "production") {
          setMessages((prev) => [...prev, makeMsg("manager", "text", "Go live in Production Mode")]);
          setPhase("done");
          addAiMessages([
            makeMsg("ai", "text", "Production Mode activated! I'm now handling tickets autonomously. I'll ask for your approval on actions that require it, and escalate when I'm unsure."),
            makeMsg("ai", "options", "Let's go to the dashboard!", {
              options: [{ label: "Go to Dashboard", value: "dashboard" }],
            }),
          ]);
        }
        break;

      case "done":
        toast.success("Setup complete! Redirecting...");
        setTimeout(() => navigate("/instruct"), 1000);
        break;
    }
  };

  // ── Render message content ──
  const renderMessageContent = (msg: ChatMessage) => {
    switch (msg.contentType) {
      case "text":
        return <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>;

      case "options":
        return (
          <div>
            {msg.text && <p className="text-[13px] leading-relaxed mb-3">{msg.text}</p>}
            <div className="flex flex-wrap gap-2">
              {(msg.data?.options as { label: string; value: string }[])?.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  className="h-8 text-[12px] gap-1.5"
                  onClick={() => handleChoice(opt.value)}
                >
                  {opt.label}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>
        );

      case "connect_form":
        return (
          <Card className="mt-1">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-medium capitalize">{String(msg.data?.platform)} Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  defaultValue={String(msg.data?.placeholder || "")}
                  className="h-8 text-[12px] flex-1"
                />
                <span className="text-[12px] text-muted-foreground">
                  .{msg.data?.platform === "zendesk" ? "zendesk.com" : "myshopify.com"}
                </span>
              </div>
              <Button size="sm" className="w-full h-8 text-[12px] gap-1.5" onClick={() => handleChoice("connected")}>
                <Link2 className="w-3.5 h-3.5" />
                Connect with OAuth
              </Button>
            </CardContent>
          </Card>
        );

      case "import_upload":
        return (
          <Card className="mt-1">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-[12px] font-medium">Drop your SOP document here</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOCX, or TXT</p>
              </div>
              <Button size="sm" className="w-full h-8 text-[12px] gap-1.5" onClick={() => handleChoice("start_import")}>
                <Sparkles className="w-3.5 h-3.5" />
                Upload & Start Analysis
              </Button>
            </CardContent>
          </Card>
        );

      case "import_progress":
        return (
          <Card className="mt-1">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-[12px] font-medium">Analyzing your knowledge base...</span>
              </div>
              <Progress value={Math.min(importProgress, 100)} className="h-1.5 mb-2" />
              <p className="text-[10px] text-muted-foreground">
                {importProgress < 30 && "Reading SOP document..."}
                {importProgress >= 30 && importProgress < 60 && "Scanning historical tickets..."}
                {importProgress >= 60 && importProgress < 90 && "Extracting business rules..."}
                {importProgress >= 90 && "Finalizing..."}
              </p>
            </CardContent>
          </Card>
        );

      case "import_done":
        return (
          <Card className="mt-1 border-emerald-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[13px] font-medium">Analysis Complete</span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Extracted <strong>{String(msg.data?.ruleCount)}</strong> rules. Found <strong>{String(msg.data?.conflictCount)}</strong> conflict that needs your input.
              </p>
            </CardContent>
          </Card>
        );

      case "conflict_card":
        return (
          <Card className="mt-1 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-[12px] font-medium text-amber-800">Conflict: Refund Window</p>
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    SOP says 30-day refund window for all. But 23% of agents extend to 45 days for VIP customers (3+ orders). Which should I follow?
                  </p>
                </div>
              </div>
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
                  SOP (30 days for all)
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
                  VIP Rule (45 days)
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "rules_review":
        return (
          <div className="mt-1 space-y-1.5">
            {parsedRules
              .filter((r) => r.status !== "rejected")
              .map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-all",
                    rule.status === "confirmed" && "border-emerald-200/60 bg-emerald-50/30",
                    rule.status === "pending" && "border-border bg-card",
                    rule.status === "conflicted" && "border-amber-200 bg-amber-50/30"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {rule.status === "confirmed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {rule.status === "pending" && (
                      <button
                        onClick={() =>
                          setParsedRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, status: "confirmed" } : r))
                          )
                        }
                        className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 hover:border-emerald-500 transition-colors"
                      />
                    )}
                    {rule.status === "conflicted" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground leading-relaxed">{rule.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="h-[14px] px-1 text-[8px]">
                        {rule.category.replace("_", " ")}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">{rule.source}</span>
                    </div>
                  </div>
                  {rule.status === "pending" && (
                    <button
                      onClick={() =>
                        setParsedRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, status: "rejected" } : r))
                        )
                      }
                      className="shrink-0 mt-0.5"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
                    </button>
                  )}
                </div>
              ))}
            <Button
              size="sm"
              className="w-full h-8 text-[12px] mt-3 gap-1.5"
              onClick={() => handleChoice("rules_confirmed")}
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Rules & Continue
            </Button>
          </div>
        );

      case "permissions_table":
        return (
          <div className="mt-1 space-y-1.5">
            {ACTION_PERMISSIONS.map((action) => (
              <div key={action.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-medium text-foreground">{action.name}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
                  {action.parameters && (
                    <div className="flex items-center gap-2 mt-1">
                      {Object.entries(action.parameters).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1")}:
                          </span>
                          <Input type="number" defaultValue={val as number} className="w-14 h-5 text-[10px]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Select defaultValue={action.permission}>
                  <SelectTrigger className="w-[120px] h-7 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autonomous" className="text-[10px]">Autonomous</SelectItem>
                    <SelectItem value="ask_permission" className="text-[10px]">Ask Permission</SelectItem>
                    <SelectItem value="disabled" className="text-[10px]">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button
              size="sm"
              className="w-full h-8 text-[12px] mt-3 gap-1.5"
              onClick={() => handleChoice("permissions_done")}
            >
              <Check className="w-3.5 h-3.5" />
              Save Permissions & Continue
            </Button>
          </div>
        );

      case "capability_summary":
        return (
          <Card className="mt-1">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.90 0.005 80)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="oklch(0.48 0.09 195)" strokeWidth="8"
                      strokeDasharray={`${CAPABILITY_SUMMARY.estimatedCoverage * 2.64} ${264 - CAPABILITY_SUMMARY.estimatedCoverage * 2.64}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-heading font-bold">{CAPABILITY_SUMMARY.estimatedCoverage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-medium">Estimated Coverage</p>
                  <p className="text-[11px] text-muted-foreground">I can auto-resolve ~{CAPABILITY_SUMMARY.estimatedCoverage}% of tickets</p>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> I can handle:
                </p>
                {CAPABILITY_SUMMARY.canHandle.map((item) => (
                  <div key={item.scenario} className="flex items-center justify-between px-2 py-1 rounded bg-emerald-50/50 text-[11px]">
                    <span>{item.scenario}</span>
                    <span className="font-medium text-emerald-600">{item.percentage}%</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> I'll escalate:
                </p>
                {CAPABILITY_SUMMARY.willEscalate.map((item) => (
                  <div key={item.scenario} className="flex items-center justify-between px-2 py-1 rounded bg-amber-50/50 text-[11px]">
                    <span>{item.scenario}</span>
                    <span className="text-amber-600">{item.reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "escalation_config":
        return (
          <div className="mt-1 space-y-1.5">
            {ESCALATION_RULES.map((rule) => (
              <div key={rule.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                <Switch defaultChecked={rule.enabled} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-medium text-foreground">{rule.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rule.description}</p>
                </div>
                {rule.configurable && (
                  <Input type="number" defaultValue={rule.value} className="w-16 h-6 text-[10px] shrink-0" />
                )}
              </div>
            ))}
            <Button
              size="sm"
              className="w-full h-8 text-[12px] mt-3 gap-1.5"
              onClick={() => handleChoice("escalation_done")}
            >
              <Check className="w-3.5 h-3.5" />
              Save Escalation Rules & Continue
            </Button>
          </div>
        );

      case "identity_form":
        return (
          <Card className="mt-1">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Agent Name</label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-1 h-8 text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Tone</label>
                  <Select value={agentTone} onValueChange={(v: typeof agentTone) => setAgentTone(v)}>
                    <SelectTrigger className="mt-1 h-8 text-[12px]">
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
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Preview:</p>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card rounded-lg px-2.5 py-1.5 border border-border/40">
                    <p className="text-[12px]">
                      Hi there! I'm {agentName} from Coastal Living Co support. How can I help you today?
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full h-8 text-[12px] gap-1.5"
                onClick={() => handleChoice("identity_done")}
              >
                <Check className="w-3.5 h-3.5" />
                Save Identity & Continue
              </Button>
            </CardContent>
          </Card>
        );

      case "go_live_choice":
        return (
          <div className="mt-1 space-y-3">
            {/* Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium mb-1">{agentName} is ready with:</p>
                    <ul className="text-[11px] text-muted-foreground space-y-0.5">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        {parsedRules.filter((r) => r.status === "confirmed").length} confirmed rules
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        {ACTION_PERMISSIONS.filter((a) => a.permission !== "disabled").length} enabled actions
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        {ESCALATION_RULES.filter((r) => r.enabled).length} escalation safeguards
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        ~{CAPABILITY_SUMMARY.estimatedCoverage}% estimated coverage
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mode choices */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleChoice("shadow")}
                className="text-left p-3 rounded-lg border-2 border-border hover:border-amber-400 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2 group-hover:bg-amber-100 transition-colors">
                  <Eye className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[12px] font-medium">Shadow Mode</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">I draft, you approve</p>
                <Badge className="mt-2 bg-amber-100 text-amber-700 border-0 text-[8px] h-[14px]">Recommended</Badge>
              </button>
              <button
                onClick={() => handleChoice("production")}
                className="text-left p-3 rounded-lg border-2 border-border hover:border-emerald-400 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2 group-hover:bg-emerald-100 transition-colors">
                  <Rocket className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[12px] font-medium">Production</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">I handle tickets autonomously</p>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left: Progress sidebar (minimal) */}
      <div className="w-[240px] border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-heading font-bold text-foreground">Seel AI</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">Setting up your AI agent</p>
        </div>

        <div className="flex-1 px-3 py-2">
          {[
            { label: "Connect Tools", phases: ["welcome", "connect_zendesk", "connect_shopify"] },
            { label: "Import Knowledge", phases: ["import", "importing", "import_done"] },
            { label: "Review Rules", phases: ["confirm_rules", "conflict"] },
            { label: "Set Permissions", phases: ["permissions"] },
            { label: "Review Capability", phases: ["capability"] },
            { label: "Escalation Rules", phases: ["escalation"] },
            { label: "Agent Identity", phases: ["identity"] },
            { label: "Go Live", phases: ["go_live", "done"] },
          ].map((step, idx) => {
            const isActive = step.phases.includes(phase);
            const allPhaseOrder = ["welcome", "connect_zendesk", "connect_shopify", "import", "importing", "import_done", "confirm_rules", "conflict", "permissions", "capability", "escalation", "identity", "go_live", "done"];
            const currentPhaseIdx = allPhaseOrder.indexOf(phase);
            const stepFirstPhaseIdx = allPhaseOrder.indexOf(step.phases[0]);
            const isCompleted = currentPhaseIdx > allPhaseOrder.indexOf(step.phases[step.phases.length - 1]);

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  !isActive && isCompleted && "text-sidebar-foreground/60",
                  !isActive && !isCompleted && "text-sidebar-foreground/25"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium border",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                    isActive && !isCompleted && "border-sidebar-primary bg-sidebar-primary/20 text-sidebar-primary",
                    !isActive && !isCompleted && "border-sidebar-border text-sidebar-foreground/40"
                  )}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </div>
                <span className="text-[11px] font-medium">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-border flex items-center px-6">
          <Bot className="w-4 h-4 text-primary mr-2" />
          <span className="text-[13px] font-medium text-foreground">Setup Assistant</span>
          <Badge variant="secondary" className="ml-2 h-[16px] text-[9px]">Onboarding</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" ref={scrollRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[600px]",
                msg.role === "manager" && "ml-auto flex-row-reverse max-w-[400px]",
                msg.role === "system" && "justify-center"
              )}
            >
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  msg.role === "ai" && "flex-1",
                  msg.role === "manager" && "bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5",
                  msg.role === "system" && "text-center"
                )}
              >
                {msg.role === "manager" ? (
                  <p className="text-[13px]">{msg.text}</p>
                ) : (
                  renderMessageContent(msg)
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingIndicator && (
            <div className="flex gap-3 max-w-[600px]">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-1 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
