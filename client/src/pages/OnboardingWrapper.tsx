/* ── Onboarding Wrapper ──────────────────────────────────────
   Toggle between two onboarding experiences:
   - Wizard (step-by-step panels)
   - Chat (conversational AI-guided)
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import Onboarding from "./Onboarding";
import OnboardingChat from "./OnboardingChat";

type Mode = "wizard" | "chat";

export default function OnboardingWrapper() {
  const [mode, setMode] = useState<Mode>("wizard");

  return (
    <div className="relative h-screen">
      {/* Floating toggle */}
      <div className="absolute top-3 right-4 z-50 flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-md">
        <button
          onClick={() => setMode("wizard")}
          className={cn(
            "text-[11px] font-medium px-2.5 py-1 rounded-full transition-all",
            mode === "wizard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Wizard
        </button>
        <div className="w-px h-3.5 bg-border" />
        <button
          onClick={() => setMode("chat")}
          className={cn(
            "text-[11px] font-medium px-2.5 py-1 rounded-full transition-all",
            mode === "chat"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Chat
        </button>
      </div>

      {/* Render active mode */}
      {mode === "wizard" ? <Onboarding /> : <OnboardingChat />}
    </div>
  );
}
