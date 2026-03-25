/**
 * KnowledgeBase: SOP management, document upload, and AI parsing results
 * Core feature: Upload SOP → AI parses into structured rules
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  Zap,
  Shield,
  ArrowUpRight,
  Edit3,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const sopDocuments = [
  {
    id: "1",
    name: "Refund & Return Policy v3.2",
    type: "PDF",
    uploadedAt: "2025-03-20",
    status: "parsed" as const,
    rules: 24,
    guardrails: 8,
    actions: 12,
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "WISMO Handling Procedures",
    type: "PDF",
    uploadedAt: "2025-03-18",
    status: "parsed" as const,
    rules: 18,
    guardrails: 5,
    actions: 9,
    size: "1.8 MB",
  },
  {
    id: "3",
    name: "VIP Customer Escalation Guide",
    type: "DOCX",
    uploadedAt: "2025-03-22",
    status: "review" as const,
    rules: 15,
    guardrails: 6,
    actions: 7,
    size: "890 KB",
  },
  {
    id: "4",
    name: "Shipping Delay Communication Templates",
    type: "PDF",
    uploadedAt: "2025-03-15",
    status: "parsed" as const,
    rules: 10,
    guardrails: 3,
    actions: 5,
    size: "1.2 MB",
  },
];

const parsedRules = [
  {
    id: "R001",
    source: "Refund & Return Policy v3.2",
    category: "Refund",
    rule: "If order total < $50 and customer requests refund within 30 days, auto-approve refund without manager review",
    type: "prompt_rule" as const,
    confidence: 95,
  },
  {
    id: "R002",
    source: "Refund & Return Policy v3.2",
    category: "Refund",
    rule: "Always offer store credit as first option before processing cash refund",
    type: "prompt_rule" as const,
    confidence: 92,
  },
  {
    id: "G001",
    source: "Refund & Return Policy v3.2",
    category: "Guardrail",
    rule: "Maximum single refund amount: $100. Amounts exceeding this must be escalated to human agent",
    type: "guardrail" as const,
    confidence: 98,
  },
  {
    id: "A001",
    source: "WISMO Handling Procedures",
    category: "Action",
    rule: "When customer asks about order status, first call get_order_status API, then check_shipping_info API",
    type: "action" as const,
    confidence: 90,
  },
  {
    id: "E001",
    source: "VIP Customer Escalation Guide",
    category: "Escalation",
    rule: "If customer sentiment score drops below -0.5, immediately escalate to human agent with full context",
    type: "escalation" as const,
    confidence: 88,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function KnowledgeBase() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload SOPs and let AI parse them into structured agent instructions</p>
        </div>
        <Button className="gap-2 bg-teal-600 hover:bg-teal-700" onClick={() => toast("Upload dialog coming soon")}>
          <Upload className="w-4 h-4" />
          Upload SOP
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<FileText className="w-4 h-4" />} label="Documents" value="4" />
        <MiniStat icon={<Layers className="w-4 h-4" />} label="Parsed Rules" value="67" />
        <MiniStat icon={<Shield className="w-4 h-4" />} label="Guardrails" value="22" />
        <MiniStat icon={<Zap className="w-4 h-4" />} label="Actions" value="33" />
      </motion.div>

      <Tabs defaultValue="documents">
        <TabsList className="bg-muted">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="rules">Parsed Rules</TabsTrigger>
          <TabsTrigger value="upload">Upload & Parse</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <motion.div variants={itemVariants} className="space-y-3">
            {sopDocuments.map((doc) => (
              <Card key={doc.id} className="shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{doc.name}</p>
                      <Badge variant="outline" className="text-[9px]">{doc.type}</Badge>
                      <DocStatusBadge status={doc.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                      <span className="text-[10px] text-muted-foreground">Uploaded {doc.uploadedAt}</span>
                      <span className="text-[10px] text-teal-600 font-medium">{doc.rules} rules · {doc.guardrails} guardrails · {doc.actions} actions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Viewing document...")}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Editing document...")}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast("Delete confirmation needed")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        {/* Parsed Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {parsedRules.map((rule) => (
                    <div key={rule.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono text-muted-foreground">{rule.id}</span>
                            <RuleTypeBadge type={rule.type} />
                            <Badge variant="secondary" className="text-[9px]">{rule.category}</Badge>
                          </div>
                          <p className="text-sm leading-relaxed">{rule.rule}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">Source: {rule.source}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-right">
                            <p className="text-xs font-semibold">{rule.confidence}%</p>
                            <p className="text-[9px] text-muted-foreground">Confidence</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast("Editing rule...")}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-4">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    dragActive ? "border-teal-500 bg-teal-50" : "border-border"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); toast("Processing uploaded file..."); }}
                >
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base font-semibold mb-1">Upload SOP Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop your SOP files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Supported formats: PDF, DOCX, TXT · Max size: 10MB
                  </p>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("File picker coming soon")}>
                    Choose File
                  </Button>
                </div>

                {/* Parsing Pipeline Preview */}
                <div className="mt-8">
                  <h4 className="text-sm font-semibold mb-4">AI Parsing Pipeline</h4>
                  <div className="flex items-center gap-3">
                    {[
                      { step: "Upload", desc: "SOP Document" },
                      { step: "Extract", desc: "Text & Structure" },
                      { step: "Parse", desc: "AI Analysis" },
                      { step: "Generate", desc: "Rules & Guardrails" },
                      { step: "Review", desc: "Human Approval" },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-1">
                            <span className="text-xs font-bold text-teal-600">{i + 1}</span>
                          </div>
                          <p className="text-xs font-medium">{s.step}</p>
                          <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                        </div>
                        {i < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="p-2 rounded-lg bg-teal-50 text-teal-600">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  if (status === "parsed") return <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200">Parsed</Badge>;
  if (status === "review") return <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Needs Review</Badge>;
  return <Badge variant="outline" className="text-[9px]">Processing</Badge>;
}

function RuleTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    prompt_rule: { label: "Prompt Rule", className: "bg-blue-50 text-blue-700 border-blue-200" },
    guardrail: { label: "Guardrail", className: "bg-red-50 text-red-700 border-red-200" },
    action: { label: "Action", className: "bg-teal-50 text-teal-700 border-teal-200" },
    escalation: { label: "Escalation", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const c = config[type] || config.prompt_rule;
  return <Badge variant="outline" className={`text-[9px] ${c.className}`}>{c.label}</Badge>;
}
