import { cn } from "@/lib/utils";
import { Bot, UserCircle2, Lock } from "lucide-react";
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
}

export function NarrowSidebar({
  activeView,
  onViewChange,
  repHired,
}: NarrowSidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-12 border-r border-border bg-white flex flex-col items-center py-3 gap-1 shrink-0">
        {/* Team Lead button */}
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
              <Bot className="w-4.5 h-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[11px]">
            <p className="font-semibold">Team Lead</p>
            <p className="text-muted-foreground">Alex — manages your playbook</p>
          </TooltipContent>
        </Tooltip>

        {/* Rep button */}
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
              aria-label="Rep"
              disabled={!repHired}
            >
              {repHired ? (
                <UserCircle2 className="w-4.5 h-4.5" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[11px]">
            {repHired ? (
              <>
                <p className="font-semibold">AI Rep</p>
                <p className="text-muted-foreground">Escalations from your rep</p>
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
    </TooltipProvider>
  );
}
