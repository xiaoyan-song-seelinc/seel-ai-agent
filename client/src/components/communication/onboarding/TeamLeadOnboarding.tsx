import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, FileText, Loader2, Settings } from "lucide-react";
import { HireRepDialog } from "./HireRepDialog";
import { ScenarioCard } from "./ScenarioCard";
import { ModeSelectionCards } from "./ModeSelectionCards";
import { RULES } from "@/lib/mock-data";
import type { OnboardingPhase } from "../hooks/useCommunicationState";
import type { AgentIdentity, ActionPermission, AgentMode } from "@/lib/mock-data";

interface TeamLeadOnboardingProps {
  phase: OnboardingPhase;
  onPhaseAdvance: (nextPhase: OnboardingPhase | "done") => void;
  onRepHired: () => void;
  repIdentity: AgentIdentity;
  permissions: ActionPermission[];
  onUpdatePermissions: (permissions: ActionPermission[]) => void;
  onUpdateIdentity: (patch: Partial<AgentIdentity>) => void;
  onModeSelected: (mode: AgentMode) => void;
}

const PHASE_ORDER: (OnboardingPhase | "done")[] = [
  "welcome",
  "connect_tools",
  "upload_docs",
  "parse_results",
  "hire_rep",
  "sanity_check",
  "choose_mode",
  "complete",
  "done",
];

const PHASE_LABELS: Record<OnboardingPhase, string> = {
  welcome: "Welcome",
  connect_tools: "Connect Tools",
  upload_docs: "Upload Docs",
  parse_results: "Review Rules",
  hire_rep: "Hire Rep",
  sanity_check: "Sanity Check",
  choose_mode: "Choose Mode",
  complete: "Setup Complete",
};

const TEST_SCENARIOS = [
  {
    id: 1,
    title: "WISMO Inquiry",
    customerMessage:
      "Hi, I ordered 5 days ago and haven't received any shipping updates. Can you check my order?",
    steps: [
      "Look up order #12345 in Shopify",
      "Check shipment tracking via carrier API",
      "Reply with status + estimated delivery",
    ],
    draftReply:
      "Hi Sarah! Your order is currently in transit with UPS (tracking: 1Z9999W99999999999). Expected delivery: Mar 28-30. Let me know if you have any questions!",
    matchedRule: "WISMO — Standard Shipping Inquiry",
  },
  {
    id: 2,
    title: "Refund Request",
    customerMessage:
      "I'd like to return my coastal throw pillow. It arrived damaged and I want a full refund.",
    steps: [
      "Identify damage claim (item < $80 — no photo needed)",
      "Verify original payment method",
      "Process refund and generate return label",
    ],
    draftReply:
      "Hi! I'm sorry to hear about the damaged pillow. I've processed a full refund to your original payment method. A prepaid return label has been emailed to you. Refund typically appears within 3-5 business days.",
    matchedRule: "Damaged / Wrong Item — Low Value (<$80)",
  },
  {
    id: 3,
    title: "Escalation Trigger",
    customerMessage:
      "This is unacceptable. My $450 bookshelf was delivered broken and I want to speak to a manager NOW.",
    steps: [
      "Acknowledge frustration with empathy",
      "Item > $200 + customer angry — escalation rule triggers",
      "Transfer to human agent with full context",
    ],
    draftReply:
      "Hi Robert, I completely understand your frustration and I sincerely apologize. I'm escalating this to our senior support team right now — someone will contact you within 1 hour. [Escalated to human agent]",
    matchedRule: "Damaged Item > $200 — Escalate for fraud review",
  },
];

// TL message bubble
function TLBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-white">TL</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[9px] text-muted-foreground/50">just now</span>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5">
          <div className="text-[12px] leading-relaxed text-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function TeamLeadOnboarding({
  phase,
  onPhaseAdvance,
  onRepHired,
  repIdentity,
  permissions,
  onUpdatePermissions,
  onUpdateIdentity,
  onModeSelected,
}: TeamLeadOnboardingProps) {
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [zendeskConnected, setZendeskConnected] = useState(false);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const totalSteps = PHASE_ORDER.length - 1; // exclude "done"

  const stepNumber = phaseIndex + 1;

  function advance() {
    const next = PHASE_ORDER[phaseIndex + 1];
    if (next) {
      onPhaseAdvance(next);
    }
  }

  function handleSampleDoc() {
    setUploadProcessing(true);
    setTimeout(() => {
      setUploadProcessing(false);
      setUploadDone(true);
    }, 1500);
  }

  function handleScenarioApprove() {
    if (scenarioIndex < TEST_SCENARIOS.length - 1) {
      setScenarioIndex((i) => i + 1);
    } else {
      advance();
    }
  }

  function handleScenarioAdjust(_feedback: string) {
    // In real app, send feedback to TL; for prototype, just move forward
    if (scenarioIndex < TEST_SCENARIOS.length - 1) {
      setScenarioIndex((i) => i + 1);
    } else {
      advance();
    }
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Progress bar */}
        <div className="px-4 py-2 border-b border-border shrink-0 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Step {stepNumber} of {totalSteps}
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              {PHASE_LABELS[phase]}
            </span>
          </div>
          <div className="flex gap-0.5">
            {PHASE_ORDER.slice(0, totalSteps).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i < phaseIndex
                    ? "bg-indigo-500 w-4"
                    : i === phaseIndex
                      ? "bg-indigo-400 w-4"
                      : "bg-muted w-3",
                )}
              />
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
            {/* ── welcome ─────────────────────────────────── */}
            {phase === "welcome" && (
              <>
                <TLBubble>
                  <p className="mb-2">
                    Welcome! I'm your AI Team Lead. I'll help you set up your AI support rep
                    in just a few steps.
                  </p>
                  <p>
                    We'll connect your tools, upload your SOPs, configure your rep, and run a
                    quick sanity check before going live.
                  </p>
                </TLBubble>
                <div className="flex gap-2 pl-10">
                  <Button
                    size="sm"
                    className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    onClick={advance}
                  >
                    Let's go
                  </Button>
                </div>
              </>
            )}

            {/* ── connect_tools ───────────────────────────── */}
            {phase === "connect_tools" && (
              <>
                <TLBubble>
                  <p>
                    First, let's connect your tools. Your rep needs access to Shopify and
                    Zendesk to handle tickets.
                  </p>
                </TLBubble>

                <div className="ml-10 space-y-2">
                  {/* Shopify */}
                  <div className="rounded-xl border border-border bg-white px-3.5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[14px]">
                        🛍
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">Shopify</p>
                        <p className="text-[10px] text-muted-foreground">
                          coastalliving.myshopify.com
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Connected
                    </Badge>
                  </div>

                  {/* Zendesk */}
                  <div className="rounded-xl border border-border bg-white px-3.5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-[14px]">
                        🎫
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">Zendesk</p>
                        <p className="text-[10px] text-muted-foreground">
                          {zendeskConnected ? "coastalliving.zendesk.com" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {zendeskConnected ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => setZendeskConnected(true)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    onClick={advance}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* ── upload_docs ──────────────────────────────── */}
            {phase === "upload_docs" && (
              <>
                <TLBubble>
                  <p>
                    Now upload your SOPs, return policies, or any customer service docs. I'll
                    extract rules automatically.
                  </p>
                </TLBubble>

                <div className="ml-10 space-y-3">
                  {!uploadProcessing && !uploadDone && (
                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
                        <Upload className="w-5 h-5 text-indigo-500" />
                      </div>
                      <p className="text-[12px] font-medium text-foreground">
                        Drag & drop files here
                      </p>
                      <p className="text-[10px] text-muted-foreground">PDF, DOC, CSV supported</p>
                      <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" className="h-7 text-[11px]">
                          Browse files
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={handleSampleDoc}
                        >
                          Try sample document
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadProcessing && (
                    <div className="rounded-xl border border-border bg-white px-4 py-5 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
                      <div>
                        <p className="text-[12px] font-medium text-foreground">
                          Processing document...
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Extracting rules and policies
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadDone && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-[12px] font-medium text-foreground">
                          Customer Service SOP v3.2.pdf processed
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          12 rules extracted
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {uploadDone && (
                      <Button
                        size="sm"
                        className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={advance}
                      >
                        Continue
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px]"
                      onClick={advance}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── parse_results ────────────────────────────── */}
            {phase === "parse_results" && (
              <>
                <TLBubble>
                  <p>
                    Here are the rules I extracted from your documents. Review them before
                    we configure your rep.
                  </p>
                </TLBubble>

                <div className="ml-10 space-y-2">
                  {RULES.slice(0, 4).map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-border bg-white px-3 py-2.5 flex items-start gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-foreground">{rule.name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {rule.content.slice(0, 100)}...
                        </p>
                      </div>
                    </div>
                  ))}

                  <Button
                    size="sm"
                    className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    onClick={advance}
                  >
                    Continue to configure Rep
                  </Button>
                </div>
              </>
            )}

            {/* ── hire_rep ─────────────────────────────────── */}
            {phase === "hire_rep" && (
              <>
                <TLBubble>
                  <p>
                    Time to set up your AI Rep! Configure their identity and what actions
                    they're allowed to take autonomously.
                  </p>
                </TLBubble>

                <div className="ml-10">
                  <button
                    type="button"
                    onClick={() => setHireDialogOpen(true)}
                    className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 px-4 py-5 flex flex-col items-center gap-2 hover:bg-indigo-50/60 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-[12px] font-semibold text-indigo-700">Hire Rep</p>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Set name, personality, language, and permissions
                    </p>
                  </button>
                </div>
              </>
            )}

            {/* ── sanity_check ─────────────────────────────── */}
            {phase === "sanity_check" && (
              <>
                <TLBubble>
                  <p>
                    Let's run a quick sanity check. Review how {repIdentity.name} would handle
                    these 3 test scenarios and give feedback if needed.
                  </p>
                </TLBubble>

                <div className="ml-10">
                  {TEST_SCENARIOS[scenarioIndex] && (
                    <ScenarioCard
                      scenario={TEST_SCENARIOS[scenarioIndex]}
                      scenarioIndex={scenarioIndex}
                      totalScenarios={TEST_SCENARIOS.length}
                      onApprove={handleScenarioApprove}
                      onAdjust={handleScenarioAdjust}
                    />
                  )}
                </div>
              </>
            )}

            {/* ── choose_mode ──────────────────────────────── */}
            {phase === "choose_mode" && (
              <>
                <TLBubble>
                  <p>
                    Almost there! Choose how you'd like {repIdentity.name} to operate when
                    handling customer tickets.
                  </p>
                </TLBubble>

                <div className="ml-10">
                  <ModeSelectionCards
                    onSelectMode={(mode) => {
                      onModeSelected(mode);
                      advance();
                    }}
                  />
                </div>
              </>
            )}

            {/* ── complete ─────────────────────────────────── */}
            {phase === "complete" && (
              <>
                <TLBubble>
                  <p className="mb-2">
                    🎉 Setup complete! {repIdentity.name} is ready to go.
                  </p>
                  <p className="mb-2">Here's a summary of what was configured:</p>
                  <ul className="space-y-1 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Shopify connected
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {RULES.length} SOP rules loaded
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {repIdentity.name} configured ({repIdentity.tone} personality)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Sanity check passed
                    </li>
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    You'll find me here in the Team Lead conversation anytime you need to chat.
                  </p>
                </TLBubble>

                <div className="flex gap-2 pl-10">
                  <Button
                    size="sm"
                    className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => onPhaseAdvance("done")}
                  >
                    Go to dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Hire Rep Dialog */}
      <HireRepDialog
        open={hireDialogOpen}
        onClose={() => setHireDialogOpen(false)}
        onHire={(identity, updatedPermissions) => {
          onUpdateIdentity(identity);
          onUpdatePermissions(updatedPermissions);
          setHireDialogOpen(false);
          onRepHired();
          advance();
        }}
        permissions={permissions}
        existingIdentity={repIdentity}
      />
    </>
  );
}
