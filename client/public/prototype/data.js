// AI Support Agent — Mock Data (Single Agent Model)
const DemoData = {

  // ─── SINGLE AI AGENT ───
  agent: {
    id: "ai-assistant",
    name: "AI Assistant",
    avatar: "🤖",
    status: "online",
    mode: "Production",
    personality: "Warm & Professional",
    language: "English (British)",
    refundCap: 80,
    maxTurns: 8,
    startDate: "Mar 24, 2026",
    tickets: { total: 1636, today: 61 },
    resolution: 87.3,
    csat: 4.6,
    avgResponse: "5.8s",
    escalation: 12.8,
    costPerTicket: "£0.72",
    humanCostPerTicket: "£4.80",
    allowedActions: [
      { name: "Order Lookup", enabled: true },
      { name: "Process Refunds", enabled: true },
      { name: "Cancel Orders", enabled: true },
      { name: "Update Address", enabled: true },
      { name: "Apply Discounts", enabled: true },
      { name: "Generate Return Labels", enabled: true },
      { name: "Modify Pricing", enabled: false },
      { name: "Delete Account", enabled: false }
    ]
  },

  // ─── CUSTOMER PROFILES (from Shopify) ───
  customers: {
    "sophie.w@gmail.com": {
      name: "Sophie Williams",
      email: "sophie.w@gmail.com",
      vip: false,
      totalOrders: 3,
      totalSpend: "£187.00",
      lastOrder: "Mar 20, 2026",
      tags: ["email-preference"]
    },
    "michael.oc@hotmail.com": {
      name: "Michael O'Connor",
      email: "michael.oc@hotmail.com",
      vip: true,
      totalOrders: 12,
      totalSpend: "£1,847.00",
      lastOrder: "Mar 14, 2026",
      tags: ["vip", "loyalty-gold"]
    },
    "james.w@outlook.com": {
      name: "James Wright",
      email: "james.w@outlook.com",
      vip: false,
      totalOrders: 1,
      totalSpend: "£89.00",
      lastOrder: "Mar 22, 2026",
      tags: ["new-customer"]
    },
    "priya.p@yahoo.com": {
      name: "Priya Patel",
      email: "priya.p@yahoo.com",
      vip: false,
      totalOrders: 5,
      totalSpend: "£412.00",
      lastOrder: "Mar 18, 2026",
      tags: ["repeat-buyer"]
    },
    "emma.t@gmail.com": {
      name: "Emma Thompson",
      email: "emma.t@gmail.com",
      vip: true,
      totalOrders: 8,
      totalSpend: "£923.00",
      lastOrder: "Mar 21, 2026",
      tags: ["vip", "loyalty-silver"]
    }
  },

  // ─── TICKETS (from Zendesk, read-only in our system) ───
  tickets: [
    {
      id: "TK-4891",
      customer: "James Wright",
      email: "james.w@outlook.com",
      vip: false,
      subject: "Where is my order?",
      category: "WISMO",
      status: "solved",
      priority: "normal",
      tags: ["wismo", "tracking"],
      channel: "email",
      time: "25 min ago",
      orderData: {
        id: "#DBH-29201",
        items: ["Silk Scarf — Navy (x1)"],
        total: "£89.00",
        status: "In Transit",
        carrier: "Royal Mail",
        tracking: "RM-9283746501",
        estimatedDelivery: "Mar 27, 2026"
      },
      plan: [
        { action: "lookup_order", label: "Look up order #DBH-29201", tool: "Shopify API", duration: 800 },
        { action: "get_tracking", label: "Retrieve tracking info from Royal Mail", tool: "Royal Mail API", duration: 600 },
        { action: "check_delivery", label: "Verify estimated delivery: Mar 27 (within window)", tool: "Internal Logic", duration: 200 },
        { action: "reply_customer", label: "Send tracking update to customer", tool: "Zendesk API", duration: 400 }
      ],
      thread: [
        { from: "system", type: "system-event", author: "System", text: "Ticket assigned to AI Assistant", time: "Today 8:35 AM", channel: "internal" },
        { from: "customer", type: "public", author: "James Wright", text: "Hi, I placed an order (#DBH-29201) three days ago and haven't received any shipping updates. Can you tell me where it is?", time: "Today 8:35 AM", channel: "email" },
        { from: "agent", type: "internal-note", author: "AI Assistant", text: "Order #DBH-29201 found. Status: In Transit via Royal Mail (RM-9283746501). Estimated delivery Mar 27 — within standard window. No issues detected. Providing tracking update.", time: "Today 8:35 AM", channel: "internal" },
        { from: "agent", type: "public", author: "AI Assistant", text: "Hi James,\n\nThanks for reaching out! I've checked on your order #DBH-29201 (Silk Scarf — Navy).\n\nGreat news — it's currently in transit with Royal Mail. Here are the details:\n\n📦 Tracking: RM-9283746501\n📅 Estimated delivery: March 27, 2026\n\nYou can track your parcel here: royalmail.com/track\n\nIf it hasn't arrived by March 28, please let us know and we'll investigate further.\n\nBest,\nAI Assistant — Debenhams Support", time: "Today 8:36 AM", channel: "email" }
      ]
    },
    {
      id: "TK-4895",
      customer: "Sophie Williams",
      email: "sophie.w@gmail.com",
      vip: false,
      subject: "Broken zipper on handbag",
      category: "Refund",
      status: "solved",
      priority: "normal",
      tags: ["refund", "damaged", "quality"],
      channel: "email",
      time: "12 min ago",
      orderData: {
        id: "#DBH-29050",
        items: ["Leather Handbag — Black (x1)"],
        total: "£45.00",
        status: "Delivered",
        deliveryDate: "Mar 22, 2026"
      },
      plan: [
        { action: "lookup_order", label: "Look up order #DBH-29050", tool: "Shopify API", duration: 1000 },
        { action: "check_return_window", label: "Verify within 30-day return window (4 days ago)", tool: "Guardrails", duration: 400 },
        { action: "check_refund_limit", label: "Verify £45.00 < £80 refund cap — approved", tool: "Guardrails", duration: 300 },
        { action: "process_refund", label: "Process refund of £45.00", tool: "Stripe API", duration: 1200 },
        { action: "reply_customer", label: "Confirm refund and provide return label", tool: "Zendesk API", duration: 600 }
      ],
      thread: [
        { from: "system", type: "system-event", author: "System", text: "Ticket assigned to AI Assistant", time: "Today 9:02 AM", channel: "internal" },
        { from: "customer", type: "public", author: "Sophie Williams", text: "The handbag I received (order #DBH-29050) has a broken zipper. I'd like a refund please. Photos attached.", time: "Today 9:02 AM", channel: "email" },
        { from: "agent", type: "internal-note", author: "AI Assistant", text: "Refund amount £45.00 is within my £80 cap — auto-approving. Delivered 4 days ago, well within 30-day return window. Damaged item so no return required per SOP 5.1.3. Processing refund directly.", time: "Today 9:03 AM", channel: "internal" },
        { from: "agent", type: "public", author: "AI Assistant", text: "Hi Sophie,\n\nI'm sorry to hear about the damaged zipper on your handbag. That's definitely not the quality we stand behind.\n\nI've processed a full refund of £45.00 to your original payment method. You should see it within 5-7 business days.\n\nYou don't need to return the damaged item — please feel free to recycle or donate it.\n\nWe'd love to make this right. Here's a 15% discount code for your next order: SORRY15\n\nBest,\nAI Assistant — Debenhams Support", time: "Today 9:04 AM", channel: "email" }
      ]
    },
    {
      id: "TK-4896",
      customer: "Michael O'Connor",
      email: "michael.oc@hotmail.com",
      vip: true,
      subject: "Where is my refund?",
      category: "Refund",
      status: "pending",
      priority: "high",
      tags: ["refund", "return", "vip", "over-cap", "escalated"],
      channel: "email",
      time: "1 min ago",
      orderData: {
        id: "#DBH-28870",
        items: ["Wool Overcoat — Charcoal (x1)"],
        total: "£195.00",
        status: "Returned",
        returnDate: "March 14, 2026"
      },
      plan: [
        { action: "lookup_order", label: "Look up order #DBH-28870", tool: "Shopify API", duration: 1000 },
        { action: "check_return_status", label: "Verify return received at warehouse", tool: "Shopify API", duration: 800 },
        { action: "check_refund_limit", label: "Check £195 > £80 cap — escalation required", tool: "Guardrails", duration: 400 },
        { action: "escalate", label: "Escalate to Manager — refund exceeds cap", tool: "Zendesk API", duration: 600 }
      ],
      thread: [
        { from: "system", type: "system-event", author: "System", text: "Ticket assigned to AI Assistant", time: "Today 9:30 AM", channel: "internal" },
        { from: "customer", type: "public", author: "Michael O'Connor", text: "I returned my coat 10 days ago (order #DBH-28870) and still haven't received my refund. This is unacceptable!", time: "Today 9:30 AM", channel: "email" },
        { from: "agent", type: "internal-note", author: "AI Assistant", text: "Return confirmed received at warehouse on March 16. Refund amount is £195.00 which exceeds my £80 cap. VIP customer, already frustrated by the wait. Escalating to Manager for approval — recommend fast-tracking given VIP status and 10-day delay.", time: "Today 9:31 AM", channel: "internal" },
        { from: "agent", type: "public", author: "AI Assistant", text: "Dear Michael,\n\nI sincerely apologise for the delay with your refund. I can see that your return of the Wool Overcoat was received at our warehouse on March 16.\n\nAs the refund amount of £195.00 requires senior approval, I've escalated this to our team lead for immediate processing. You should receive confirmation within the next 2 hours.\n\nThank you for your patience, and I'm sorry for the inconvenience.\n\nAI Assistant — Debenhams Support", time: "Today 9:32 AM", channel: "email" },
        { from: "system", type: "system-event", author: "System", text: "AI Assistant escalated ticket to Manager. Reason: refund amount £195.00 exceeds agent cap (£80).", time: "Today 9:32 AM", channel: "internal" }
      ]
    },
    {
      id: "TK-4893",
      customer: "Priya Patel",
      email: "priya.p@yahoo.com",
      vip: false,
      subject: "Received wrong item",
      category: "Complaint",
      status: "pending",
      priority: "high",
      tags: ["wrong-item", "escalated", "urgent"],
      channel: "chat",
      time: "45 min ago",
      orderData: {
        id: "#DBH-29100",
        items: ["Floral Dress — Red (x1)"],
        total: "£67.00",
        status: "Delivered",
        deliveryDate: "Mar 20, 2026"
      },
      plan: [
        { action: "lookup_order", label: "Look up order #DBH-29100", tool: "Shopify API", duration: 900 },
        { action: "verify_delivery", label: "Confirm delivery of Floral Dress — Red", tool: "Shopify API", duration: 500 },
        { action: "detect_mismatch", label: "Customer reports blue dress received — item mismatch detected", tool: "Internal Logic", duration: 300 },
        { action: "escalate", label: "Escalate — wrong item requires warehouse coordination", tool: "Zendesk API", duration: 600 }
      ],
      thread: [
        { from: "system", type: "system-event", author: "System", text: "Ticket assigned to AI Assistant", time: "Today 8:15 AM", channel: "internal" },
        { from: "customer", type: "public", author: "Priya Patel", text: "I ordered a RED floral dress but received a BLUE one instead! I need the correct one urgently for a wedding this weekend.", time: "Today 8:15 AM", channel: "chat" },
        { from: "agent", type: "internal-note", author: "AI Assistant", text: "Order #DBH-29100 shows Floral Dress — Red was ordered. Customer reports receiving blue. Item mismatch confirmed. Customer has time-sensitive need (wedding this weekend). This requires warehouse coordination for expedited replacement — escalating to Manager.", time: "Today 8:16 AM", channel: "internal" },
        { from: "agent", type: "public", author: "AI Assistant", text: "Hi Priya,\n\nI'm really sorry about this mix-up — that's not the experience we want for you, especially with your wedding coming up!\n\nI've flagged this as urgent and escalated to our team lead to arrange an expedited replacement. We'll do our best to get the correct red dress to you before the weekend.\n\nYou'll hear back within the next hour with a shipping update.\n\nAI Assistant — Debenhams Support", time: "Today 8:17 AM", channel: "chat" },
        { from: "system", type: "system-event", author: "System", text: "AI Assistant escalated ticket to Manager. Reason: wrong item received, requires warehouse coordination.", time: "Today 8:17 AM", channel: "internal" }
      ]
    },
    {
      id: "TK-4897",
      customer: "Emma Thompson",
      email: "emma.t@gmail.com",
      vip: true,
      subject: "Cancel my order please",
      category: "Cancellation",
      status: "solved",
      priority: "normal",
      tags: ["cancellation", "unfulfilled", "vip"],
      channel: "email",
      time: "2 hours ago",
      orderData: {
        id: "#DBH-29250",
        items: ["Cashmere Sweater — Cream (x1)", "Wool Scarf — Grey (x1)"],
        total: "£142.00",
        status: "Processing",
        paymentStatus: "Authorized"
      },
      plan: [
        { action: "lookup_order", label: "Look up order #DBH-29250", tool: "Shopify API", duration: 800 },
        { action: "check_fulfillment", label: "Verify order not yet shipped — cancellation eligible", tool: "Shopify API", duration: 400 },
        { action: "cancel_order", label: "Cancel order #DBH-29250", tool: "Shopify API", duration: 1000 },
        { action: "void_payment", label: "Void payment authorization of £142.00", tool: "Stripe API", duration: 800 },
        { action: "reply_customer", label: "Confirm cancellation to customer", tool: "Zendesk API", duration: 400 }
      ],
      thread: [
        { from: "system", type: "system-event", author: "System", text: "Ticket assigned to AI Assistant", time: "Today 7:00 AM", channel: "internal" },
        { from: "customer", type: "public", author: "Emma Thompson", text: "Hi, I'd like to cancel my recent order #DBH-29250. I changed my mind about the colours. Thanks!", time: "Today 7:00 AM", channel: "email" },
        { from: "agent", type: "internal-note", author: "AI Assistant", text: "Order #DBH-29250 status: Processing (not yet shipped). Cancellation eligible per SOP 3.2.1. VIP customer — direct refund per updated VIP policy. Voiding payment authorization instead of processing refund since order hasn't been charged yet.", time: "Today 7:01 AM", channel: "internal" },
        { from: "agent", type: "public", author: "AI Assistant", text: "Hi Emma,\n\nNo problem at all! I've cancelled your order #DBH-29250 right away.\n\nSince the payment was only authorised (not charged), the hold on your card will be released within 1-2 business days. You won't be charged anything.\n\nItems cancelled:\n- Cashmere Sweater — Cream (x1)\n- Wool Scarf — Grey (x1)\n\nIf you'd like to reorder in different colours, I'm happy to help!\n\nBest,\nAI Assistant — Debenhams Support", time: "Today 7:02 AM", channel: "email" }
      ]
    }
  ],

  // ─── PERFORMANCE DATA ───
  volumeData: [
    { day: "Mon", count: 223 },
    { day: "Tue", count: 246 },
    { day: "Wed", count: 239 },
    { day: "Thu", count: 270 },
    { day: "Fri", count: 287 },
    { day: "Sat", count: 191 },
    { day: "Sun", count: 140 }
  ],

  performanceData: {
    daily: [
      { date: "Mar 18", tickets: 50, resolved: 44, escalated: 6, csat: 4.5 },
      { date: "Mar 19", tickets: 57, resolved: 51, escalated: 6, csat: 4.6 },
      { date: "Mar 20", tickets: 63, resolved: 57, escalated: 6, csat: 4.5 },
      { date: "Mar 21", tickets: 73, resolved: 67, escalated: 6, csat: 4.7 },
      { date: "Mar 22", tickets: 58, resolved: 53, escalated: 5, csat: 4.6 },
      { date: "Mar 23", tickets: 42, resolved: 38, escalated: 4, csat: 4.8 },
      { date: "Mar 24", tickets: 61, resolved: 55, escalated: 6, csat: 4.6 }
    ],
    categoryBreakdown: [
      { name: "WISMO", pct: 34, resolution: 97 },
      { name: "Refunds", pct: 28, resolution: 88 },
      { name: "Cancellations", pct: 19, resolution: 92 },
      { name: "Address Changes", pct: 11, resolution: 95 },
      { name: "Complaints", pct: 8, resolution: 62 }
    ]
  },

  // ─── ALERTS & RECOMMENDATIONS ───
  alerts: [
    {
      type: "warning",
      icon: "⚠",
      title: "Refund cost spike detected",
      message: "Average refund amount is up 42% this week. 12 refunds were issued where store credit would have been appropriate per SOP.",
      time: "5 hours ago",
      actions: ["Review Cases", "Adjust Policy"]
    },
    {
      type: "info",
      icon: "💡",
      title: "Knowledge gap identified",
      message: "18 tickets about international customs duties were escalated this week. Consider adding an international returns policy to reduce escalation rate by ~3%.",
      time: "1 day ago",
      actions: ["Add Policy"]
    },
    {
      type: "success",
      icon: "✓",
      title: "WISMO resolution rate hit 97%",
      message: "WISMO queries are now resolving at 97%+ rate. This category can be considered fully automated.",
      time: "1 day ago",
      actions: []
    },
    {
      type: "recommendation",
      icon: "📊",
      title: "Consider expanding refund cap",
      message: "83% of escalated refunds are between £80-£120. Increasing the cap to £120 could reduce escalation rate by 5% with minimal risk.",
      time: "2 days ago",
      actions: ["Review Analysis", "Update Cap"]
    }
  ],

  // ─── KNOWLEDGE BASE ───
  knowledgeBase: {
    documents: [
      { id: "doc-playbook", name: "Debenhams_CS_Playbook_2025.pdf", uploaded: "Mar 24, 2026", extractedRules: "18 prompt rules, 8 guardrails, 6 actions", score: 94 },
      { id: "doc-refund", name: "Refund_Policy_v3.docx", uploaded: "Mar 24, 2026", extractedRules: "4 guardrails, 3 actions", score: 91 },
      { id: "doc-escalation", name: "Escalation_Matrix.pdf", uploaded: "Mar 24, 2026", extractedRules: "8 escalation triggers", score: 87 }
    ],
    qualityBreakdown: {
      overall: 92,
      items: [
        { text: "Add international returns policy", impact: "+3%", type: "missing", priority: "high" },
        { text: "Clarify gift card refund rules", impact: "+2%", type: "ambiguous", priority: "medium" },
        { text: "Add size exchange workflow", impact: "+1.5%", type: "missing", priority: "medium" },
        { text: "Update holiday season return window", impact: "+1%", type: "outdated", priority: "low" },
        { text: "Add loyalty points refund policy", impact: "+0.5%", type: "missing", priority: "low" }
      ]
    },
    advancedConfig: {
      prompt: "You are a customer service agent for Debenhams UK.\nYou are warm, professional, and empathetic.\nAlways greet customers by name.\nUse British English spelling.\nSign off with your name.\n\nKey behaviours:\n- Acknowledge the customer's frustration before offering solutions\n- Offer alternatives when primary resolution isn't available\n- Proactively mention relevant promotions or discount codes\n- Never promise specific delivery dates unless confirmed by carrier API",
      guardrails: "MAX_REFUND_AUTO: £80\nMAX_REFUNDS_PER_DAY: 2 per customer\nRETURN_WINDOW: 30 days\nREQUIRE_HUMAN_APPROVAL: refund > cap, legal mention, threat detection\nBLOCKED_ACTIONS: delete_account, modify_pricing, access_payment_full\nCOMPLIANCE: GDPR data handling, no PII in logs",
      actionRegistry: "lookup_order(order_id) → Shopify API\ncancel_order(order_id) → Shopify API\nprocess_refund(order_id, amount, method) → Stripe API\nupdate_address(order_id, new_address) → Shopify API\nget_tracking(tracking_id) → Royal Mail API\nsend_reply(ticket_id, message) → Zendesk API\nlookup_customer(email) → CRM API\napply_discount(customer_id, code) → Shopify API\nescalate_ticket(ticket_id, reason) → Zendesk API",
      escalationRules: "TRIGGER: customer_sentiment == 'angry' OR 'threatening'\nTRIGGER: refund_amount > agent.refund_cap\nTRIGGER: message contains 'legal', 'lawyer', 'sue', 'trading standards'\nTRIGGER: item_mismatch == true (wrong item received)\nTRIGGER: repeat_contact_count > 3 for same issue\nTRIGGER: VIP customer AND complaint category\nTRIGGER: order_value > £500\nTRIGGER: agent confidence_score < 0.6"
    }
  },

  // ─── KNOWLEDGE GAPS ───
  knowledgeGaps: [
    { topic: "International customs duties", count: 18, source: "ai-detected", lastSeen: "Today" },
    { topic: "Gift card refund process", count: 7, source: "manager-feedback", lastSeen: "Yesterday" },
    { topic: "Size exchange workflow", count: 5, source: "ai-detected", lastSeen: "Today" },
    { topic: "Loyalty points redemption", count: 4, source: "ai-detected", lastSeen: "2 days ago" },
    { topic: "Pre-order cancellation policy", count: 3, source: "manager-feedback", lastSeen: "3 days ago" }
  ],

  // ─── TEMPORARY INSTRUCTIONS ───
  tempInstructions: [
    { id: "ti-1", text: "Spring Sale: auto-approve all refunds under £100 (raised from £80)", effectiveFrom: "Mar 25, 2026", effectiveTo: "Apr 1, 2026", active: true },
    { id: "ti-2", text: "Easter weekend: extend return window to 45 days for all customers", effectiveFrom: "Apr 18, 2026", effectiveTo: "Apr 21, 2026", active: false }
  ],

  // ─── FEEDBACK LOG ───
  feedbackLog: [
    { ticketId: "TK-4882", type: "negative", reason: "Reply inaccurate", detail: "Refund processing time should be 5-10 business days, not 3-5 days", time: "Yesterday 3:14 PM" },
    { ticketId: "TK-4879", type: "negative", reason: "Tone issue", detail: "Response was too casual for a VIP customer complaint", time: "Yesterday 11:20 AM" },
    { ticketId: "TK-4875", type: "positive", reason: null, detail: null, time: "Yesterday 10:05 AM" },
    { ticketId: "TK-4871", type: "negative", reason: "Should have escalated", detail: "Customer mentioned 'trading standards' but AI continued handling", time: "Mar 23, 4:30 PM" },
    { ticketId: "TK-4868", type: "positive", reason: null, detail: null, time: "Mar 23, 2:15 PM" }
  ],

  // ─── ONBOARDING DATA ───
  onboarding: {
    sopResults: {
      files: [
        { name: "Debenhams_CS_Playbook_2025.pdf", size: "2.4 MB" },
        { name: "Refund_Policy_v3.docx", size: "340 KB" },
        { name: "Escalation_Matrix.pdf", size: "180 KB" }
      ],
      rules: {
        prompt: 18,
        guardrails: 12,
        actions: 9,
        escalation: 8
      },
      warnings: [
        { type: "ambiguous", text: "Return window: '30 days' vs '28 calendar days' found in different documents" },
        { type: "missing", text: "No international returns policy found" },
        { type: "missing", text: "No gift card refund rules found" }
      ]
    },
    ticketAnalysis: {
      totalAnalyzed: 500,
      matches: [
        { rule: "Standard refund within 30 days", sopMatch: true, teamCompliance: "94%", icon: "✓" },
        { rule: "Escalate when refund > cap", sopMatch: true, teamCompliance: "97%", icon: "✓" },
        { rule: "Use customer name in greeting", sopMatch: true, teamCompliance: "89%", icon: "✓" }
      ],
      decisionPoints: [
        {
          id: "dp-1",
          title: "VIP Return Window",
          description: "SOP says 30-day return window for all customers, but 23% of your team approves returns up to 45 days for VIP customers.",
          options: [
            { label: "Strict 30 days for all customers", value: "strict" },
            { label: "45 days for VIP, 30 days for others", value: "flexible" }
          ]
        },
        {
          id: "dp-2",
          title: "Post-Complaint Discount",
          description: "Your team offers 15% discount codes after resolving complaints in 34% of cases, but this isn't in the SOP.",
          options: [
            { label: "Yes, add to AI's toolkit", value: "enable" },
            { label: "No, only offer what's in SOP", value: "disable" }
          ]
        },
        {
          id: "dp-3",
          title: "Partial Refunds",
          description: "Your team issues partial refunds in 12% of cases (e.g., 50% refund for late delivery). SOP only mentions full refunds.",
          options: [
            { label: "Allow partial refunds (AI decides %)", value: "auto" },
            { label: "Allow but require approval", value: "approval" },
            { label: "Full refunds only", value: "disable" }
          ]
        }
      ]
    },
    readinessAudit: {
      overall: 89,
      metrics: {
        coverage: 87,
        accuracy: 94,
        compliance: 91,
        escalationRate: 13
      },
      categoryScores: [
        { name: "WISMO", score: 97 },
        { name: "Cancellations", score: 92 },
        { name: "Address Changes", score: 95 },
        { name: "Refunds", score: 88 },
        { name: "Product Enquiries", score: 78 },
        { name: "Complaints", score: 62 }
      ],
      recommendation: "AI Agent is ready for production deployment on high-confidence categories (WISMO, Cancellations, Address Changes). Consider Shadow Mode for Complaints until resolution rate improves."
    }
  },

  // ─── ZENDESK SIDEBAR DEMO DATA ───
  sidebarDemo: {
    ticketId: "TK-4895",
    confidence: 0.94,
    suggestedActions: [
      { action: "Process refund £45.00", status: "executed", tool: "Stripe API" },
      { action: "Send confirmation email", status: "executed", tool: "Zendesk API" },
      { action: "Apply discount code SORRY15", status: "executed", tool: "Shopify API" }
    ]
  }
};
