/**
 * Skills — Playbook > Skills sub-tab
 * V23: Flattened single-level Skill model.
 * Each Skill = Intent description + Guidance (Markdown) + Actions (toggles).
 * No Scenario sub-level. Skill granularity is user-defined.
 * Category tabs (Order / Protection) for list organization.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import RichTextEditor from "@/components/RichTextEditor";
import { markdownToHtml } from "@/lib/markdown-to-html";
import {
  Target, ChevronLeft, ChevronRight, ChevronDown, Package, Shield, ShoppingCart,
  Pencil, Check, X, Info, AlertTriangle, Eye, Zap, MessageSquare,
  FileText, Upload, Sparkles, Bell, ArrowRight, Play, Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface SkillAction {
  id: string;
  name: string;
  description: string;
  type: "read" | "write";
  connector: string;
  enabled: boolean;
  disabledHint?: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  /** Category for tab-based organization */
  category: "Order" | "Protection";
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
  agentCount: number;
  /** The complete Markdown guidance document */
  guidance: string;
  /** Actions available for this skill */
  actions: SkillAction[];
}

/* ── Preset Skills Data ── */
const initialSkills: Skill[] = [
  {
    id: "order-tracking",
    name: "Order Tracking",
    description: "Track order status, provide shipping updates, and answer delivery-related questions.",
    category: "Order",
    icon: Package,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    enabled: true,
    agentCount: 1,
    guidance: `**WHEN:** The customer asks about their order status, tracking, or delivery.

### 1. Verify customer identity

**IF** the customer hasn't provided an order number or email, **THEN** ask for one of the following:
- Order number
- Email address associated with the order

### 2. Look up order and tracking

Use the order number or email to retrieve the current fulfillment status and tracking details.

- Provide the current status (e.g. Unfulfilled, In Transit, Delivered).
- If a tracking link is available, share it with the customer.

### 3. Estimated delivery

- **Only** provide estimated dates that come directly from carrier tracking data.
- **IF** no estimated date is available, inform the customer that tracking updates may be delayed and provide the carrier's contact info.

### 4. Handle delays

**IF** tracking shows "In Transit" for more than **7 business days** past the estimated delivery date, **THEN** escalate to a human agent.

### 5. Delivered but not received

**IF** the customer reports non-receipt despite delivery confirmation:
- Share the specific delivery details from the carrier (date, time, location).
- Suggest checking with neighbors, building management, or other household members.
- **IF** the customer confirms they still haven't received the package, **THEN** escalate to a human agent.

**Note:** Do not speculate on delivery dates beyond what carrier data shows. Do not issue refund or replacement for non-receipt — this requires human review.

---

### Escalation

**Escalate to a human agent** in any of the following situations:
- Tracking data has been unavailable for more than **48 hours**
- Delivery delay exceeds **7 business days** past estimated date
- Customer confirms non-receipt despite delivery confirmation`,
    actions: [
      { id: "ot-a1", name: "Look up order status", description: "Query order details including current fulfillment status and line items.", type: "read", connector: "Shopify", enabled: true },
      { id: "ot-a2", name: "Get tracking information", description: "Retrieve carrier tracking number, URL, and latest tracking events.", type: "read", connector: "Shopify", enabled: true },
    ],
  },
  {
    id: "seel-protection",
    name: "Seel Protection",
    description: "Handle protection policy inquiries, claim filing, claim status checks, and policy cancellation requests.",
    category: "Protection",
    icon: Shield,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    enabled: true,
    agentCount: 1,
    guidance: `**WHEN:** The customer asks about their Seel protection coverage, wants to file a claim, check claim status, or cancel their policy.

---

## Coverage Inquiry

### 1. Look up the specific policy

Always retrieve the customer's actual policy before answering. Do not provide generic coverage information.

### 2. Explain coverage

- Clearly state the **coverage period** and what is covered.
- Mention any **exclusions** that apply.

**IF** no active policy is found, **THEN** inform the customer and suggest they check their order confirmation email.

---

## Filing a Claim

### 1. Verify eligibility

Look up the customer's policy and confirm it is active and within the coverage period.

**IF** the policy is expired or no policy exists, **THEN** inform the customer with a clear explanation.

### 2. Collect claim details

Required information:
- Order number
- Description of the issue
- Date the issue was discovered

Photos are recommended but not mandatory.

### 3. File the claim

**IF** eligible, initiate the claim with the collected details.

**Note:** Never disclose internal claim approval criteria or scoring logic to the customer.

---

## Claim Status

### 1. Look up claim

Retrieve the claim details and current status.

### 2. Provide update

- Share the current status and any next steps.
- **IF** the claim has been pending for more than **5 business days**, acknowledge the delay and provide an updated timeline.

**Note:** Provide factual status updates only — do not predict claim outcomes.

---

## Policy Cancellation

### 1. Check eligibility

Look up the policy and verify cancellation eligibility:
- Must be within **30 days** of purchase
- **AND** no claim has been filed

**IF** outside the cancellation window or a claim exists, **THEN** explain the policy terms clearly.

### 2. Process cancellation

**IF** eligible, process the cancellation and confirm:
- Refund amount
- Expected refund timeline

---

### Escalation

**Escalate to a human agent** in any of the following situations:
- Claim is disputed by the customer
- Partial damage with unclear liability
- Customer disputes the cancellation policy terms`,
    actions: [
      { id: "sp-a1", name: "Look up protection policy", description: "Retrieve customer's Seel protection policy details, coverage scope, and status.", type: "read", connector: "Seel API", enabled: true },
      { id: "sp-a2", name: "Check claim status", description: "Query existing claim details including current status and resolution timeline.", type: "read", connector: "Seel API", enabled: true },
      { id: "sp-a3", name: "File a claim", description: "Initiate a new protection claim with order and issue details.", type: "write", connector: "Seel API", enabled: true, disabledHint: "Agent will collect claim details and escalate to human agent for manual filing." },
      { id: "sp-a4", name: "Cancel protection policy", description: "Process policy cancellation and trigger refund if eligible.", type: "write", connector: "Seel API", enabled: true, disabledHint: "Agent will confirm eligibility and escalate to human agent for manual cancellation." },
    ],
  },
  {
    id: "order-cancellation",
    name: "Order Cancellation",
    description: "Handle order cancellation requests with eligibility checks, confirmation flow, and refund processing.",
    category: "Order",
    icon: ShoppingCart,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    enabled: false,
    agentCount: 0,
    guidance: `**WHEN:** The customer wants to cancel an order, whether they just placed it or changed their mind.

### 1. Verify the order

Confirm which order the customer wants to cancel. Ask for the order number if not provided.

### 2. Check eligibility

**IF** the order is **Unfulfilled**, **THEN** proceed with cancellation.

**IF** the order is already fulfilled or shipped, **THEN** inform the customer and suggest they initiate a return instead.

### 3. Confirm and cancel

- Always confirm the cancellation intent with the customer before proceeding.
- After successful cancellation, confirm:
  - Refund amount
  - Expected timeline (5-7 business days)
- Log the cancellation reason for analytics.

### 4. Partial cancellation

**IF** the order contains multiple items and the customer wants to cancel only some items, **THEN** escalate to a human agent — partial cancellation is not currently supported.

### 5. Recently placed orders

For orders placed within the last few minutes, prioritize speed — the customer expects a just-placed order to be easy to cancel. Follow the same eligibility check but communicate with urgency.

**Note:** Do not process cancellations without explicit customer confirmation.

---

### Escalation

**Escalate to a human agent** in any of the following situations:
- Customer requests partial cancellation (not currently supported)
- Cancellation fails due to a system error`,
    actions: [
      { id: "om-a1", name: "Check order status", description: "Verify order fulfillment status and cancellation eligibility.", type: "read", connector: "Shopify", enabled: true },
      { id: "om-a2", name: "Cancel order", description: "Cancel an unfulfilled order and trigger refund to original payment method.", type: "write", connector: "Shopify", enabled: false, disabledHint: "Agent will verify eligibility and escalate to human agent for manual cancellation." },
    ],
  },
];

/* ── Animation variants ── */
const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── Category config ── */
const categories = [
  { key: "all" as const, label: "All Skills" },
  { key: "Order" as const, label: "Order" },
  { key: "Protection" as const, label: "Protection" },
];

/* ── Guidance display (read-only rendered HTML) ── */
function GuidanceView({ content }: { content: string }) {
  const html = markdownToHtml(content);
  return (
    <div
      className="guidance-display"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ── Main Component ── */
export default function Skills() {
  const [skills, setSkills] = useState(initialSkills);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [sopBannerDismissed, setSopBannerDismissed] = useState(false);
  const [notified, setNotified] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "Order" | "Protection">("all");

  /* Guidance editing state */
  const [editing, setEditing] = useState(false);
  const [editHtml, setEditHtml] = useState("");

  const [, navigate] = useLocation();
  const detailSkill = skills.find(s => s.id === detailId);

  const filteredSkills = useMemo(() => {
    if (activeCategory === "all") return skills;
    return skills.filter(s => s.category === activeCategory);
  }, [skills, activeCategory]);

  const handleTestSkill = (skillName: string) => {
    navigate(`/performance?test=${encodeURIComponent(skillName)}`);
  };

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleAction = (skillId: string, actionId: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const updatedActions = s.actions.map(a => {
        if (a.id !== actionId) return a;
        const newEnabled = !a.enabled;
        // Show feedback toast when toggling write actions
        if (a.type === "write") {
          if (!newEnabled && a.disabledHint) {
            toast.info(`"${a.name}" disabled — ${a.disabledHint}`, { duration: 4000 });
          } else if (newEnabled) {
            toast.warning(`"${a.name}" enabled — this action can modify data in ${a.connector}.`, { duration: 4000 });
          }
        }
        return { ...a, enabled: newEnabled };
      });
      return { ...s, actions: updatedActions };
    }));
  };

  const saveGuidance = (skillId: string, guidance: string) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, guidance } : s));
  };

  // ── Detail View ──
  if (detailSkill) {
    const Icon = detailSkill.icon;
    const enabledActions = detailSkill.actions.filter(a => a.enabled).length;
    const totalActions = detailSkill.actions.length;
    const hasEnabledWrite = detailSkill.actions.some(a => a.type === "write" && a.enabled);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[800px] space-y-5">
        {/* Back */}
        <button onClick={() => { setDetailId(null); setEditing(false); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Skills
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", detailSkill.iconBg)}>
              <Icon className={cn("w-5 h-5", detailSkill.iconColor)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{detailSkill.name}</h2>
                <Badge variant="outline" className="text-[9px]">{detailSkill.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{detailSkill.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">{detailSkill.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={detailSkill.enabled} onCheckedChange={() => toggleSkill(detailSkill.id)} />
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            {enabledActions} of {totalActions} actions enabled
          </div>
          {hasEnabledWrite && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              Write actions enabled
            </div>
          )}
          {detailSkill.agentCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Used by {detailSkill.agentCount} agent{detailSkill.agentCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Guidance section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Guidance</h3>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[300px]">
                  The complete instruction document for this skill. Edit in Markdown to define how the agent handles customer requests — including verification steps, conditions, and response guidelines. You can organize multiple sub-scenarios using headings.
                </TooltipContent>
              </Tooltip>
            </div>
            {!editing ? (
              <button
                onClick={() => { setEditHtml(markdownToHtml(detailSkill.guidance)); setEditing(true); }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(false); toast.success("Guidance updated"); }}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <RichTextEditor
              content={editHtml}
              onChange={setEditHtml}
              placeholder="Write your guidance here..."
            />
          ) : (
            <div className="p-4 rounded-lg bg-muted/15 border border-border/50">
              <GuidanceView content={detailSkill.guidance} />
            </div>
          )}
        </div>

        {/* Actions section */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <h3 className="text-sm font-semibold">Actions</h3>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[280px]">
                Actions are operations the agent can perform. Toggle them on/off independently. When a write action is disabled, the agent will follow its fallback behavior (usually escalation).
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {detailSkill.actions.map(action => (
              <div key={action.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                !action.enabled && action.type === "write"
                  ? "border-border/50 bg-muted/5"
                  : "border-border/60 hover:bg-muted/10"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                  action.type === "read" ? "bg-blue-50" : "bg-amber-50"
                )}>
                  {action.type === "read"
                    ? <Eye className="w-4 h-4 text-blue-500" />
                    : <Zap className="w-4 h-4 text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-sm font-medium", !action.enabled && "text-muted-foreground")}>{action.name}</p>
                    <Badge variant="outline" className={cn(
                      "text-[9px]",
                      action.type === "read" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      {action.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">via {action.connector}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  {action.type === "write" && action.enabled && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Will modify data in {action.connector}
                    </p>
                  )}
                  {action.type === "write" && !action.enabled && action.disabledHint && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 italic">
                      <Info className="w-2.5 h-2.5 shrink-0" />
                      {action.disabledHint}
                    </p>
                  )}
                </div>
                <Switch
                  checked={action.enabled}
                  onCheckedChange={() => toggleAction(detailSkill.id, action.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test skill */}
        <div className="pt-2 border-t border-border/40">
          <button
            onClick={() => handleTestSkill(detailSkill.name)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Test this skill
          </button>
        </div>

        {/* SOP hint */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <span>Want to auto-generate skills from your SOP? <button onClick={() => { setDetailId(null); setAddSkillOpen(true); }} className="text-primary hover:underline">Learn more</button></span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── List View ──
  const enabledCount = skills.filter(s => s.enabled).length;

  return (
    <motion.div variants={cV} initial="hidden" animate="visible" className="p-6 max-w-[800px] space-y-4">
      {/* SOP Coming Soon Banner */}
      {!sopBannerDismissed && (
        <motion.div variants={iV} className="flex items-center gap-3 p-3.5 rounded-lg bg-gradient-to-r from-primary/5 to-violet-50 border border-primary/15">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Coming soon: Import skills from your SOP</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Upload your team's standard operating procedures and let AI create skills automatically.</p>
          </div>
          <button onClick={() => setSopBannerDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Global hint */}
      <motion.div variants={iV} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary">Each skill is a complete instruction set your agent follows. It includes a <strong>guidance document</strong> (editable Markdown) and <strong>actions</strong> (toggleable operations). You decide the scope — from a single intent to an entire business domain.</p>
      </motion.div>

      {/* Category Tabs + Summary */}
      <motion.div variants={iV} className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/60">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeCategory === cat.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">{enabledCount}/{skills.length} enabled</p>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setAddSkillOpen(true)}>
            <Target className="w-3.5 h-3.5" /> Add Skill
          </Button>
        </div>
      </motion.div>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base">Add Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <button
              onClick={() => { setAddSkillOpen(false); toast.info("All available template skills are already shown in your list."); }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/20 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Choose from templates</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select from pre-built skills designed for common support scenarios.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0 group-hover:text-primary transition-colors" />
            </button>

            <div className="w-full flex items-start gap-3 p-4 rounded-lg border border-dashed border-primary/30 bg-gradient-to-r from-primary/[0.03] to-violet-50/50 text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Import from SOP</p>
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Upload your team's standard operating procedures and let AI automatically generate skills, guidance, and actions.</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Upload className="w-3 h-3" /> PDF, DOCX, TXT
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Sparkles className="w-3 h-3" /> AI-powered extraction
                  </div>
                </div>
                {!notified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs h-7 gap-1.5"
                    onClick={() => { setNotified(true); toast.success("We'll notify you when this feature is available."); }}
                  >
                    <Bell className="w-3 h-3" /> Notify me when available
                  </Button>
                ) : (
                  <p className="mt-3 text-xs text-primary flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> You'll be notified when this feature launches.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skill Cards */}
      <motion.div variants={iV} className="space-y-3">
        {filteredSkills.map(skill => {
          const Icon = skill.icon;
          const enabledActions = skill.actions.filter(a => a.enabled).length;
          const totalActions = skill.actions.length;
          const writeEnabled = skill.actions.filter(a => a.type === "write" && a.enabled).length;
          return (
            <div
              key={skill.id}
              className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer",
                skill.enabled
                  ? "border-border hover:border-primary/30 hover:shadow-sm bg-card"
                  : "border-border/60 bg-muted/20 opacity-70 hover:opacity-90"
              )}
              onClick={() => setDetailId(skill.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", skill.iconBg)}>
                  <Icon className={cn("w-5 h-5", skill.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{skill.name}</h3>
                    <Badge variant="outline" className="text-[9px]">{skill.category}</Badge>
                    <Badge variant={skill.enabled ? "default" : "secondary"} className={cn(
                      "text-[9px]",
                      skill.enabled ? "bg-primary/15 text-primary" : ""
                    )}>
                      {skill.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Zap className="w-3 h-3" /> {enabledActions}/{totalActions} actions
                    </span>
                    {writeEnabled > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertTriangle className="w-3 h-3" /> {writeEnabled} write
                      </span>
                    )}
                    {skill.agentCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Used by {skill.agentCount} agent{skill.agentCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  <Switch checked={skill.enabled} onCheckedChange={() => toggleSkill(skill.id)} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
