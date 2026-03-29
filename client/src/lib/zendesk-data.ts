/* ── Zendesk Sidebar Mock Data ──────────────────────────────
   Two ticket states (MVP — Direct Handoff):
   1. "handling"   — AI handling normally, no manager attention needed
   2. "escalated"  — AI cannot handle, needs manager to take over
   ──────────────────────────────────────────────────────────── */

export type TicketState = "handling" | "escalated";

export interface TicketMessage {
  from: "customer" | "agent" | "internal";
  text: string;
  timestamp: string;
}

export interface ZendeskTicket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  state: TicketState;
  messages: TicketMessage[];
  // AI internal note — always present for escalated
  internalNote?: string;
  // Give Instruction
  instruction?: string;
  // AI handling metadata
  confidence?: number;
  intentDetected?: string;
  currentStep?: string;
  // Escalation metadata
  escalationReason?: string;
}

export const ZENDESK_TICKETS: ZendeskTicket[] = [
  // ── 1. Handling: Normal WISMO ──
  {
    id: "zd-4595",
    subject: "Where is my order?",
    customerName: "Lisa Wang",
    customerEmail: "lisa.wang@yahoo.com",
    state: "handling",
    confidence: 0.94,
    intentDetected: "Where Is My Order",
    currentStep: "Shared tracking link and updated ETA",
    messages: [
      {
        from: "customer",
        text: "I ordered a candle set 5 days ago and still haven't received it. Tracking hasn't updated in 3 days.",
        timestamp: "2026-03-26T08:30:00Z",
      },
      {
        from: "agent",
        text: "Hi Lisa! Your order #CLC-10250 shipped 4 days ago via USPS. Tracking shows it's in transit — estimated delivery March 28. I'll follow up if it hasn't arrived by then.",
        timestamp: "2026-03-26T08:30:45Z",
      },
      {
        from: "customer",
        text: "Okay, thanks. I'll wait until the 28th.",
        timestamp: "2026-03-26T08:32:00Z",
      },
    ],
  },
  // ── 2. Handling: Damaged item refund (autonomous) ──
  {
    id: "zd-4589",
    subject: "Broken lamp — need a refund",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah.m@gmail.com",
    state: "handling",
    confidence: 0.92,
    intentDetected: "Product Issues — Damaged Item",
    currentStep: "Processed refund of $89.99",
    messages: [
      {
        from: "customer",
        text: "Hi, I received my ceramic table lamp yesterday and the base is completely cracked. I'd like a full refund please.",
        timestamp: "2026-03-26T09:00:00Z",
      },
      {
        from: "agent",
        text: "Hi Sarah! I'm so sorry about the damaged lamp. I can see your order #CLC-10234 — the ceramic table lamp at $89.99. Since this is a damaged item, I'll process a full refund right away. You don't need to return the damaged item.",
        timestamp: "2026-03-26T09:01:00Z",
      },
      {
        from: "agent",
        text: "Your refund of $89.99 has been initiated to your Visa ending in 4242. Please allow 3-5 business days for it to appear. Is there anything else I can help with?",
        timestamp: "2026-03-26T09:01:30Z",
      },
    ],
  },
  // ── 3. Handling: Loyalty discount (autonomous) ──
  {
    id: "zd-4591",
    subject: "Loyalty discount request",
    customerName: "David Park",
    customerEmail: "david.park@outlook.com",
    state: "handling",
    confidence: 0.85,
    intentDetected: "Pre-sale — Loyalty Discount",
    currentStep: "Applied 12% discount code",
    messages: [
      {
        from: "customer",
        text: "Hey! I've been shopping with you for over a year. Any chance I could get a discount on my current cart ($234.50)?",
        timestamp: "2026-03-26T09:20:00Z",
      },
      {
        from: "agent",
        text: "Hi David! Thanks for being a loyal customer — I can see you've placed 7 orders with us. I'd love to offer you a 12% loyalty discount! Your code is LOYAL-DAVID-12, bringing your total to $206.36 (saving $28.14).",
        timestamp: "2026-03-26T09:20:30Z",
      },
      {
        from: "customer",
        text: "Awesome, thanks so much!",
        timestamp: "2026-03-26T09:22:00Z",
      },
    ],
  },
  // ── 4. Escalated: Angry customer wants manager ──
  {
    id: "zd-4593",
    subject: "URGENT: Want to speak to a manager",
    customerName: "Robert Chen",
    customerEmail: "robert.chen@gmail.com",
    state: "escalated",
    escalationReason: "Customer explicitly requested human agent. Sentiment: very frustrated. High-value order ($450).",
    internalNote: "Customer ordered a coastal oak bookshelf ($450). Delivery attempted 3 times — customer was home each time but driver marked as 'not home'. Customer is understandably frustrated and demanding to speak with a manager. I verified the delivery failures in the carrier system. This needs human judgment on how to resolve the carrier issue.",
    messages: [
      {
        from: "customer",
        text: "This is RIDICULOUS. THREE delivery attempts and your driver keeps marking 'not home' when I'm at my door. I want a MANAGER. This $450 bookshelf better arrive or I'm disputing the charge.",
        timestamp: "2026-03-26T08:00:00Z",
      },
      {
        from: "internal",
        text: "🚨 Escalating to human agent — customer explicitly requested manager, sentiment: very frustrated, high-value order ($450).",
        timestamp: "2026-03-26T08:00:15Z",
      },
    ],
  },
  // ── 5. Escalated: International customs question ──
  {
    id: "zd-4599",
    subject: "Customs duties on my return",
    customerName: "James Wilson",
    customerEmail: "james.w@mail.co.uk",
    state: "escalated",
    escalationReason: "No rule for international customs duties refund. Escalated for policy decision.",
    internalNote: "International return with customs duties question. Customer paid £22 in customs. I don't have a rule for whether customs duties are refundable. This has come up 5 times this week — needs a policy decision.",
    messages: [
      {
        from: "customer",
        text: "I paid £22 in customs duties when my order arrived. Now I want to return it. Will I get the duties back too?",
        timestamp: "2026-03-26T11:00:00Z",
      },
      {
        from: "internal",
        text: "🚨 Escalating — no policy for international customs duties refund. This is the 5th similar case this week.",
        timestamp: "2026-03-26T11:00:10Z",
      },
    ],
  },
];
