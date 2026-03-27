/* ── Onboarding Guide Bubble ──────────────────────────────────
   Floating bubble (bottom-right) that expands into a compact
   chat panel. Guides the user through Playbook setup steps.
   Inspired by Intercom-style help widget.
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bot, X, ChevronRight, Check, Sparkles } from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  message: string;
  sectionId: string; // matches section id on Playbook page
  choices?: { label: string; action: "scroll" | "complete" }[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    message: "Hey! I'll walk you through setting up your AI agent. Each step takes about 30 seconds — and you can always come back later.",
    sectionId: "",
    choices: [
      { label: "Let's go", action: "complete" },
    ],
  },
  {
    id: "integrations",
    title: "Connect your tools",
    message: "First, connect Zendesk and Shopify so Alex can read tickets and look up orders. Click \"Manage\" on each integration above.",
    sectionId: "section-integrations",
    choices: [
      { label: "Done — next step", action: "complete" },
    ],
  },
  {
    id: "mode",
    title: "Choose agent mode",
    message: "I recommend starting with **Shadow Mode** — Alex will draft replies as internal notes, but won't send anything until you approve.",
    sectionId: "section-general",
    choices: [
      { label: "Got it, next", action: "complete" },
    ],
  },
  {
    id: "knowledge",
    title: "Upload your first document",
    message: "Upload your return policy, SOP, or playbook. Alex will read it and extract rules automatically. You can review and edit them anytime.",
    sectionId: "section-knowledge",
    choices: [
      { label: "I'll upload later", action: "complete" },
      { label: "Take me there", action: "scroll" },
    ],
  },
  {
    id: "actions",
    title: "Set action permissions",
    message: "Decide what Alex can do on its own (like tracking shipments) vs. what needs your approval (like issuing refunds). You can adjust these anytime.",
    sectionId: "section-actions",
    choices: [
      { label: "Looks good, next", action: "complete" },
      { label: "Take me there", action: "scroll" },
    ],
  },
  {
    id: "done",
    title: "You're all set!",
    message: "That's the basics. Alex is ready to start working on your tickets. Check **Messages** for updates, questions, and performance reports.",
    sectionId: "",
    choices: [
      { label: "Go to Messages", action: "complete" },
    ],
  },
];

export default function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;
  const progress = Math.round((completedSteps.size / GUIDE_STEPS.length) * 100);

  const scrollToSection = (sectionId: string) => {
    if (!sectionId) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Brief highlight
      el.classList.add("ring-2", "ring-primary/20");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/20"), 2000);
    }
  };

  const handleChoice = (action: "scroll" | "complete") => {
    if (action === "scroll" && step) {
      scrollToSection(step.sectionId);
      return;
    }

    // Mark current step complete and advance
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (isLastStep) {
      setOpen(false);
      // Navigate to inbox
      window.location.href = "/messages";
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      // Scroll to next section
      const nextStep = GUIDE_STEPS[nextIdx];
      if (nextStep?.sectionId) {
        setTimeout(() => scrollToSection(nextStep.sectionId), 300);
      }
    }
  };

  // Auto-open on first visit (simulate)
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Expanded panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-6 w-[340px] bg-white rounded-xl border border-border/60 shadow-lg z-50 overflow-hidden"
          style={{ maxHeight: "420px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[13px] font-semibold text-foreground">Setup Guide</span>
              <span className="text-[11px] text-muted-foreground">
                {completedSteps.size}/{GUIDE_STEPS.length}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="px-4 pt-3 pb-2 flex gap-1.5">
            {GUIDE_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  idx === currentStep && "bg-primary",
                  idx !== currentStep && completedSteps.has(idx) && "bg-primary/30",
                  idx !== currentStep && !completedSteps.has(idx) && "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Message content */}
          {step && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium text-primary/70 uppercase tracking-wide mb-1">
                Step {currentStep + 1} — {step.title}
              </p>
              <p
                className="text-[13px] text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: step.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>
          )}

          {/* Choice buttons */}
          {step?.choices && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {step.choices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => handleChoice(c.action)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium transition-all",
                    c.action === "complete"
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "border border-border text-foreground hover:bg-accent"
                  )}
                >
                  {c.label}
                  {c.action === "complete" && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all z-50",
          open
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {/* Notification dot when closed and not all done */}
        {!open && completedSteps.size < GUIDE_STEPS.length && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </button>
    </>
  );
}
