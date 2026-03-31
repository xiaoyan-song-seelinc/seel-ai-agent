// ══════════════════════════════════════════════════════════════
// Mock Data Layer — Seel AI Support Agent
// Brand: "Coastal Living Co" (home goods DTC)
// Rep: "Alex" | Manager: "Jordan Chen"
// ══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────

export type TopicType = "knowledge_gap" | "performance_report" | "performance_summary" | "open_question" | "escalation_review" | "rule_update" | "question";
export type TopicStatus = "unread" | "read" | "resolved";
export type MessageSender = "ai" | "manager";
export type PermissionLevel = "autonomous" | "disabled";
export type AgentMode = "training" | "production" | "off";
export type TicketSidebarState = "ai_handling" | "escalated" | "taken_over";
export type EscalationStatus = "needs_attention" | "resolved";

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
  dailyDigest?: {
    periodLabel: string;
    kpis: { label: string; value: string; delta: string; positive: boolean }[];
    topIntent: { name: string; resolution: string; volume: number };
    worstIntent: { name: string; resolution: string; volume: number; ruleName: string; ruleLink: string };
    recommendations: { text: string; linkLabel: string; linkPath: string }[];
  };
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  managerName?: string; // e.g. "Jordan Chen", "Alex Song" — defaults to primary manager
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
  ruleName: string;
  type: "new" | "update";
  before?: string;
  after: string;
  source?: string;
  category: string;
  evidence: string[];
  status: "pending" | "accepted" | "rejected";
  confidence?: "high" | "medium" | "low";
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
  locked: boolean;
  type: "read" | "write";
}

// ── SOP-level Rule ──────────────────────────────────────────

export interface RuleVersion {
  version: number;
  text: string;
  changedAt: string;
  conversationId?: string;
  conversationTitle?: string;
  changeDescription: string;
}

export interface SOPRule {
  id: string;
  name: string;
  content: string;
  lastUpdated: string;
  updatedByTopicId?: string;
  sourceDocId?: string;
  tags?: string[];
  actions?: string[];
  invocationCount: number;
  avgCsat: number;
  deflectionRate: number;
  versions: RuleVersion[];
}

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
  inUse: boolean;
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
  sentimentChangedRate: number;
  firstResponseTime: number;
  fullResolutionTime: number;
  volume: number;
}

export interface IntentMetric {
  intent: string;
  volume: number;
  resolutionRate: number;
  csat: number;
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

// ── Escalation Ticket (for Rep conversation in Communication tab) ──

export interface EscalationTicket {
  id: string;
  zendeskTicketId: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: EscalationStatus;
  reason: string;
  summary: string;
  sentiment: "frustrated" | "neutral" | "urgent";
  orderValue?: number;
  createdAt: string;
  resolvedAt?: string;
  zendeskUrl: string;
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
    connected: false,
    metadata: {},
  },
  {
    platform: "shopify",
    connected: true,
    connectedAt: "2026-02-25T10:45:00Z",
    metadata: { storeUrl: "coastalliving.myshopify.com", products: 847, monthlyOrders: 3200 },
  },
];

export const ACTION_PERMISSIONS: ActionPermission[] = [
  // ── Write Actions (visible in UI) ──
  {
    id: "ap-1",
    name: "Reply to customer",
    description: "Send a response to the customer",
    category: "Communication",
    permission: "autonomous",
    locked: true,
    type: "write",
    lastModified: "2026-03-10T14:00:00Z",
  },
  {
    id: "ap-2",
    name: "Escalate to human",
    description: "Transfer ticket to human agent with context summary",
    category: "Communication",
    permission: "autonomous",
    locked: true,
    type: "write",
    lastModified: "2026-03-10T14:00:00Z",
  },
  {
    id: "ap-5",
    name: "Cancel order",
    description: "Cancel unfulfilled order and notify customer",
    category: "Order Management",
    permission: "disabled",
    locked: false,
    type: "write",
    guardrails: [
      { id: "g-5-1", label: "Only unfulfilled orders", type: "boolean", enabled: true },
      { id: "g-5-2", label: "Within hours of placement", type: "number", value: 2, unit: "hours", enabled: true },
    ],
    lastModified: "2026-03-01T09:00:00Z",
  },
  {
    id: "ap-8",
    name: "Edit shipping address",
    description: "Update shipping address on unfulfilled orders",
    category: "Order Management",
    permission: "disabled",
    locked: false,
    type: "write",
    guardrails: [
      { id: "g-8-1", label: "Only unfulfilled orders", type: "boolean", enabled: true },
    ],
    lastModified: "2026-03-01T09:00:00Z",
  },
  {
    id: "ap-9",
    name: "File Seel claim",
    description: "Submit a Seel protection claim on behalf of the customer",
    category: "Seel Protection",
    permission: "disabled",
    locked: false,
    type: "write",
    guardrails: [
      { id: "g-9-1", label: "Requires customer confirmation", type: "boolean", enabled: true },
    ],
    lastModified: "2026-03-01T09:00:00Z",
  },
  // ── Read Actions (always enabled, not shown in config UI) ──
  {
    id: "ap-3",
    name: "Track shipment",
    description: "Look up shipment status and share with customer",
    category: "Order Management",
    permission: "autonomous",
    locked: true,
    type: "read",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-4",
    name: "Look up order details",
    description: "Retrieve order information from Shopify",
    category: "Order Management",
    permission: "autonomous",
    locked: true,
    type: "read",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-6",
    name: "Look up customer info",
    description: "Retrieve customer profile and order history",
    category: "Customer",
    permission: "autonomous",
    locked: true,
    type: "read",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-10",
    name: "Look up product info",
    description: "Retrieve product details, inventory, and pricing",
    category: "Product",
    permission: "autonomous",
    locked: true,
    type: "read",
    lastModified: "2026-02-28T09:00:00Z",
  },
  {
    id: "ap-11",
    name: "Look up Seel protection",
    description: "Check Seel protection status, coverage, and claim history",
    category: "Seel Protection",
    permission: "autonomous",
    locked: true,
    type: "read",
    lastModified: "2026-02-28T09:00:00Z",
  },
];

// Helper: only write actions shown in configuration UI
export const WRITE_ACTIONS = ACTION_PERMISSIONS.filter(a => a.type === "write");
export const READ_ACTIONS = ACTION_PERMISSIONS.filter(a => a.type === "read");

// ── SOP Rules ──────────────────────────────────────────────

export const RULES: SOPRule[] = [
  {
    id: "rule-1",
    name: "Standard Return & Refund",
    content: "Process full refund for items returned within 30 days of delivery in original condition. Refund to original payment method only. For VIP customers (3+ completed orders), extend return window to 45 days. Verify order date and customer tier before processing. If the item is eligible, initiate refund through the payment gateway and send confirmation email.\n\nExceptions: Final sale items are non-returnable. Items without tags or showing signs of use are not eligible. Spring Sale orders (Mar 15-31, 2026) have a 60-day return window.\n\nEscalate when: Customer requests refund to a different payment method, or order value exceeds $150. Escalate to manager with order details and customer request.",
    lastUpdated: "2026-03-20T09:00:00Z",
    updatedByTopicId: "t-4",
    sourceDocId: "doc-2",
    tags: ["Returns", "Refunds", "VIP"],
    actions: ["ap-1", "ap-3"],
    invocationCount: 156,
    avgCsat: 4.5,
    deflectionRate: 82,
    versions: [
      { version: 3, text: "Process full refund for items returned within 30 days of delivery in original condition. Refund to original payment method only. For VIP customers (3+ completed orders), extend return window to 45 days.", changedAt: "2026-03-20T09:00:00Z", conversationId: "t-4", conversationTitle: "VIP customer refund window extension", changeDescription: "Added VIP 45-day return window" },
      { version: 2, text: "Process full refund for items returned within 30 days of delivery in original condition. Refund to original payment method only.", changedAt: "2026-03-10T14:00:00Z", conversationId: "t-6", conversationTitle: "Holiday return policy extension", changeDescription: "Added Spring Sale 60-day exception" },
      { version: 1, text: "Process full refund for items returned within 30 days of purchase.", changedAt: "2026-03-01T09:00:00Z", changeDescription: "Initial rule extracted from Return Policy document" },
    ],
  },
  {
    id: "rule-2",
    name: "Where Is My Order (WISMO)",
    content: "Look up order in Shopify, retrieve shipment tracking. If shipped, share tracking link and estimated delivery date. If delayed >3 days past estimate, apologize and offer to contact carrier on customer's behalf. Always provide the tracking number and carrier name in the response.\n\nExceptions: Never promise a specific delivery date — use estimated ranges. If tracking shows no movement for 7+ days, offer 10% discount on next order.\n\nEscalate when: Package shows delivered but customer says not received, or carrier reports package lost. Escalate to manager for carrier claim initiation.",
    lastUpdated: "2026-03-01T09:00:00Z",
    sourceDocId: "doc-1",
    tags: ["Shipping", "WISMO"],
    actions: ["ap-4"],
    invocationCount: 243,
    avgCsat: 4.6,
    deflectionRate: 91,
    versions: [
      { version: 1, text: "Look up order in Shopify, retrieve shipment tracking. If shipped, share tracking link and estimated delivery date.", changedAt: "2026-03-01T09:00:00Z", changeDescription: "Initial rule extracted from Customer Service SOP" },
    ],
  },
  {
    id: "rule-3",
    name: "Damaged / Wrong Item",
    content: "For items under $80, process replacement or refund (customer's choice) without requiring photo evidence. For items $80+, request photo evidence before processing. Offer free return shipping for all defective/wrong items. Acknowledge the inconvenience and express empathy before offering resolution options.\n\nExceptions: If customer reports damage on a final-sale item, still process replacement (not refund). For wrong-item cases, do not require return of the incorrect item if value is under $80.\n\nEscalate when: Customer claims damage on item over $200, or multiple damage claims from same customer within 30 days. Escalate to manager for fraud review before processing.",
    lastUpdated: "2026-03-12T14:00:00Z",
    updatedByTopicId: "t-3",
    sourceDocId: "doc-1",
    tags: ["Product Issues", "Damage"],
    actions: ["ap-1", "ap-3"],
    invocationCount: 89,
    avgCsat: 4.2,
    deflectionRate: 68,
    versions: [
      { version: 2, text: "For items under $80, process replacement or refund without requiring photo evidence. For items $80+, request photo evidence before processing.", changedAt: "2026-03-12T14:00:00Z", conversationId: "t-3", conversationTitle: "Learned: Damaged item photo not always needed", changeDescription: "Added $80 threshold — low-value items skip photo" },
      { version: 1, text: "For all damage claims, request photo evidence before processing replacement or refund.", changedAt: "2026-03-01T09:00:00Z", changeDescription: "Initial rule extracted from Customer Service SOP" },
    ],
  },
  {
    id: "rule-4",
    name: "Order Cancellation",
    content: "Cancel unfulfilled orders immediately with full refund. For fulfilled/shipped orders, guide customer to the return process instead. Express sympathy for the inconvenience. Confirm the cancellation with an email notification to the customer.\n\nExceptions: Custom/personalized orders cannot be cancelled once production has started.\n\nEscalate when: Customer insists on cancelling a shipped order and refuses return process. Escalate to manager with order status and customer sentiment.",
    lastUpdated: "2026-03-01T09:00:00Z",
    sourceDocId: "doc-1",
    tags: ["Cancellations"],
    actions: ["ap-2", "ap-1"],
    invocationCount: 67,
    avgCsat: 4.4,
    deflectionRate: 75,
    versions: [
      { version: 1, text: "Cancel unfulfilled orders immediately with full refund. For fulfilled/shipped orders, guide customer to the return process instead.", changedAt: "2026-03-01T09:00:00Z", changeDescription: "Initial rule extracted from Customer Service SOP" },
    ],
  },
  {
    id: "rule-5",
    name: "Return Shipping Cost",
    content: "Defective/wrong items: free return shipping (company pays). Change-of-mind returns: customer pays — provide prepaid label and deduct $8.95 from refund. Clearly explain the shipping cost policy to the customer before generating the return label.\n\nExceptions: VIP customers (3+ orders) get free return shipping on first change-of-mind return per year.\n\nEscalate when: Customer disputes the $8.95 fee or claims item is defective when evidence suggests otherwise. Escalate to manager for judgment call.",
    lastUpdated: "2026-03-20T09:00:00Z",
    updatedByTopicId: "t-7",
    sourceDocId: "doc-2",
    tags: ["Returns", "Shipping"],
    actions: ["ap-3"],
    invocationCount: 42,
    avgCsat: 4.1,
    deflectionRate: 58,
    versions: [
      { version: 2, text: "Defective/wrong items: free return shipping. Change-of-mind returns: customer pays $8.95.", changedAt: "2026-03-20T09:00:00Z", conversationId: "t-7", conversationTitle: "Return shipping cost for defective items", changeDescription: "Clarified defective vs change-of-mind shipping cost" },
      { version: 1, text: "Return shipping costs $8.95 for all returns.", changedAt: "2026-03-01T09:00:00Z", changeDescription: "Initial rule extracted from Return Policy document" },
    ],
  },
  {
    id: "rule-6",
    name: "International Returns",
    content: "Return shipping is customer's responsibility for international orders. Customs duties are non-refundable (outside our control). For VIP customers, offer store credit equal to the duties amount as a goodwill gesture. Provide clear instructions on how to ship the item back internationally.\n\nExceptions: Defective/wrong items shipped internationally still qualify for free return shipping.\n\nEscalate when: Customer threatens chargeback over customs duties, or return involves items over $300. Escalate to manager immediately.",
    lastUpdated: "2026-03-25T16:00:00Z",
    updatedByTopicId: "t-8",
    sourceDocId: "doc-2",
    tags: ["Returns", "International"],
    actions: ["ap-3", "ap-1"],
    invocationCount: 18,
    avgCsat: 4.3,
    deflectionRate: 72,
    versions: [
      { version: 1, text: "Return shipping is customer's responsibility for international orders. Customs duties are non-refundable.", changedAt: "2026-03-25T16:00:00Z", conversationId: "t-8", conversationTitle: "International order return complications", changeDescription: "New rule created from Team Lead conversation" },
    ],
  },
];

export const SKILLS = RULES;

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  { id: "doc-1", name: "Coastal Living Co — Customer Service SOP v3.2.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "2.4 MB", extractedRules: 12, status: "processed", sourceUrl: "/documents/sop-v3.2.pdf", inUse: true },
  { id: "doc-2", name: "Return & Refund Policy — March 2026.pdf", type: "pdf", uploadedAt: "2026-03-01T09:00:00Z", size: "890 KB", extractedRules: 5, status: "processed", sourceUrl: "/documents/return-policy.pdf", inUse: true },
  { id: "doc-3", name: "Shipping Partner SLA & Escalation Guide.doc", type: "doc", uploadedAt: "2026-03-05T14:00:00Z", size: "1.1 MB", extractedRules: 3, status: "processed", sourceUrl: "/documents/shipping-sla.doc", inUse: true },
  { id: "doc-4", name: "VIP Customer Handling Guidelines.pdf", type: "pdf", uploadedAt: "2026-03-10T11:00:00Z", size: "540 KB", extractedRules: 4, status: "processed", sourceUrl: "/documents/vip-guidelines.pdf", inUse: true },
  { id: "doc-5", name: "Product Warranty Terms — All Categories.csv", type: "csv", uploadedAt: "2026-03-15T16:00:00Z", size: "320 KB", extractedRules: 8, status: "processed", sourceUrl: "/documents/warranty-terms.csv", inUse: false },
  { id: "doc-6", name: "Coastal Living Co FAQ Page", type: "url", uploadedAt: "2026-03-18T10:00:00Z", size: "—", extractedRules: 6, status: "processed", sourceUrl: "https://coastalliving.com/faq", inUse: true },
];

// ── Escalation Tickets (Rep conversation) ──────────────────

export const ESCALATION_TICKETS: EscalationTicket[] = [
  {
    id: "esc-1",
    zendeskTicketId: "4593",
    subject: "URGENT: Want to speak to a manager",
    customerName: "Robert Chen",
    customerEmail: "robert.chen@gmail.com",
    status: "needs_attention",
    reason: "Customer explicitly requested human agent",
    summary: "Customer ordered coastal oak bookshelf ($450). 3 failed delivery attempts — driver marked 'not home' each time. Customer very frustrated, demanding manager.",
    sentiment: "frustrated",
    orderValue: 450,
    createdAt: "2026-03-26T08:00:00Z",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4593",
  },
  {
    id: "esc-2",
    zendeskTicketId: "4599",
    subject: "Customs duties on my return",
    customerName: "James Wilson",
    customerEmail: "james.w@mail.co.uk",
    status: "needs_attention",
    reason: "No rule for international customs duties refund",
    summary: "International return — customer paid £22 in customs. No policy for customs duties refund. 5th similar case this week.",
    sentiment: "neutral",
    createdAt: "2026-03-26T11:00:00Z",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4599",
  },
  {
    id: "esc-3",
    zendeskTicketId: "4601",
    subject: "Wrong color received — want exchange",
    customerName: "Maria Santos",
    customerEmail: "maria.s@gmail.com",
    status: "needs_attention",
    reason: "Customer wants exchange (not in current action set)",
    summary: "Received ocean blue throw pillow instead of sage green. Wants exchange, not refund. Exchange action not currently enabled.",
    sentiment: "neutral",
    createdAt: "2026-03-25T14:00:00Z",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4601",
  },
  {
    id: "esc-4",
    zendeskTicketId: "4580",
    subject: "Refund still not received after 2 weeks",
    customerName: "Tom Bradley",
    customerEmail: "tom.b@outlook.com",
    status: "resolved",
    reason: "Refund processing delay beyond normal timeframe",
    summary: "Customer returned item 2 weeks ago, refund not yet received. Investigated — payment processor delay. Manually expedited.",
    sentiment: "frustrated",
    orderValue: 125,
    createdAt: "2026-03-20T09:00:00Z",
    resolvedAt: "2026-03-21T14:00:00Z",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4580",
  },
  {
    id: "esc-5",
    zendeskTicketId: "4605",
    subject: "Bulk order discount request",
    customerName: "Jennifer Lee",
    customerEmail: "jennifer.lee@designstudio.com",
    status: "needs_attention",
    reason: "Bulk/wholesale inquiry — outside standard rules",
    summary: "Interior designer wants to order 25 coastal throw pillows for a hotel project. Asking for wholesale pricing. No rule for B2B/bulk orders.",
    sentiment: "neutral",
    orderValue: 1250,
    createdAt: "2026-03-26T13:00:00Z",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4605",
  },
];

// ── Topics (Team Lead conversation) ────────────────────────

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
      ruleName: "Refund Payment Method Policy",
      type: "new",
      after: "When customer requests refund to a different payment method, explain that refunds can only be processed to the original payment method due to payment processor restrictions. Offer store credit as an alternative.",
      source: "Ticket #4521, #4533, #4540",
      category: "Refunds",
      evidence: ["Ticket #4521 — customer wanted refund to PayPal instead of credit card", "Ticket #4533 — customer's original card expired", "Ticket #4540 — customer wanted refund to bank account"],
      status: "pending",
      confidence: "high",
    },
    messages: [
      { id: "m-1-1", sender: "ai", content: "I've noticed a pattern over the past 3 days: **8 customers** have requested refunds to a different payment method than the one they used for purchase.\n\nCurrently, I escalate these because I don't have a clear rule. Here's what I've observed:\n\n- 5 customers wanted refund to PayPal (paid by credit card)\n- 2 customers had expired cards\n- 1 customer wanted a bank transfer\n\nI'd like to propose a rule:", timestamp: "2026-03-26T08:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Modify & Accept", type: "modify_accept" }, { label: "Reject", type: "reject" }] },
      { id: "m-1-2", sender: "ai", content: "**Proposed rule:** When customer requests refund to a different payment method, explain that refunds can only be processed to the original payment method due to payment processor restrictions. Offer store credit as an alternative.\n\nFor expired cards specifically, advise the customer to contact their bank — the refund will still process to the old card number and the bank will handle forwarding.\n\nShould I adopt this rule?", timestamp: "2026-03-26T08:00:30Z" },
    ],
  },
  {
    id: "t-2",
    type: "performance_summary",
    title: "Daily Digest — Mar 30, 2026",
    status: "unread",
    createdAt: "2026-03-30T06:00:00Z",
    updatedAt: "2026-03-30T06:00:00Z",
    preview: "This week Ava handled 156 tickets with a 78.5% auto-resolution rate...",
    messages: [
      { id: "m-2-1", sender: "ai", content: "Here's your daily update. See the structured breakdown below.", timestamp: "2026-03-30T06:00:00Z" },
    ],
    dailyDigest: {
      periodLabel: "Mar 30, 2026",
      kpis: [
        { label: "Tickets Handled", value: "156", delta: "+12%", positive: true },
        { label: "Auto-Resolution", value: "78.5%", delta: "+3.2%", positive: true },
        { label: "CSAT", value: "4.6/5", delta: "+0.2", positive: true },
        { label: "First Response", value: "42s", delta: "-8s", positive: true },
        { label: "Full Resolution", value: "11m 20s", delta: "-2m 10s", positive: true },
      ],
      topIntent: { name: "WISMO", resolution: "92%", volume: 64 },
      worstIntent: { name: "Return & Refund", resolution: "54%", volume: 38, ruleName: "Return & Refund Handling", ruleLink: "/playbook" },
      recommendations: [
        { text: "Return & Refund escalations increased 15% yesterday. Most escalations involve orders over $200 where the refund exceeds the guardrail limit. Consider raising the guardrail or adding a rule for high-value returns.", linkLabel: "Edit guardrail", linkPath: "/config" },
        { text: "WISMO resolution rate is at 92%, the highest across all intents. Consider documenting this rule pattern as a template for other intents.", linkLabel: "View WISMO rule", linkPath: "/playbook" },
        { text: "3 customers rated CSAT low citing overly formal tone on live chat. Consider switching to friendly tone for the chat channel.", linkLabel: "Edit Rep tone settings", linkPath: "/config" },
      ],
    },
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
      { id: "m-3-2", sender: "manager", managerName: "Jordan Chen", content: "Good catch. Yes — for items under $80, don't require photo evidence. It's not worth the customer friction. Just process the replacement or refund based on their preference.", timestamp: "2026-03-12T14:30:00Z" },
      { id: "m-3-2b", sender: "manager", managerName: "Alex Song", content: "Agreed — I'd set the threshold at $80 as Jordan said. Also add a note to flag VIP customers at any price point.", timestamp: "2026-03-12T14:45:00Z" },
      { id: "m-3-3", sender: "ai", content: "Got it! I've updated my **Damaged / Wrong Item** rule:\n\n> For damage claims on items under $80, process replacement or refund (customer's choice) without requiring photo evidence. For items $80+, still request photo before processing.\n\nThis should reduce escalations for low-value damage claims. I'll monitor the impact.", timestamp: "2026-03-12T14:46:00Z" },
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
      { id: "m-4-2", sender: "manager", managerName: "Jordan Chen", content: "Good find. Yes, extend to 45 days for VIP customers. I'll update the SOP too. VIP = 3 or more completed orders.", timestamp: "2026-03-14T15:00:00Z" },
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
      { id: "m-6-1", sender: "manager", managerName: "Alex Song", content: "New rule: For orders placed during our Spring Sale (March 15-31), extend the return window to 60 days instead of the standard 30. This applies to all customers, not just VIP.", timestamp: "2026-03-20T09:00:00Z" },
      { id: "m-6-2", sender: "ai", content: "Understood! I've added this as a temporary rule:\n\n> Orders placed between March 15-31, 2026 have a 60-day return window (expires May 30, 2026). Applies to all customers.\n\nThis overrides the standard 30-day window and the VIP 45-day window for qualifying orders. I'll automatically revert to normal policy after May 30.\n\nDoes this look correct?", timestamp: "2026-03-20T09:01:00Z" },
      { id: "m-6-3", sender: "manager", managerName: "Alex Song", content: "Perfect, that's correct.", timestamp: "2026-03-20T09:30:00Z" },
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
      ruleName: "International Returns Policy",
      type: "new",
      after: "For international returns, inform customer that return shipping is their responsibility and customs duties are non-refundable. Offer store credit for the duties amount as a goodwill gesture for VIP customers.",
      source: "Ticket #4560, #4567",
      category: "Returns",
      evidence: ["Ticket #4560 — UK customer confused about duties refund", "Ticket #4567 — Canadian customer expected free return shipping"],
      status: "pending",
      confidence: "high",
    },
    messages: [
      { id: "m-8-1", sender: "ai", content: "I've been escalating all international return requests because I'm unsure about two things:\n\n1. **Return shipping for international orders** — who pays?\n2. **Customs duties** — are these refundable?\n\nThis week alone I escalated 5 tickets for this reason. Here's my proposed rule based on observing how your team handled them:\n\n> For international returns: return shipping is customer's responsibility. Customs duties are non-refundable (we can't control this). For VIP customers, offer store credit equal to the duties amount as goodwill.\n\nDoes this match your policy?", timestamp: "2026-03-25T16:00:00Z", actions: [{ label: "Accept Rule", type: "accept" }, { label: "Modify & Accept", type: "modify_accept" }, { label: "Reject", type: "reject" }] },
    ],
  },
  {
    id: "t-question-1",
    type: "question",
    title: "Payment methods — Afterpay support?",
    status: "unread",
    createdAt: "2026-03-30T09:01:00Z",
    updatedAt: "2026-03-30T09:01:00Z",
    preview: "4 customers asked about Afterpay this week. Not in knowledge base.",
    messages: [
      {
        id: "mq-1",
        sender: "ai",
        content: "4 customers asked \"Do you support Afterpay?\" this week. I couldn't find this information in your documents. Do you support Afterpay as a payment method?",
        timestamp: "2026-03-30T09:01:00Z",
      },
    ],
  },
];

// ── Performance Data ────────────────────────────────────────

export const PERFORMANCE_SUMMARY: PerformanceMetric[] = [
  { label: "Auto-Resolution Rate", value: 68, unit: "%", trend: 4, trendLabel: "vs previous day" },
  { label: "CSAT Score", value: 4.3, unit: "/5", trend: 0.2, trendLabel: "vs previous day" },
  { label: "Sentiment Changed", value: 8.3, unit: "%", trend: -1.1, trendLabel: "vs previous day" },
  { label: "First Response Time", value: 45, unit: "s", trend: -8, trendLabel: "vs previous day" },
  { label: "Full Resolution Time", value: 750, unit: "s", trend: -130, trendLabel: "vs previous day" },
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
    sentimentChangedRate: Math.max(3, 15 - i * 0.25 + (Math.random() * 4 - 2)),
    firstResponseTime: Math.max(30, 90 - i * 1.5 + (Math.random() * 15 - 7)),
    fullResolutionTime: Math.max(300, 1200 - i * 20 + (Math.random() * 200 - 100)),
    volume: Math.round(baseVolume * growthFactor + (Math.random() * 10 - 5)),
  };
});

export const INTENT_METRICS: IntentMetric[] = [
  { intent: "Where Is My Order", volume: 156, resolutionRate: 89, csat: 4.5 },
  { intent: "Refunds", volume: 98, resolutionRate: 62, csat: 4.0 },
  { intent: "Cancellations", volume: 67, resolutionRate: 78, csat: 4.2 },
  { intent: "Product Issues", volume: 52, resolutionRate: 55, csat: 3.8 },
  { intent: "Shipping", volume: 45, resolutionRate: 71, csat: 4.1 },
  { intent: "Returns", volume: 38, resolutionRate: 58, csat: 3.9 },
  { intent: "Pre-sale Questions", volume: 31, resolutionRate: 82, csat: 4.4 },
  { intent: "Account Issues", volume: 18, resolutionRate: 44, csat: 3.6 },
];

export const ACTIONABLE_ITEMS: ActionableItem[] = [
  { id: "ai-1", title: "High escalation rate on Product Issues", description: "Product damage claims have a {{escalation_rate_product_issues}}% escalation rate. Main gap: unclear rules on when to offer replacement vs refund for items near the $80 threshold.", impact: "Reducing to 25% would auto-resolve ~{{saved_tickets_per_week}} more tickets/week", linkedTopicId: "t-3" },
  { id: "ai-2", title: "International returns need rules", description: "{{intl_return_count}} international return tickets escalated this week with no clear policy. All were handled similarly by your team.", impact: "Adding this rule could auto-resolve ~{{intl_saved_tickets}} tickets/week", linkedTopicId: "t-8" },
  { id: "ai-3", title: "Tone adjustment for live chat", description: "{{low_csat_chat_count}} customers rated CSAT low citing 'too formal' tone on live chat. Consider switching to 'friendly' tone for chat channel.", impact: "Could improve chat CSAT by {{csat_improvement_range}} points" },
];

// ── Conversation Log ──────────────────────────────────────────

export type ConversationLogMode = "production" | "training";
export type ConversationOutcome = "resolved" | "escalated" | "pending";

export interface ReasoningStep {
  type: "classify" | "rule_match" | "action_check" | "decision" | "gap_signal" | "execute_action" | "generate_reply";
  label: string;
  detail: string;
  timestamp: string;
}

export interface ReasoningTurn {
  turnNumber: number;
  customerInput: string;
  contextEnrichment?: { fieldsExtracted: string[]; queries: { action: string; params: string; status: "success" | "failed"; result: string }[]; infoRequested?: string };
  ruleRouting?: { intent: string; intentConfidence: number; sentiment: string; matchedRules: { name: string; ruleId: string; confidence: number }[] };
  knowledgeRetrieval?: { query: string; resultsCount: number; topScore: number; belowThreshold: boolean };
  actionsExecuted?: { name: string; input: string; result: "success" | "failed"; output: string }[];
  guardrailCheck?: { result: "passed" | "blocked"; blockedRule?: string; blockedReason?: string };
  repOutput: string;
}

export interface ConversationLog {
  id: string;
  ticketId: string;
  zendeskTicketId: string;
  zendeskUrl: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  initialIntent: string;
  finalIntent: string;
  initialSentiment: string;
  finalSentiment: string;
  intentChanged: boolean;
  outcome: ConversationOutcome;
  mode: ConversationLogMode;
  confidence: number;
  ruleMatched: string | null;
  actionsTaken: string[];
  totalTurns: number;
  duration: number;
  csat?: number;
  createdAt: string;
  resolvedAt?: string;
  reasoning: ReasoningStep[];
  reasoningTurns: ReasoningTurn[];
  messages: { role: "customer" | "agent" | "internal"; text: string; timestamp: string }[];
  flagged: boolean;
  flagNote?: string;
  escalationReason?: string;
  handoffNotes?: string;
  suggestedReply?: string;
}

export const DAILY_DIGEST = {
  dayLabel: "Mar 30, 2026",
  variables: {
    period_label: "Mar 30, 2026",
    rep_name: "Ava",
    total_tickets: 156,
    delta_tickets: "+12%",
    resolution_rate: "78.5%",
    delta_resolution: "+3.2%",
    csat_score: "4.6/5",
    delta_csat: "+0.2",
    sentiment_changed_rate: "8.3%",
    delta_sentiment_changed: "-1.1%",
    first_response_time: "42s",
    delta_frt: "-8s",
    full_resolution_time: "11m 20s",
    delta_full_rt: "-2m 10s",
    top_intent: "WISMO",
    top_intent_resolution: "92%",
    top_intent_volume: 64,
    worst_intent: "Return & Refund",
    worst_intent_resolution: "54%",
    worst_intent_volume: 38,
    worst_intent_rule_name: "Return & Refund Handling",
    link_to_rule: "/playbook",
    actionable_suggestion: "Return & Refund escalations increased 15% yesterday. Most escalations involve orders over $200 where the refund exceeds the guardrail limit. Consider raising the guardrail or adding a rule for high-value returns.",
    action_link_label: "Edit guardrail",
    action_link_url: "/config",
    link_to_performance: "/performance",
  },
  summaryTemplate: `\u{1F4CA} Daily Digest \u2014 {{period_label}}\n\nYesterday {{rep_name}} handled {{total_tickets}} tickets ({{delta_tickets}} vs previous day).\n\nKey metrics:\n\u2022 Auto-Resolution Rate: {{resolution_rate}} ({{delta_resolution}} vs previous day)\n\u2022 CSAT: {{csat_score}} ({{delta_csat}} vs previous day)\n\u2022 Sentiment Changed: {{sentiment_changed_rate}} ({{delta_sentiment_changed}} vs previous day)\n\u2022 First Response Time: {{first_response_time}} ({{delta_frt}} vs previous day)\n\u2022 Full Resolution Time: {{full_resolution_time}} ({{delta_full_rt}} vs previous day)\n\nTop performing intent:\n  {{top_intent}} \u2014 {{top_intent_resolution}} resolution rate across {{top_intent_volume}} tickets\n\nNeeds improvement:\n  {{worst_intent}} \u2014 {{worst_intent_resolution}} resolution rate across {{worst_intent_volume}} tickets\n  \u2192 Review this rule: {{worst_intent_rule_name}}\n\nSuggestion:\n  {{actionable_suggestion}}\n  \u2192 {{action_link_label}}\n\nView full performance dashboard \u2192`,
  recommendations: [
    { id: "rec-1", text: "Return & Refund escalations increased 15% yesterday. Most escalations involve orders over $200 where the refund exceeds the guardrail limit. Consider raising the guardrail or adding a rule for high-value returns.", linkLabel: "Edit guardrail", linkPath: "/config" },
    { id: "rec-2", text: "WISMO resolution rate is at 92%, the highest across all intents. Consider documenting this rule pattern as a template for other intents.", linkLabel: "View WISMO rule", linkPath: "/playbook" },
    { id: "rec-3", text: "3 customers rated CSAT low citing overly formal tone on live chat. Consider switching to friendly tone for the chat channel.", linkLabel: "Edit Rep tone settings", linkPath: "/config" },
  ],
};

export const CONVERSATION_LOGS: ConversationLog[] = [
  {
    id: "cl-1", ticketId: "t-4412", zendeskTicketId: "4412",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4412",
    subject: "Damaged ceramic vase — replacement request", customerName: "Sarah Johnson", customerEmail: "sarah.j@email.com",
    initialIntent: "Damage Claim", finalIntent: "Damage Claim", intentChanged: false,
    initialSentiment: "frustrated", finalSentiment: "positive",
    outcome: "resolved", mode: "production", confidence: 0.94,
    ruleMatched: "Damage claims under $80 — auto-replace",
    actionsTaken: ["Send Replacement"], totalTurns: 3, duration: 124, csat: 5,
    createdAt: "2026-03-28T14:22:00Z", resolvedAt: "2026-03-28T14:24:04Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Detected intent: Damage Claim (confidence: 0.94). Customer reports cracked ceramic vase, requests replacement.", timestamp: "2026-03-28T14:22:01Z" },
      { type: "rule_match", label: "Rule Matching", detail: "Matched Rule: 'Damage claims under $80 — auto-replace'. Item value $34.99 < $80 threshold. No photo required.", timestamp: "2026-03-28T14:22:01Z" },
      { type: "action_check", label: "Permission Check", detail: "Action 'Send Replacement' = autonomous. Guardrail check: first exchange for this customer = OK.", timestamp: "2026-03-28T14:22:02Z" },
      { type: "decision", label: "Decision", detail: "All checks passed. Proceeding with direct reply + replacement action.", timestamp: "2026-03-28T14:22:02Z" },
      { type: "execute_action", label: "Execute Action", detail: "Called Shopify API: create_exchange(order_id=CLV-2026-4412, item=ceramic-vase-blue, reason=damaged). Exchange created successfully.", timestamp: "2026-03-28T14:22:03Z" },
      { type: "generate_reply", label: "Generate Reply", detail: "Generated friendly reply acknowledging damage, confirming replacement initiated, no return needed.", timestamp: "2026-03-28T14:22:04Z" },
    ],
    messages: [
      { role: "customer", text: "I received my ceramic vase and it's cracked. I'd like a replacement.", timestamp: "2026-03-28T14:22:00Z" },
      { role: "agent", text: "Hi Sarah, I'm sorry to hear your ceramic vase arrived cracked! I've gone ahead and initiated a replacement — you should receive a shipping confirmation within 24 hours. No need to return the damaged item.", timestamp: "2026-03-28T14:22:04Z" },
      { role: "customer", text: "That was fast! Thank you so much.", timestamp: "2026-03-28T14:23:30Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "I received my ceramic vase and it's cracked. I'd like a replacement.", contextEnrichment: { fieldsExtracted: ["order_id: CLV-2026-4412", "item: ceramic-vase-blue", "value: $34.99"], queries: [{ action: "get_order", params: "CLV-2026-4412", status: "success", result: "Ceramic vase, $34.99, delivered 2026-03-26" }] }, ruleRouting: { intent: "Damage Claim", intentConfidence: 0.94, sentiment: "frustrated", matchedRules: [{ name: "Damage claims under $80 — auto-replace", ruleId: "r-1", confidence: 0.94 }] }, actionsExecuted: [{ name: "Send Replacement", input: "order_id=CLV-2026-4412, item=ceramic-vase-blue", result: "success", output: "Exchange created, shipping in 24h" }], guardrailCheck: { result: "passed" }, repOutput: "Hi Sarah, I'm sorry to hear your ceramic vase arrived cracked! I've gone ahead and initiated a replacement — you should receive a shipping confirmation within 24 hours. No need to return the damaged item." }],
    flagged: false,
  },
  {
    id: "cl-2", ticketId: "t-4501", zendeskTicketId: "4501",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4501",
    subject: "Refund to PayPal instead of credit card", customerName: "Mike Torres", customerEmail: "mike.t@email.com",
    initialIntent: "Refund Request", finalIntent: "Cross-Payment Refund", intentChanged: true,
    initialSentiment: "neutral", finalSentiment: "neutral",
    outcome: "escalated", mode: "production", confidence: 0.72,
    ruleMatched: null, actionsTaken: [], totalTurns: 2, duration: 45,
    createdAt: "2026-03-28T16:10:00Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Initial intent: Refund Request (confidence: 0.72). Customer wants refund to different payment method (PayPal).", timestamp: "2026-03-28T16:10:01Z" },
      { type: "classify", label: "Intent Reclassification", detail: "Reclassified to: Cross-Payment Refund. No standard refund rule covers cross-payment-method transfers.", timestamp: "2026-03-28T16:10:01Z" },
      { type: "rule_match", label: "Rule Matching", detail: "No rule found for cross-payment-method refunds. 'Issue Refund' guardrail specifies 'same payment method'.", timestamp: "2026-03-28T16:10:02Z" },
      { type: "decision", label: "Decision", detail: "Escalating to human agent. Sending gap signal to Orchestrator for Team Lead review.", timestamp: "2026-03-28T16:10:03Z" },
      { type: "gap_signal", label: "Gap Signal Sent", detail: '{"type":"gap_signal","gap_type":"no_rule","description":"No rule for cross-payment refunds"}', timestamp: "2026-03-28T16:10:03Z" },
    ],
    messages: [
      { role: "customer", text: "Can you refund to my PayPal instead of the original credit card?", timestamp: "2026-03-28T16:10:00Z" },
      { role: "internal", text: "[ESCALATION] No rule covers cross-payment-method refunds. Escalating to human agent.", timestamp: "2026-03-28T16:10:03Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "Can you refund to my PayPal instead of the original credit card?", ruleRouting: { intent: "Refund Request", intentConfidence: 0.72, sentiment: "neutral", matchedRules: [] }, guardrailCheck: { result: "blocked", blockedRule: "Issue Refund", blockedReason: "Cross-payment-method refunds not supported" }, repOutput: "[ESCALATION] No rule covers cross-payment-method refunds. Escalating to human agent." }],
    escalationReason: "No rule for cross-payment-method refunds",
    handoffNotes: "Customer wants refund to PayPal instead of original credit card. No existing rule covers this scenario.",
    flagged: false,
  },
  {
    id: "cl-3", ticketId: "t-4523", zendeskTicketId: "4523",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4523",
    subject: "Where is my order? Tracking shows delivered but not received", customerName: "Emily Davis", customerEmail: "emily.d@email.com",
    initialIntent: "Where Is My Order", finalIntent: "Where Is My Order", intentChanged: false,
    initialSentiment: "concerned", finalSentiment: "positive",
    outcome: "resolved", mode: "production", confidence: 0.97,
    ruleMatched: "WISMO — tracking shows delivered",
    actionsTaken: ["Get Order Details", "Check Tracking"], totalTurns: 4, duration: 210, csat: 4,
    createdAt: "2026-03-27T09:15:00Z", resolvedAt: "2026-03-27T09:18:30Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Detected intent: Where Is My Order (confidence: 0.97).", timestamp: "2026-03-27T09:15:01Z" },
      { type: "rule_match", label: "Rule Matching", detail: "Matched Rule: 'WISMO — tracking shows delivered'. Check tracking, advise wait 48h.", timestamp: "2026-03-27T09:15:01Z" },
      { type: "execute_action", label: "Execute Action", detail: "Called Shopify API: get_order(CLV-2026-4523). Order: Coastal Throw Blanket, $65.", timestamp: "2026-03-27T09:15:03Z" },
      { type: "execute_action", label: "Execute Action", detail: "Called Shipping API: check_tracking(9400111899223033005). Status: Delivered, signed by neighbor.", timestamp: "2026-03-27T09:15:04Z" },
      { type: "generate_reply", label: "Generate Reply", detail: "Generated reply with tracking details and suggestion to check with neighbor.", timestamp: "2026-03-27T09:15:05Z" },
    ],
    messages: [
      { role: "customer", text: "Hi, my order CLV-2026-4523 shows delivered but I never got it.", timestamp: "2026-03-27T09:15:00Z" },
      { role: "agent", text: "Hi Emily! I checked your tracking — USPS shows it was delivered yesterday and signed for by a neighbor. Could you check with them?", timestamp: "2026-03-27T09:15:05Z" },
      { role: "customer", text: "Oh! Let me check with my neighbor. Thanks!", timestamp: "2026-03-27T09:16:30Z" },
      { role: "customer", text: "Found it! My neighbor had it. Thanks!", timestamp: "2026-03-27T09:18:30Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "Hi, my order CLV-2026-4523 shows delivered but I never got it.", contextEnrichment: { fieldsExtracted: ["order_id: CLV-2026-4523"], queries: [{ action: "get_order", params: "CLV-2026-4523", status: "success", result: "Coastal Throw Blanket, $65, delivered" }, { action: "check_tracking", params: "9400111899223033005", status: "success", result: "Delivered, signed by neighbor" }] }, ruleRouting: { intent: "Where Is My Order", intentConfidence: 0.97, sentiment: "concerned", matchedRules: [{ name: "WISMO — tracking shows delivered", ruleId: "r-3", confidence: 0.97 }] }, repOutput: "Hi Emily! I checked your tracking — USPS shows it was delivered yesterday and signed for by a neighbor. Could you check with them?" }],
    flagged: false,
  },
  {
    id: "cl-4", ticketId: "t-4530", zendeskTicketId: "4530",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4530",
    subject: "Cancel my subscription", customerName: "James Wilson", customerEmail: "james.w@email.com",
    initialIntent: "Cancellation", finalIntent: "Retention — Downgrade", intentChanged: true,
    initialSentiment: "frustrated", finalSentiment: "satisfied",
    outcome: "resolved", mode: "training", confidence: 0.88,
    ruleMatched: "Cancellation — offer alternatives first",
    actionsTaken: [], totalTurns: 5, duration: 340, csat: 4,
    createdAt: "2026-03-27T11:30:00Z", resolvedAt: "2026-03-27T11:35:40Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Detected intent: Cancellation (confidence: 0.88).", timestamp: "2026-03-27T11:30:01Z" },
      { type: "rule_match", label: "Rule Matching", detail: "Matched Rule: 'Cancellation — offer alternatives first'. Must offer downgrade/pause.", timestamp: "2026-03-27T11:30:01Z" },
      { type: "decision", label: "Decision", detail: "Training mode: generating internal note with suggested reply.", timestamp: "2026-03-27T11:30:02Z" },
      { type: "generate_reply", label: "Generate Reply", detail: "[INTERNAL NOTE] Suggested: offer 50% discount or downgrade to Basic plan.", timestamp: "2026-03-27T11:30:03Z" },
      { type: "classify", label: "Intent Reclassification", detail: "Customer accepted downgrade. Reclassified to: Retention — Downgrade.", timestamp: "2026-03-27T11:33:00Z" },
    ],
    messages: [
      { role: "customer", text: "I want to cancel my subscription. It's too expensive.", timestamp: "2026-03-27T11:30:00Z" },
      { role: "internal", text: "[INTERNAL NOTE] Suggested reply: offer 50% off for 3 months or downgrade to Basic plan at $9.99/mo.", timestamp: "2026-03-27T11:30:03Z" },
      { role: "agent", text: "I understand, James. Before we process the cancellation, I'd like to offer: (1) 50% off for 3 months, or (2) downgrade to Basic at $9.99/mo.", timestamp: "2026-03-27T11:31:00Z" },
      { role: "customer", text: "Actually the basic plan sounds good. Let's do that.", timestamp: "2026-03-27T11:33:00Z" },
      { role: "agent", text: "Great choice! I've switched you to the Basic plan at $9.99/mo. The change takes effect on your next billing date.", timestamp: "2026-03-27T11:33:30Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "I want to cancel my subscription. It's too expensive.", ruleRouting: { intent: "Cancellation", intentConfidence: 0.88, sentiment: "frustrated", matchedRules: [{ name: "Cancellation — offer alternatives first", ruleId: "r-5", confidence: 0.88 }] }, repOutput: "[INTERNAL NOTE] Suggested: offer 50% discount or downgrade to Basic plan." }, { turnNumber: 2, customerInput: "Actually the basic plan sounds good. Let's do that.", ruleRouting: { intent: "Retention — Downgrade", intentConfidence: 0.92, sentiment: "satisfied", matchedRules: [{ name: "Cancellation — offer alternatives first", ruleId: "r-5", confidence: 0.92 }] }, repOutput: "Great choice! I've switched you to the Basic plan at $9.99/mo." }],
    flagged: false,
  },
  {
    id: "cl-5", ticketId: "t-4593", zendeskTicketId: "4593",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4593",
    subject: "URGENT: Want to speak to a manager", customerName: "Robert Chen", customerEmail: "robert.c@email.com",
    initialIntent: "Delivery Complaint", finalIntent: "Manager Request", intentChanged: true,
    initialSentiment: "angry", finalSentiment: "angry",
    outcome: "escalated", mode: "production", confidence: 0.65,
    ruleMatched: null, actionsTaken: ["Get Order Details"], totalTurns: 3, duration: 90,
    createdAt: "2026-03-26T08:00:00Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Initial intent: Delivery Complaint (confidence: 0.65). 3 failed delivery attempts.", timestamp: "2026-03-26T08:00:01Z" },
      { type: "execute_action", label: "Execute Action", detail: "Called Shopify API: get_order(CLV-2026-4593). Order: Coastal Oak Bookshelf, $450.", timestamp: "2026-03-26T08:00:02Z" },
      { type: "classify", label: "Intent Reclassification", detail: "Customer explicitly requested manager. Reclassified to: Manager Request.", timestamp: "2026-03-26T08:00:30Z" },
      { type: "decision", label: "Decision", detail: "Escalating immediately. High-value order ($450), frustrated customer, explicit manager request.", timestamp: "2026-03-26T08:00:31Z" },
      { type: "gap_signal", label: "Gap Signal Sent", detail: '{"type":"gap_signal","gap_type":"no_rule","description":"No rule for manager requests with repeated delivery failures"}', timestamp: "2026-03-26T08:00:32Z" },
    ],
    messages: [
      { role: "customer", text: "This is ridiculous! 3 times the driver said I wasn't home but I WAS. I want to speak to a manager NOW.", timestamp: "2026-03-26T08:00:00Z" },
      { role: "internal", text: "[ESCALATION] Customer explicitly requested manager. High-value order ($450), 3 failed deliveries.", timestamp: "2026-03-26T08:00:32Z" },
      { role: "agent", text: "I completely understand your frustration, Robert. I'm escalating this to a senior team member right away.", timestamp: "2026-03-26T08:00:35Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "This is ridiculous! 3 times the driver said I wasn't home but I WAS. I want to speak to a manager NOW.", contextEnrichment: { fieldsExtracted: ["order_id: CLV-2026-4593", "value: $450"], queries: [{ action: "get_order", params: "CLV-2026-4593", status: "success", result: "Coastal Oak Bookshelf, $450, 3 failed deliveries" }] }, ruleRouting: { intent: "Delivery Complaint", intentConfidence: 0.65, sentiment: "angry", matchedRules: [] }, guardrailCheck: { result: "blocked", blockedRule: "Manager Request", blockedReason: "No rule for manager requests with repeated delivery failures" }, repOutput: "I completely understand your frustration, Robert. I'm escalating this to a senior team member right away." }],
    escalationReason: "Customer explicitly requested manager. High-value order ($450), 3 failed deliveries.",
    handoffNotes: "Customer is very upset about 3 failed delivery attempts on a $450 bookshelf. Explicitly requested to speak with a manager.",
    flagged: true, flagNote: "Customer very upset — 3 failed deliveries on $450 order.",
  },
  {
    id: "cl-6", ticketId: "t-4540", zendeskTicketId: "4540",
    zendeskUrl: "https://coastalliving.zendesk.com/agent/tickets/4540",
    subject: "Do you ship to Hawaii?", customerName: "Lisa Nakamura", customerEmail: "lisa.n@email.com",
    initialIntent: "Pre-sale Question", finalIntent: "Pre-sale Question", intentChanged: false,
    initialSentiment: "neutral", finalSentiment: "positive",
    outcome: "resolved", mode: "training", confidence: 0.96,
    ruleMatched: "Shipping inquiry — check knowledge base",
    actionsTaken: [], totalTurns: 2, duration: 60, csat: 5,
    createdAt: "2026-03-27T15:00:00Z", resolvedAt: "2026-03-27T15:01:00Z",
    reasoning: [
      { type: "classify", label: "Intent Classification", detail: "Detected intent: Pre-sale Question (confidence: 0.96).", timestamp: "2026-03-27T15:00:01Z" },
      { type: "rule_match", label: "Rule Matching", detail: "Matched Rule: 'Shipping inquiry — check knowledge base'. Hawaii: $12 flat rate, 5-7 days.", timestamp: "2026-03-27T15:00:01Z" },
      { type: "decision", label: "Decision", detail: "Training mode: generating internal note.", timestamp: "2026-03-27T15:00:02Z" },
      { type: "generate_reply", label: "Generate Reply", detail: "[INTERNAL NOTE] Suggested: confirm Hawaii shipping at $12 flat rate.", timestamp: "2026-03-27T15:00:02Z" },
    ],
    messages: [
      { role: "customer", text: "Hi! Do you ship to Hawaii? If so, how much?", timestamp: "2026-03-27T15:00:00Z" },
      { role: "internal", text: "[INTERNAL NOTE] Suggested reply: 'Yes, we ship to all 50 US states including Hawaii! Flat rate $12, 5-7 business days.'", timestamp: "2026-03-27T15:00:02Z" },
    ],
    reasoningTurns: [{ turnNumber: 1, customerInput: "Hi! Do you ship to Hawaii? If so, how much?", ruleRouting: { intent: "Pre-sale Question", intentConfidence: 0.96, sentiment: "neutral", matchedRules: [{ name: "Shipping inquiry — check knowledge base", ruleId: "r-7", confidence: 0.96 }] }, knowledgeRetrieval: { query: "Hawaii shipping rate", resultsCount: 1, topScore: 0.95, belowThreshold: false }, repOutput: "[INTERNAL NOTE] Suggested: confirm Hawaii shipping at $12 flat rate." }],
    flagged: false,
  },
];

// ── Zendesk Sidebar Mock Data ──────────────────────────────

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
  confidence?: number;
  intentDetected?: string;
  currentStep?: string;
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
      { from: "internal", text: "Escalating to human agent — customer explicitly requested manager, sentiment: very frustrated, high-value order ($450).", timestamp: "2026-03-26T08:00:15Z" },
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

// Legacy compat
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
export type ApprovalRequest = { id: string; ticketId: string; ticketSubject: string; customerName: string; actionType: string; actionLabel: string; parameters: Record<string, string | number>; reasoning: string; status: ApprovalStatus; createdAt: string; timeoutAt: string; aiConfidence: number; intentDetected: string; actionsTaken: string[]; };
export const MOCK_TICKETS: ApprovalRequest[] = [];
