import { cn } from "@/lib/utils";
import { Bot, UserCircle2, Lock, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NarrowSidebarProps {
  activeView: "teamlead" | "rep";
  onViewChange: (v: "teamlead" | "rep") => void;
  repHired: boolean;
  onResetOnboarding?: () => void;
}

export function NarrowSidebar({
  activeView,
  onViewChange,
  repHired,
  onResetOnboarding,
}: NarrowSidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-12 border-r border-border bg-white flex flex-col items-center py-3 shrink-0">
        {/* Main nav buttons */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {/* Team Lead */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange("teamlead")}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  activeView === "teamlead"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
                aria-label="Team Lead"
              >
                <Bot className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">
              <p className="font-semibold">Team Lead</p>
              <p className="text-muted-foreground">Manages rules & proposals</p>
            </TooltipContent>
          </Tooltip>

          {/* Rep */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => repHired && onViewChange("rep")}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  !repHired
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : activeView === "rep"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
                aria-label="AI Rep"
                disabled={!repHired}
              >
                {repHired ? (
                  <UserCircle2 className="w-[18px] h-[18px]" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">
              {repHired ? (
                <>
                  <p className="font-semibold">AI Rep</p>
                  <p className="text-muted-foreground">Escalations & rep profile</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">AI Rep</p>
                  <p className="text-muted-foreground">Hire a rep to unlock</p>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom: dev test button */}
        {onResetOnboarding && (
          <div className="mt-auto pb-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onResetOnboarding}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Reset onboarding"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                <p className="font-semibold">Reset onboarding</p>
                <p className="text-muted-foreground">Test the setup flow again</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
