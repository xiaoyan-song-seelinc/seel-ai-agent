/**
 * Knowledge — Playbook > Knowledge sub-tab
 * Single-page table view with:
 * - Processing banner (dismissible)
 * - Type filter tabs (All / Documents / URLs / Texts)
 * - Status + Enabled filters
 * - Full table: Title, Knowledge, Status, Created, Created by, Updated, Enabled
 * - Add Knowledge modal (Upload files / Add URLs / Paste text)
 * - Row actions: Edit, Retry (failed+retryable), Delete
 * - Click row → detail page (inline)
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, Upload, Globe, FileText, AlignLeft,
  X, RotateCcw, Trash2, Pencil, ChevronLeft,
  File, Info, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
type KnowledgeType = "file" | "url" | "text";
type KnowledgeStatus = "queued" | "crawling" | "parsing" | "ready" | "failed";
type FailReason = "auth_required" | "not_found" | "unsupported" | "unreachable" | "rate_limited" | "parse_error";

interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  knowledge: string; // summary or preview
  status: KnowledgeStatus;
  failReason?: FailReason;
  enabled: boolean;
  created: string;
  createdBy: string;
  updated: string;
  source?: string; // filename, url, or "manual"
  content?: string; // full text for text type
}

const failReasonLabels: Record<FailReason, string> = {
  auth_required: "Auth required (403)",
  not_found: "Not found (404)",
  unsupported: "Unsupported / No content",
  unreachable: "Unreachable / Timeout",
  rate_limited: "Rate limited",
  parse_error: "Parse error",
};

const retryableReasons: FailReason[] = ["unreachable", "rate_limited", "parse_error"];

/* ── Demo Data ── */
const demoItems: KnowledgeItem[] = [
  { id: "k1", title: "Customer_Policy_V2.pdf", type: "file", knowledge: "Comprehensive return and refund policy covering 30-day window, conditions, and exceptions.", status: "ready", enabled: true, created: "Sep 5, 2025", createdBy: "John D.", updated: "Sep 5, 2025", source: "Customer_Policy_V2.pdf" },
  { id: "k2", title: "luminous-ai.com/docs/api", type: "url", knowledge: "—", status: "crawling", enabled: true, created: "Sep 5, 2025", createdBy: "John D.", updated: "—", source: "https://luminous-ai.com/docs/api" },
  { id: "k3", title: "Refund FAQs", type: "text", knowledge: "Frequently asked questions about refund processing, timelines, and eligibility.", status: "ready", enabled: true, created: "Sep 5, 2025", createdBy: "Alice W.", updated: "Sep 5, 2025", content: "Q: How long does a refund take?\nA: Refunds are typically processed within 5-7 business days.\n\nQ: Can I get a refund after 30 days?\nA: Our standard return window is 30 days. Exceptions may apply for defective products." },
  { id: "k4", title: "Employee_Handbook_2024.docx", type: "file", knowledge: "—", status: "queued", enabled: true, created: "Sep 5, 2025", createdBy: "John D.", updated: "—", source: "Employee_Handbook_2024.docx" },
  { id: "k5", title: "Employee_Handbook_2024.docx", type: "file", knowledge: "—", status: "failed", failReason: "parse_error", enabled: false, created: "Sep 5, 2025", createdBy: "John D.", updated: "—", source: "Employee_Handbook_2024.docx" },
  { id: "k6", title: "Shipping Policy", type: "text", knowledge: "Standard shipping takes 5-7 business days. Express shipping available for $12.99.", status: "ready", enabled: true, created: "Sep 3, 2025", createdBy: "Alice W.", updated: "Sep 4, 2025", content: "Standard shipping takes 5-7 business days. Express shipping is available for $12.99 and delivers within 2-3 business days." },
  { id: "k7", title: "help.acme.com/returns", type: "url", knowledge: "—", status: "failed", failReason: "auth_required", enabled: false, created: "Sep 2, 2025", createdBy: "John D.", updated: "—", source: "https://help.acme.com/returns" },
  { id: "k8", title: "Size Guide 2025", type: "file", knowledge: "Detailed sizing chart for all product categories including apparel, shoes, and accessories.", status: "ready", enabled: false, created: "Aug 28, 2025", createdBy: "Alice W.", updated: "Sep 1, 2025", source: "Size_Guide_2025.pdf" },
  { id: "k9", title: "store.example.com/warranty", type: "url", knowledge: "Warranty terms and coverage details for electronics and appliances.", status: "ready", enabled: true, created: "Aug 25, 2025", createdBy: "John D.", updated: "Aug 26, 2025", source: "https://store.example.com/warranty" },
  { id: "k10", title: "Holiday Promo Rules", type: "text", knowledge: "Black Friday: 30% off sitewide. Cyber Monday: Buy 2 Get 1 Free on accessories.", status: "ready", enabled: true, created: "Aug 20, 2025", createdBy: "Alice W.", updated: "Aug 22, 2025", content: "Black Friday: 30% off sitewide.\nCyber Monday: Buy 2 Get 1 Free on accessories.\nHoliday bundle deals available Dec 1-25." },
  { id: "k11", title: "docs.acme.com/integrations", type: "url", knowledge: "—", status: "failed", failReason: "unreachable", enabled: false, created: "Aug 18, 2025", createdBy: "John D.", updated: "—", source: "https://docs.acme.com/integrations" },
  { id: "k12", title: "Product_Catalog_Q3.xlsx", type: "file", knowledge: "Q3 product catalog with 1,247 SKUs including pricing, descriptions, and availability.", status: "ready", enabled: true, created: "Aug 15, 2025", createdBy: "John D.", updated: "Aug 16, 2025", source: "Product_Catalog_Q3.xlsx" },
];

/* ── Status config ── */
const statusCfg: Record<KnowledgeStatus, { label: string; color: string; icon: React.ElementType }> = {
  queued: { label: "Queued", color: "text-gray-600 bg-gray-50 border-gray-200", icon: Loader2 },
  crawling: { label: "Crawling", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Globe },
  parsing: { label: "Parsing", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Loader2 },
  ready: { label: "Ready", color: "text-primary bg-primary/10 border-primary/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-600 bg-red-50 border-red-200", icon: AlertCircle },
};

function TypeIcon({ type, className }: { type: KnowledgeType; className?: string }) {
  if (type === "file") return <File className={cn("w-4 h-4 text-blue-500", className)} />;
  if (type === "url") return <Globe className={cn("w-4 h-4 text-primary", className)} />;
  return <AlignLeft className={cn("w-4 h-4 text-violet-500", className)} />;
}

const typeLabels: Record<KnowledgeType, string> = { file: "Documents", url: "URLs", text: "Texts" };

const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const iV = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function Knowledge() {
  const [items, setItems] = useState(demoItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | KnowledgeType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | KnowledgeStatus>("all");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "on" | "off">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"upload" | "url" | "text">("upload");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Counts
  const processingCount = items.filter(i => ["queued", "crawling", "parsing"].includes(i.status)).length;
  const failedCount = items.filter(i => i.status === "failed").length;
  const typeCounts = {
    all: items.length,
    file: items.filter(i => i.type === "file").length,
    url: items.filter(i => i.type === "url").length,
    text: items.filter(i => i.type === "text").length,
  };

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter(i => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (enabledFilter === "on" && !i.enabled) return false;
      if (enabledFilter === "off" && i.enabled) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return i.title.toLowerCase().includes(q) || i.knowledge.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, enabledFilter, searchQuery]);

  // Detail item
  const detailItem = items.find(i => i.id === detailId);

  // Handlers
  const handleToggleEnabled = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const handleRetry = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "queued" as KnowledgeStatus, failReason: undefined } : i));
    toast.success("Item queued for retry");
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (detailId === id) setDetailId(null);
    toast.success("Item deleted");
  };

  const openDetail = (item: KnowledgeItem) => {
    setDetailId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content || "");
  };

  const saveDetail = () => {
    if (!detailId) return;
    setItems(prev => prev.map(i => {
      if (i.id !== detailId) return i;
      const updates: Partial<KnowledgeItem> = { title: editTitle };
      if (i.type === "text") updates.content = editContent;
      return { ...i, ...updates };
    }));
    toast.success("Changes saved");
  };

  // ── Detail View ──
  if (detailItem) {
    const sc = statusCfg[detailItem.status];
    const canEditContent = detailItem.type === "text";
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[800px] space-y-6">
        <button onClick={() => setDetailId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Knowledge
        </button>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-sm" />
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
              <div className="flex items-center gap-1.5">
                <TypeIcon type={detailItem.type} className="w-3.5 h-3.5" />
                <span className="text-sm capitalize">{detailItem.type}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
              <Badge variant="outline" className={cn("text-[10px] font-medium", sc.color)}>
                <sc.icon className={cn("w-3 h-3 mr-1", detailItem.status === "queued" || detailItem.status === "parsing" ? "animate-spin" : "")} />
                {sc.label}
              </Badge>
              {detailItem.failReason && (
                <p className="text-[11px] text-red-500 mt-1">{failReasonLabels[detailItem.failReason]}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Created</Label>
              <p className="text-sm">{detailItem.created}</p>
              <p className="text-[11px] text-muted-foreground">by {detailItem.createdBy}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Updated</Label>
              <p className="text-sm">{detailItem.updated}</p>
            </div>
          </div>

          {/* Enabled */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className="text-xs text-muted-foreground">When enabled, this knowledge is used for AI answers. When disabled, it will not be used.</p>
            </div>
            <Switch checked={detailItem.enabled} onCheckedChange={() => handleToggleEnabled(detailItem.id)} />
          </div>

          {/* Source */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Source</Label>
            {detailItem.type === "file" && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                <File className="w-4 h-4 text-blue-500" />
                <span className="text-sm flex-1">{detailItem.source}</span>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast.info("Download coming soon")}>Download</Button>
              </div>
            )}
            {detailItem.type === "url" && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                <Globe className="w-4 h-4 text-primary" />
                <a href={detailItem.source} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">{detailItem.source}</a>
              </div>
            )}
            {detailItem.type === "text" && (
              <div>
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={10}
                  className="text-sm font-mono"
                  readOnly={!canEditContent}
                />
                {!canEditContent && <p className="text-[11px] text-muted-foreground mt-1">Content editing is only available for text entries.</p>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={saveDetail} className="text-xs">Save Changes</Button>
            {detailItem.status === "failed" && detailItem.failReason && retryableReasons.includes(detailItem.failReason) && (
              <Button variant="outline" className="text-xs gap-1.5" onClick={() => handleRetry(detailItem.id)}>
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </Button>
            )}
            <Button variant="outline" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 ml-auto" onClick={() => handleDelete(detailItem.id)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── List View ──
  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[1100px] space-y-4">
      {/* Global hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">Knowledge articles are <strong>globally shared</strong> across all agents. They provide reference information for answering customer questions.</p>
      </motion.div>

      {/* Processing banner */}
      {!bannerDismissed && processingCount > 0 && (
        <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 flex-1">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <p className="text-xs text-blue-700">{processingCount} {processingCount === 1 ? "item is" : "items are"} processing. We'll keep updating this list automatically.</p>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Failed banner (if no processing but has failed) */}
      {!bannerDismissed && processingCount === 0 && failedCount > 0 && (
        <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 flex-1">{failedCount} {failedCount === 1 ? "item needs" : "items need"} attention. Filter by Failed to review.</p>
          <button onClick={() => setBannerDismissed(true)} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Type filter tabs + Create button */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(["all", "file", "url", "text"] as const).map(t => {
            const isActive = typeFilter === t;
            const icon = t === "all" ? null : t === "file" ? <File className="w-3 h-3" /> : t === "url" ? <Globe className="w-3 h-3" /> : <AlignLeft className="w-3 h-3" />;
            const label = t === "all" ? "All" : typeLabels[t];
            const count = typeCounts[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {icon}{label} ({count})
              </button>
            );
          })}
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Create knowledge
        </Button>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={iV} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="crawling">Crawling</SelectItem>
              <SelectItem value="parsing">Parsing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Select value={enabledFilter} onValueChange={v => setEnabledFilter(v as typeof enabledFilter)}>
            <SelectTrigger className="h-8 text-xs w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="on">On</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={iV} className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Knowledge</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Created</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Updated</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Enabled</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const sc = statusCfg[item.status];
              const canRetry = item.status === "failed" && item.failReason && retryableReasons.includes(item.failReason);
              return (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <TypeIcon type={item.type} className="shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{item.knowledge}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={cn("text-[10px] font-medium gap-1", sc.color)}>
                        <sc.icon className={cn("w-3 h-3", (item.status === "queued" || item.status === "crawling" || item.status === "parsing") ? "animate-spin" : "")} />
                        {sc.label}
                      </Badge>
                      {item.failReason && (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-red-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{failReasonLabels[item.failReason]}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs">{item.created}</p>
                      <p className="text-[10px] text-muted-foreground">{item.createdBy}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{item.updated}</span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <Switch checked={item.enabled} onCheckedChange={() => handleToggleEnabled(item.id)} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted transition-colors">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="currentColor" className="text-muted-foreground" /><circle cx="8" cy="8" r="1.5" fill="currentColor" className="text-muted-foreground" /><circle cx="8" cy="13" r="1.5" fill="currentColor" className="text-muted-foreground" /></svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => openDetail(item)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </DropdownMenuItem>
                        {canRetry && (
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => handleRetry(item.id)}>
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">No knowledge items found.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or add new knowledge.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination hint */}
      <motion.div variants={iV} className="flex justify-end">
        <p className="text-xs text-muted-foreground">1–{filtered.length} of {items.length}</p>
      </motion.div>

      {/* ── Add Knowledge Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base"><Plus className="w-5 h-5 text-primary" /> Create knowledge</DialogTitle>
            <DialogDescription>Add knowledge to help your agents answer customer questions.</DialogDescription>
          </DialogHeader>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            {([
              { key: "upload" as const, icon: Upload, label: "Upload files" },
              { key: "url" as const, icon: Globe, label: "Add web URLs" },
              { key: "text" as const, icon: AlignLeft, label: "Paste text" },
            ]).map(m => (
              <button
                key={m.key}
                onClick={() => setAddMode(m.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
                  addMode === m.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <m.icon className="w-3.5 h-3.5" />{m.label}
              </button>
            ))}
          </div>

          {/* Upload files */}
          {addMode === "upload" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Drop files here or click to browse</p>
                <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, XLSX · Max 20 files · 25 MB each</p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/50">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Images in uploaded files are not used for knowledge ingestion in this version.</p>
              </div>
            </div>
          )}

          {/* Add URLs */}
          {addMode === "url" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Web URLs</Label>
                <Textarea placeholder={"https://help.example.com/returns\nhttps://help.example.com/shipping\nhttps://help.example.com/faq"} rows={5} className="text-xs font-mono" />
                <p className="text-[11px] text-muted-foreground mt-1">One URL per line · Max 50 URLs · http/https only</p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/50">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Images on web pages are not used for knowledge ingestion in this version.</p>
              </div>
            </div>
          )}

          {/* Paste text */}
          {addMode === "text" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Title</Label>
                <Input placeholder="e.g. Return Policy FAQ" className="text-xs" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Content</Label>
                <Textarea placeholder="Paste or type your knowledge content here..." rows={8} className="text-xs" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-primary hover:bg-primary/90" onClick={() => {
              toast.success("Knowledge added — processing will begin shortly");
              setAddOpen(false);
            }}>
              {addMode === "upload" ? "Upload & Process" : addMode === "url" ? "Add URLs" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
