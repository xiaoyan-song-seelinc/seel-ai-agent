/**
 * Knowledge: Three-layer knowledge management
 * Tab 1: Knowledge Articles — global reference content (FAQs, policies, product docs)
 * Tab 2: Skills — business scenarios (e.g. Refund, WISMO) that reference Actions
 * Tab 3: Actions — executable tools (e.g. Process Refund via Shopify API)
 * Entity model: Knowledge global, Skill ↔ Action many-to-many, Action-bound Guardrails
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Target, Zap, Plus, Search, Upload, FileText, Globe, Link2,
  CheckCircle2, AlertTriangle, ChevronRight, Shield,
  Eye, Pencil, Clock, Tag, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Knowledge Articles ── */
const knowledgeArticles = [
  { id: "k1", title: "Return & Refund Policy", type: "policy" as const, source: "PDF Upload", lastUpdated: "2 days ago", status: "active" as const, usageCount: 342, tags: ["refund", "return", "policy"] },
  { id: "k2", title: "Shipping & Delivery FAQ", type: "faq" as const, source: "Zendesk Help Center", lastUpdated: "1 week ago", status: "active" as const, usageCount: 218, tags: ["shipping", "delivery", "tracking"] },
  { id: "k3", title: "Product Catalog 2025", type: "product" as const, source: "Shopify Sync", lastUpdated: "3 hours ago", status: "active" as const, usageCount: 156, tags: ["product", "catalog", "pricing"] },
  { id: "k4", title: "Warranty Information", type: "policy" as const, source: "PDF Upload", lastUpdated: "1 month ago", status: "active" as const, usageCount: 89, tags: ["warranty", "guarantee"] },
  { id: "k5", title: "Size Guide", type: "product" as const, source: "Web Crawl", lastUpdated: "2 weeks ago", status: "active" as const, usageCount: 67, tags: ["size", "fit", "guide"] },
  { id: "k6", title: "Holiday Promotion Rules", type: "policy" as const, source: "Manual Entry", lastUpdated: "5 days ago", status: "draft" as const, usageCount: 0, tags: ["promotion", "discount", "holiday"] },
];

/* ── Skills ── */
const skills = [
  { id: "s1", name: "Refund Processing", desc: "Handle all refund-related requests including full refund, partial refund, and return-then-refund.", status: "active" as const, actions: ["Process Full Refund", "Process Partial Refund", "Initiate Return Label"], guardrails: ["Max refund amount $500", "Require order ID verification"], triggerExamples: ["I want a refund", "Can I get my money back", "This product is defective"], conversationsHandled: 276, successRate: 94.2 },
  { id: "s2", name: "WISMO (Where Is My Order)", desc: "Track order status, provide shipping updates, and handle delivery inquiries.", status: "active" as const, actions: ["Check Order Status", "Get Tracking Info"], guardrails: ["Escalate if order >14 days late"], triggerExamples: ["Where is my order", "Track my package", "When will it arrive"], conversationsHandled: 342, successRate: 97.1 },
  { id: "s3", name: "Order Changes", desc: "Process order modifications including cancellation, address change, and item swap.", status: "active" as const, actions: ["Cancel Order", "Update Shipping Address", "Swap Item"], guardrails: ["Cannot cancel if already shipped", "Address change within 2 hours of order"], triggerExamples: ["Cancel my order", "Change delivery address", "Swap to different size"], conversationsHandled: 154, successRate: 88.5 },
  { id: "s4", name: "Subscription Management", desc: "Handle subscription pause, resume, upgrade, and cancellation requests.", status: "inactive" as const, actions: ["Pause Subscription", "Cancel Subscription"], guardrails: ["Offer retention discount before cancel"], triggerExamples: ["Pause my subscription", "Cancel membership"], conversationsHandled: 0, successRate: 0 },
  { id: "s5", name: "Product Inquiry", desc: "Answer product questions using knowledge base, recommend alternatives.", status: "inactive" as const, actions: [], guardrails: [], triggerExamples: ["Is this waterproof", "What size should I get"], conversationsHandled: 0, successRate: 0 },
];

/* ── Actions ── */
const actions = [
  { id: "a1", name: "Process Full Refund", provider: "Shopify", type: "write" as const, enabled: true, guardrail: "Max $500, require order verification", usedBySkills: ["Refund Processing"], lastTriggered: "2 hours ago" },
  { id: "a2", name: "Process Partial Refund", provider: "Shopify", type: "write" as const, enabled: true, guardrail: "Max 50% of order value", usedBySkills: ["Refund Processing"], lastTriggered: "5 hours ago" },
  { id: "a3", name: "Initiate Return Label", provider: "ShipStation", type: "write" as const, enabled: true, guardrail: "Within 30-day return window", usedBySkills: ["Refund Processing"], lastTriggered: "1 day ago" },
  { id: "a4", name: "Check Order Status", provider: "Shopify", type: "read" as const, enabled: true, guardrail: null, usedBySkills: ["WISMO"], lastTriggered: "10 min ago" },
  { id: "a5", name: "Get Tracking Info", provider: "ShipStation", type: "read" as const, enabled: true, guardrail: null, usedBySkills: ["WISMO"], lastTriggered: "15 min ago" },
  { id: "a6", name: "Cancel Order", provider: "Shopify", type: "write" as const, enabled: false, guardrail: "Cannot cancel if shipped", usedBySkills: ["Order Changes"], lastTriggered: "3 days ago" },
  { id: "a7", name: "Update Shipping Address", provider: "Shopify", type: "write" as const, enabled: false, guardrail: "Within 2 hours of order", usedBySkills: ["Order Changes"], lastTriggered: "1 week ago" },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function TypeIcon({ type }: { type: string }) {
  if (type === "policy") return <FileText className="w-4 h-4 text-blue-500" />;
  if (type === "faq") return <Globe className="w-4 h-4 text-teal-500" />;
  return <Tag className="w-4 h-4 text-violet-500" />;
}

export default function Knowledge() {
  const [activeTab, setActiveTab] = useState("knowledge");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [skillDetailId, setSkillDetailId] = useState<string | null>(null);
  const [actionDetailId, setActionDetailId] = useState<string | null>(null);

  const selectedSkill = skills.find(s => s.id === skillDetailId);
  const selectedAction = actions.find(a => a.id === actionDetailId);

  const filteredArticles = knowledgeArticles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.tags.some(t => t.includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage knowledge articles, skills, and actions that power your agents.</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemV}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="knowledge" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" /> Knowledge <Badge variant="secondary" className="text-[9px] ml-1">{knowledgeArticles.length}</Badge></TabsTrigger>
              <TabsTrigger value="skills" className="gap-1.5 text-xs"><Target className="w-3.5 h-3.5" /> Skills <Badge variant="secondary" className="text-[9px] ml-1">{skills.length}</Badge></TabsTrigger>
              <TabsTrigger value="actions" className="gap-1.5 text-xs"><Zap className="w-3.5 h-3.5" /> Actions <Badge variant="secondary" className="text-[9px] ml-1">{actions.length}</Badge></TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs w-48" />
              </div>
              {activeTab === "knowledge" && (
                <Button size="sm" className="gap-1 bg-teal-600 hover:bg-teal-700 text-xs h-8" onClick={() => setUploadOpen(true)}>
                  <Upload className="w-3.5 h-3.5" /> Add Source
                </Button>
              )}
            </div>
          </div>

          {/* ── Knowledge Articles ── */}
          <TabsContent value="knowledge" className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total Articles" value={String(knowledgeArticles.length)} icon={<BookOpen className="w-4 h-4 text-teal-600" />} />
              <StatCard label="Active" value={String(knowledgeArticles.filter(a => a.status === "active").length)} icon={<CheckCircle2 className="w-4 h-4 text-teal-600" />} />
              <StatCard label="Total References" value={String(knowledgeArticles.reduce((s, a) => s + a.usageCount, 0))} icon={<Eye className="w-4 h-4 text-blue-600" />} />
              <StatCard label="Sources" value="4 types" icon={<Link2 className="w-4 h-4 text-violet-600" />} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50/50 border border-teal-200/60">
              <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-xs text-teal-700">Knowledge articles are <strong>globally shared</strong> across all agents. They provide reference information for answering customer questions.</p>
            </div>
            <div className="space-y-2">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="shadow-sm hover:shadow-md transition-all hover:border-teal-200 cursor-pointer" onClick={() => toast.info("Article detail coming soon")}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><TypeIcon type={article.type} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <Badge variant={article.status === "active" ? "default" : "secondary"} className={cn("text-[9px]", article.status === "active" ? "bg-teal-100 text-teal-700" : "")}>{article.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{article.source}</span>
                        <span className="text-[10px] text-muted-foreground">Updated {article.lastUpdated}</span>
                        <span className="text-[10px] text-muted-foreground">{article.usageCount} references</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">{article.tags.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Skills ── */}
          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total Skills" value={String(skills.length)} icon={<Target className="w-4 h-4 text-violet-600" />} />
              <StatCard label="Active" value={String(skills.filter(s => s.status === "active").length)} icon={<CheckCircle2 className="w-4 h-4 text-teal-600" />} />
              <StatCard label="Conversations" value={String(skills.reduce((s, sk) => s + sk.conversationsHandled, 0))} icon={<Eye className="w-4 h-4 text-blue-600" />} />
              <StatCard label="Avg Success" value={`${(skills.filter(s => s.successRate > 0).reduce((s, sk) => s + sk.successRate, 0) / Math.max(skills.filter(s => s.successRate > 0).length, 1)).toFixed(1)}%`} icon={<CheckCircle2 className="w-4 h-4 text-teal-600" />} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50 border border-violet-200/60">
              <Target className="w-4 h-4 text-violet-600 shrink-0" />
              <p className="text-xs text-violet-700">Skills define <strong>business scenarios</strong> (e.g. "Refund Processing"). Each skill references one or more Actions and can have its own guardrails. Skills are shared globally across all agents.</p>
            </div>
            <div className="space-y-3">
              {skills.map((skill) => (
                <Card key={skill.id} className="shadow-sm hover:shadow-md transition-all hover:border-violet-200 cursor-pointer" onClick={() => setSkillDetailId(skill.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", skill.status === "active" ? "bg-violet-100" : "bg-muted")}>
                          <Target className={cn("w-4 h-4", skill.status === "active" ? "text-violet-600" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{skill.name}</p>
                            <Badge variant={skill.status === "active" ? "default" : "secondary"} className={cn("text-[9px]", skill.status === "active" ? "bg-violet-100 text-violet-700" : "")}>{skill.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{skill.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Zap className="w-3 h-3 text-amber-500" />{skill.actions.length} actions</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Shield className="w-3 h-3 text-red-400" />{skill.guardrails.length} guardrails</span>
                      {skill.conversationsHandled > 0 && <>
                        <span className="text-[10px] text-muted-foreground">{skill.conversationsHandled} conversations</span>
                        <span className="text-[10px] text-muted-foreground">{skill.successRate}% success</span>
                      </>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Actions ── */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total Actions" value={String(actions.length)} icon={<Zap className="w-4 h-4 text-amber-600" />} />
              <StatCard label="Enabled" value={String(actions.filter(a => a.enabled).length)} icon={<CheckCircle2 className="w-4 h-4 text-teal-600" />} />
              <StatCard label="Read-only" value={String(actions.filter(a => a.type === "read").length)} icon={<Eye className="w-4 h-4 text-blue-600" />} />
              <StatCard label="Write" value={String(actions.filter(a => a.type === "write").length)} icon={<Pencil className="w-4 h-4 text-amber-600" />} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">Actions are <strong>executable tools</strong> (like API calls to Shopify, Zendesk). They are referenced by Skills and can have action-bound guardrails. Think of them as the "hands" of your agents.</p>
            </div>
            <div className="space-y-2">
              {actions.map((action) => (
                <Card key={action.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setActionDetailId(action.id)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", action.enabled ? "bg-amber-100" : "bg-muted")}>
                      <Zap className={cn("w-4 h-4", action.enabled ? "text-amber-600" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{action.name}</p>
                        <Badge variant="outline" className={cn("text-[9px]", action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200")}>{action.type}</Badge>
                        {!action.enabled && <Badge variant="secondary" className="text-[9px]">Disabled</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">via {action.provider}</span>
                        <span className="text-[10px] text-muted-foreground">Used by: {action.usedBySkills.join(", ")}</span>
                        {action.lastTriggered && <span className="text-[10px] text-muted-foreground">Last: {action.lastTriggered}</span>}
                      </div>
                    </div>
                    {action.guardrail && <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground max-w-[150px] truncate"><Shield className="w-3 h-3 text-red-400 shrink-0" />{action.guardrail}</span>}
                    <Switch checked={action.enabled} onCheckedChange={() => toast.info("Feature coming soon")} onClick={e => e.stopPropagation()} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Upload Dialog ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-teal-600" /> Add Knowledge Source</DialogTitle>
            <DialogDescription>Upload documents or connect external sources. Content will be parsed into knowledge articles.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Source Type</Label>
              <Select defaultValue="upload">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">File Upload (PDF, DOCX, TXT)</SelectItem>
                  <SelectItem value="url">Web URL / Help Center</SelectItem>
                  <SelectItem value="zendesk">Zendesk Help Center Sync</SelectItem>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-teal-300 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, TXT up to 10MB</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { toast.success("Source added successfully"); setUploadOpen(false); }}>Upload & Parse</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Skill Detail Dialog ── */}
      <Dialog open={!!skillDetailId} onOpenChange={() => setSkillDetailId(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          {selectedSkill && (<>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-violet-600" /> {selectedSkill.name}</DialogTitle>
              <DialogDescription>{selectedSkill.desc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedSkill.status === "active" ? "default" : "secondary"} className={cn("text-[9px]", selectedSkill.status === "active" ? "bg-violet-100 text-violet-700" : "")}>{selectedSkill.status}</Badge>
                  <Switch checked={selectedSkill.status === "active"} onCheckedChange={() => toast.info("Feature coming soon")} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Trigger Examples</p>
                <div className="flex flex-wrap gap-2">{selectedSkill.triggerExamples.map(t => <Badge key={t} variant="outline" className="text-xs font-normal">"{t}"</Badge>)}</div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Actions Referenced</p>
                <div className="space-y-2">
                  {selectedSkill.actions.length > 0 ? selectedSkill.actions.map(a => {
                    const ad = actions.find(ac => ac.name === a);
                    return (<div key={a} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm flex-1">{a}</span>
                      {ad && <Badge variant="outline" className="text-[9px]">via {ad.provider}</Badge>}
                      {ad && (ad.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />)}
                    </div>);
                  }) : <p className="text-xs text-muted-foreground italic">No actions — this is a knowledge-only skill.</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-red-400" /> Skill Guardrails</p>
                <div className="space-y-2">
                  {selectedSkill.guardrails.length > 0 ? selectedSkill.guardrails.map(g => (
                    <div key={g} className="flex items-center gap-3 p-2.5 rounded-lg border border-red-200/60 bg-red-50/30"><Shield className="w-3.5 h-3.5 text-red-400" /><span className="text-sm">{g}</span></div>
                  )) : <p className="text-xs text-muted-foreground italic">No guardrails configured.</p>}
                </div>
              </div>
              {selectedSkill.conversationsHandled > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-lg font-bold">{selectedSkill.conversationsHandled}</p><p className="text-[10px] text-muted-foreground">Conversations Handled</p></div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center"><p className="text-lg font-bold">{selectedSkill.successRate}%</p><p className="text-[10px] text-muted-foreground">Success Rate</p></div>
                </div>
              )}
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      {/* ── Action Detail Dialog ── */}
      <Dialog open={!!actionDetailId} onOpenChange={() => setActionDetailId(null)}>
        <DialogContent className="max-w-lg">
          {selectedAction && (<>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-600" /> {selectedAction.name}</DialogTitle>
              <DialogDescription>Action via {selectedAction.provider} · {selectedAction.type === "read" ? "Read-only" : "Write"} operation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Enabled</span>
                <Switch checked={selectedAction.enabled} onCheckedChange={() => toast.info("Feature coming soon")} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Used by Skills</p>
                <div className="flex flex-wrap gap-2">{selectedAction.usedBySkills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
              </div>
              {selectedAction.guardrail && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-red-400" /> Action-bound Guardrail</p>
                  <div className="p-3 rounded-lg border border-red-200/60 bg-red-50/30"><p className="text-sm">{selectedAction.guardrail}</p></div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Last triggered: {selectedAction.lastTriggered}</div>
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-3 flex items-center gap-3">{icon}<div><p className="text-lg font-bold leading-none">{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{label}</p></div></CardContent></Card>
  );
}
