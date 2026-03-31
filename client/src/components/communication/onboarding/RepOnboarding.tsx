import { Button } from "@/components/ui/button";
import { UserCircle2, ArrowRight } from "lucide-react";

interface RepOnboardingProps {
  onContinueSetup: () => void;
}

export function RepOnboarding({ onContinueSetup }: RepOnboardingProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3">
        <UserCircle2 className="w-7 h-7 text-indigo-500" />
      </div>
      <p className="text-[13px] font-semibold text-foreground mb-1">
        Your AI Rep isn't set up yet
      </p>
      <p className="text-[12px] text-muted-foreground max-w-xs leading-relaxed mb-4">
        Complete the onboarding to configure your Rep.
      </p>
      <Button
        size="sm"
        className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        onClick={onContinueSetup}
      >
        Continue Setup
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
