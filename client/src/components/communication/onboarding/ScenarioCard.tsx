import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ScenarioCardProps {
  scenario: {
    id: number;
    title: string;
    customerMessage: string;
    steps: string[];
    draftReply: string;
    matchedRule: string;
  };
  scenarioIndex: number;
  totalScenarios: number;
  onApprove: () => void;
  onAdjust: (feedback: string) => void;
}

export function ScenarioCard({
  scenario,
  scenarioIndex,
  totalScenarios,
  onApprove,
  onAdjust,
}: ScenarioCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  function handleAdjust() {
    if (feedback.trim()) {
      onAdjust(feedback.trim());
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Scenario {scenarioIndex + 1} of {totalScenarios}
          </span>
          <span className="text-[11px] font-semibold text-foreground">
            {scenario.title}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Customer message */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Customer message
          </p>
          <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
            <p className="text-[11px] text-foreground leading-relaxed italic">
              "{scenario.customerMessage}"
            </p>
          </div>
        </div>

        {/* Rep's approach */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Rep's approach
          </p>
          <ol className="space-y-0.5">
            {scenario.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/60 shrink-0 mt-0.5 w-3.5">
                  {i + 1}.
                </span>
                <p className="text-[11px] text-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Draft reply */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Draft reply
          </p>
          <div className="rounded-lg border-l-2 border-indigo-400 bg-indigo-50/50 px-3 py-2">
            <p className="text-[11px] text-foreground leading-relaxed">
              "{scenario.draftReply}"
            </p>
          </div>
        </div>

        {/* Matched rule */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Matched rule:
          </span>
          <span className="text-[10px] text-indigo-600 font-medium">{scenario.matchedRule}</span>
        </div>

        {/* Feedback area */}
        {showFeedback && (
          <div className="space-y-2">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What needs to be adjusted? e.g. The draft should mention the tracking number..."
              className="text-[11px] min-h-[60px] resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!feedback.trim()}
                onClick={handleAdjust}
              >
                Submit feedback
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showFeedback && (
          <div className="flex items-center gap-2 pt-0.5">
            <Button
              size="sm"
              className={cn(
                "h-7 text-[11px] gap-1.5",
                "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
              onClick={onApprove}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Looks good
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setShowFeedback(true)}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs adjustment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
