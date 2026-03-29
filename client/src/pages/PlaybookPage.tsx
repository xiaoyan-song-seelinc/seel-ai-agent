/* ── PlaybookPage ─────────────────────────────────────────
   Full-page Knowledge view: Documents tab + Rules tab.
   Rules shown as SOP-level cards with policy/exceptions/escalation.
   ──────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  RULES,
  KNOWLEDGE_DOCUMENTS,
} from "@/lib/mock-data";
import type { SOPRule } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Trash2,
  User,
  Bot,
  X,
  AlertTriangle,
  ExternalLink,
  FileText,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ListChecks,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/* ── Conflict data ── */
const CONFLICTS = [
  {
    id: "cf-1",
    title: "Return window duration",
    ruleA: "30 days from purchase date",
    sourceA: "SOP Document (Section 2.1)",
    ruleB: "28 days from delivery date",
    sourceB: "Observed in 47 past tickets",
  },
];

/* ── Collect all unique tags from rules ── */
function getAllTags() {
  const tagSet = new Set<string>();
  RULES.forEach((r) => r.tags?.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

/* ── Rule Card Component ── */
function RuleCard({
  rule,
  idx,
  onTagClick,
  selectedTags,
}: {
  rule: SOPRule;
  idx: number;
  onTagClick: (tag: string) => void;
  selectedTags: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span className="text-[11px] text-muted-foreground font-mono mt-0.5 shrink-0 w-5 text-right">
          {idx + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-foreground">
              {rule.name}
            </span>
            <Badge
              variant="secondary"
              className="h-[16px] px-1.5 text-[9px] shrink-0"
            >
              {rule.intent}
            </Badge>
            {rule.tags?.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className={cn(
                  "px-1.5 py-0 rounded text-[9px] font-medium transition-colors",
                  selectedTags.has(tag)
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Policy (always visible) */}
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-1.5">
            {rule.policy}
          </p>

          {/* Expand/collapse for exceptions + escalation */}
          {(rule.exceptions.length > 0 || rule.escalation) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Collapse" : `Exceptions (${rule.exceptions.length}) & Escalation`}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2.5 pl-0.5">
              {/* Exceptions */}
              {rule.exceptions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ListChecks className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Exceptions</span>
                  </div>
                  <ul className="space-y-0.5">
                    {rule.exceptions.map((ex, i) => (
                      <li key={i} className="text-[11.5px] text-muted-foreground leading-relaxed pl-4 relative before:content-['–'] before:absolute before:left-1 before:text-muted-foreground/40">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Escalation */}
              {rule.escalation && (
                <div className="p-2.5 rounded-md bg-red-50/50 border border-red-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] font-semibold text-red-500/80 uppercase tracking-wider">Escalation</span>
                  </div>
                  <p className="text-[11.5px] text-foreground/80 leading-relaxed">
                    <span className="font-medium">When:</span> {rule.escalation.trigger}
                  </p>
                  <p className="text-[11.5px] text-foreground/80 leading-relaxed mt-0.5">
                    <span className="font-medium">Then:</span> {rule.escalation.action}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground/60">
              Updated{" "}
              {new Date(rule.lastUpdated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {rule.sourceDocId && (
              <button
                onClick={() => toast.info("Showing source document")}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                View Source Document
              </button>
            )}
            {rule.updatedByTopicId && (
              <a
                href={`/messages?topic=${rule.updatedByTopicId}`}
                className="text-[10px] text-primary hover:underline"
              >
                View conversation
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaybookPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"documents" | "rules">("rules");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [conflictsDismissed, setConflictsDismissed] = useState(false);

  const allTags = useMemo(() => getAllTags(), []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filteredRules = useMemo(() => {
    return RULES.filter((rule) => {
      // Tag filter
      if (selectedTags.size > 0) {
        const hasTags = rule.tags?.some((t) => selectedTags.has(t));
        if (!hasTags) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rule.name.toLowerCase().includes(q) ||
          rule.policy.toLowerCase().includes(q) ||
          rule.intent.toLowerCase().includes(q) ||
          rule.exceptions.some((ex) => ex.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedTags, searchQuery]);

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60">
        <div className="max-w-[920px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
              Playbook
            </h1>
            {/* Tab toggle in header */}
            <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
              <button
                onClick={() => setActiveTab("rules")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors",
                  activeTab === "rules"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Rules ({RULES.length})
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors",
                  activeTab === "documents"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Documents ({KNOWLEDGE_DOCUMENTS.length})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1.5 h-8 text-[12px]"
              onClick={() => navigate("/agent")}
            >
              <User className="w-3.5 h-3.5" />
              Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Dismissible guide banner */}
      {showGuide && (
        <div className="max-w-[920px] mx-auto px-6 pt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground leading-relaxed flex-1">
              This is your knowledge base. Rules are learned from documents and conversations in{" "}
              <a href="/messages" className="text-primary font-medium hover:underline">
                Messages
              </a>
              . For agent identity, mode, and actions, go to{" "}
              <a href="/agent" className="text-primary font-medium hover:underline">
                Agent
              </a>
              .
            </p>
            <button
              onClick={() => setShowGuide(false)}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[920px] mx-auto px-6 py-4">

        {/* ═══ Rules Tab ═══ */}
        {activeTab === "rules" && (
          <div>
            {/* Conflicts alert */}
            {!conflictsDismissed && CONFLICTS.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-amber-800">
                      {CONFLICTS.length} unresolved conflict{CONFLICTS.length !== 1 ? "s" : ""}
                    </p>
                    {CONFLICTS.map((c) => (
                      <div key={c.id} className="mt-2 p-2.5 bg-white rounded border border-amber-200/40">
                        <p className="text-[12px] font-medium text-foreground mb-1.5">{c.title}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">{c.sourceA}</p>
                            <p className="text-[12px] text-foreground">{c.ruleA}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">{c.sourceB}</p>
                            <p className="text-[12px] text-foreground">{c.ruleB}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2.5 rounded-full"
                            onClick={() => toast.success("Applied: " + c.ruleA)}
                          >
                            Use A
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2.5 rounded-full"
                            onClick={() => toast.success("Applied: " + c.ruleB)}
                          >
                            Use B
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setConflictsDismissed(true)}
                    className="text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Search + Tag filter bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-[12px] pl-8"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border",
                      selectedTags.has(tag)
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                    )}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.size > 0 && (
                  <button
                    onClick={() => setSelectedTags(new Set())}
                    className="text-[11px] text-muted-foreground hover:text-foreground ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Rules list — SOP cards */}
            <div className="bg-white rounded-lg border border-border/60">
              {filteredRules.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[13px] text-muted-foreground">No rules match your filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredRules.map((rule, idx) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      idx={idx}
                      onTagClick={(tag) => setSelectedTags(new Set([tag]))}
                      selectedTags={selectedTags}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom help text */}
            <div className="mt-3 text-center">
              <p className="text-[11px] text-muted-foreground">
                Rules are updated through conversations in{" "}
                <a href="/messages" className="text-primary hover:underline">
                  Messages
                </a>{" "}
                or by uploading documents.
              </p>
            </div>
          </div>
        )}

        {/* ═══ Documents Tab ═══ */}
        {activeTab === "documents" && (
          <div>
            <div className="bg-white rounded-lg border border-border/60">
              <div className="divide-y divide-border/30">
                {KNOWLEDGE_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0",
                          doc.type === "pdf" && "bg-red-50 text-red-500",
                          doc.type === "doc" && "bg-blue-50 text-blue-500",
                          doc.type === "csv" && "bg-emerald-50 text-emerald-500",
                          doc.type === "url" && "bg-purple-50 text-purple-500"
                        )}
                      >
                        {doc.type}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                          <span className="text-[11px] text-muted-foreground">
                            Uploaded{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <Badge variant="secondary" className="h-[16px] px-1.5 text-[10px]">
                            {doc.extractedRules} rules extracted
                          </Badge>
                          {doc.status === "processed" && (
                            <span className="text-[10px] text-emerald-600">Processed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => toast.info("View document")}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload area */}
            <button
              onClick={() => toast.info("File upload dialog would open here")}
              className="w-full border-2 border-dashed border-border/60 rounded-lg p-6 text-center hover:border-primary/40 transition-colors mt-4"
            >
              <Upload className="w-5 h-5 mx-auto text-muted-foreground/50 mb-1.5" />
              <p className="text-[13px] font-medium text-foreground">Upload Document</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PDF, DOC, CSV — rules will be extracted automatically
              </p>
            </button>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
