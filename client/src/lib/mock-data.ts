// ══════════════════════════════════════════════════════════════
// Mock Data Layer — Seel AI Support Agent
// Brand: "Coastal Living Co" (home goods DTC)
// Rep: "Alex" | Manager: "Jordan Chen"
// ══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────

export type TopicType = "knowledge_gap" | "performance_report" | "open_question" | "escalation_review" | "rule_update";
export type TopicStatus = "unread" | "read" | "resolved";
export type MessageSender = "ai" | "manager";
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
export type PermissionLevel = "autonomous" | "disabled";
export type AgentMode = "training" | "production" | "off";
export type TicketSidebarState = "ai_handling" | "escalated" | "taken_over";

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
  type: "accept" | "reject" | "modify_accept" | "link";
  targetUrl?: string;
}

export interface ProposedRule {
  id: string;
  text: string;
  category: string;
  evidence: string[];
  status: "pending" | "accepted" | "rejected";
}

export interface Guardrail {
  id: string;
  label: string;
  type: "number" | "boolean";
  value?: number;
  unit?: string;
  enabled: boolean;
}

export interface ActionPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  permission: PermissionLevel;
  guardrails?: Guardrail[];
  lastModified: string;
  dependsOn?: string[];
}

// ── SOP-level Rule (replaces old flat Skill) ──────────────

export interface RuleEscalation {
  trigger: string;
  action: string;
}

export interface SOPRule {
  id: string;
  name: string;
  intent: string;
  policy: string;
  exceptions: string[];
  escalation: RuleEscalation;
  lastUpdated: string;
  updatedByTopicId?: string;
  sourceDocId?: string;
  tags?: string[];
}

// Keep Skill as alias for backward compat in legacy pages
export type Skill = SOPRule;

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
  sourceUrl?: string;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: number;
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

export interface BadCaseReport {
  id: string;
  ticketId: string;
  comment: string;
  createdAt: string;
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
  {
    id: "ap-1",
    name: "Issue Refund",
    description: "Process refund to original payment method",
    category: "Financial",
    permission: "autonomous",
    guardrails: [
      { id: "g-1-1", label: "Max refund amount", type: "number", value: 150, unit: "$", enabled: true },
    ],
    lastModified: "2026-03-10T14:00:00Z",
  },
  {
    id: "ap-2",
    name: "Cancel Order",
    description: "Cancel unfulfilled order and notify customer",
    category: "Order Management",
    permission: "autonomous",
    lastModified: "2026-03-01T09:00:00Z",
  },
  {
    id: "ap-3",
    name: "Create Return Label",
    description: "Generate prepaid return shipping label",
    category: "Returns",
    permission: "autonomous",
    lastModified: "2026-03-01T09:00:00Z",
  },
  {
    id: "ap-4",
    name: "Track Shipment",
    description: "Look up shipment status and share with customer",
    category: "Order Management",
    permission: "autonomous",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-5",
    name: "Apply Discount",
    description: "Apply discount code or manual discount",
    category: "Financial",
    permission: "autonomous",
    guardrails: [
      { id: "g-5-1", label: "Max discount percentage", type: "number", value: 15, unit: "%", enabled: true },
    ],
    lastModified: "2026-03-05T11:00:00Z",
  },
  {
    id: "ap-6",
    name: "Update Shipping Address",
    description: "Modify shipping address on unfulfilled order",
    category: "Order Management",
    permission: "autonomous",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-7",
    name: "Resend Order",
    description: "Create replacement shipment for lost/damaged items",
    category: "Order Management",
    permission: "autonomous",
    guardrails: [
      { id: "g-7-1", label: "Max order value", type: "number", value: 200, unit: "$", enabled: true },
    ],
    lastModified: "2026-03-08T16:00:00Z",
  },
  {
    id: "ap-8",
    name: "Create Coupon",
    description: "Generate unique discount coupon for customer retention",
    category: "Financial",
    permission: "disabled",
    lastModified: "2026-02-28T09:00:00Z",
    dependsOn: ["ap-5"],
  },
  {
    id: "ap-9",
    name: "Escalate to Manager",
    description: "Transfer ticket to human agent with context summary",
    category: "Workflow",
    permission: "autonomous",
    guardrails: [
      { id: "g-9-1", label: "Angry customer detected", type: "boolean", enabled: true },
      { id: "g-9-2", label: "Legal/safety keywords", type: "boolean", enabled: true },
      { id: "g-9-3", label: "Unresolved after N turns", type: "number", value: 4, unit: "turns", enabled: true },
      { id: "g-9-4", label: "Customer requests human", type: "boolean", enabled: true },
      { id: "g-9-5", label: "High-value order threshold", type: "number", value: 500, unit: "$", enabled: true },
      { id: "g-9-6", label: "Repeat contact threshold", type: "number", value: 3, unit: "times", enabled: true },
    ],
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-10",
    name: "Close Ticket",
    description: "Mark ticket as resolved after customer confirmation",
    category: "Workflow",
    permission: "autonomous",
    lastModified: "2026-02-28T09:00:00Z",
  },
];

// ── SOP Rules (replaces old flat SKILLS) ──────────────────

export const RULES: SOPRule[] = [
  {
    id: "rule-1",
    name: "Standard Return & Refund",
    intent: "Returns / Refunds",
    policy: "Process full refund for items returned within 30 days of delivery in original condition. Refund to original payment method only. For VIP customers (3+ completed orders), extend return window to 45 days.",
    exceptions: [
      "Final sale items are non-returnable.",
      "Items without tags or showing signs of use are not eligible.",
      "Spring Sale orders (Mar 15-31, 2026) have a 60-day return window.",
    ],
    escalation: {
      trigger: "Customer requests refund to a different payment method, or order value exceeds $150.",
      action: "Escalate to manager with order details and customer request.",
    },
    lastUpdated: "2026-03-20T09:00:00Z",
    updatedByTopicId: "t-4",
    sourceDocId: "doc-2",
    tags: ["Returns", "Refunds", "VIP"],
  },
  {
    id: "rule-2",
    name: "Where Is My Order (WISMO)",
    intent: "Order Tracking",
    policy: "Look up order in Shopify, retrieve shipment tracking. If shipped, share tracking link and estimated delivery date. If delayed >3 days past estimate, apologize and offer to contact carrier on customer's behalf.",
    exceptions: [
      "Never promise a specific delivery date — use estimated ranges.",
      "If tracking shows no movement for 7+ days, offer 10% discount on next order.",
    ],
    escalation: {
      trigger: "Package shows delivered but customer says not received, or carrier reports package lost.",
      action: "Escalate to manager for carrier claim initiation.",
    },
    lastUpdated: "2026-03-01T09:00:00Z",
    sourceDocId: "doc-1",
    tags: ["Shipping", "WISMO"],
  },
  {
    id: "rule-3",
    name: "Damaged / Wrong Item",
    intent: "Product Issues",
    policy: "For items under $80, process replacement or refund (customer's choice) without requiring photo evidence. For items $80+, request photo evidence before processing. Offer free return shipping for all defective/wrong items.",
    exceptions: [
      "If customer reports damage on a final-sale item, still process replacement (not refund).",
      "For wrong-item cases, do not require return of the incorrect item if value is under $80.",
    ],
    escalation: {
      trigger: "Customer claims damage on item over $200, or multiple damage claims from same customer within 30 days.",
      action: "Escalate to manager for fraud review before processing.",
    },
    lastUpdated: "2026-03-12T14:00:00Z",
    updatedByTopicId: "t-3",
    sourceDocId: "doc-1",
    tags: ["Product Issues", "Damage"],
  },
  {
    id: "rule-4",
    name: "Order Cancellation",
    intent: "Cancellations",
    policy: "Cancel unfulfilled orders immediately with full refund. For fulfilled/shipped orders, guide customer to the return process instead. Express sympathy for the inconvenience.",
    exceptions: [
      "Custom/personalized orders cannot be cancelled once production has started.",
    ],
    escalation: {
      trigger: "Customer insists on cancelling a shipped order and refuses return process.",
      action: "Escalate to manager with order status and customer sentiment.",
    },
    lastUpdated: "2026-03-01T09:00:00Z",
    sourceDocId: "doc-1",
    tags: ["Cancellations"],
  },
  {
    id: "rule-5",
    name: "Return Shipping Cost",
    intent: "Returns",
    policy: "Defective/wrong items: free return shipping (company pays). Change-of-mind returns: customer pays — provide prepaid label and deduct $8.95 from refund.",
    exceptions: [
      "VIP customers (3+ orders) get free return shipping on first change-of-mind return per year.",
    ],
    escalation: {
      trigger: "Customer disputes the $8.95 fee or claims item is defective when evidence suggests otherwise.",
      action: "Escalate to manager for judgment call.",
    },
    lastUpdated: "2026-03-20T09:00:00Z",
    updatedByTopicId: "t-7",
    sourceDocId: "doc-2",
    tags: ["Returns", "Shipping"],
  },
  {
    id: "rule-6",
    name: "International Returns",
    intent: "Returns",
    policy: "Return shipping is customer's responsibility for international orders. Customs duties are non-refundable (outside our control). For VIP customers, offer store credit equal to the duties amount as a goodwill gesture.",
    exceptions: [
      "Defective/wrong items shipped internationally still qualify for free return shipping.",
    ],
    escalation: {
      trigger: "Customer threatens chargeback over customs duties, or return involves items over $300.",
      action: "Escalate to manager immediately.",
    },
    lastUpdated: "2026-03-25T16:00:00Z",
    updatedByTopicId: "t-8",
    sourceDocId: "doc-2",
    tags: ["Returns", "International"],
  },
];

// Backward-compatible alias for legacy pages
export const SKILLS = RULES;

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  { id: "doc-1", name: "Coastal Living Co — Customer Service SOP v3.2.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "2.4 MB", extractedRules: 12, status: "processed", sourceUrl: "/documents/sop-v3.2.pdf" },
  { id: "doc-2", name: "Return & Refund Policy — March 2026.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "890 KB", extractedRules: 5, status: "processed", sourceUrl: "/documents/return-policy.pdf" },
  { id: "doc-3", name: "Shipping Partner SLA & Escalation Guide.doc", type: "doc", uploadedAt: "2026-03-05T14:00:00Z", size: "1.1 MB", extractedRules: 3, status: "processed", sourceUrl: "/documents/shipping-sla.doc" },
  { id: "doc-4", name: "VIP Customer Handling Guidelines.pdf", type: "pdf", uploadedAt: "2026-03-10T11:00:00Z", size: "540 KB", extractedRules: 4, status: "processed", sourceUrl: "/documents/vip-guidelines.pdf" },
  { id: "doc-5", name: "Product Warranty Terms — All Categories.csv", type: "csv", uploadedAt: "2026-03-15T16:00:00Z", size: "320 KB", extractedRules: 8, status: "processed", sourceUrl: "/documents/warranty-terms.csv" },
  { id: "doc-6", name: "Coastal Living Co FAQ Page", type: "url", uploadedAt: "2026-03-18T10:00:00Z", size: "—", extractedRules: 6, status: "processed", sourceUrl: "https://coastalliving.com/faq" },
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
      { id: "m-1-1", sender: "ai", content: "I've noticed a pattern over the past 3 days: **8 customers** have requested refunds to a different payment method than the one they used for purchase.\n\nCurrently, I escalate these because I don't have a clear rule. Here's what I've observed:\n\n- 5 customers wanted refund to PayPal (paid by credit card)\n- 2 customers had expired cards\n- 1 customer wanted a bank transfer\n\nI'd like to propose a rule:", timestamp: "2026-03-26T08:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Modify & Accept", type: "modify_accept" }, { label: "Reject", type: "reject" }] },
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
      { id: "m-3-3", sender: "ai", content: "Got it! I've updated my **Damaged / Wrong Item** rule:\n\n> For damage claims on items under $80, process replacement or refund (customer's choice) without requiring photo evidence. For items $80+, still request photo before processing.\n\nThis should reduce escalations for low-value damage claims. I'll monitor the impact.", timestamp: "2026-03-12T14:31:00Z" },
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
      { id: "m-7-1", sender: "ai", content: "Yesterday you **denied** my approval request on ticket #4498. I wanted to charge the customer $8.95 return shipping for a defective item.\n\nAfter reviewing your handling, I realized I was applying the change-of-mind return shipping policy to a defective item case. These should be different:\n\n**Proposed update:**\n- Defective/wrong items → free return shipping (we pay)\n- Change of mind → customer pays ($8.95 deducted from refund)\n\nIs this correct?", timestamp: "2026-03-19T14:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Modify & Accept", type: "modify_accept" }, { label: "Reject", type: "reject" }] },
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
      { id: "m-8-1", sender: "ai", content: "I've been escalating all international return requests because I'm unsure about two things:\n\n1. **Return shipping for international orders** — who pays?\n2. **Customs duties** — are these refundable?\n\nThis week alone I escalated 5 tickets for this reason. Here's my proposed rule based on observing how your team handled them:\n\n> For international returns: return shipping is customer's responsibility. Customs duties are non-refundable (we can't control this). For VIP customers, offer store credit equal to the duties amount as goodwill.\n\nDoes this match your policy?", timestamp: "2026-03-25T16:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Modify & Accept", type: "modify_accept" }, { label: "Reject", type: "reject" }] },
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

// ── Zendesk Sidebar Mock Data (simplified: handling / escalated only) ──

export interface ZendeskTicketMessage {
  from: "customer" | "agent" | "internal";
  text: string;
  timestamp: string;
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
  state: TicketSidebarState;
  takenOver: boolean;
  markedBadCase: boolean;
  badCaseNote?: string;
  aiActivity: ZendeskTicketActivity[];
  // AI handling details
  confidence?: number;
  intentDetected?: string;
  currentStep?: string;
  // Escalation details
  escalationReason?: string;
  escalationSummary?: string;
}

export const ZENDESK_TICKETS: ZendeskTicket[] = [
  {
    id: "zd-4595",
    subject: "Where is my order? It's been 5 days",
    customerName: "Lisa Wang",
    customerEmail: "lisa.wang@yahoo.com",
    state: "ai_handling",
    confidence: 0.94,
    intentDetected: "Where Is My Order",
    currentStep: "Shared tracking link and updated ETA with customer",
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
    id: "zd-4589",
    subject: "I need a refund for my broken lamp",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah.m@gmail.com",
    state: "ai_handling",
    confidence: 0.92,
    intentDetected: "Product Issues — Damaged Item",
    currentStep: "Processing refund of $89.99 to original payment method",
    messages: [
      { from: "customer", text: "Hi, I received my ceramic table lamp yesterday and the base is completely cracked. I'd like a full refund please.", timestamp: "2026-03-26T09:00:00Z" },
      { from: "agent", text: "Hi Sarah! I'm so sorry to hear about the damaged lamp. I can see your order #CLC-10234 and the ceramic table lamp ($89.99). Since this is a damaged item, I'll process a full refund for you right away. You don't need to return the damaged item.", timestamp: "2026-03-26T09:01:00Z" },
      { from: "agent", text: "Your refund of $89.99 has been initiated to your Visa ending in 4242. Please allow 3-5 business days for it to appear. Is there anything else I can help with?", timestamp: "2026-03-26T09:01:30Z" },
    ],
    takenOver: false,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Product Issues — Damaged Item", timestamp: "2026-03-26T09:00:05Z" },
      { type: "action", description: "Verified order #CLC-10234 in Shopify", timestamp: "2026-03-26T09:00:10Z" },
      { type: "action", description: "Item $89.99 > $80 threshold, but customer described clear damage", timestamp: "2026-03-26T09:00:12Z" },
      { type: "respond", description: "Confirmed damage and initiated refund", timestamp: "2026-03-26T09:01:00Z" },
      { type: "action", description: "Processed refund of $89.99 to Visa ending 4242", timestamp: "2026-03-26T09:01:30Z" },
    ],
  },
  {
    id: "zd-4593",
    subject: "URGENT: I want to speak to a manager NOW",
    customerName: "Robert Chen",
    customerEmail: "robert.chen@gmail.com",
    state: "escalated",
    intentDetected: "Shipping — Delivery Failure",
    escalationReason: "Customer explicitly requested human agent. Sentiment: very frustrated. High-value order ($450).",
    escalationSummary: "Customer ordered a coastal oak bookshelf ($450). Delivery attempted 3 times — customer was home each time but driver marked as 'not home'. Customer is understandably frustrated and demanding to speak with a manager.",
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
  {
    id: "zd-4591",
    subject: "Can I get a discount? I've been a loyal customer",
    customerName: "David Park",
    customerEmail: "david.park@outlook.com",
    state: "ai_handling",
    confidence: 0.85,
    intentDetected: "Pre-sale — Loyalty Discount Request",
    currentStep: "Applied 12% discount code LOYAL-DAVID-12",
    messages: [
      { from: "customer", text: "Hey! I've been shopping with you guys for over a year now. Any chance I could get a loyalty discount on my current cart? It's $234.50.", timestamp: "2026-03-26T09:20:00Z" },
      { from: "agent", text: "Hi David! Thank you so much for being a loyal customer — I can see you've placed 7 orders with us. I'd love to offer you a 12% loyalty discount! I've generated a unique code for you: LOYAL-DAVID-12. That brings your total to $206.36, saving you $28.14.", timestamp: "2026-03-26T09:20:30Z" },
      { from: "customer", text: "Awesome, thanks so much!", timestamp: "2026-03-26T09:22:00Z" },
    ],
    takenOver: false,
    markedBadCase: false,
    aiActivity: [
      { type: "classify", description: "Classified as Pre-sale — Loyalty Discount Request", timestamp: "2026-03-26T09:20:05Z" },
      { type: "action", description: "Verified customer has 7 completed orders (VIP)", timestamp: "2026-03-26T09:20:10Z" },
      { type: "action", description: "Checked discount history — no prior discounts", timestamp: "2026-03-26T09:20:15Z" },
      { type: "action", description: "Generated unique code LOYAL-DAVID-12 (12%)", timestamp: "2026-03-26T09:20:25Z" },
      { type: "respond", description: "Applied discount and shared code with customer", timestamp: "2026-03-26T09:20:30Z" },
    ],
  },
];

// Legacy Zendesk types for backward compat (used by unused pages)
export type ApprovalRequest = { id: string; ticketId: string; ticketSubject: string; customerName: string; actionType: string; actionLabel: string; parameters: Record<string, string | number>; reasoning: string; status: ApprovalStatus; createdAt: string; timeoutAt: string; aiConfidence: number; intentDetected: string; actionsTaken: string[]; };
export const MOCK_TICKETS: ApprovalRequest[] = [];
