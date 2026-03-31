import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, Zap, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgentMode } from "@/lib/mock-data";

interface ModeSelectionCardsProps {
  onSelectMode: (mode: "training" | "production") => void;
}

export function ModeSelectionCards({ onSelectMode }: ModeSelectionCardsProps) {
  const [selected, setSelected] = useState<"training" | "production" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleCardClick(mode: "training" | "production") {
    if (mode === "production") {
      setConfirmOpen(true);
    } else {
      setSelected("training");
      onSelectMode("training");
    }
  }

  function handleProductionConfirm() {
    setConfirmOpen(false);
    setSelected("production");
    onSelectMode("production");
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Training Mode */}
        <button
          type="button"
          onClick={() => handleCardClick("training")}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-all relative",
            selected === "training"
              ? "border-indigo-500 bg-indigo-50"
              : "border-border bg-white hover:border-indigo-300 hover:bg-indigo-50/30",
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <Badge className="text-[8px] bg-emerald-100 text-emerald-700 border-emerald-200">
              Recommended
            </Badge>
          </div>

          <p className="text-[13px] font-semibold text-foreground mb-1.5">Training Mode</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            Rep writes Internal Notes in Zendesk. You review before replies go to customers.
          </p>

          <div className="flex items-center gap-1.5 mt-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-[10px] text-emerald-700 font-medium">
              Low risk — catch mistakes before they reach customers
            </p>
          </div>
        </button>

        {/* Production Mode */}
        <button
          type="button"
          onClick={() => handleCardClick("production")}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-all relative",
            selected === "production"
              ? "border-indigo-500 bg-indigo-50"
              : "border-border bg-white hover:border-indigo-300 hover:bg-indigo-50/30",
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <p className="text-[13px] font-semibold text-foreground mb-1.5">Production Mode</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            Rep replies directly to customers. Escalates when uncertain.
          </p>

          <div className="flex items-center gap-1.5 mt-auto">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 font-medium">
              Rep will immediately start replying to live customers
            </p>
          </div>
        </button>
      </div>

      {/* Confirmation dialog for Production Mode */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Enable Production Mode?
            </DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Your rep will immediately start replying directly to live customers. Make sure
              you've reviewed all the scenarios and you're comfortable with the configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px] bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleProductionConfirm}
            >
              Enable Production Mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
