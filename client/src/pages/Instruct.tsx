/* ── Inbox Page ────────────────────────────────────────────────
   Left: Topic list (onboarding pinned at top)
   Right: Conversation thread with choice bubbles, file upload,
          scenario cards, "Take me there" links, mode selection
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TOPICS, type Topic, type TopicStatus, type TopicType, type MessageSender } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  FileEdit,
  Search,
  Send,
  Bot,
  User,
  ExternalLink,
  Check,
  X,
  Plus,
  Inbox as InboxIcon,
  Sparkles,
  Upload,
  FileText,
  ArrowRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

/* ── Config ── */

const TYPE_ICON: Record<TopicType, typeof Lightbulb> = {
  knowledge_gap: Lightbulb,
  performance_report: BarChart3,
  open_question: HelpCircle,
  escalation_review: AlertTriangle,
  rule_update: FileEdit,
};

const TYPE_LABEL: Record<TopicType, string> = {
  knowledge_gap: "Knowledge Gap",
  performance_report: "Performance",
  open_question: "Question",
  escalation_review: "Escalation",
  rule_update: "Rule Update",
};

const TYPE_COLOR: Record<TopicType, string> = {
  knowledge_gap: "text-amber-500",
  performance_report: "text-blue-500",
  open_question: "text-slate-500",
  escalation_review: "text-orange-500",
  rule_update: "text-violet-500",
};

type FilterTab = "all" | "unread" | "pending" | "resolved";

const PRIORITY: Record<TopicType, number> = {
  knowledge_gap: 0,
  escalation_review: 1,
  open_question: 2,
  rule_update: 3,
  performance_report: 4,
};

/* ── Onboarding Types ── */

interface OnboardingChoice {
  label: string;
  value: string;
  description?: string;
}

interface OnboardingMessage {
  id: string;
  sender: "ai" | "manager";
  content: string;
  timestamp: string;
  choices?: OnboardingChoice[];
  isScenario?: boolean;
  isFileUpload?: boolean;
  isTakeMeThere?: { label: string; href: string };
}

type OnboardingPhase =
  | "welcome"
  | "connect_zendesk"
  | "connect_shopify"
  | "upload_doc"
  | "parsing"
  | "conflict_1"
  | "conflict_2"
  | "actions_intro"
  | "actions_refund"
  | "actions_cancel"
  | "escalation_intro"
  | "escalation_emotion"
  | "identity_name"
  | "identity_tone"
  | "scenario_wismo"
  | "scenario_refund"
  | "scenario_escalation"
  | "mode_select"
  | "complete";

/* ── Onboarding Welcome Topic ── */

const ONBOARDING_TOPIC_ID = "t-onboarding";

function createOnboardingTopic(): Topic {
  return {
    id: ONBOARDING_TOPIC_ID,
    type: "rule_update" as TopicType,
    title: "Welcome — meet your new rep",
    status: "unread" as TopicStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: "Hi! I'm Alex, your new AI support rep. Let's get me set up.",
    messages: [],
  };
}

/* ── Component ── */

export default function Inbox() {
  const [topics, setTopics] = useState<Topic[]>(() => {
    const onboardingTopic = createOnboardingTopic();
    const regularTopics = TOPICS.map((t) => ({
      ...t,
      status: t.status === "read" ? ("pending" as TopicStatus) : t.status,
    }));
    return [onboardingTopic, ...regularTopics];
  });

  const [selectedId, setSelectedId] = useState<string | null>(ONBOARDING_TOPIC_ID);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  /* ── Onboarding State ── */
  const [obPhase, setObPhase] = useState<OnboardingPhase>("welcome");
  const [obMessages, setObMessages] = useState<OnboardingMessage[]>([]);
  const [obChoiceMade, setObChoiceMade] = useState<Record<string, string>>({});
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOnboarding = selectedId === ONBOARDING_TOPIC_ID;

  /* ── Onboarding message builder ── */
  const addAIMessage = useCallback((content: string, extras?: Partial<OnboardingMessage>) => {
    const msg: OnboardingMessage = {
      id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: "ai",
      content,
      timestamp: new Date().toISOString(),
      ...extras,
    };
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addManagerMessage = useCallback((content: string) => {
    const msg: OnboardingMessage = {
      id: `ob-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: "manager",
      content,
      timestamp: new Date().toISOString(),
    };
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  /* ── Kick off welcome ── */
  useEffect(() => {
    if (obPhase === "welcome" && obMessages.length === 0) {
      const timer = setTimeout(() => {
        addAIMessage(
          "Hi! I'm **Alex**, your new AI support rep.\n\nI'll be handling customer tickets for your team — things like order inquiries, refunds, returns, and more. But first, I need to learn how your team works.\n\nThis will take about 5 minutes. Ready to get started?",
          {
            choices: [
              { label: "Let's do it", value: "start" },
            ],
          }
        );
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [obPhase, obMessages.length, addAIMessage]);

  /* ── Phase transitions ── */
  const advanceOnboarding = useCallback(
    (choice: string, choiceLabel: string, currentPhase: OnboardingPhase) => {
      // Record the choice
      setObChoiceMade((prev) => ({ ...prev, [currentPhase]: choice }));

      // Add manager bubble
      addManagerMessage(choiceLabel);

      // Delay AI response for natural feel
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const advance = async () => {
        await delay(600);

        switch (currentPhase) {
          case "welcome":
            setObPhase("connect_zendesk");
            addAIMessage(
              "Great! First things first — I need access to your helpdesk so I can see and respond to tickets.\n\nDo you use Zendesk?",
              {
                choices: [
                  { label: "Connect Zendesk", value: "connect" },
                  { label: "I'll set this up later", value: "skip" },
                ],
              }
            );
            break;

          case "connect_zendesk":
            if (choice === "connect") {
              await delay(1200);
              addAIMessage("Connected to **Zendesk** — coastalliving.zendesk.com. I can see 1,247 tickets from the last 90 days. Nice.");
              await delay(800);
            }
            setObPhase("connect_shopify");
            addAIMessage(
              choice === "connect"
                ? "Now, to look up orders and process refunds, I'll need access to your store. Are you on Shopify?"
                : "No problem, you can connect it anytime in **Playbook → Integrations**.\n\nNext — to look up orders and process refunds, I'll need access to your store. Are you on Shopify?",
              {
                choices: [
                  { label: "Connect Shopify", value: "connect" },
                  { label: "I'll set this up later", value: "skip" },
                ],
              }
            );
            break;

          case "connect_shopify":
            if (choice === "connect") {
              await delay(1200);
              addAIMessage("Connected to **Shopify** — coastalliving.myshopify.com. I can see 3,842 products and recent orders.");
              await delay(800);
            }
            setObPhase("upload_doc");
            addAIMessage(
              choice === "connect"
                ? "Now the important part — **your policies**. I need to learn your rules so I don't go rogue.\n\nDo you have a return policy, SOP doc, or any guidelines you can share? Drop it here and I'll read through it."
                : "No worries, you can connect anytime in **Playbook → Integrations**.\n\nNow the important part — **your policies**. I need to learn your rules so I don't go rogue.\n\nDo you have a return policy, SOP doc, or any guidelines you can share? Drop it here and I'll read through it.",
              { isFileUpload: true }
            );
            break;

          case "upload_doc":
            // This is handled by file upload, not choice
            break;

          case "conflict_1":
            setObPhase("conflict_2");
            if (choice === "30_days") {
              addAIMessage(
                "Got it — **30 days** is the standard window.\n\nOne more thing I noticed: your SOP says \"no returns on sale items,\" but I found 12 tickets where your team accepted returns on items discounted less than 30%.\n\nWhich should I follow?",
                {
                  choices: [
                    { label: "Follow the SOP — no returns on any sale items", value: "strict" },
                    { label: "Allow returns if discount was under 30%", value: "flexible" },
                  ],
                }
              );
            } else {
              addAIMessage(
                "Got it — **28 days** is the standard window.\n\nOne more thing I noticed: your SOP says \"no returns on sale items,\" but I found 12 tickets where your team accepted returns on items discounted less than 30%.\n\nWhich should I follow?",
                {
                  choices: [
                    { label: "Follow the SOP — no returns on any sale items", value: "strict" },
                    { label: "Allow returns if discount was under 30%", value: "flexible" },
                  ],
                }
              );
            }
            break;

          case "conflict_2":
            setObPhase("actions_intro");
            addAIMessage(
              choice === "strict"
                ? "Clear — no returns on sale items, period. I've noted that.\n\nOk, rules are set. Now let's talk about **what I'm allowed to do on my own**.\n\nSome actions are low-risk (like looking up an order). Others are bigger deals (like issuing a refund). For the bigger ones, I can either handle them myself or check with you first.\n\nLet's start with refunds:"
                : "Makes sense — I'll allow returns on items with less than 30% discount.\n\nOk, rules are set. Now let's talk about **what I'm allowed to do on my own**.\n\nSome actions are low-risk (like looking up an order). Others are bigger deals (like issuing a refund). For the bigger ones, I can either handle them myself or check with you first.\n\nLet's start with refunds:"
            );
            await delay(600);
            setObPhase("actions_refund");
            addAIMessage(
              "**Refunds** — when a customer qualifies for a refund per your policy, should I:",
              {
                choices: [
                  { label: "Process it myself", value: "autonomous", description: "I'll handle refunds up to a limit you set" },
                  { label: "Ask me first", value: "ask_permission", description: "I'll draft the refund and wait for your OK" },
                ],
              }
            );
            break;

          case "actions_refund":
            setObPhase("actions_cancel");
            addAIMessage(
              choice === "autonomous"
                ? "I'll handle refunds on my own. You can set a dollar limit anytime in **Playbook → Actions**.\n\n**Order cancellations** — when a customer wants to cancel an unshipped order:"
                : "I'll always check with you before processing refunds.\n\n**Order cancellations** — when a customer wants to cancel an unshipped order:",
              {
                choices: [
                  { label: "Cancel it myself", value: "autonomous", description: "If the order hasn't shipped, I'll cancel immediately" },
                  { label: "Ask me first", value: "ask_permission", description: "I'll confirm with you before canceling" },
                ],
              }
            );
            break;

          case "actions_cancel":
            setObPhase("escalation_intro");
            addAIMessage(
              "Noted. You can fine-tune all action permissions later.",
              { isTakeMeThere: { label: "See all actions in Playbook", href: "/playbook" } }
            );
            await delay(1000);
            setObPhase("escalation_emotion");
            addAIMessage(
              "Next — **when should I hand off to you?**\n\nI'll always escalate if I genuinely don't know the answer. But there are some situations where you might want me to loop you in even if I *could* handle it.\n\nFor example: **angry or upset customers**. Should I try to de-escalate myself, or hand off to you right away?",
              {
                choices: [
                  { label: "Try to de-escalate first", value: "ai_first", description: "I'll attempt to calm things down. If it doesn't work after 2 messages, I'll escalate." },
                  { label: "Hand off to me immediately", value: "escalate", description: "Any sign of frustration → I loop you in" },
                ],
              }
            );
            break;

          case "escalation_emotion":
            setObPhase("identity_name");
            addAIMessage(
              choice === "ai_first"
                ? "I'll try to handle it first, and escalate if it doesn't improve. Smart.\n\nYou can configure more escalation triggers in Playbook."
                : "Understood — I'll hand off immediately when emotions run high.\n\nYou can configure more escalation triggers in Playbook."
            );
            await delay(800);
            addAIMessage(
              "Almost there. **How should I introduce myself?**\n\nRight now my name is **Alex**. Want to keep it, or give me a different name?",
              {
                choices: [
                  { label: "Keep Alex", value: "Alex" },
                  { label: "Call me Ava", value: "Ava" },
                  { label: "Call me Sam", value: "Sam" },
                ],
              }
            );
            break;

          case "identity_name": {
            const agentName = choice === "Alex" ? "Alex" : choice === "Ava" ? "Ava" : "Sam";
            setObPhase("identity_tone");
            addAIMessage(
              `**${agentName}** it is.\n\nAnd what tone should I use with customers?`,
              {
                choices: [
                  { label: "Friendly and warm", value: "friendly", description: "\"Hey Emma! Let me look into that for you 😊\"" },
                  { label: "Professional", value: "professional", description: "\"Hello Emma, I'd be happy to assist you with this.\"" },
                  { label: "Casual", value: "casual", description: "\"Hi Emma! Sure thing, let me check that real quick.\"" },
                ],
              }
            );
            break;
          }

          case "identity_tone":
            setObPhase("scenario_wismo");
            addAIMessage(
              `Got it — I'll keep it **${choice}**. You can adjust my identity anytime in Playbook.\n\nNow, before I start, let me show you how I'd handle a few common scenarios so you can make sure I'm on the right track.`
            );
            await delay(1000);
            addAIMessage(
              `**Scenario 1 — "Where is my order?"**\n\nCustomer writes: *"Where is my order #DBH-29174? It's been a week and I haven't received anything."*\n\nHere's what I'd do:\n1. Look up **#DBH-29174** in Shopify\n2. I see it's **shipped** via Royal Mail, tracking RM29174UK, expected Mar 25\n3. I'd reply:\n\n> *Hi Emma! Your order #DBH-29174 shipped via Royal Mail (tracking: RM29174UK) and is expected to arrive by March 25th. You can track it here: [link]. Let me know if you need anything else!*\n\nThis is read-only — I'm just looking up info and replying. Does this look right?`,
              {
                choices: [
                  { label: "That's right", value: "approve" },
                  { label: "Needs adjustment", value: "adjust" },
                ],
                isScenario: true,
              }
            );
            break;

          case "scenario_wismo":
            setObPhase("scenario_refund");
            addAIMessage(
              choice === "approve"
                ? "Great."
                : "No worries — you can fine-tune my responses in Playbook."
            );
            await delay(800);
            addAIMessage(
              `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within 30-day return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed to your original payment method within 3-5 business days.*\n\n${obChoiceMade["actions_refund"] === "ask_permission" ? "Since you asked me to check before processing refunds, I'd send you an approval request in Zendesk before actually initiating this." : "Since you gave me permission to process refunds, I'd handle this end-to-end."}\n\nLook good?`,
              {
                choices: [
                  { label: "That's right", value: "approve" },
                  { label: "Needs adjustment", value: "adjust" },
                ],
                isScenario: true,
              }
            );
            break;

          case "scenario_refund":
            setObPhase("scenario_escalation");
            addAIMessage(
              choice === "approve"
                ? "Perfect."
                : "Noted — I'll learn from your corrections over time."
            );
            await delay(800);
            addAIMessage(
              `**Scenario 3 — Escalation**\n\nCustomer writes: *"This is the THIRD time I'm contacting you about this. I want to speak to a manager RIGHT NOW. Your service is absolutely terrible."*\n\nHere's what I'd do:\n${obChoiceMade["escalation_emotion"] === "ai_first"
                ? "1. Detect strong frustration + explicit request for manager\n2. Even though I'd normally try to de-escalate first, the customer explicitly asked for a manager — so I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly. They'll be with you shortly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation."
                : "1. Detect strong frustration + explicit request for manager\n2. Per your preference, I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly. They'll be with you shortly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation."
              }\n\nDoes this feel right?`,
              {
                choices: [
                  { label: "That's right", value: "approve" },
                  { label: "Needs adjustment", value: "adjust" },
                ],
                isScenario: true,
              }
            );
            break;

          case "scenario_escalation":
            setObPhase("mode_select");
            addAIMessage(
              "Great — I'm confident I understand your policies.\n\nOne last question. How do you want me to work?"
            );
            await delay(800);
            addAIMessage(
              "**Training mode** — I draft my responses and actions, but I check with you before anything goes out to the customer. Good if you want to review my work for a while.\n\n**Production mode** — I handle tickets on my own. You can review everything after the fact. Good if you trust the sanity check and want me working immediately.",
              {
                choices: [
                  { label: "Training — check with me first", value: "shadow" },
                  { label: "Production — handle it yourself", value: "production" },
                ],
              }
            );
            break;

          case "mode_select":
            setObPhase("complete");
            addAIMessage(
              choice === "shadow"
                ? "Training mode it is. I'll draft everything and wait for your approval before sending.\n\nYou're all set! I'll start picking up tickets now. You'll see my work in Zendesk — check the sidebar for approvals.\n\nIf I run into something I don't know, I'll post it here in Inbox. Talk soon!"
                : "Production mode — let's go. I'll start handling tickets on my own right away.\n\nYou're all set! You can review my work anytime in Zendesk. If I run into something I don't know, I'll post it here in Inbox. Talk soon!"
            );
            // Mark topic as resolved
            setTopics((prev) =>
              prev.map((t) =>
                t.id === ONBOARDING_TOPIC_ID
                  ? { ...t, status: "resolved" as TopicStatus }
                  : t
              )
            );
            break;
        }
      };

      advance();
    },
    [addAIMessage, addManagerMessage, obChoiceMade]
  );

  /* ── File upload handler ── */
  const handleFileUpload = useCallback(() => {
    if (fileUploaded) return;
    setFileUploaded(true);
    addManagerMessage("📎 Seel_Return_Policy_2026.pdf");

    setIsParsing(true);
    setObPhase("parsing");

    // Simulate parsing
    setTimeout(() => {
      setIsParsing(false);
      addAIMessage(
        "I've read through your return policy. Here's what I found:\n\n**13 rules** across 5 categories:\n- **Return Window**: 30-day standard, 45-day for VIP\n- **Refund Methods**: Original payment, store credit, exchange\n- **Return Shipping**: Free for defective, $8.95 for change-of-mind\n- **Exclusions**: Final sale items, personalized items\n- **Special Cases**: International returns, damaged items\n\nI noticed a couple of things that need your input."
      );

      setTimeout(() => {
        setObPhase("conflict_1");
        addAIMessage(
          "Your document says the return window is **30 days**, but I found tickets where your team accepted returns at **28 days** counting from delivery (not purchase).\n\nWhich should I follow?",
          {
            choices: [
              { label: "30 days from purchase", value: "30_days" },
              { label: "28 days from delivery", value: "28_days" },
            ],
          }
        );
      }, 1200);
    }, 2500);
  }, [fileUploaded, addManagerMessage, addAIMessage]);

  /* ── Regular topic handlers ── */
  const counts = {
    all: topics.length,
    unread: topics.filter((t) => t.status === "unread").length,
    pending: topics.filter((t) => t.status === ("pending" as TopicStatus) || t.status === "read").length,
    resolved: topics.filter((t) => t.status === "resolved").length,
  };

  const filtered = topics
    .filter((t) => {
      if (tab === "all") return true;
      if (tab === "pending") return t.status === ("pending" as TopicStatus) || t.status === "read";
      return t.status === tab;
    })
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Onboarding always first
      if (a.id === ONBOARDING_TOPIC_ID) return -1;
      if (b.id === ONBOARDING_TOPIC_ID) return 1;
      if (a.status === "unread" && b.status !== "unread") return -1;
      if (a.status !== "unread" && b.status === "unread") return 1;
      return PRIORITY[a.type] - PRIORITY[b.type];
    });

  const selected = topics.find((t) => t.id === selectedId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length, obMessages.length]);

  useEffect(() => {
    if (selectedId && selectedId !== ONBOARDING_TOPIC_ID) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === selectedId && t.status === "unread"
            ? { ...t, status: "pending" as TopicStatus }
            : t
        )
      );
    }
  }, [selectedId]);

  const handleAccept = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    const rule = topic?.proposedRule?.text || "the proposed rule";
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: "resolved" as TopicStatus,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: "Approved. Please update the rule.", timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: `Got it! I've updated the rule. Here's my understanding:\n\n> ${rule}\n\nI'll apply this going forward. Let me know if anything needs adjustment.`, timestamp: new Date().toISOString() },
          ],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "accepted" as const } : undefined,
        };
      })
    );
    toast.success("Rule accepted");
  };

  const handleReject = (id: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: "Rejected. This doesn't match our policy.", timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Understood. I'll keep escalating these cases. Could you tell me the correct approach?", timestamp: new Date().toISOString() },
          ],
          proposedRule: t.proposedRule ? { ...t.proposedRule, status: "rejected" as const } : undefined,
        };
      })
    );
    toast.info("Rule rejected");
  };

  const handleSend = () => {
    if (!replyText.trim() || !selectedId) return;
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: replyText.trim(), timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Thanks for the guidance! I'll incorporate this. Let me know if there's anything else.", timestamp: new Date().toISOString() },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setReplyText("");
  };

  const handleNewTopic = () => {
    const t: Topic = {
      id: `t-new-${Date.now()}`,
      type: "rule_update",
      title: "New Rule Update",
      status: "pending" as TopicStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preview: "",
      messages: [],
    };
    setTopics((prev) => [prev[0], t, ...prev.slice(1)]);
    setSelectedId(t.id);
    toast.info("New topic created");
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const h = (Date.now() - d.getTime()) / 3.6e6;
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${Math.round(h)}h`;
    if (h < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /* ── Find the last message with active choices (for onboarding) ── */
  const lastChoiceMsg = obMessages.filter((m) => m.choices && m.choices.length > 0).at(-1);
  const isLastChoiceActive = lastChoiceMsg && !obChoiceMade[obPhase] && obPhase !== "parsing" && obPhase !== "complete";

  /* ── Render ── */
  return (
    <div className="flex h-full">
      {/* ── Left Panel ── */}
      <div className="w-[300px] border-r border-border flex flex-col bg-white shrink-0">
        <div className="h-11 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-semibold text-foreground">Inbox</h1>
            {counts.unread > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                {counts.unread}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleNewTopic}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[13px] bg-background"
            />
          </div>
          <div className="flex gap-0.5 bg-muted/50 rounded-md p-0.5">
            {(["all", "unread", "pending", "resolved"] as FilterTab[]).map((f) => (
              <button
                key={f}
                onClick={() => setTab(f)}
                className={cn(
                  "flex-1 px-2 py-1 rounded text-[12px] font-medium transition-all",
                  tab === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {counts[f] > 0 && f !== "all" && (
                  <span className="ml-1 opacity-60">{counts[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No topics</div>
          ) : (
            filtered.map((topic) => {
              const isOb = topic.id === ONBOARDING_TOPIC_ID;
              const Icon = isOb ? Sparkles : TYPE_ICON[topic.type];
              const isActive = selectedId === topic.id;
              const isUnread = topic.status === "unread";

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 transition-colors",
                    isActive
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : "hover:bg-muted/30 border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 shrink-0", isOb ? "text-primary" : TYPE_COLOR[topic.type])} />
                    <span
                      className={cn(
                        "text-[13px] truncate flex-1",
                        isUnread || isOb ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                      )}
                    >
                      {topic.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {fmtTime(topic.updatedAt)}
                    </span>
                    {isUnread && !isOb && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-white">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-[280px]">
              <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <InboxIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground/70 mb-1">Select a topic</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Alex posts topics for knowledge gaps, performance reports, and questions.
              </p>
            </div>
          </div>
        ) : isOnboarding ? (
          /* ── Onboarding Conversation ── */
          <>
            <div className="h-11 px-5 flex items-center gap-3 border-b border-border shrink-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-[13px] font-medium text-foreground truncate flex-1">
                Welcome — meet your new rep
              </h2>
              {obPhase === "complete" ? (
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px]">Setting up</Badge>
              )}
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              <div className="max-w-[640px] mx-auto space-y-4">
                {obMessages.map((msg) => {
                  const isAI = msg.sender === "ai";
                  const hasActiveChoices = msg.choices && msg.id === lastChoiceMsg?.id && isLastChoiceActive;

                  return (
                    <div key={msg.id}>
                      <div className={cn("flex gap-3", !isAI && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            isAI ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          {isAI ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-medium text-foreground/60">
                              {isAI ? "Alex" : "You"}
                            </span>
                            <span className="text-[11px] text-muted-foreground/40">just now</span>
                          </div>

                          {/* Message content */}
                          <div
                            className={cn(
                              "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed max-w-full",
                              isAI
                                ? "bg-card border border-border text-foreground/85"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            {msg.content.split("\n").map((line, i) => {
                              if (line.startsWith("> ")) {
                                return (
                                  <blockquote
                                    key={i}
                                    className={cn(
                                      "border-l-2 pl-3 my-1.5 italic text-[12px]",
                                      isAI ? "border-primary/30 text-foreground/60" : "border-white/40 text-white/80"
                                    )}
                                  >
                                    {line.slice(2)}
                                  </blockquote>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return (
                                  <div key={i} className="flex gap-2 ml-1">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                                    <span>{renderBold(line.slice(2))}</span>
                                  </div>
                                );
                              }
                              if (line === "") return <div key={i} className="h-1.5" />;
                              return <p key={i}>{renderBold(line)}</p>;
                            })}
                          </div>

                          {/* File upload zone */}
                          {msg.isFileUpload && !fileUploaded && (
                            <div className="mt-3 w-full">
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={() => handleFileUpload()}
                              />
                              <button
                                onClick={() => handleFileUpload()}
                                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
                              >
                                <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
                                  Drop a file here or click to upload
                                </p>
                                <p className="text-[11px] text-muted-foreground/60 mt-1">PDF, Word, or text</p>
                              </button>
                            </div>
                          )}

                          {/* Take me there link */}
                          {msg.isTakeMeThere && (
                            <a
                              href={msg.isTakeMeThere.href}
                              className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              {msg.isTakeMeThere.label}
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Choice bubbles — right-aligned like manager messages */}
                      {hasActiveChoices && msg.choices && (
                        <div className="flex flex-col items-end gap-2 mt-3 ml-10">
                          {msg.choices.map((choice, ci) => (
                            <button
                              key={ci}
                              onClick={() => advanceOnboarding(choice.value, choice.label, obPhase)}
                              className={cn(
                                "text-left rounded-2xl px-4 py-2 text-[13px] transition-all max-w-[400px]",
                                "border border-primary/30 text-primary hover:bg-primary hover:text-white",
                                ci === 0 && "bg-primary/5 border-primary/50 font-medium"
                              )}
                            >
                              <span>{choice.label}</span>
                              {choice.description && (
                                <span className="block text-[11px] opacity-70 mt-0.5">{choice.description}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Parsing indicator */}
                {isParsing && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-foreground/60">Alex</span>
                      </div>
                      <div className="bg-card border border-border rounded-lg px-3.5 py-3 inline-flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[12px] text-muted-foreground">Reading your document...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </ScrollArea>
          </>
        ) : (
          /* ── Regular Topic Conversation ── */
          <>
            <div className="h-11 px-5 flex items-center gap-3 border-b border-border shrink-0">
              {(() => {
                const Icon = TYPE_ICON[selected.type];
                return <Icon className={cn("w-4 h-4 shrink-0", TYPE_COLOR[selected.type])} />;
              })()}
              <h2 className="text-[13px] font-medium text-foreground truncate flex-1">
                {selected.title}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {selected.status === "resolved" ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">Open</Badge>
                )}
                {selected.sourceTicketId && (
                  <button className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    #{selected.sourceTicketId}
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              <div className="max-w-[640px] mx-auto space-y-4">
                {selected.messages.map((msg) => {
                  const isAI = msg.sender === "ai";
                  return (
                    <div key={msg.id} className={cn("flex gap-3", !isAI && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isAI ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        {isAI ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-foreground/60">
                            {isAI ? "Alex" : "You"}
                          </span>
                          <span className="text-[11px] text-muted-foreground/40">
                            {fmtTime(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
                            isAI
                              ? "bg-card border border-border text-foreground/85"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {msg.content.split("\n").map((line, i) => {
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={i}
                                  className={cn(
                                    "border-l-2 pl-3 my-1.5 italic text-[12px]",
                                    isAI ? "border-primary/30 text-foreground/60" : "border-white/40 text-white/80"
                                  )}
                                >
                                  {line.slice(2)}
                                </blockquote>
                              );
                            }
                            if (line.startsWith("- ")) {
                              return (
                                <div key={i} className="flex gap-2 ml-1">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                                  <span>{renderBold(line.slice(2))}</span>
                                </div>
                              );
                            }
                            if (line === "") return <div key={i} className="h-1.5" />;
                            return <p key={i}>{renderBold(line)}</p>;
                          })}
                        </div>

                        {msg.actions && msg.actions.length > 0 && selected.proposedRule?.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            {msg.actions.map((action) => (
                              <Button
                                key={action.label}
                                size="sm"
                                variant={action.type === "accept" ? "default" : "outline"}
                                className={cn(
                                  "h-7 text-[12px] gap-1",
                                  action.type === "accept" && "bg-emerald-600 hover:bg-emerald-700"
                                )}
                                onClick={() => {
                                  if (action.type === "accept") handleAccept(selected.id);
                                  if (action.type === "reject") handleReject(selected.id);
                                }}
                              >
                                {action.type === "accept" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            {selected.status !== "resolved" && (
              <div className="px-5 py-2.5 border-t border-border shrink-0">
                <div className="max-w-[640px] mx-auto flex gap-2">
                  <Input
                    placeholder="Reply to Alex..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1 h-8 text-[12px]"
                  />
                  <Button size="sm" className="h-8 px-3" disabled={!replyText.trim()} onClick={handleSend}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
