/* ── Inbox Page ────────────────────────────────────────────────
   Left: Topic list (onboarding pinned at top)
   Right: Conversation thread with choice bubbles, inline forms,
          structured conflict resolution, scenario sanity checks
   ──────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TOPICS, type Topic, type TopicStatus, type TopicType, type MessageSender } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb, BarChart3, HelpCircle, AlertTriangle, FileEdit,
  Search, Send, Bot, User, ExternalLink, Check, X, Plus,
  Inbox as InboxIcon, Sparkles, Upload, FileText, ArrowRight, Zap,
} from "lucide-react";
import { toast } from "sonner";

/* ── Config ── */
const TYPE_ICON: Record<TopicType, typeof Lightbulb> = {
  knowledge_gap: Lightbulb, performance_report: BarChart3,
  open_question: HelpCircle, escalation_review: AlertTriangle, rule_update: FileEdit,
};
const TYPE_COLOR: Record<TopicType, string> = {
  knowledge_gap: "text-amber-500", performance_report: "text-blue-500",
  open_question: "text-slate-500", escalation_review: "text-orange-500", rule_update: "text-violet-500",
};
type FilterTab = "all" | "unread" | "pending" | "resolved";
const PRIORITY: Record<TopicType, number> = {
  knowledge_gap: 0, escalation_review: 1, open_question: 2, rule_update: 3, performance_report: 4,
};

/* ── Onboarding Types ── */
interface OnboardingChoice { label: string; value: string; description?: string; }

interface ConflictItem {
  id: string;
  title: string;
  sourceA: string;
  sourceALabel: string;
  sourceB: string;
  sourceBLabel: string;
  resolved?: "a" | "b" | "later";
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
  isNameInput?: boolean;
  isActionsForm?: boolean;
  isEscalationForm?: boolean;
  isConflictForm?: boolean;
  conflicts?: ConflictItem[];
  scenarioFeedback?: boolean;
}

type OnboardingPhase =
  | "welcome" | "name_input"
  | "connect_zendesk" | "connect_shopify"
  | "upload_doc" | "parsing" | "parse_done"
  | "conflicts"
  | "actions_form"
  | "escalation_form"
  | "identity_tone"
  | "scenario_wismo" | "scenario_refund" | "scenario_escalation"
  | "mode_select" | "complete";

/* ── Progress stages ── */
const STAGES = [
  { id: "connection", label: "Connection" },
  { id: "knowledge", label: "Knowledge" },
  { id: "permissions", label: "Permissions" },
  { id: "sanity", label: "Sanity Check" },
  { id: "go_live", label: "Go Live" },
];

function getStageIndex(phase: OnboardingPhase): number {
  if (["welcome", "name_input", "connect_zendesk", "connect_shopify"].includes(phase)) return 0;
  if (["upload_doc", "parsing", "parse_done", "conflicts"].includes(phase)) return 1;
  if (["actions_form", "escalation_form", "identity_tone"].includes(phase)) return 2;
  if (["scenario_wismo", "scenario_refund", "scenario_escalation"].includes(phase)) return 3;
  return 4;
}

/* ── Onboarding Welcome Topic ── */
const ONBOARDING_TOPIC_ID = "t-onboarding";
function createOnboardingTopic(): Topic {
  return {
    id: ONBOARDING_TOPIC_ID, type: "rule_update" as TopicType,
    title: "Welcome — meet your new rep", status: "unread" as TopicStatus,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    preview: "Hi! I'm your new AI support rep. Let's get set up.", messages: [],
  };
}

/* ── Default conflicts ── */
const DEFAULT_CONFLICTS: ConflictItem[] = [
  {
    id: "c1", title: "Return window duration",
    sourceA: "30 days from purchase date", sourceALabel: "SOP Document (Section 2.1)",
    sourceB: "28 days from delivery date", sourceBLabel: "Observed in 47 past tickets",
  },
  {
    id: "c2", title: "Sale items return policy",
    sourceA: "No returns on any sale items", sourceALabel: "SOP Document (Section 3.4)",
    sourceB: "Allow returns if discount was under 30%", sourceBLabel: "Observed in 12 past tickets",
  },
  {
    id: "c3", title: "International return shipping",
    sourceA: "Customer pays return shipping for international orders", sourceALabel: "SOP Document (Section 5.2)",
    sourceB: "Provide prepaid label for orders over $100", sourceBLabel: "Observed in 8 past tickets",
  },
];

/* ── Default action items ── */
const DEFAULT_ACTIONS = [
  { id: "refund", label: "Process refunds", description: "Issue refunds to customers", default: "ask" as const },
  { id: "cancel", label: "Cancel orders", description: "Cancel unshipped orders", default: "ask" as const },
  { id: "return_label", label: "Create return labels", description: "Generate prepaid return shipping labels", default: "auto" as const },
  { id: "reply", label: "Send customer replies", description: "Respond to customer messages", default: "auto" as const },
  { id: "internal_note", label: "Write internal notes", description: "Add notes to tickets for your team", default: "auto" as const },
  { id: "lookup_order", label: "Look up orders", description: "Query order status and details in Shopify", default: "auto" as const },
];

/* ── Default escalation triggers ── */
const DEFAULT_ESCALATION = [
  { id: "angry", label: "Customer is angry or upset", default: true },
  { id: "legal", label: "Legal or compliance keywords detected", default: true },
  { id: "manager_request", label: "Customer explicitly asks for a manager", default: true },
  { id: "unresolved_3", label: "Issue unresolved after 3 exchanges", default: true },
  { id: "high_value", label: "Order value exceeds $500", default: false },
  { id: "repeat_contact", label: "Customer contacted 3+ times about same issue", default: false },
  { id: "refund_over_limit", label: "Refund amount exceeds configured limit", default: false },
];

/* ── Component ── */
export default function Inbox() {
  const [topics, setTopics] = useState<Topic[]>(() => {
    const onboardingTopic = createOnboardingTopic();
    const regularTopics = TOPICS.map((t) => ({
      ...t, status: t.status === "read" ? ("pending" as TopicStatus) : t.status,
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
  const [agentName, setAgentName] = useState("Alex");
  const [nameInput, setNameInput] = useState("");
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);

  // Inline form states
  const [conflicts, setConflicts] = useState<ConflictItem[]>(DEFAULT_CONFLICTS);
  const [actionPerms, setActionPerms] = useState<Record<string, "auto" | "ask" | "off">>(
    Object.fromEntries(DEFAULT_ACTIONS.map((a) => [a.id, a.default]))
  );
  const [escalationToggles, setEscalationToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_ESCALATION.map((e) => [e.id, e.default]))
  );

  // Scenario feedback
  const [scenarioFeedbackText, setScenarioFeedbackText] = useState("");
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnboarding = selectedId === ONBOARDING_TOPIC_ID;

  /* ── Onboarding message builder ── */
  const addAIMessage = useCallback((content: string, extras?: Partial<OnboardingMessage>) => {
    const msg: OnboardingMessage = {
      id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: "ai", content, timestamp: new Date().toISOString(), ...extras,
    };
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addManagerMessage = useCallback((content: string) => {
    const msg: OnboardingMessage = {
      id: `ob-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: "manager", content, timestamp: new Date().toISOString(),
    };
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  /* ── Kick off welcome ── */
  useEffect(() => {
    if (obPhase === "welcome" && obMessages.length === 0) {
      const timer = setTimeout(() => {
        addAIMessage(
          "Hi there! I'm your new AI support rep. I'll be handling customer tickets — things like order inquiries, refunds, returns, and more.\n\nBut first, let me learn how your team works. This will take about 5 minutes.\n\nBefore we start — **what should I call myself** when talking to customers?",
          { isNameInput: true }
        );
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [obPhase, obMessages.length, addAIMessage]);

  /* ── Submit agent name ── */
  const handleNameSubmit = useCallback(() => {
    const name = nameInput.trim() || "Alex";
    setAgentName(name);
    addManagerMessage(name);
    setObPhase("connect_zendesk");
    setTimeout(() => {
      addAIMessage(
        `**${name}** — I like it.\n\nFirst things first — I need access to your helpdesk so I can see and respond to tickets.\n\nDo you use Zendesk?`,
        {
          choices: [
            { label: "Connect Zendesk", value: "connect" },
            { label: "I'll set this up later", value: "skip" },
          ],
        }
      );
    }, 500);
  }, [nameInput, addManagerMessage, addAIMessage]);

  /* ── Phase transitions ── */
  const advanceOnboarding = useCallback(
    (choice: string, choiceLabel: string, currentPhase: OnboardingPhase) => {
      setObChoiceMade((prev) => ({ ...prev, [currentPhase]: choice }));
      addManagerMessage(choiceLabel);

      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const advance = async () => {
        await delay(600);

        switch (currentPhase) {
          case "connect_zendesk":
            if (choice === "connect") {
              await delay(1200);
              addAIMessage("Connected to **Zendesk** — coastalliving.zendesk.com. I can see 1,247 tickets from the last 90 days.");
              await delay(800);
            } else {
              setSkippedSteps((prev) => [...prev, "zendesk"]);
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
            } else {
              setSkippedSteps((prev) => [...prev, "shopify"]);
            }
            setObPhase("upload_doc");
            addAIMessage(
              "Now the important part — **your policies**. I need to learn your rules so I don't go rogue.\n\nDo you have a return policy, SOP doc, or any guidelines you can share?",
              { isFileUpload: true }
            );
            break;

          case "parse_done":
            setObPhase("conflicts");
            addAIMessage(
              `I found **3 conflicts** between your document and what I observed in past tickets. For each one, pick the rule I should follow — or choose "Decide later" and resolve it in **Playbook → Knowledge**.`,
              { isConflictForm: true, conflicts: DEFAULT_CONFLICTS }
            );
            break;

          case "identity_tone":
            setObPhase("scenario_wismo");
            addAIMessage(
              `Got it — I'll keep it **${choice}**. You can adjust my identity anytime in Playbook.\n\nNow, before I start, let me show you how I'd handle a few common scenarios. If anything looks off, just tell me and I'll adjust on the spot.`
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
            if (choice === "adjust") {
              setAwaitingFeedback(true);
              addAIMessage("Sure — what would you change? Just type it out and I'll update my approach.", { scenarioFeedback: true });
              return;
            }
            setObPhase("scenario_refund");
            addAIMessage("Great.");
            await delay(800);
            addAIMessage(
              `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days.*\n\n${actionPerms["refund"] === "ask" ? "Since refunds need your approval, I'd send you an approval request in Zendesk before initiating." : "Since I have permission to process refunds, I'd handle this end-to-end."}\n\nLook good?`,
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
            if (choice === "adjust") {
              setAwaitingFeedback(true);
              addAIMessage("What should I do differently here? I'll update the rule right away.", { scenarioFeedback: true });
              return;
            }
            setObPhase("scenario_escalation");
            addAIMessage("Perfect.");
            await delay(800);
            addAIMessage(
              `**Scenario 3 — Escalation**\n\nCustomer writes: *"This is the THIRD time I'm contacting you about this. I want to speak to a manager RIGHT NOW."*\n\nHere's what I'd do:\n1. Detect strong frustration + explicit request for manager\n2. I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation.\n\nDoes this feel right?`,
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
            if (choice === "adjust") {
              setAwaitingFeedback(true);
              addAIMessage("What would you change about my escalation approach?", { scenarioFeedback: true });
              return;
            }
            setObPhase("mode_select");
            addAIMessage(
              "Great — I'm confident I understand your policies.\n\nOne last question. **How do you want me to work?**"
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

          case "mode_select": {
            setObPhase("complete");
            const mode = choice === "shadow" ? "Training" : "Production";
            const incomplete = skippedSteps.length > 0;

            let completionMsg = `**${mode} mode** it is. ${choice === "shadow" ? "I'll draft everything and wait for your approval before sending." : "I'll start handling tickets on my own right away."}\n\n---\n\n**You're all set!** Here's what happens next:\n\n`;
            completionMsg += `- **Inbox** — I'll post here whenever I run into something I don't know, need your input on a rule, or have a weekly performance summary.\n`;
            completionMsg += `- **Zendesk** — ${choice === "shadow" ? "Check the sidebar for my draft responses and approval requests." : "I'm handling tickets. Check the sidebar to review my work, takeover, or flag bad cases."}\n`;
            completionMsg += `- **Playbook** — Your configuration hub. Adjust my permissions, escalation rules, identity, and knowledge anytime.`;

            if (incomplete) {
              completionMsg += `\n\n---\n\n**Before I start, you still need to:**`;
              if (skippedSteps.includes("zendesk")) {
                completionMsg += `\n- Connect Zendesk`;
              }
              if (skippedSteps.includes("shopify")) {
                completionMsg += `\n- Connect Shopify`;
              }
            }

            addAIMessage(completionMsg, incomplete ? undefined : undefined);

            if (incomplete) {
              setTimeout(() => {
                addAIMessage(
                  "Complete the remaining steps so I can start working:",
                  {
                    isTakeMeThere: { label: "Go to Playbook → Integrations", href: "/playbook" },
                  }
                );
              }, 800);
            }

            setTopics((prev) =>
              prev.map((t) =>
                t.id === ONBOARDING_TOPIC_ID
                  ? { ...t, status: "resolved" as TopicStatus }
                  : t
              )
            );
            break;
          }
        }
      };

      advance();
    },
    [addAIMessage, addManagerMessage, obChoiceMade, actionPerms, skippedSteps]
  );

  /* ── Scenario feedback handler ── */
  const handleScenarioFeedback = useCallback(() => {
    if (!scenarioFeedbackText.trim() || !awaitingFeedback) return;
    const feedback = scenarioFeedbackText.trim();
    addManagerMessage(feedback);
    setScenarioFeedbackText("");
    setAwaitingFeedback(false);

    setTimeout(() => {
      addAIMessage(
        `Got it — I've updated my approach based on your feedback:\n\n> "${feedback}"\n\nI'll apply this going forward. Let's continue.`
      );

      setTimeout(() => {
        // Move to next scenario
        if (obPhase === "scenario_wismo") {
          setObPhase("scenario_refund");
          addAIMessage(
            `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days.*\n\n${actionPerms["refund"] === "ask" ? "Since refunds need your approval, I'd send you an approval request in Zendesk before initiating." : "Since I have permission to process refunds, I'd handle this end-to-end."}\n\nLook good?`,
            {
              choices: [
                { label: "That's right", value: "approve" },
                { label: "Needs adjustment", value: "adjust" },
              ],
              isScenario: true,
            }
          );
        } else if (obPhase === "scenario_refund") {
          setObPhase("scenario_escalation");
          addAIMessage(
            `**Scenario 3 — Escalation**\n\nCustomer writes: *"This is the THIRD time I'm contacting you about this. I want to speak to a manager RIGHT NOW."*\n\nHere's what I'd do:\n1. Detect strong frustration + explicit request for manager\n2. I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation.\n\nDoes this feel right?`,
            {
              choices: [
                { label: "That's right", value: "approve" },
                { label: "Needs adjustment", value: "adjust" },
              ],
              isScenario: true,
            }
          );
        } else if (obPhase === "scenario_escalation") {
          setObPhase("mode_select");
          addAIMessage("Great — I'm confident I understand your policies.\n\nOne last question. **How do you want me to work?**");
          setTimeout(() => {
            addAIMessage(
              "**Training mode** — I draft my responses and actions, but I check with you before anything goes out to the customer. Good if you want to review my work for a while.\n\n**Production mode** — I handle tickets on my own. You can review everything after the fact. Good if you trust the sanity check and want me working immediately.",
              {
                choices: [
                  { label: "Training — check with me first", value: "shadow" },
                  { label: "Production — handle it yourself", value: "production" },
                ],
              }
            );
          }, 800);
        }
      }, 800);
    }, 600);
  }, [scenarioFeedbackText, awaitingFeedback, obPhase, addManagerMessage, addAIMessage, actionPerms]);

  /* ── File upload handler ── */
  const handleFileUpload = useCallback((useDemoDoc = false) => {
    if (fileUploaded) return;
    setFileUploaded(true);
    addManagerMessage(useDemoDoc ? "📎 Seel_Return_Policy_2026.pdf (demo)" : "📎 Uploaded document");

    setIsParsing(true);
    setObPhase("parsing");

    setTimeout(() => {
      setIsParsing(false);
      setObPhase("parse_done");
      addAIMessage(
        "I've read through your return policy and extracted the rules. You can review all extracted rules anytime in **Playbook → Knowledge**.",
        {
          choices: [{ label: "Continue", value: "continue" }],
          isTakeMeThere: { label: "View extracted rules in Playbook", href: "/playbook" },
        }
      );
    }, 2500);
  }, [fileUploaded, addManagerMessage, addAIMessage]);

  /* ── Conflict resolution handler ── */
  const handleConflictResolve = useCallback((conflictId: string, resolution: "a" | "b" | "later") => {
    setConflicts((prev) =>
      prev.map((c) => c.id === conflictId ? { ...c, resolved: resolution } : c)
    );
  }, []);

  const handleConflictsSubmit = useCallback(() => {
    const resolved = conflicts.filter((c) => c.resolved === "a" || c.resolved === "b");
    const deferred = conflicts.filter((c) => c.resolved === "later" || !c.resolved);

    let msg = `Got it — I've updated ${resolved.length} rule${resolved.length !== 1 ? "s" : ""}.`;
    if (deferred.length > 0) {
      msg += ` ${deferred.length} conflict${deferred.length !== 1 ? "s" : ""} deferred — you can resolve ${deferred.length === 1 ? "it" : "them"} in **Playbook → Knowledge**.`;
    }

    addManagerMessage(`Resolved ${resolved.length} conflicts, deferred ${deferred.length}`);
    setTimeout(() => {
      addAIMessage(msg);
      setTimeout(() => {
        setObPhase("actions_form");
        addAIMessage(
          "Next — **what can I do on my own, and what needs your OK?**\n\nHere are the actions I can take. For each one, choose whether I should handle it myself, ask you first, or not do it at all.",
          { isActionsForm: true }
        );
      }, 800);
    }, 600);
  }, [conflicts, addManagerMessage, addAIMessage]);

  /* ── Actions form submit ── */
  const handleActionsSubmit = useCallback(() => {
    const autoCount = Object.values(actionPerms).filter((v) => v === "auto").length;
    const askCount = Object.values(actionPerms).filter((v) => v === "ask").length;
    addManagerMessage(`Set ${autoCount} actions to auto, ${askCount} to ask permission`);
    setTimeout(() => {
      addAIMessage(
        `Noted — I'll handle ${autoCount} actions on my own and check with you on ${askCount}. You can fine-tune these anytime.`,
        { isTakeMeThere: { label: "Adjust in Playbook → Actions", href: "/playbook" } }
      );
      setTimeout(() => {
        setObPhase("escalation_form");
        addAIMessage(
          "Now — **when should I hand off to you?**\n\nI'll always escalate if I genuinely don't know the answer. But here are some extra triggers you can turn on:",
          { isEscalationForm: true }
        );
      }, 800);
    }, 600);
  }, [actionPerms, addManagerMessage, addAIMessage]);

  /* ── Escalation form submit ── */
  const handleEscalationSubmit = useCallback(() => {
    const enabledCount = Object.values(escalationToggles).filter(Boolean).length;
    addManagerMessage(`Enabled ${enabledCount} escalation triggers`);
    setTimeout(() => {
      addAIMessage(
        `Got it — ${enabledCount} escalation triggers active. You can adjust these anytime.`,
        { isTakeMeThere: { label: "Change in Playbook → Escalation", href: "/playbook" } }
      );
      setTimeout(() => {
        setObPhase("identity_tone");
        addAIMessage(
          `Almost there. I'm **${agentName}**. What tone should I use with customers?`,
          {
            choices: [
              { label: "Friendly and warm", value: "friendly", description: `"Hey Emma! Let me look into that for you 😊"` },
              { label: "Professional", value: "professional", description: `"Hello Emma, I'd be happy to assist you with this."` },
              { label: "Casual", value: "casual", description: `"Hi Emma! Sure thing, let me check that real quick."` },
            ],
          }
        );
      }, 800);
    }, 600);
  }, [escalationToggles, agentName, addManagerMessage, addAIMessage]);

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
          ...t, status: "resolved" as TopicStatus,
          messages: [
            ...t.messages,
            { id: `m-${Date.now()}`, sender: "manager" as MessageSender, content: "Approved. Please update the rule.", timestamp: new Date().toISOString() },
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: `Got it! I've updated the rule:\n\n> ${rule}\n\nI'll apply this going forward.`, timestamp: new Date().toISOString() },
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
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Understood. Could you tell me the correct approach?", timestamp: new Date().toISOString() },
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
            { id: `m-${Date.now() + 1}`, sender: "ai" as MessageSender, content: "Thanks for the guidance! I'll incorporate this.", timestamp: new Date().toISOString() },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setReplyText("");
  };

  const handleNewTopic = () => {
    const t: Topic = {
      id: `t-new-${Date.now()}`, type: "rule_update", title: "New Rule Update",
      status: "pending" as TopicStatus, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), preview: "", messages: [],
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

  /* ── Find the last message with active choices ── */
  const lastChoiceMsg = obMessages.filter((m) => m.choices && m.choices.length > 0).at(-1);
  const isLastChoiceActive = lastChoiceMsg && !obChoiceMade[obPhase] && obPhase !== "parsing" && obPhase !== "complete";

  /* ── Progress bar ── */
  const currentStageIdx = getStageIndex(obPhase);
  const progressPct = obPhase === "complete" ? 100 : Math.round((currentStageIdx / (STAGES.length - 1)) * 100);

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
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[13px] bg-background" />
          </div>
          <div className="flex gap-0.5 bg-muted/50 rounded-md p-0.5">
            {(["all", "unread", "pending", "resolved"] as FilterTab[]).map((f) => (
              <button
                key={f} onClick={() => setTab(f)}
                className={cn(
                  "flex-1 px-2 py-1 rounded text-[12px] font-medium transition-all",
                  tab === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {counts[f] > 0 && f !== "all" && <span className="ml-1 opacity-60">{counts[f]}</span>}
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
                  key={topic.id} onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 transition-colors",
                    isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30 border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 shrink-0", isOb ? "text-primary" : TYPE_COLOR[topic.type])} />
                    <span className={cn("text-[13px] truncate flex-1", isUnread || isOb ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                      {topic.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{fmtTime(topic.updatedAt)}</span>
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
                {agentName} posts topics for knowledge gaps, performance reports, and questions.
              </p>
            </div>
          </div>
        ) : isOnboarding ? (
          /* ── Onboarding Conversation ── */
          <>
            {/* Header with progress bar */}
            <div className="shrink-0">
              <div className="h-11 px-5 flex items-center gap-3 border-b border-border">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <h2 className="text-[13px] font-medium text-foreground truncate flex-1">
                  Welcome — meet your new rep
                </h2>
                {obPhase === "complete" ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">Complete</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">Setting up</Badge>
                )}
              </div>

              {/* Progress bar */}
              {obPhase !== "complete" && (
                <div className="px-5 py-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 max-w-[640px] mx-auto">
                    {STAGES.map((stage, i) => (
                      <div key={stage.id} className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1.5 flex-1">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                            i < currentStageIdx ? "bg-primary" : i === currentStageIdx ? "bg-primary" : "bg-border"
                          )} />
                          <span className={cn(
                            "text-[11px] whitespace-nowrap transition-colors",
                            i <= currentStageIdx ? "text-foreground/70 font-medium" : "text-muted-foreground/50"
                          )}>
                            {stage.label}
                          </span>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={cn(
                            "h-px flex-1 min-w-[12px] transition-colors",
                            i < currentStageIdx ? "bg-primary/40" : "bg-border/60"
                          )} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", isAI ? "bg-primary/10" : "bg-muted")}>
                          {isAI ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-medium text-foreground/60">{isAI ? agentName : "You"}</span>
                            <span className="text-[11px] text-muted-foreground/40">just now</span>
                          </div>

                          {/* Message content */}
                          <div className={cn(
                            "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed max-w-full",
                            isAI ? "bg-card border border-border text-foreground/85" : "bg-primary text-primary-foreground"
                          )}>
                            {msg.content.split("\n").map((line, i) => {
                              if (line.startsWith("> ")) {
                                return (
                                  <blockquote key={i} className={cn("border-l-2 pl-3 my-1.5 italic text-[12px]", isAI ? "border-primary/30 text-foreground/60" : "border-white/40 text-white/80")}>
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
                              if (line === "---") return <hr key={i} className="my-2 border-border/50" />;
                              if (line === "") return <div key={i} className="h-1.5" />;
                              return <p key={i}>{renderBold(line)}</p>;
                            })}
                          </div>

                          {/* Name input */}
                          {msg.isNameInput && obPhase === "welcome" && (
                            <div className="mt-3 flex gap-2 w-full max-w-[320px]">
                              <Input
                                placeholder="e.g. Alex, Ava, Sam..."
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                                className="flex-1 h-8 text-[13px]"
                              />
                              <Button size="sm" className="h-8 px-3" onClick={handleNameSubmit}>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}

                          {/* File upload zone */}
                          {msg.isFileUpload && !fileUploaded && (
                            <div className="mt-3 w-full space-y-2">
                              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={() => handleFileUpload(false)} />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
                              >
                                <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">Drop a file here or click to upload</p>
                                <p className="text-[11px] text-muted-foreground/60 mt-1">PDF, Word, or text</p>
                              </button>
                              <button
                                onClick={() => handleFileUpload(true)}
                                className="w-full text-center text-[12px] text-primary hover:text-primary/80 font-medium py-1.5 transition-colors"
                              >
                                Use demo doc: Seel_Return_Policy_2026.pdf
                              </button>
                            </div>
                          )}

                          {/* Take me there link */}
                          {msg.isTakeMeThere && (
                            <a href={msg.isTakeMeThere.href} className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 font-medium transition-colors">
                              {msg.isTakeMeThere.label} <ArrowRight className="w-3 h-3" />
                            </a>
                          )}

                          {/* Conflict resolution form */}
                          {msg.isConflictForm && obPhase === "conflicts" && (
                            <div className="mt-3 w-full space-y-3">
                              {conflicts.map((conflict, ci) => (
                                <div key={conflict.id} className="border border-border rounded-lg p-3 bg-muted/20">
                                  <p className="text-[12px] font-semibold text-foreground mb-2">
                                    Conflict {ci + 1}: {conflict.title}
                                  </p>
                                  <div className="space-y-1.5">
                                    <button
                                      onClick={() => handleConflictResolve(conflict.id, "a")}
                                      className={cn(
                                        "w-full text-left rounded-md px-3 py-2 text-[12px] border transition-all",
                                        conflict.resolved === "a"
                                          ? "border-primary bg-primary/5 text-foreground"
                                          : "border-border hover:border-primary/40 text-foreground/80"
                                      )}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center", conflict.resolved === "a" ? "border-primary" : "border-muted-foreground/30")}>
                                          {conflict.resolved === "a" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>
                                        <div>
                                          <span className="font-medium">{conflict.sourceA}</span>
                                          <span className="block text-[11px] text-muted-foreground mt-0.5">Source: {conflict.sourceALabel}</span>
                                        </div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={() => handleConflictResolve(conflict.id, "b")}
                                      className={cn(
                                        "w-full text-left rounded-md px-3 py-2 text-[12px] border transition-all",
                                        conflict.resolved === "b"
                                          ? "border-primary bg-primary/5 text-foreground"
                                          : "border-border hover:border-primary/40 text-foreground/80"
                                      )}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center", conflict.resolved === "b" ? "border-primary" : "border-muted-foreground/30")}>
                                          {conflict.resolved === "b" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>
                                        <div>
                                          <span className="font-medium">{conflict.sourceB}</span>
                                          <span className="block text-[11px] text-muted-foreground mt-0.5">Source: {conflict.sourceBLabel}</span>
                                        </div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={() => handleConflictResolve(conflict.id, "later")}
                                      className={cn(
                                        "w-full text-center py-1.5 text-[11px] transition-colors rounded",
                                        conflict.resolved === "later"
                                          ? "text-primary font-medium bg-primary/5"
                                          : "text-muted-foreground hover:text-foreground"
                                      )}
                                    >
                                      Decide later
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                className="w-full h-8 text-[12px]"
                                disabled={conflicts.every((c) => !c.resolved)}
                                onClick={handleConflictsSubmit}
                              >
                                Continue
                              </Button>
                            </div>
                          )}

                          {/* Actions form */}
                          {msg.isActionsForm && obPhase === "actions_form" && (
                            <div className="mt-3 w-full space-y-2">
                              {DEFAULT_ACTIONS.map((action) => (
                                <div key={action.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5 bg-muted/20">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-medium text-foreground">{action.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{action.description}</p>
                                  </div>
                                  <div className="flex gap-1 shrink-0 ml-3">
                                    {(["auto", "ask", "off"] as const).map((perm) => (
                                      <button
                                        key={perm}
                                        onClick={() => setActionPerms((prev) => ({ ...prev, [action.id]: perm }))}
                                        className={cn(
                                          "px-2 py-1 rounded text-[11px] font-medium transition-all",
                                          actionPerms[action.id] === perm
                                            ? perm === "auto" ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                              : perm === "ask" ? "bg-amber-100 text-amber-700 border border-amber-200"
                                              : "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted"
                                        )}
                                      >
                                        {perm === "auto" ? "Auto" : perm === "ask" ? "Ask me" : "Off"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <Button size="sm" className="w-full h-8 text-[12px]" onClick={handleActionsSubmit}>
                                Continue
                              </Button>
                            </div>
                          )}

                          {/* Escalation form */}
                          {msg.isEscalationForm && obPhase === "escalation_form" && (
                            <div className="mt-3 w-full space-y-1.5">
                              {DEFAULT_ESCALATION.map((trigger) => (
                                <button
                                  key={trigger.id}
                                  onClick={() => setEscalationToggles((prev) => ({ ...prev, [trigger.id]: !prev[trigger.id] }))}
                                  className={cn(
                                    "w-full flex items-center gap-3 border rounded-lg px-3 py-2.5 text-left transition-all",
                                    escalationToggles[trigger.id]
                                      ? "border-primary/40 bg-primary/5"
                                      : "border-border bg-muted/20 hover:border-border"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                                    escalationToggles[trigger.id] ? "border-primary bg-primary" : "border-muted-foreground/30"
                                  )}>
                                    {escalationToggles[trigger.id] && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-[12px] text-foreground/80">{trigger.label}</span>
                                </button>
                              ))}
                              <Button size="sm" className="w-full h-8 text-[12px] mt-2" onClick={handleEscalationSubmit}>
                                Continue
                              </Button>
                            </div>
                          )}

                          {/* Scenario feedback input */}
                          {msg.scenarioFeedback && awaitingFeedback && (
                            <div className="mt-2 flex gap-2 w-full">
                              <Input
                                placeholder="Tell me what to change..."
                                value={scenarioFeedbackText}
                                onChange={(e) => setScenarioFeedbackText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleScenarioFeedback()}
                                className="flex-1 h-8 text-[12px]"
                                autoFocus
                              />
                              <Button size="sm" className="h-8 px-3" disabled={!scenarioFeedbackText.trim()} onClick={handleScenarioFeedback}>
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Choice bubbles */}
                      {hasActiveChoices && msg.choices && !awaitingFeedback && (
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
                        <span className="text-[12px] font-medium text-foreground/60">{agentName}</span>
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
              <h2 className="text-[13px] font-medium text-foreground truncate flex-1">{selected.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {selected.status === "resolved" ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">Resolved</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">Open</Badge>
                )}
                {selected.sourceTicketId && (
                  <button className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <ExternalLink className="w-3 h-3" /> #{selected.sourceTicketId}
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
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", isAI ? "bg-primary/10" : "bg-muted")}>
                        {isAI ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-foreground/60">{isAI ? agentName : "You"}</span>
                          <span className="text-[11px] text-muted-foreground/40">{fmtTime(msg.timestamp)}</span>
                        </div>
                        <div className={cn(
                          "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
                          isAI ? "bg-card border border-border text-foreground/85" : "bg-primary text-primary-foreground"
                        )}>
                          {msg.content.split("\n").map((line, i) => {
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote key={i} className={cn("border-l-2 pl-3 my-1.5 italic text-[12px]", isAI ? "border-primary/30 text-foreground/60" : "border-white/40 text-white/80")}>
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
                                key={action.label} size="sm"
                                variant={action.type === "accept" ? "default" : "outline"}
                                className={cn("h-7 text-[12px] gap-1", action.type === "accept" && "bg-emerald-600 hover:bg-emerald-700")}
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
                    placeholder={`Reply to ${agentName}...`}
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
