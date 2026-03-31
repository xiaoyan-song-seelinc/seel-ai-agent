import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Topic, SOPRule } from "@/lib/mock-data";

interface RuleReviewSidebarProps {
  topic: Topic | null;
  rules: SOPRule[];
}

function RuleTextBlock({
  text,
  highlight,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3.5 py-3 text-[12px] leading-relaxed whitespace-pre-wrap text-foreground",
        highlight
          ? "border-l-2 border-indigo-400 bg-indigo-50/50 pl-3"
          : "bg-muted/30",
      )}
    >
      {text}
    </div>
  );
}

export function RuleReviewSidebar({ topic, rules }: RuleReviewSidebarProps) {
  if (!topic || !topic.proposedRule) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[12px] text-muted-foreground">No rule selected.</p>
      </div>
    );
  }

  const proposed = topic.proposedRule;
  const isNew = proposed.type === "new";

  // Try to find matching existing rule
  const existingRule = rules.find(
    (r) => r.name.toLowerCase() === proposed.ruleName.toLowerCase(),
  ) ?? null;

  const currentText =
    proposed.before ??
    (existingRule ? existingRule.content : null) ??
    null;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Rule name */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          Rule
        </p>
        <p className="text-[13px] font-semibold text-foreground">{proposed.ruleName}</p>
      </div>

      {/* Tabs */}
      {isNew ? (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Proposed Rule
          </p>
          <RuleTextBlock text={proposed.after} highlight />
        </div>
      ) : (
        <Tabs defaultValue="proposed" className="w-full">
          <TabsList className="h-7 text-[11px] mb-3">
            <TabsTrigger value="current" className="text-[11px] h-6 px-3">
              Current Rule
            </TabsTrigger>
            <TabsTrigger value="proposed" className="text-[11px] h-6 px-3">
              Proposed Rule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-0">
            {currentText ? (
              <RuleTextBlock text={currentText} />
            ) : (
              <p className="text-[12px] text-muted-foreground italic px-1">
                No current rule text available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="proposed" className="mt-0">
            <RuleTextBlock text={proposed.after} highlight />
            {currentText && (
              <p className="mt-2 text-[10px] text-muted-foreground italic">
                Changes highlighted with indigo border.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Evidence */}
      {proposed.evidence && proposed.evidence.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Evidence
          </p>
          <div className="space-y-1">
            {proposed.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[10px] text-indigo-400 mt-0.5 shrink-0">•</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{ev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      {proposed.source && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Source
          </p>
          <p className="text-[11px] text-muted-foreground">{proposed.source}</p>
        </div>
      )}

      {/* Category */}
      {proposed.category && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Category
          </p>
          <p className="text-[11px] text-foreground">{proposed.category}</p>
        </div>
      )}
    </div>
  );
}
