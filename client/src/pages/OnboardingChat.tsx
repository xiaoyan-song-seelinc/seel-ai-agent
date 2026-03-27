/* ── Onboarding Chat — Quick Start ──────────────────────────────
   AOS-inspired conversational onboarding with choice bubbles.
   Quick Start: Connect → Upload Seel Return Policy demo → AI Parse → Resolve Conflict → Go Live Shadow
   Then guide to Settings/Documents for deeper config.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bot,
  CheckCircle2,
  Link2,
  Upload,
  Sparkles,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  Rocket,
  Settings,
  BookOpen,
  Check,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ── Types ──
type MessageRole = "ai" | "manager" | "system";

interface ChoiceOption {
  label: string;
  value: string;
  icon?: "arrow" | "eye" | "rocket" | "settings" | "docs" | "check";
  variant?: "primary" | "outline" | "success" | "warning";
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  choices?: ChoiceOption[];
  widget?: "connect_zendesk" | "connect_shopify" | "upload_doc" | "import_progress" | "parse_result" | "conflict" | "go_live_summary";
  widgetData?: Record<string, unknown>;
  timestamp: Date;
}

type Phase =
  | "welcome"
  | "connect_zendesk"
  | "connect_shopify"
  | "upload_doc"
  | "importing"
  | "parse_result"
  | "conflict"
  | "conflict_resolved"
  | "go_live"
  | "done";

let msgCounter = 0;
function makeMsg(
  role: MessageRole,
  content: string,
  extras?: Partial<Pick<ChatMessage, "choices" | "widget" | "widgetData">>
): ChatMessage {
  msgCounter++;
  return {
    id: `msg-${msgCounter}`,
    role,
    content,
    ...extras,
    timestamp: new Date(),
  };
}

// ── Steps for sidebar ──
const STEPS = [
  { label: "Connect Zendesk", phases: ["welcome", "connect_zendesk"] },
  { label: "Connect Shopify", phases: ["connect_shopify"] },
  { label: "Upload & Parse", phases: ["upload_doc", "importing", "parse_result"] },
  { label: "Resolve Conflicts", phases: ["conflict", "conflict_resolved"] },
  { label: "Go Live", phases: ["go_live", "done"] },
];

const ALL_PHASES: Phase[] = [
  "welcome", "connect_zendesk", "connect_shopify", "upload_doc",
  "importing", "parse_result", "conflict", "conflict_resolved", "go_live", "done",
];

export default function OnboardingChat() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [typing, setTyping] = useState(false);
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInit = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Add AI messages with typing delay
  const addAiMessages = (msgs: ChatMessage[], delay = 500) => {
    setTyping(true);
    const copy = [...msgs];
    let i = 0;
    const next = () => {
      if (i < copy.length) {
        const m = copy[i];
        if (m) setMessages((prev) => [...prev, m]);
        i++;
        if (i < copy.length) setTimeout(next, delay);
        else setTyping(false);
      }
    };
    setTimeout(next, 400);
  };

  // Initialize
  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    addAiMessages([
      makeMsg("ai", "Hey! I'm your setup assistant. Let's get your AI agent running — this takes about 3 minutes."),
      makeMsg("ai", "First, let's connect your Zendesk so I can read and respond to tickets.", {
        choices: [
          { label: "Connect Zendesk", value: "start_zendesk", icon: "arrow", variant: "primary" },
          { label: "Skip for now", value: "skip_zendesk", variant: "outline" },
        ],
      }),
    ]);
  }, []);

  // Handle choices
  const handleChoice = (value: string) => {
    switch (phase) {
      case "welcome":
        if (value === "skip_zendesk") {
          // Skip Zendesk, go straight to Shopify
          setPhase("connect_shopify");
          addAiMessages([
            makeMsg("ai", "No problem — you can connect Zendesk later in **Playbook → Integrations**."),
            makeMsg("ai", "How about Shopify? Connecting it lets me look up orders and process refunds.", {
              choices: [
                { label: "Connect Shopify", value: "start_shopify", icon: "arrow", variant: "primary" },
                { label: "Skip for now", value: "skip_shopify", variant: "outline" },
              ],
            }),
          ]);
        } else {
          setPhase("connect_zendesk");
          addAiMessages([
            makeMsg("ai", "", {
              widget: "connect_zendesk",
            }),
          ]);
        }
        break;

      case "connect_zendesk":
        setPhase("connect_shopify");
        addAiMessages([
          makeMsg("ai", "Zendesk connected! Now let's hook up Shopify so I can look up orders and process refunds.", {
            choices: [
              { label: "Connect Shopify", value: "start_shopify", icon: "arrow", variant: "primary" },
              { label: "Skip for now", value: "skip_shopify", variant: "outline" },
            ],
          }),
        ]);
        break;

      case "connect_shopify":
        setPhase("upload_doc");
        addAiMessages([
          makeMsg("ai", "Now I need to learn your business rules. Upload a document — your SOP, return policy, or playbook — and I'll extract the rules from it."),
          makeMsg("ai", "Let me show you how it works with your **Seel Return Policy** as an example.", {
            widget: "upload_doc",
          }),
        ]);
        break;

      case "upload_doc":
        setPhase("importing");
        setImportProgress(0);
        addAiMessages([
          makeMsg("ai", "Got it! Reading through your return policy now...", {
            widget: "import_progress",
          }),
        ]);
        // Simulate progress
        const interval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setPhase("conflict");
                addAiMessages([
                  makeMsg("ai", "I've gone through everything. Here's what I pulled out:", {
                    widget: "parse_result",
                    widgetData: {
                      rules: [
                        { category: "Return Window", count: 3, example: "30-day return window from delivery date" },
                        { category: "Refund Method", count: 2, example: "Refund to original payment method only" },
                        { category: "Condition Rules", count: 4, example: "Items must be unused with tags attached" },
                        { category: "Exceptions", count: 2, example: "Final sale items are non-returnable" },
                        { category: "Shipping", count: 2, example: "Customer pays return shipping unless defective" },
                      ],
                    },
                  }),
                  makeMsg("ai", "One thing I need you to resolve:", {
                    widget: "conflict",
                  }),
                ], 600);
              }, 500);
              return 100;
            }
            return prev + Math.random() * 15;
          });
        }, 180);
        break;

      case "conflict": {
        const choiceLabel = value === "30_days" ? "30 days from delivery" : "28 calendar days from delivery";
        setMessages((prev) => [...prev, makeMsg("manager", choiceLabel)]);
        setPhase("go_live");
        addAiMessages([
          makeMsg("ai", `Got it — I'll use "${choiceLabel}" as the rule. ✓`),
          makeMsg("ai", "That's the Quick Start done! You can upload more documents and review extracted rules anytime in **Playbook → Knowledge Base**."),
          makeMsg("ai", "Now let's get your agent live. I recommend starting in **Shadow Mode** — I'll draft replies as Internal Notes in Zendesk, but won't send anything until you approve.", {
            choices: [
              { label: "Start in Shadow Mode", value: "shadow", icon: "eye", variant: "primary" },
              { label: "Go live in Production", value: "production", icon: "rocket", variant: "outline" },
            ],
          }),
        ]);
        break;
      }

      case "go_live":
        setPhase("done");
        const modeName = value === "shadow" ? "Shadow Mode" : "Production Mode";
        addAiMessages([
          makeMsg("ai", `${modeName} activated! Your agent is now working on your Zendesk tickets.`),
          makeMsg("ai", "A few things you can set up when you're ready — no rush:", {
            widget: "go_live_summary",
          }),
          makeMsg("ai", "Where would you like to go?", {
            choices: [
              { label: "Go to Messages", value: "messages", icon: "arrow", variant: "primary" },
              { label: "Open Settings", value: "settings", icon: "settings", variant: "outline" },
              { label: "Upload more documents", value: "documents", icon: "docs", variant: "outline" },
            ],
          }),
        ]);
        break;

      case "done":
        if (value === "settings") {
          toast.success("Redirecting to Playbook...");
          setTimeout(() => navigate("/playbook"), 600);
        } else if (value === "documents") {
          toast.success("Redirecting to Documents...");
          setTimeout(() => navigate("/playbook"), 600);
        } else {
          toast.success("Setup complete! Redirecting...");
          setTimeout(() => navigate("/messages"), 600);
        }
        break;
    }
  };

  // ── Render choice bubbles (AOS-style pills) ──
  const renderChoices = (choices: ChoiceOption[]) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {choices.map((c) => {
        const icons: Record<string, typeof ArrowRight> = {
          arrow: ArrowRight, eye: Eye, rocket: Rocket,
          settings: Settings, docs: BookOpen, check: Check,
        };
        const Icon = c.icon ? icons[c.icon] : null;
        const base = "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer";
        const variants: Record<string, string> = {
          primary: "bg-primary text-white hover:bg-primary/90",
          outline: "border border-border text-foreground hover:bg-accent",
          success: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
          warning: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
        };
        return (
          <button
            key={c.value}
            className={cn(base, variants[c.variant || "outline"])}
            onClick={() => handleChoice(c.value)}
          >
            {c.label}
            {Icon && <Icon className="w-3.5 h-3.5" />}
          </button>
        );
      })}
    </div>
  );

  // ── Render widgets ──
  const renderWidget = (msg: ChatMessage) => {
    switch (msg.widget) {
      case "connect_zendesk":
        return (
          <div className="mt-2 p-4 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#03363D]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[#03363D]">Z</span>
              </div>
              <div>
                <p className="text-[13px] font-medium">Zendesk</p>
                <p className="text-[11px] text-muted-foreground">Connect via OAuth</p>
              </div>
            </div>
            <button
              onClick={() => handleChoice("zendesk_connected")}
              className="w-full py-2 rounded-lg bg-[#03363D] text-white text-[13px] font-medium hover:bg-[#03363D]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect Zendesk Account
            </button>
          </div>
        );

      case "connect_shopify":
        return (
          <div className="mt-2 p-4 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#96BF48]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[#96BF48]">S</span>
              </div>
              <div>
                <p className="text-[13px] font-medium">Shopify</p>
                <p className="text-[11px] text-muted-foreground">Connect via OAuth</p>
              </div>
            </div>
            <button
              onClick={() => handleChoice("shopify_connected")}
              className="w-full py-2 rounded-lg bg-[#96BF48] text-white text-[13px] font-medium hover:bg-[#96BF48]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect Shopify Store
            </button>
          </div>
        );

      case "upload_doc":
        return (
          <div className="mt-2 p-4 rounded-lg border border-dashed border-border bg-white hover:border-primary/40 transition-colors">
            <div className="text-center py-4">
              <Upload className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-foreground">Drop your document here</p>
              <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, or TXT — we'll extract the rules</p>
            </div>
            <button
              onClick={() => handleChoice("uploaded")}
              className="w-full mt-2 py-2 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              Upload Seel_Return_Policy_v2.pdf
            </button>
          </div>
        );

      case "import_progress":
        return (
          <div className="mt-2 p-4 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <span className="text-[12px] text-muted-foreground">
                {importProgress < 30 && "Reading document..."}
                {importProgress >= 30 && importProgress < 60 && "Extracting business rules..."}
                {importProgress >= 60 && importProgress < 90 && "Cross-referencing with FAQ..."}
                {importProgress >= 90 && "Finalizing..."}
              </span>
            </div>
            <Progress value={Math.min(importProgress, 100)} className="h-1" />
          </div>
        );

      case "parse_result": {
        const rules = (msg.widgetData?.rules as { category: string; count: number; example: string }[]) || [];
        const totalRules = rules.reduce((sum, r) => sum + r.count, 0);
        return (
          <div className="mt-2 p-4 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-medium">{totalRules} rules extracted</span>
            </div>
            <div className="space-y-1.5">
              {rules.map((r) => (
                <div key={r.category} className="flex items-start gap-2.5 py-1.5 px-2.5 rounded-md bg-muted/40">
                  <span className="text-[12px] font-medium text-foreground w-28 shrink-0">{r.category}</span>
                  <span className="text-[12px] text-muted-foreground flex-1">{r.example}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{r.count} rules</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "conflict":
        return (
          <div className="mt-2 p-4 rounded-lg border border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-amber-900">Conflict: Return Window</p>
                <p className="text-[12px] text-amber-800/80 mt-1 leading-relaxed">
                  Your return policy says "30-day return window" but the FAQ page says "28 calendar days from delivery." Which one should I follow?
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleChoice("30_days")}
                className="px-4 py-2 rounded-full text-[13px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                30 days from delivery
              </button>
              <button
                onClick={() => handleChoice("28_days")}
                className="px-4 py-2 rounded-full text-[13px] font-medium border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                28 calendar days from delivery
              </button>
            </div>
          </div>
        );

      case "go_live_summary":
        return (
          <div className="mt-2 space-y-1.5">
            {[
              { label: "Action permissions", desc: "What your agent can do autonomously vs. ask permission", where: "Settings → Actions" },
              { label: "Escalation rules", desc: "When to hand off to a human", where: "Settings → Escalation" },
              { label: "Agent identity & tone", desc: "Name, greeting style, sign-off", where: "Settings → Identity" },
              { label: "More documents", desc: "Upload additional SOPs, playbooks, or FAQs", where: "Settings → Documents" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5 py-2 px-3 rounded-lg border border-border bg-white">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-[10px] text-primary/70 shrink-0 mt-0.5">{item.where}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Main render ──
  const currentPhaseIdx = ALL_PHASES.indexOf(phase);

  return (
    <div className="flex h-screen bg-white">
      {/* Left sidebar — progress */}
      <div className="w-[220px] border-r border-border bg-background flex flex-col shrink-0">
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-foreground">Seel AI</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 pl-9">Quick Start Setup</p>
        </div>

        <nav className="flex-1 px-3 py-1">
          {STEPS.map((step, idx) => {
            const isActive = step.phases.includes(phase);
            const stepLastPhaseIdx = ALL_PHASES.indexOf(step.phases[step.phases.length - 1] as Phase);
            const isCompleted = currentPhaseIdx > stepLastPhaseIdx;

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 transition-all",
                  isActive && "bg-primary/8 text-primary",
                  !isActive && isCompleted && "text-foreground/50",
                  !isActive && !isCompleted && "text-muted-foreground/40"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium",
                    isCompleted && "bg-emerald-500 text-white",
                    isActive && !isCompleted && "bg-primary/15 text-primary border border-primary/30",
                    !isActive && !isCompleted && "border border-border text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </div>
                <span className="text-[12px] font-medium">{step.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="px-5 pb-5 text-[10px] text-muted-foreground/50">
          ~3 min setup
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-11 border-b border-border flex items-center px-5 shrink-0">
          <Bot className="w-4 h-4 text-primary mr-2" />
          <span className="text-[13px] font-medium text-foreground">Setup Assistant</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" ref={scrollRef}>
          {messages.filter(Boolean).map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "manager" && "justify-end",
              )}
            >
              {/* AI avatar */}
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}

              {/* Content */}
              <div className={cn(
                msg.role === "ai" && "flex-1 max-w-[560px]",
                msg.role === "manager" && "max-w-[360px]",
              )}>
                {msg.role === "manager" ? (
                  <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2">
                    <p className="text-[13px]">{msg.content}</p>
                  </div>
                ) : (
                  <div>
                    {msg.content && (
                      <p className="text-[13px] leading-relaxed text-foreground"
                         dangerouslySetInnerHTML={{
                           __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                         }}
                      />
                    )}
                    {msg.widget && renderWidget(msg)}
                    {msg.choices && renderChoices(msg.choices)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-1 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
