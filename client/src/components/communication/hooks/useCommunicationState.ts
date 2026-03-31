import { useState } from "react";

export type OnboardingPhase =
  | "welcome"
  | "connect_tools"
  | "upload_docs"
  | "parse_results"
  | "hire_rep"
  | "sanity_check"
  | "choose_mode"
  | "complete";

export interface CommunicationState {
  activeView: "teamlead" | "rep";
  setActiveView: (v: "teamlead" | "rep") => void;
  onboardingPhase: OnboardingPhase | "done";
  setOnboardingPhase: (p: OnboardingPhase | "done") => void;
  onboardingComplete: boolean;
  repHired: boolean;
  setRepHired: (v: boolean) => void;
  resetOnboarding: () => void;
}

export function useCommunicationState(): CommunicationState {
  const [activeView, setActiveView] = useState<"teamlead" | "rep">("teamlead");
  const [onboardingPhase, setOnboardingPhase] = useState<OnboardingPhase | "done">("welcome");
  const [repHired, setRepHired] = useState(false);

  const onboardingComplete = onboardingPhase === "done";

  function resetOnboarding() {
    setOnboardingPhase("welcome");
    setRepHired(false);
    setActiveView("teamlead");
  }

  return {
    activeView,
    setActiveView,
    onboardingPhase,
    setOnboardingPhase,
    onboardingComplete,
    repHired,
    setRepHired,
    resetOnboarding,
  };
}
