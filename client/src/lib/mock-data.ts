// ══════════════════════════════════════════════════════════════
// Mock Data Layer — Seel AI Support Agent
// Brand: "Coastal Living Co" (home goods DTC)
// Agent: "Alex" | Manager: "Jordan Chen"
// ══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────

export type TopicType = "knowledge_gap" | "performance_report" | "open_question" | "escalation_review" | "rule_update";
export type TopicStatus = "unread" | "read" | "resolved";
export type MessageSender = "ai" | "manager";
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
export type PermissionLevel = "autonomous" | "ask_permission" | "disabled";
export type AgentMode = "shadow" | "production" | "off";
export type OnboardingStep = "connect_zendesk" | "connect_shopify" | "import_rules" | "confirm_rules" | "set_permissions" | "capability_boundary" | "escalation_rules" | "agent_identity" | "readiness_audit" | "go_live";
export type TicketSidebarState = "ai_handling" | "pending_approval" | "escalated" | "taken_over";

export interface Topic {
  id: string;
  type: TopicType;
  title: string;
  status: TopicStatus;
  createdAt: string;
  updatedAt: string;
  preview: string;
  messages: Message[];
  sourceTicketId?: string;
  proposedRule?: ProposedRule;
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  actions?: MessageAction[];
}

export interface MessageAction {
  label: string;
  type: "accept" | "reject" | "link";
  targetUrl?: string;
}

export interface ProposedRule {
  id: string;
  text: string;
  category: string;
  evidence: string[];
  status: "pending" | "accepted" | "rejected";
}

export interface ActionPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  permission: PermissionLevel;
  parameters?: Record<string, unknown>;
  lastModified: string;
  dependsOn?: string[];
}

export interface EscalationRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  configurable: boolean;
  value?: number;
  routingTarget?: string;
  routingType?: "zendesk_group" | "external_link" | "specific_agent";
}

export interface AgentIdentity {
  name: string;
  tone: "professional" | "friendly" | "casual";
  greeting: string;
  signature: string;
  transparentAboutAI: boolean;
}

export interface Integration {
  platform: "zendesk" | "shopify";
  connected: boolean;
  connectedAt?: string;
  metadata: Record<string, string | number>;
  webhookStatus?: "active" | "inactive" | "error";
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: "pdf" | "doc" | "csv" | "url";
  uploadedAt: string;
  size: string;
  extractedRules: number;
  status: "processed" | "processing" | "error";
}

export interface Skill {
  id: string;
  name: string;
  intent: string;
  ruleText: string;
  lastUpdated: string;
  updatedByTopicId?: string;
  confidence: number;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: number; // positive = improvement
  trendLabel: string;
}

export interface DailyMetric {
  date: string;
  autoResolutionRate: number;
  csat: number;
  escalationRate: number;
  responseTime: number;
  volume: number;
}

export interface IntentMetric {
  intent: string;
  volume: number;
  resolutionRate: number;
  csat: number;
  avgTurns: number;
  escalationRate: number;
}

export interface ActionableItem {
  id: string;
  title: string;
  description: string;
  impact: string;
  linkedTopicId?: string;
}

export interface ApprovalRequest {
  id: string;
  ticketId: string;
  ticketSubject: string;
  customerName: string;
  actionType: string;
  actionLabel: string;
  parameters: Record<string, string | number>;
  reasoning: string;
  status: ApprovalStatus;
  createdAt: string;
  timeoutAt: string;
  aiConfidence: number;
  intentDetected: string;
  actionsTaken: string[];
}

export interface BadCaseReport {
  id: string;
  ticketId: string;
  comment: string;
  createdAt: string;
}

export interface ParsedRule {
  id: string;
  text: string;
  source: string;
  category: "behavior" | "business_rule" | "action_mapping";
  confidence: number;
  status: "pending" | "confirmed" | "rejected" | "conflicted";
  conflictGroupId?: string;
  conflictAlternative?: string;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  integrations: Integration[];
  parsedRules: ParsedRule[];
  actionPermissions: ActionPermission[];
  escalationRules: EscalationRule[];
  identity: AgentIdentity;
  capabilitySummary: {
    canHandle: { scenario: string; percentage: number }[];
    willEscalate: { scenario: string; reason: string }[];
    estimatedCoverage: number;
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const AGENT_IDENTITY: AgentIdentity = {
  name: "Alex",
  tone: "friendly",
  greeting: "Hi there! I'm Alex from Coastal Living Co support. How can I help you today?",
  signature: "Best,\nAlex\nCoastal Living Co Support",
  transparentAboutAI: false,
};

export const AGENT_MODE: AgentMode = "production";

export const INTEGRATIONS: Integration[] = [
  {
    platform: "zendesk",
    connected: true,
    connectedAt: "2026-02-25T10:30:00Z",
    metadata: { subdomain: "coastalliving", plan: "Professional", activeAgents: 6, openTickets: 234 },
    webhookStatus: "active",
  },
  {
    platform: "shopify",
    connected: true,
    connectedAt: "2026-02-25T10:45:00Z",
    metadata: { storeUrl: "coastalliving.myshopify.com", products: 847, monthlyOrders: 3200 },
  },
];

export const ACTION_PERMISSIONS: ActionPermission[] = [
  { id: "ap-1", name: "Issue Refund", description: "Process refund to original payment method", category: "Financial", permission: "ask_permission", parameters: { maxAmount: 150 }, lastModified: "2026-03-10T14:00:00Z" },
  { id: "ap-2", name: "Cancel Order", description: "Cancel unfulfilled order and notify customer", category: "Order Management", permission: "autonomous", lastModified: "2026-03-01T09:00:00Z" },
  { id: "ap-3", name: "Create Return Label", description: "Generate prepaid return shipping label", category: "Returns", permission: "autonomous", lastModified: "2026-03-01T09:00:00Z" },
  { id: "ap-4", name: "Track Shipment", description: "Look up shipment status and share with customer", category: "Order Management", permission: "autonomous", lastModified: "2026-02-28T09:00:00Z" },
  { id: "ap-5", name: "Apply Discount", description: "Apply discount code or manual discount", category: "Financial", permission: "ask_permission", parameters: { maxPercentage: 15 }, lastModified: "2026-03-05T11:00:00Z" },
  { id: "ap-6", name: "Update Shipping Address", description: "Modify shipping address on unfulfilled order", category: "Order Management", permission: "autonomous", lastModified: "2026-02-28T09:00:00Z" },
  { id: "ap-7", name: "Resend Order", description: "Create replacement shipment for lost/damaged items", category: "Order Management", permission: "ask_permission", parameters: { maxValue: 200 }, lastModified: "2026-03-08T16:00:00Z" },
  { id: "ap-8", name: "Create Coupon", description: "Generate unique discount coupon for customer retention", category: "Financial", permission: "disabled", lastModified: "2026-02-28T09:00:00Z", dependsOn: ["ap-5"] },
  { id: "ap-9", name: "Escalate to Manager", description: "Transfer ticket to human agent with context summary", category: "Workflow", permission: "autonomous", lastModified: "2026-02-28T09:00:00Z" },
  { id: "ap-10", name: "Close Ticket", description: "Mark ticket as resolved after customer confirmation", category: "Workflow", permission: "autonomous", lastModified: "2026-02-28T09:00:00Z" },
];

export const ESCALATION_RULES: EscalationRule[] = [
  { id: "er-1", label: "Angry customer detected", description: "Escalate when customer sentiment is angry or frustrated (caps, exclamation marks, explicit complaints)", enabled: true, configurable: false },
  { id: "er-2", label: "Legal/safety keywords", description: "Escalate when message contains legal threats, safety concerns, or regulatory keywords", enabled: true, configurable: false },
  { id: "er-3", label: "Unresolved after N turns", description: "Escalate if the issue isn't resolved within a set number of conversation turns", enabled: true, configurable: true, value: 4 },
  { id: "er-4", label: "Customer requests human", description: "Escalate immediately when customer explicitly asks for a human agent", enabled: true, configurable: false },
  { id: "er-5", label: "High-value order (>$500)", description: "Escalate any issue involving orders above this threshold", enabled: true, configurable: true, value: 500, routingTarget: "CX Team A", routingType: "zendesk_group" },
  { id: "er-6", label: "Repeat contact (3+ times)", description: "Escalate when customer has contacted about the same issue multiple times", enabled: true, configurable: true, value: 3, routingTarget: "CX Team A", routingType: "zendesk_group" },
  { id: "er-7", label: "Insurance-related inquiry", description: "Route insurance claims and coverage questions to the dedicated insurance support team", enabled: true, configurable: false, routingTarget: "https://insurance-support.seel.com/zendesk", routingType: "external_link" },
  { id: "er-8", label: "Technical/integration issue", description: "Route technical issues (tracking pixel, API errors) to engineering support", enabled: true, configurable: false, routingTarget: "Engineering Support", routingType: "zendesk_group" },
];

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  { id: "doc-1", name: "Coastal Living Co — Customer Service SOP v3.2.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "2.4 MB", extractedRules: 12, status: "processed" },
  { id: "doc-2", name: "Return & Refund Policy — March 2026.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "890 KB", extractedRules: 5, status: "processed" },
  { id: "doc-3", name: "Shipping Partner SLA & Escalation Guide.doc", type: "doc", uploadedAt: "2026-03-05T14:00:00Z", size: "1.1 MB", extractedRules: 3, status: "processed" },
  { id: "doc-4", name: "VIP Customer Handling Guidelines.pdf", type: "pdf", uploadedAt: "2026-03-10T11:00:00Z", size: "540 KB", extractedRules: 4, status: "processed" },
  { id: "doc-5", name: "Product Warranty Terms — All Categories.csv", type: "csv", uploadedAt: "2026-03-15T16:00:00Z", size: "320 KB", extractedRules: 8, status: "processed" },
];

export const SKILLS: Skill[] = [
  { id: "sk-1", name: "Standard Refund Policy", intent: "Refunds", ruleText: "Process full refund for items returned within 30 days in original condition. For VIP customers (3+ orders), extend window to 45 days. Refund to original payment method only.", lastUpdated: "2026-03-15T10:00:00Z", updatedByTopicId: "t-4", confidence: 0.95 },
  { id: "sk-2", name: "WISMO Response", intent: "Where Is My Order", ruleText: "Look up order in Shopify, check shipment tracking. If shipped, share tracking link and estimated delivery. If delayed >3 days past estimate, apologize and offer to contact carrier.", lastUpdated: "2026-03-01T09:00:00Z", confidence: 0.98 },
  { id: "sk-3", name: "Cancellation Policy", intent: "Cancellations", ruleText: "Cancel unfulfilled orders immediately with full refund. For fulfilled orders, guide customer to return process instead. Express sympathy for the inconvenience.", lastUpdated: "2026-03-01T09:00:00Z", confidence: 0.92 },
  { id: "sk-4", name: "Damaged Item Handling", intent: "Product Issues", ruleText: "Ask for photo evidence. If damage is confirmed, offer replacement or full refund — customer's choice. Do not require return of damaged item for orders under $80.", lastUpdated: "2026-03-12T14:00:00Z", updatedByTopicId: "t-3", confidence: 0.88 },
  { id: "sk-5", name: "Shipping Delay Communication", intent: "Shipping", ruleText: "Acknowledge the delay, provide updated ETA if available. For delays >7 days, offer 10% discount on next order. Never blame the carrier directly.", lastUpdated: "2026-03-08T11:00:00Z", confidence: 0.90 },
  { id: "sk-6", name: "Product Recommendation", intent: "Pre-sale", ruleText: "When customer asks about product features or comparisons, reference product descriptions from Shopify. Suggest complementary items. Do not make claims not in the product listing.", lastUpdated: "2026-03-01T09:00:00Z", confidence: 0.85 },
  { id: "sk-7", name: "Return Shipping Cost", intent: "Returns", ruleText: "Free return shipping for defective/wrong items. Customer pays return shipping for change-of-mind returns. Provide prepaid label in both cases, deduct $8.95 from refund for change-of-mind.", lastUpdated: "2026-03-20T09:00:00Z", updatedByTopicId: "t-7", confidence: 0.91 },
];

export const TOPICS: Topic[] = [
  {
    id: "t-1",
    type: "knowledge_gap",
    title: "Refund to different payment method",
    status: "unread",
    createdAt: "2026-03-26T08:00:00Z",
    updatedAt: "2026-03-26T08:00:00Z",
    preview: "Over the past 3 days, 8 customers requested refunds to a different payment method than the original...",
    proposedRule: {
      id: "pr-1",
      text: "When customer requests refund to a different payment method, explain that refunds can only be processed to the original payment method due to payment processor restrictions. Offer store credit as an alternative.",
      category: "Refunds",
      evidence: ["Ticket #4521 — customer wanted refund to PayPal instead of credit card", "Ticket #4533 — customer's original card expired", "Ticket #4540 — customer wanted refund to bank account"],
      status: "pending",
    },
    messages: [
      { id: "m-1-1", sender: "ai", content: "I've noticed a pattern over the past 3 days: **8 customers** have requested refunds to a different payment method than the one they used for purchase.\n\nCurrently, I escalate these because I don't have a clear rule. Here's what I've observed:\n\n- 5 customers wanted refund to PayPal (paid by credit card)\n- 2 customers had expired cards\n- 1 customer wanted a bank transfer\n\nI'd like to propose a rule:", timestamp: "2026-03-26T08:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Reject", type: "reject" }] },
      { id: "m-1-2", sender: "ai", content: "**Proposed rule:** When customer requests refund to a different payment method, explain that refunds can only be processed to the original payment method due to payment processor restrictions. Offer store credit as an alternative.\n\nFor expired cards specifically, advise the customer to contact their bank — the refund will still process to the old card number and the bank will handle forwarding.\n\nShould I adopt this rule?", timestamp: "2026-03-26T08:00:30Z" },
    ],
  },
  {
    id: "t-2",
    type: "performance_report",
    title: "Weekly Performance Summary (Mar 19-25)",
    status: "unread",
    createdAt: "2026-03-26T06:00:00Z",
    updatedAt: "2026-03-26T06:00:00Z",
    preview: "This week I handled 412 tickets with a 68% auto-resolution rate. CSAT improved to 4.3...",
    messages: [
      { id: "m-2-1", sender: "ai", content: "Here's my weekly summary for **March 19-25**:\n\n**Key Metrics:**\n- Tickets handled: **412** (up 8% from last week)\n- Auto-resolution rate: **68%** (up from 64%)\n- CSAT: **4.3/5** (up from 4.1)\n- Escalation rate: **24%** (down from 28%)\n- Avg first response: **45 seconds**\n\n**Highlights:**\n- WISMO tickets are my strongest category — 89% auto-resolved\n- Refund CSAT improved after you updated the VIP refund window rule last week\n\n**Areas of concern:**\n- Product damage claims: escalation rate is still 42%. I'm not confident about when to offer replacement vs refund\n- 3 customers complained about my tone being \"too formal\" on live chat\n\nWould you like me to create action items for these concerns?", timestamp: "2026-03-26T06:00:00Z", actions: [{ label: "Create Action Items", type: "accept" }] },
    ],
  },
  {
    id: "t-3",
    type: "escalation_review",
    title: "Learned: Damaged item photo not always needed",
    status: "resolved",
    createdAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-03-12T16:00:00Z",
    preview: "I observed how you handled ticket #4412 — you processed a replacement without requiring a photo...",
    sourceTicketId: "4412",
    messages: [
      { id: "m-3-1", sender: "ai", content: "I escalated **ticket #4412** because the customer reported a damaged ceramic vase but didn't provide a photo. My current rule requires photo evidence for all damage claims.\n\nI noticed you processed a replacement immediately without asking for a photo. The order was $34.99.\n\nI'd like to learn from this: should I skip photo requirements for low-value items? If so, what's the threshold?", timestamp: "2026-03-12T10:00:00Z" },
      { id: "m-3-2", sender: "manager", content: "Good catch. Yes — for items under $80, don't require photo evidence. It's not worth the customer friction. Just process the replacement or refund based on their preference.", timestamp: "2026-03-12T14:30:00Z" },
      { id: "m-3-3", sender: "ai", content: "Got it! I've updated my **Damaged Item Handling** rule:\n\n> For damage claims on items under $80, process replacement or refund (customer's choice) without requiring photo evidence. For items $80+, still request photo before processing.\n\nThis should reduce escalations for low-value damage claims. I'll monitor the impact.", timestamp: "2026-03-12T14:31:00Z" },
    ],
  },
  {
    id: "t-4",
    type: "knowledge_gap",
    title: "VIP customer refund window extension",
    status: "resolved",
    createdAt: "2026-03-14T09:00:00Z",
    updatedAt: "2026-03-15T10:00:00Z",
    preview: "I noticed 23% of agents extend the refund window for VIP customers. Should I do the same?",
    messages: [
      { id: "m-4-1", sender: "ai", content: "While analyzing historical tickets, I found that **23% of your team** extends the 30-day refund window to 45 days for VIP customers (those with 3+ orders).\n\nYour SOP says 30 days for everyone. Which should I follow?", timestamp: "2026-03-14T09:00:00Z" },
      { id: "m-4-2", sender: "manager", content: "Good find. Yes, extend to 45 days for VIP customers. I'll update the SOP too. VIP = 3 or more completed orders.", timestamp: "2026-03-14T15:00:00Z" },
      { id: "m-4-3", sender: "ai", content: "Updated! My refund policy now includes:\n\n> For VIP customers (3+ completed orders), extend return window from 30 to 45 days.\n\nI'll apply this going forward.", timestamp: "2026-03-14T15:01:00Z" },
    ],
  },
  {
    id: "t-5",
    type: "open_question",
    title: "Multi-product return shipping cost",
    status: "read",
    createdAt: "2026-03-24T11:00:00Z",
    updatedAt: "2026-03-24T11:00:00Z",
    preview: "When a customer bought 2 products and wants to return only 1, how should I handle the shipping cost?",
    messages: [
      { id: "m-5-1", sender: "ai", content: "I have a question about a scenario I couldn't find in the SOP:\n\n**Scenario:** Customer bought 2 items in one order. They want to return 1 item (change of mind). The order originally qualified for free shipping ($75+ threshold).\n\nQuestions:\n1. Do we charge the $8.95 return shipping fee for the returned item?\n2. If the remaining order total drops below $75, do we retroactively charge original shipping?\n\nI've seen this come up 3 times this week and I've been escalating each time.", timestamp: "2026-03-24T11:00:00Z" },
    ],
  },
  {
    id: "t-6",
    type: "rule_update",
    title: "Holiday return policy extension",
    status: "resolved",
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-20T09:30:00Z",
    preview: "Manager updated: Extended return window to 60 days for orders placed during spring sale.",
    messages: [
      { id: "m-6-1", sender: "manager", content: "New rule: For orders placed during our Spring Sale (March 15-31), extend the return window to 60 days instead of the standard 30. This applies to all customers, not just VIP.", timestamp: "2026-03-20T09:00:00Z" },
      { id: "m-6-2", sender: "ai", content: "Understood! I've added this as a temporary rule:\n\n> Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.\n\nThis overrides the standard 30-day window and the VIP 45-day window for qualifying orders. I'll automatically revert to normal policy after May 30.\n\nDoes this look correct?", timestamp: "2026-03-20T09:01:00Z" },
      { id: "m-6-3", sender: "manager", content: "Perfect, that's correct.", timestamp: "2026-03-20T09:30:00Z" },
    ],
  },
  {
    id: "t-7",
    type: "knowledge_gap",
    title: "Return shipping cost for defective items",
    status: "resolved",
    createdAt: "2026-03-19T14:00:00Z",
    updatedAt: "2026-03-20T09:00:00Z",
    preview: "A denied approval led me to discover the return shipping cost rule needs clarification...",
    messages: [
      { id: "m-7-1", sender: "ai", content: "Yesterday you **denied** my approval request on ticket #4498. I wanted to charge the customer $8.95 return shipping for a defective item.\n\nAfter reviewing your handling, I realized I was applying the change-of-mind return shipping policy to a defective item case. These should be different:\n\n**Proposed update:**\n- Defective/wrong items → free return shipping (we pay)\n- Change of mind → customer pays ($8.95 deducted from refund)\n\nIs this correct?", timestamp: "2026-03-19T14:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Reject", type: "reject" }] },
      { id: "m-7-2", sender: "manager", content: "Yes, exactly right. Defective items should always be free return shipping. Good that you caught this from the denial.", timestamp: "2026-03-20T09:00:00Z" },
      { id: "m-7-3", sender: "ai", content: "Updated my **Return Shipping Cost** rule. This is a great example of the feedback loop working — your denial on one ticket improved my handling for all future return shipping decisions. Thanks!", timestamp: "2026-03-20T09:01:00Z" },
    ],
  },
  {
    id: "t-8",
    type: "knowledge_gap",
    title: "International order return complications",
    status: "unread",
    createdAt: "2026-03-25T16:00:00Z",
    updatedAt: "2026-03-25T16:00:00Z",
    preview: "I've escalated 5 international return requests this week. I need guidance on customs and duties...",
    proposedRule: {
      id: "pr-2",
      text: "For international returns, inform customer that return shipping is their responsibility and customs duties are non-refundable. Offer store credit for the duties amount as a goodwill gesture for VIP customers.",
      category: "Returns",
      evidence: ["Ticket #4560 — UK customer confused about duties refund", "Ticket #4567 — Canadian customer expected free return shipping"],
      status: "pending",
    },
    messages: [
      { id: "m-8-1", sender: "ai", content: "I've been escalating all international return requests because I'm unsure about two things:\n\n1. **Return shipping for international orders** — who pays?\n2. **Customs duties** — are these refundable?\n\nThis week alone I escalated 5 tickets for this reason. Here's my proposed rule based on observing how your team handled them:\n\n> For international returns: return shipping is customer's responsibility. Customs duties are non-refundable (we can't control this). For VIP customers, offer store credit equal to the duties amount as goodwill.\n\nDoes this match your policy?", timestamp: "2026-03-25T16:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Reject", type: "reject" }] },
    ],
  },
];

// ── Performance Data ────────────────────────────────────────

export const PERFORMANCE_SUMMARY: PerformanceMetric[] = [
  { label: "Auto-Resolution Rate", value: 68, unit: "%", trend: 4, trendLabel: "vs last week" },
  { label: "CSAT Score", value: 4.3, unit: "/5", trend: 0.2, trendLabel: "vs last week" },
  { label: "Escalation Rate", value: 24, unit: "%", trend: -4, trendLabel: "vs last week" },
  { label: "First Response Time", value: 45, unit: "sec", trend: -12, trendLabel: "vs last week" },
];

export const DAILY_METRICS: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, i + 1);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseVolume = isWeekend ? 35 : 60;
  const growthFactor = 1 + (i / 30) * 0.15;
  return {
    date: date.toISOString().split("T")[0],
    autoResolutionRate: Math.min(75, 55 + i * 0.5 + (Math.random() * 6 - 3)),
    csat: Math.min(4.8, 3.9 + i * 0.015 + (Math.random() * 0.3 - 0.15)),
    escalationRate: Math.max(18, 35 - i * 0.5 + (Math.random() * 6 - 3)),
    responseTime: Math.max(30, 90 - i * 1.5 + (Math.random() * 15 - 7)),
    volume: Math.round(baseVolume * growthFactor + (Math.random() * 10 - 5)),
  };
});

export const INTENT_METRICS: IntentMetric[] = [
  { intent: "Where Is My Order", volume: 156, resolutionRate: 89, csat: 4.5, avgTurns: 2.1, escalationRate: 8 },
  { intent: "Refunds", volume: 98, resolutionRate: 62, csat: 4.0, avgTurns: 3.4, escalationRate: 32 },
  { intent: "Cancellations", volume: 67, resolutionRate: 78, csat: 4.2, avgTurns: 2.8, escalationRate: 15 },
  { intent: "Product Issues", volume: 52, resolutionRate: 55, csat: 3.8, avgTurns: 4.1, escalationRate: 42 },
  { intent: "Shipping", volume: 45, resolutionRate: 71, csat: 4.1, avgTurns: 2.5, escalationRate: 22 },
  { intent: "Returns", volume: 38, resolutionRate: 58, csat: 3.9, avgTurns: 3.8, escalationRate: 35 },
  { intent: "Pre-sale Questions", volume: 31, resolutionRate: 82, csat: 4.4, avgTurns: 2.2, escalationRate: 12 },
  { intent: "Account Issues", volume: 18, resolutionRate: 44, csat: 3.6, avgTurns: 4.5, escalationRate: 48 },
];

export const ACTIONABLE_ITEMS: ActionableItem[] = [
  { id: "ai-1", title: "High escalation rate on Product Issues", description: "Product damage claims have a 42% escalation rate. Main gap: unclear rules on when to offer replacement vs refund for items near the $80 threshold.", impact: "Reducing to 25% would auto-resolve ~9 more tickets/week", linkedTopicId: "t-3" },
  { id: "ai-2", title: "International returns need rules", description: "5 international return tickets escalated this week with no clear policy. All were handled similarly by your team.", impact: "Adding this rule could auto-resolve ~5 tickets/week", linkedTopicId: "t-8" },
  { id: "ai-3", title: "Tone adjustment for live chat", description: "3 customers rated CSAT low citing 'too formal' tone on live chat. Consider switching to 'friendly' tone for chat channel.", impact: "Could improve chat CSAT by 0.2-0.3 points" },
];

// ── Zendesk Sidebar Mock Data ──────────────────────────────

export const MOCK_TICKETS: ApprovalRequest[] = [
  {
    id: "apr-1",
    ticketId: "4589",
    ticketSubject: "I need a refund for my broken lamp",
    customerName: "Sarah Mitchell",
    actionType: "refund",
    actionLabel: "Issue Refund",
    parameters: { amount: 89.99, currency: "USD", method: "Original Visa ending 4242", orderId: "CLC-10234" },
    reasoning: "Customer received a ceramic table lamp with a cracked base. Photo evidence confirms damage. Order is within 30-day return window. Recommending full refund to original payment method.",
    status: "pending",
    createdAt: "2026-03-26T09:15:00Z",
    timeoutAt: "2026-03-26T09:45:00Z",
    aiConfidence: 0.92,
    intentDetected: "Product Issues — Damaged Item",
    actionsTaken: ["Verified order #CLC-10234 in Shopify", "Confirmed item is within return window", "Reviewed photo evidence of damage"],
  },
  {
    id: "apr-2",
    ticketId: "4591",
    ticketSubject: "Can I get a discount? I've been a loyal customer",
    customerName: "David Park",
    actionType: "discount",
    actionLabel: "Apply Discount",
    parameters: { percentage: 12, code: "LOYAL-DAVID-12", orderId: "CLC-10241", orderTotal: 234.50 },
    reasoning: "Customer has 7 completed orders (VIP). Requesting loyalty discount on current cart. 12% is within the 15% max threshold. Customer has never received a discount before.",
    status: "pending",
    createdAt: "2026-03-26T09:30:00Z",
    timeoutAt: "2026-03-26T10:00:00Z",
    aiConfidence: 0.85,
    intentDetected: "Pre-sale — Loyalty Discount Request",
    actionsTaken: ["Verified customer has 7 completed orders", "Checked discount history — no prior discounts", "Generated unique code LOYAL-DAVID-12"],
  },
  {
    id: "apr-3",
    ticketId: "4585",
    ticketSubject: "Wrong item received, need replacement ASAP",
    customerName: "Emma Thompson",
    actionType: "resend",
    actionLabel: "Resend Order",
    parameters: { orderId: "CLC-10228", itemName: "Coastal Breeze Candle Set", value: 45.00, shippingMethod: "Express (2-day)" },
    reasoning: "Customer received a different candle set than ordered. Photo shows wrong SKU. Original order value $45 is under $80 threshold — no return needed. Recommending express reshipping.",
    status: "pending",
    createdAt: "2026-03-26T08:45:00Z",
    timeoutAt: "2026-03-26T09:15:00Z",
    aiConfidence: 0.95,
    intentDetected: "Product Issues — Wrong Item",
    actionsTaken: ["Verified order #CLC-10228", "Confirmed SKU mismatch from photo", "Item under $80 — no return required per policy"],
  },
];

export const MOCK_ESCALATED_TICKET = {
  ticketId: "4593",
  ticketSubject: "URGENT: I want to speak to a manager NOW",
  customerName: "Robert Chen",
  reason: "Customer explicitly requested human agent. Sentiment: very frustrated. Issue involves a $450 furniture order with multiple delivery attempts.",
  summary: "Customer ordered a coastal oak bookshelf ($450). Delivery attempted 3 times — customer was home each time but driver marked as 'not home'. Customer is understandably frustrated and demanding to speak with a manager.",
  actionsTaken: ["Verified 3 failed delivery attempts in carrier system", "Confirmed customer was charged correctly", "Prepared full case summary for handoff"],
  intentDetected: "Shipping — Delivery Failure",
};

export const MOCK_AI_HANDLING_TICKET = {
  ticketId: "4595",
  ticketSubject: "Where is my order? It's been 5 days",
  customerName: "Lisa Wang",
  confidence: 0.94,
  intentDetected: "Where Is My Order",
  currentStep: "Shared tracking link and updated ETA with customer",
  actionsTaken: ["Looked up order #CLC-10250 in Shopify", "Retrieved tracking from carrier API", "Shared tracking link with customer", "Estimated delivery: March 28"],
};

export const MOCK_TAKEN_OVER_TICKET = {
  ticketId: "4587",
  ticketSubject: "Warranty claim for dining table",
  customerName: "Michael Brown",
  takenOverAt: "2026-03-26T08:30:00Z",
  takenOverBy: "Jordan Chen",
};

// ── Onboarding Mock Data ────────────────────────────────────

export const ONBOARDING_PARSED_RULES: ParsedRule[] = [
  { id: "opr-1", text: "Process full refund for items returned within 30 days in original condition", source: "SOP Document, Section 3.1", category: "business_rule", confidence: 0.97, status: "confirmed" },
  { id: "opr-2", text: "Always address customer by first name", source: "SOP Document, Section 1.2", category: "behavior", confidence: 0.95, status: "confirmed" },
  { id: "opr-3", text: "Look up order status in Shopify when customer asks about delivery", source: "SOP Document, Section 4.1", category: "action_mapping", confidence: 0.93, status: "confirmed" },
  { id: "opr-4", text: "Refund window is 30 days for all customers", source: "SOP Document, Section 3.1", category: "business_rule", confidence: 0.88, status: "conflicted", conflictGroupId: "cg-1", conflictAlternative: "23% of agents extend to 45 days for VIP customers (3+ orders)" },
  { id: "opr-5", text: "Extend refund window to 45 days for VIP customers with 3+ orders", source: "Historical ticket analysis (23% of agents)", category: "business_rule", confidence: 0.72, status: "conflicted", conflictGroupId: "cg-1", conflictAlternative: "SOP says 30 days for all customers" },
  { id: "opr-6", text: "Never provide legal advice or make warranty promises beyond stated policy", source: "SOP Document, Section 1.4", category: "behavior", confidence: 0.99, status: "confirmed" },
  { id: "opr-7", text: "For damaged items, always request photo evidence before processing", source: "SOP Document, Section 5.2", category: "business_rule", confidence: 0.91, status: "pending" },
  { id: "opr-8", text: "Offer free shipping on replacement orders for defective items", source: "Historical ticket analysis", category: "business_rule", confidence: 0.85, status: "pending" },
  { id: "opr-9", text: "Use Shopify API to cancel unfulfilled orders", source: "SOP Document, Section 4.3", category: "action_mapping", confidence: 0.96, status: "confirmed" },
  { id: "opr-10", text: "Respond within 4 hours during business hours (9am-6pm EST)", source: "SOP Document, Section 1.1", category: "behavior", confidence: 0.94, status: "confirmed" },
];

export const CAPABILITY_SUMMARY = {
  canHandle: [
    { scenario: "Order tracking and delivery updates (WISMO)", percentage: 89 },
    { scenario: "Standard refund processing", percentage: 62 },
    { scenario: "Order cancellation (unfulfilled)", percentage: 78 },
    { scenario: "Return label generation", percentage: 70 },
    { scenario: "Pre-sale product questions", percentage: 82 },
    { scenario: "Shipping delay communication", percentage: 71 },
  ],
  willEscalate: [
    { scenario: "Create discount coupons", reason: "No API integration available" },
    { scenario: "Modify existing orders (add/remove items)", reason: "Shopify API limitation" },
    { scenario: "Warranty claims beyond standard policy", reason: "Requires manager judgment" },
    { scenario: "Billing disputes / chargeback handling", reason: "Legal sensitivity" },
    { scenario: "Social media complaint escalations", reason: "Brand risk — requires human touch" },
  ],
  estimatedCoverage: 67,
};


// ── Zendesk Ticket Types for Sidebar Simulation ──────────────

export interface ZendeskTicketMessage {
  from: "customer" | "agent" | "internal";
  text: string;
  timestamp: string;
}

export interface ZendeskTicketApproval {
  actionType: "refund" | "discount" | "replacement" | "resend";
  reason: string;
  status: ApprovalStatus;
  details?: Record<string, string | number>;
  timeoutMinutes?: number;
  respondedAt?: string;
}

export interface ZendeskTicketActivity {
  type: "classify" | "respond" | "action" | "escalate";
  description: string;
  timestamp: string;
}

export interface ZendeskTicket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  messages: ZendeskTicketMessage[];
  approval?: ZendeskTicketApproval;
  takenOver: boolean;
  markedBadCase: boolean;
  badCaseNote?: string;
  aiActivity: ZendeskTicketActivity[];
}

export const ZENDESK_TICKETS: ZendeskTicket[] = [
  {
    id: "zd-4589",
    subject: "I need a refund for my broken lamp",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah.m@gmail.com",
    messages: [
      { from: "customer", text: "Hi, I received my ceramic table lamp yesterday and the base is completely cracked. I'd like a full refund please.", timestamp: "2026-03-26T09:00:00Z" },
      { from: "agent", text: "Hi Sarah! I'm so sorry to hear about the damaged lamp. I can see your order #CLC-10234 and the ceramic table lamp ($89.99). Let me look into a refund for you right away.", timestamp: "2026-03-26T09:01:00Z" },
      { from: "internal", text: "⏳ Requesting manager approval for refund of $89.99 — amount exceeds autonomous threshold.", timestamp: "2026-03-26T09:01:30Z" },
    ],
    approval: {
      actionType: "refund",
      reason: "Customer received a ceramic table lamp with a cracked base. Photo evidence confirms damage. Order is within 30-day return window. Recommending full refund to original payment method.",
      status: "pending",
      details: { amount: "$89.99", method: "Visa ending 4242", orderId: "CLC-10234", reason: "Damaged item" },
      timeoutMinutes: 30,
    },
    takenOver: false,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Product Issues — Damaged Item", timestamp: "2026-03-26T09:00:05Z" },
      { type: "action", description: "Verified order #CLC-10234 in Shopify", timestamp: "2026-03-26T09:00:10Z" },
      { type: "action", description: "Confirmed item within 30-day return window", timestamp: "2026-03-26T09:00:12Z" },
      { type: "respond", description: "Sent empathy response and refund confirmation", timestamp: "2026-03-26T09:01:00Z" },
      { type: "action", description: "Requested approval for $89.99 refund (above $50 threshold)", timestamp: "2026-03-26T09:01:30Z" },
    ],
  },
  {
    id: "zd-4591",
    subject: "Can I get a discount? I've been a loyal customer",
    customerName: "David Park",
    customerEmail: "david.park@outlook.com",
    messages: [
      { from: "customer", text: "Hey! I've been shopping with you guys for over a year now. Any chance I could get a loyalty discount on my current cart? It's $234.50.", timestamp: "2026-03-26T09:20:00Z" },
      { from: "agent", text: "Hi David! Thank you so much for being a loyal customer — I can see you've placed 7 orders with us. Let me check what I can do for you.", timestamp: "2026-03-26T09:20:30Z" },
      { from: "internal", text: "⏳ Requesting approval to apply 12% discount (code: LOYAL-DAVID-12) on order totaling $234.50.", timestamp: "2026-03-26T09:21:00Z" },
    ],
    approval: {
      actionType: "discount",
      reason: "Customer has 7 completed orders (VIP). Requesting loyalty discount on current cart. 12% is within the 15% max threshold. Customer has never received a discount before.",
      status: "pending",
      details: { discount: "12%", code: "LOYAL-DAVID-12", orderTotal: "$234.50", savings: "$28.14" },
      timeoutMinutes: 30,
    },
    takenOver: false,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Pre-sale — Loyalty Discount Request", timestamp: "2026-03-26T09:20:05Z" },
      { type: "action", description: "Verified customer has 7 completed orders (VIP)", timestamp: "2026-03-26T09:20:10Z" },
      { type: "action", description: "Checked discount history — no prior discounts", timestamp: "2026-03-26T09:20:15Z" },
      { type: "respond", description: "Acknowledged loyalty and checking options", timestamp: "2026-03-26T09:20:30Z" },
      { type: "action", description: "Generated unique code LOYAL-DAVID-12, requesting approval", timestamp: "2026-03-26T09:21:00Z" },
    ],
  },
  {
    id: "zd-4595",
    subject: "Where is my order? It's been 5 days",
    customerName: "Lisa Wang",
    customerEmail: "lisa.wang@yahoo.com",
    messages: [
      { from: "customer", text: "I ordered a coastal breeze candle set 5 days ago and still haven't received it. The tracking hasn't updated in 3 days. What's going on?", timestamp: "2026-03-26T08:30:00Z" },
      { from: "agent", text: "Hi Lisa! Let me look into your order right away. I found your order #CLC-10250 — it shipped 4 days ago via USPS. The tracking shows it's currently in transit and the estimated delivery is March 28. Sometimes tracking can lag behind the actual package location. Would you like me to keep an eye on it and update you if there are any changes?", timestamp: "2026-03-26T08:30:45Z" },
      { from: "customer", text: "Okay, thanks. I'll wait until the 28th then.", timestamp: "2026-03-26T08:32:00Z" },
      { from: "agent", text: "Sounds good! I'll follow up with you on March 28 if it hasn't arrived by then. Is there anything else I can help with?", timestamp: "2026-03-26T08:32:30Z" },
    ],
    takenOver: false,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Where Is My Order", timestamp: "2026-03-26T08:30:05Z" },
      { type: "action", description: "Looked up order #CLC-10250 in Shopify", timestamp: "2026-03-26T08:30:10Z" },
      { type: "action", description: "Retrieved tracking from USPS — in transit", timestamp: "2026-03-26T08:30:15Z" },
      { type: "respond", description: "Shared tracking status and ETA (March 28)", timestamp: "2026-03-26T08:30:45Z" },
      { type: "respond", description: "Offered follow-up on delivery date", timestamp: "2026-03-26T08:32:30Z" },
    ],
  },
  {
    id: "zd-4593",
    subject: "URGENT: I want to speak to a manager NOW",
    customerName: "Robert Chen",
    customerEmail: "robert.chen@gmail.com",
    messages: [
      { from: "customer", text: "This is RIDICULOUS. I've had THREE delivery attempts and your driver keeps marking it as 'not home' when I'm literally standing at my door. I want to speak to a MANAGER right now. This $450 bookshelf better arrive or I'm disputing the charge.", timestamp: "2026-03-26T08:00:00Z" },
      { from: "internal", text: "🚨 Escalating to human agent — customer explicitly requested manager, sentiment: very frustrated, high-value order ($450).", timestamp: "2026-03-26T08:00:15Z" },
    ],
    takenOver: true,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Shipping — Delivery Failure", timestamp: "2026-03-26T08:00:05Z" },
      { type: "action", description: "Verified 3 failed delivery attempts in carrier system", timestamp: "2026-03-26T08:00:08Z" },
      { type: "escalate", description: "Escalated: customer requested human + angry sentiment + $450 order", timestamp: "2026-03-26T08:00:15Z" },
    ],
  },
];
