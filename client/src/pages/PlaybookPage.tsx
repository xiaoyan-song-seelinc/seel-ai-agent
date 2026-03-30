/* ── PlaybookPage ─────────────────────────────────────────
   Full-page Knowledge view: Documents tab + Rules tab.
   Rules: one-line preview, detail sheet with Content + Stats tabs.
   Content: long-form policy text (no separate Exception/Escalation sections).
   Stats: invocations, avg CSAT, deflection rate.
   Documents: search + Add in same row, In Use toggle, 3-dot menu.
   No tags anywhere.
   ──────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  RULES,
  KNOWLEDGE_DOCUMENTS,
  ACTION_PERMISSIONS,
} from "@/lib/mock-data";
import type { SOPRule, KnowledgeDocument, RuleVersion } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Bot,
  X,
  FileText,
  BookOpen,
  Search,
  ChevronRight,
  MoreHorizontal,
  Upload,
  Link2,
  PenLine,
  Eye,
  Trash2,
  History,
  Zap,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Plus,
  BarChart3,
  TrendingUp,
  Star,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ── Helper: get action name by ID ── */
function getActionName(actionId: string): string {
  const action = ACTION_PERMISSIONS.find((a) => a.id === actionId);
  return action?.name ?? actionId;
}

/* ── Rule Card (list item — simplified, no tags) ── */
function RuleCard({
  rule,
  idx,
  onSelect,
}: {
  rule: SOPRule;
  idx: number;
  onSelect: () => void;
}) {
  // One-line preview: first ~120 chars of content
  const preview =
    rule.content.length > 120
      ? rule.content.slice(0, 120) + "..."
      : rule.content;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-5 py-3 hover:bg-muted/30 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <span className="text-[11px] text-muted-foreground font-mono mt-0.5 shrink-0 w-5 text-right">
          {idx + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">
              {rule.name}
            </span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">
              {rule.invocationCount} uses
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-1 line-clamp-1">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ── Rule Detail Sheet (Content + Stats tabs, no Version in detail) ── */
function RuleDetailSheet({
  rule,
  open,
  onClose,
}: {
  rule: SOPRule | null;
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "stats">("content");
  const [showVersions, setShowVersions] = useState(false);

  if (!rule) return null;

  const actionNames = (rule.actions ?? []).map(getActionName);

  // Content is now a single field, split by double newlines for paragraphs
  const contentParagraphs = rule.content.split("\n\n").filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground/60">
                Updated{" "}
                {new Date(rule.lastUpdated).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <SheetTitle className="text-[16px]">{rule.name}</SheetTitle>
            <SheetDescription className="sr-only">Rule details</SheetDescription>

            {/* Content / Stats tabs */}
            <div className="flex gap-1 mt-3 p-0.5 bg-muted/50 rounded-lg self-start">
              <button
                onClick={() => setActiveTab("content")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                  activeTab === "content"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-3 h-3" />
                Content
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                  activeTab === "stats"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3 h-3" />
                Stats
              </button>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            {activeTab === "content" ? (
              <div className="px-6 py-5 space-y-5">
                {/* Full content */}
                <div className="space-y-4">
                  {contentParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-[13px] text-foreground leading-[1.8] tracking-[0.01em]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Actions */}
                {actionNames.length > 0 && (
                  <div className="pt-3 border-t border-border/30">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Actions
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {actionNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[11px] text-primary font-medium"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Version History (collapsible) */}
                <div className="pt-3 border-t border-border/30">
                  <button
                    onClick={() => setShowVersions(!showVersions)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <History className="w-3 h-3" />
                    Version History ({rule.versions.length})
                    {showVersions ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {showVersions && (
                    <div className="mt-3 space-y-0 relative">
                      {/* Timeline line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />

                      {rule.versions.map((v, i) => (
                        <VersionItem key={v.version} version={v} isLatest={i === 0} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ═══ Stats Tab ═══ */
              <div className="px-6 py-5 space-y-6">
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Used
                      </span>
                    </div>
                    <p className="text-[22px] font-semibold text-foreground leading-none">
                      {rule.invocationCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      times invoked
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Avg CSAT
                      </span>
                    </div>
                    <p className="text-[22px] font-semibold text-foreground leading-none">
                      {rule.avgCsat.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      out of 5.0
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Deflection
                      </span>
                    </div>
                    <p className="text-[22px] font-semibold text-foreground leading-none">
                      {rule.deflectionRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      resolved without escalation
                    </p>
                  </div>
                </div>

                {/* Performance context */}
                <div className="p-3.5 rounded-lg bg-muted/20 border border-border/20">
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    This rule has been invoked <strong className="text-foreground">{rule.invocationCount} times</strong> across
                    all conversations. Tickets handled using this rule have an average
                    customer satisfaction score of <strong className="text-foreground">{rule.avgCsat.toFixed(1)}/5.0</strong> and
                    a <strong className="text-foreground">{rule.deflectionRate}%</strong> deflection rate (resolved without
                    human escalation).
                  </p>
                </div>

                {/* Actions summary */}
                {actionNames.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Linked Actions
                    </h4>
                    <div className="space-y-1.5">
                      {actionNames.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 border border-border/20"
                        >
                          <Zap className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-[12px] text-foreground">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Version History Item ── */
function VersionItem({
  version,
  isLatest,
}: {
  version: RuleVersion;
  isLatest: boolean;
}) {
  return (
    <div className="relative pl-6 pb-4">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-2 z-10",
          isLatest
            ? "bg-primary border-primary"
            : "bg-background border-border"
        )}
      />

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold",
              isLatest ? "text-primary" : "text-muted-foreground"
            )}
          >
            v{version.version}
            {isLatest && " (current)"}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {new Date(version.changedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <p className="text-[11.5px] text-foreground/80">
          {version.changeDescription}
        </p>

        {version.conversationId && (
          <a
            href={`/communication?topic=${version.conversationId}`}
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5"
          >
            <MessageCircle className="w-2.5 h-2.5" />
            {version.conversationTitle ?? "View conversation"}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Document Row ── */
function DocumentRow({
  doc,
  onToggleInUse,
}: {
  doc: KnowledgeDocument;
  onToggleInUse: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
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
            {doc.size !== "—" && (
              <span className="text-[11px] text-muted-foreground">{doc.size}</span>
            )}
            <span className="text-[11px] text-muted-foreground">
              Uploaded{" "}
              {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {doc.status === "processed" && (
              <span className="text-[10px] text-emerald-600">Processed</span>
            )}
            {doc.status === "processing" && (
              <span className="text-[10px] text-amber-600">Processing...</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* In Use toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {doc.inUse ? "In use" : "Disabled"}
          </span>
          <Switch
            checked={doc.inUse}
            onCheckedChange={() => onToggleInUse(doc.id)}
            className="scale-[0.8]"
          />
        </div>

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() => toast.info("Viewing document")}
              className="text-[12px]"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              View
            </DropdownMenuItem>
            {doc.type === "url" && doc.sourceUrl && (
              <DropdownMenuItem
                onClick={() => window.open(doc.sourceUrl, "_blank")}
                className="text-[12px]"
              >
                <Globe className="w-3.5 h-3.5 mr-2" />
                Open URL
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast.info("Document removed")}
              className="text-[12px] text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ── Upload Document Dialog ── */
function UploadDocumentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeMethod, setActiveMethod] = useState<
    "upload" | "url" | "manual"
  >("upload");
  const [urlValue, setUrlValue] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  const handleSubmit = () => {
    if (activeMethod === "upload") {
      toast.success(
        "Document uploaded. Processing will take 30-60 minutes — Alex will notify you when rules are ready."
      );
    } else if (activeMethod === "url") {
      if (!urlValue.trim()) {
        toast.error("Please enter a URL");
        return;
      }
      toast.success(
        "URL imported. Processing will take 30-60 minutes — Alex will notify you when rules are ready."
      );
    } else {
      if (!manualTitle.trim() || !manualContent.trim()) {
        toast.error("Please fill in both title and content");
        return;
      }
      toast.success(
        "Content saved. Processing will take 30-60 minutes — Alex will notify you when rules are ready."
      );
    }
    onClose();
    setUrlValue("");
    setManualTitle("");
    setManualContent("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Add Document</DialogTitle>
          <DialogDescription className="text-[12px]">
            Upload a file, paste a URL, or write content manually. Rules will be
            extracted automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Method tabs */}
        <Tabs
          value={activeMethod}
          onValueChange={(v) => setActiveMethod(v as typeof activeMethod)}
        >
          <TabsList className="w-full h-8">
            <TabsTrigger value="upload" className="flex-1 text-[11px] gap-1.5">
              <Upload className="w-3 h-3" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-[11px] gap-1.5">
              <Link2 className="w-3 h-3" />
              Add URL
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 text-[11px] gap-1.5">
              <PenLine className="w-3 h-3" />
              Manual Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[13px] font-medium text-foreground">
                Drop file here or click to browse
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF, DOC, DOCX, CSV, TXT — max 10 MB
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-foreground mb-1.5 block">
                Web Page URL
              </label>
              <Input
                placeholder="https://example.com/policy-page"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                className="h-9 text-[12px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                We'll crawl the page and extract relevant content automatically.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-foreground mb-1.5 block">
                Title
              </label>
              <Input
                placeholder="e.g., Holiday Return Policy Extension"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="h-9 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground mb-1.5 block">
                Content
              </label>
              <Textarea
                placeholder="Paste or type your policy content here..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="min-h-[140px] text-[12px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Processing notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/40 mt-1">
          <Bot className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            After importing, rules will be extracted automatically. You'll be notified when ready for review.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-[12px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="h-8 text-[12px]"
          >
            {activeMethod === "upload"
              ? "Upload"
              : activeMethod === "url"
              ? "Import"
              : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════
   ── MAIN PAGE ──
   ══════════════════════════════════════════════════════════ */

export default function PlaybookPage() {
  const [activeTab, setActiveTab] = useState<"documents" | "rules">("rules");
  const [ruleSearch, setRuleSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [selectedRule, setSelectedRule] = useState<SOPRule | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState(KNOWLEDGE_DOCUMENTS);

  const filteredRules = useMemo(() => {
    if (!ruleSearch.trim()) return RULES;
    const q = ruleSearch.toLowerCase();
    return RULES.filter(
      (rule) =>
        rule.name.toLowerCase().includes(q) ||
        rule.content.toLowerCase().includes(q)
    );
  }, [ruleSearch]);

  const filteredDocs = useMemo(() => {
    if (!docSearch.trim()) return documents;
    const q = docSearch.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [docSearch, documents]);

  const toggleDocInUse = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, inUse: !d.inUse } : d))
    );
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      toast.info(doc.inUse ? `"${doc.name}" disabled` : `"${doc.name}" enabled`);
    }
  };

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60">
        <div className="max-w-[920px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
              Playbook
            </h1>
            {/* Tab toggle */}
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
                Documents ({documents.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dismissible guide banner */}
      {showGuide && (
        <div className="max-w-[920px] mx-auto px-6 pt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground leading-relaxed flex-1">
              Your playbook contains the rules and knowledge your AI rep uses to handle tickets. Rules are learned from documents and conversations.
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
            {/* Search bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="h-8 text-[12px] pl-8"
                />
              </div>
            </div>

            {/* Rules list */}
            <div className="bg-white rounded-lg border border-border/60">
              {filteredRules.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[13px] text-muted-foreground">
                    No rules match your search.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredRules.map((rule, idx) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      idx={idx}
                      onSelect={() => setSelectedRule(rule)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom help */}
            <div className="mt-3 text-center">
              <p className="text-[11px] text-muted-foreground">
                Rules update automatically from your conversations and uploaded documents.
              </p>
            </div>
          </div>
        )}

        {/* ═══ Documents Tab ═══ */}
        {activeTab === "documents" && (
          <div>
            {/* Search + Add Document in same row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="h-8 text-[12px] pl-8"
                />
              </div>
              <Button
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
                className="h-8 text-[12px] gap-1.5 ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document
              </Button>
            </div>

            <div className="bg-white rounded-lg border border-border/60">
              {filteredDocs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[13px] text-muted-foreground">
                    {docSearch.trim()
                      ? "No documents match your search."
                      : "No documents yet. Add your first document to get started."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredDocs.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onToggleInUse={toggleDocInUse}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>

      {/* Rule Detail Sheet */}
      <RuleDetailSheet
        rule={selectedRule}
        open={!!selectedRule}
        onClose={() => setSelectedRule(null)}
      />

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      />
    </div>
  );
}
