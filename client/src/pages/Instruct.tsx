/* ── Inbox Page ────────────────────────────────────────────────
   Left: Topic list (onboarding pinned at top)
   Right: Conversation thread with choice bubbles, inline forms,
          structured conflict resolution, scenario sanity checks
   Onboarding: Team Lead hosts setup, then "hires" a Rep
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
  Users, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

/* ── Config ── */
const TYPE_ICON: Record<TopicType, typeof Lightbulb> = {
  knowledge_gap: Lightbulb, performance_report: BarChart3, performance_summary: BarChart3,
  open_question: HelpCircle, escalation_review: AlertTriangle, rule_update: FileEdit,
};
const TYPE_COLOR: Record<TopicType, string> = {
  knowledge_gap: "text-amber-500", performance_report: "text-blue-500", performance_summary: "text-blue-500",
  open_question: "text-slate-500", escalation_review: "text-orange-500", rule_update: "text-violet-500",
};
const TYPE_BG: Record<TopicType, string> = {
  knowledge_gap: "bg-amber-50 text-amber-700", performance_report: "bg-blue-50 text-blue-700", performance_summary: "bg-blue-50 text-blue-700",
  open_question: "bg-slate-50 text-slate-600", escalation_review: "bg-orange-50 text-orange-700", rule_update: "bg-violet-50 text-violet-700",
};
const TYPE_LABEL: Record<TopicType, string> = {
  knowledge_gap: "Knowledge Gap", performance_report: "Performance", performance_summary: "Summary",
  open_question: "Question", escalation_review: "Escalation", rule_update: "Rule Update",
};
type FilterTab = "all" | "open" | "resolved";
const PRIORITY: Record<TopicType, number> = {
  knowledge_gap: 0, escalation_review: 1, open_question: 2, rule_update: 3, performance_report: 4, performance_summary: 5,
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
  sender: "team_lead" | "manager" | "rep";
  senderName?: string;
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
  isPhaseTransition?: boolean;
}

type OnboardingPhase =
  | "welcome"
  | "connect_zendesk" | "connect_shopify"
  | "upload_doc" | "parsing" | "parse_done"
  | "conflicts"
  | "escalation_form"
  | "phase2_intro"
  | "rep_name_input"
  | "identity_tone"
  | "actions_form"
  | "scenario_wismo" | "scenario_refund" | "scenario_escalation"
  | "mode_select" | "complete";

/* ── Progress stages ── */
const STAGES = [
  { id: "team_setup", label: "Team Setup" },
  { id: "hire_rep", label: "Hire a Rep" },
];

function getStageIndex(phase: OnboardingPhase): number {
  if (["welcome", "connect_zendesk", "connect_shopify", "upload_doc", "parsing", "parse_done", "conflicts", "escalation_form"].includes(phase)) return 0;
  return 1;
}

/* ── Onboarding Welcome Topic ── */
const ONBOARDING_TOPIC_ID = "t-onboarding";
function createOnboardingTopic(): Topic {
  return {
    id: ONBOARDING_TOPIC_ID, type: "rule_update" as TopicType,
    title: "Welcome — set up your AI team", status: "unread" as TopicStatus,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    preview: "Let's get your AI support team ready.", messages: [],
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

/* ── Default action items (no Ask Permission in MVP) ── */
const DEFAULT_ACTIONS = [
  { id: "return_label", label: "Create return labels", description: "Generate prepaid return shipping labels", default: true },
  { id: "reply", label: "Send customer replies", description: "Respond to customer messages", default: true },
  { id: "internal_note", label: "Write internal notes", description: "Add notes to tickets for your team", default: true },
  { id: "lookup_order", label: "Look up orders", description: "Query order status and details in Shopify", default: true },
  { id: "cancel", label: "Cancel orders", description: "Cancel unshipped orders", default: false },
  { id: "seel_ticket", label: "Create Seel ticket", description: "Route to Seel Zendesk plugin for warranty claims", default: true },
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
  const [repName, setRepName] = useState("Alex");
  const [nameInput, setNameInput] = useState("");
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);

  // Inline form states
  const [conflicts, setConflicts] = useState<ConflictItem[]>(DEFAULT_CONFLICTS);
  const [actionPerms, setActionPerms] = useState<Record<string, boolean>>(
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
  const addMessage = useCallback((sender: "team_lead" | "manager" | "rep", content: string, extras?: Partial<OnboardingMessage>) => {
    const senderName = sender === "team_lead" ? "Team Lead" : sender === "rep" ? repName : "You";
    const msg: OnboardingMessage = {
      id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender, senderName, content, timestamp: new Date().toISOString(), ...extras,
    };
    setObMessages((prev) => [...prev, msg]);
    return msg;
  }, [repName]);

  /* ── Kick off welcome ── */
  useEffect(() => {
    if (obPhase === "welcome" && obMessages.length === 0) {
      const timer = setTimeout(() => {
        addMessage("team_lead",
          "Hi! I'm your **Team Lead** — I'll manage your AI support reps and keep you in the loop on everything.\n\nLet's get your team set up. First, I need to connect to your tools and learn your rules. Then we'll hire your first rep.\n\nReady?",
          {
            choices: [
              { label: "Let's go", value: "start" },
            ],
          }
        );
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [obPhase, obMessages.length, addMessage]);

  /* ── Submit rep name ── */
  const handleNameSubmit = useCallback(() => {
    const name = nameInput.trim() || "Alex";
    setRepName(name);
    addMessage("manager", name);
    setObPhase("identity_tone");
    setTimeout(() => {
      addMessage("team_lead",
        `**${name}** — great name. What tone should ${name} use with customers?`,
        {
          choices: [
            { label: "Friendly and warm", value: "friendly", description: `"Hey Emma! Let me look into that for you 😊"` },
            { label: "Professional", value: "professional", description: `"Hello Emma, I'd be happy to assist you with this."` },
            { label: "Casual", value: "casual", description: `"Hi Emma! Sure thing, let me check that real quick."` },
          ],
        }
      );
    }, 500);
  }, [nameInput, addMessage]);

  /* ── Phase transitions ── */
  const advanceOnboarding = useCallback(
    (choice: string, choiceLabel: string, currentPhase: OnboardingPhase) => {
      setObChoiceMade((prev) => ({ ...prev, [currentPhase]: choice }));
      addMessage("manager", choiceLabel);

      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const advance = async () => {
        await delay(600);

        switch (currentPhase) {
          case "welcome":
            setObPhase("connect_zendesk");
            addMessage("team_lead",
              "First — I need access to your helpdesk so the team can see and respond to tickets.\n\nDo you use Zendesk?",
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
              addMessage("team_lead", "Connected to **Zendesk** — coastalliving.zendesk.com. I can see 1,247 tickets from the last 90 days.");
              await delay(800);
            } else {
              setSkippedSteps((prev) => [...prev, "zendesk"]);
            }
            setObPhase("connect_shopify");
            addMessage("team_lead",
              choice === "connect"
                ? "Now, to look up orders and process actions, I'll need access to your store. Are you on Shopify?"
                : "No problem, you can connect it anytime in **Playbook → Integrations**.\n\nNext — to look up orders, I'll need access to your store. Are you on Shopify?",
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
              addMessage("team_lead", "Connected to **Shopify** — coastalliving.myshopify.com. I can see 3,842 products and recent orders.");
              await delay(800);
            } else {
              setSkippedSteps((prev) => [...prev, "shopify"]);
            }
            setObPhase("upload_doc");
            addMessage("team_lead",
              "Now the important part — **your policies**. I need to learn your rules so the team knows how to handle things.\n\nDo you have a return policy, SOP doc, or any guidelines you can share?",
              { isFileUpload: true }
            );
            break;

          case "parse_done":
            setObPhase("conflicts");
            addMessage("team_lead",
              "I found **3 conflicts** between your document and what I observed in past tickets. For each one, pick the rule the team should follow — or choose \"Decide later\" and resolve it in **Playbook → Knowledge**.",
              { isConflictForm: true, conflicts: DEFAULT_CONFLICTS }
            );
            break;

          case "identity_tone":
            setObPhase("actions_form");
            addMessage("team_lead",
              `Got it — ${repName} will keep it **${choice}**.\n\nNow, what should ${repName} be allowed to do on their own? Toggle off anything you'd rather handle yourself.`,
              { isActionsForm: true }
            );
            break;

          case "scenario_wismo":
            if (choice === "adjust") {
              setAwaitingFeedback(true);
              addMessage("rep", "Sure — what would you change? Just type it out and I'll update my approach.", { scenarioFeedback: true });
              return;
            }
            setObPhase("scenario_refund");
            addMessage("team_lead", `${repName} got that right. Next scenario:`);
            await delay(800);
            addMessage("rep",
              `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days.*\n\n${actionPerms["reply"] ? "I have permission to send replies, so I'd handle this end-to-end." : "I'd draft this and wait for your approval."}\n\nLook good?`,
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
              addMessage("rep", "What should I do differently here? I'll update the rule right away.", { scenarioFeedback: true });
              return;
            }
            setObPhase("scenario_escalation");
            addMessage("team_lead", "Nice. One more:");
            await delay(800);
            addMessage("rep",
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
              addMessage("rep", "What would you change about my escalation approach?", { scenarioFeedback: true });
              return;
            }
            setObPhase("mode_select");
            addMessage("team_lead",
              `Great — ${repName} passed the sanity check. I'm confident they understand your policies.\n\nOne last question. **How should ${repName} work?**`
            );
            await delay(800);
            addMessage("team_lead",
              `**Training mode** — ${repName} drafts responses and actions, but checks with you before anything goes out to the customer. Good if you want to review their work for a while.\n\n**Production mode** — ${repName} handles tickets independently. You can review everything after the fact. Good if you trust the sanity check and want them working immediately.`,
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

            let completionMsg = `**${repName} is now in ${mode} mode.** ${choice === "shadow" ? "They'll draft everything and wait for your approval before sending." : "They'll start handling tickets on their own right away."}\n\n---\n\n**Here's how things work from here:**\n\n`;
            completionMsg += `- **This conversation** — I'll message you here whenever ${repName} runs into something they don't know, needs your input on a rule, or has a weekly performance summary.\n`;
            completionMsg += `- **Zendesk** — ${choice === "shadow" ? `Check the sidebar for ${repName}'s draft responses. You can approve, edit, or flag bad cases.` : `${repName} is handling tickets. Check the sidebar to review their work or flag bad cases.`}\n`;
            completionMsg += `- **Playbook** — Your configuration hub. Adjust permissions, escalation rules, identity, and knowledge anytime.`;

            if (incomplete) {
              completionMsg += `\n\n---\n\n**Before ${repName} can start, you still need to:**`;
              if (skippedSteps.includes("zendesk")) {
                completionMsg += `\n- Connect Zendesk`;
              }
              if (skippedSteps.includes("shopify")) {
                completionMsg += `\n- Connect Shopify`;
              }
            }

            addMessage("team_lead", completionMsg);

            if (incomplete) {
              setTimeout(() => {
                addMessage("team_lead",
                  "Complete the remaining steps so the team can start working:",
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
    [addMessage, obChoiceMade, actionPerms, skippedSteps, repName]
  );

  /* ── Scenario feedback handler ── */
  const handleScenarioFeedback = useCallback(() => {
    if (!scenarioFeedbackText.trim() || !awaitingFeedback) return;
    const feedback = scenarioFeedbackText.trim();
    addMessage("manager", feedback);
    setScenarioFeedbackText("");
    setAwaitingFeedback(false);

    setTimeout(() => {
      addMessage("rep",
        `Got it — I've updated my approach based on your feedback:\n\n> "${feedback}"\n\nI'll apply this going forward. Let's continue.`
      );

      setTimeout(() => {
        if (obPhase === "scenario_wismo") {
          setObPhase("scenario_refund");
          addMessage("team_lead", `${repName} adjusted. Next scenario:`);
          setTimeout(() => {
            addMessage("rep",
              `**Scenario 2 — "I want a refund"**\n\nCustomer writes: *"I received my ceramic vase yesterday and it's smaller than I expected. I'd like a refund."*\n\nHere's what I'd do:\n1. Check order — delivered 1 day ago, within return window\n2. Item is $42.99, change-of-mind return\n3. I'd reply and initiate the return:\n\n> *Hi! I'm sorry the vase wasn't what you expected. I've started a return for you — you'll receive a prepaid shipping label via email shortly. Once we receive the item, your refund of $34.04 ($42.99 minus $8.95 return shipping) will be processed within 3-5 business days.*\n\nLook good?`,
              {
                choices: [
                  { label: "That's right", value: "approve" },
                  { label: "Needs adjustment", value: "adjust" },
                ],
                isScenario: true,
              }
            );
          }, 600);
        } else if (obPhase === "scenario_refund") {
          setObPhase("scenario_escalation");
          addMessage("team_lead", `${repName} adjusted. Last scenario:`);
          setTimeout(() => {
            addMessage("rep",
              `**Scenario 3 — Escalation**\n\nCustomer writes: *"This is the THIRD time I'm contacting you about this. I want to speak to a manager RIGHT NOW."*\n\nHere's what I'd do:\n1. Detect strong frustration + explicit request for manager\n2. I'd **escalate immediately**\n3. I'd reply:\n\n> *I completely understand your frustration, and I'm sorry for the repeated issues. I'm connecting you with a manager right now who can help resolve this directly.*\n\nThen I'd assign the ticket to you with an internal note summarizing the situation.\n\nDoes this feel right?`,
              {
                choices: [
                  { label: "That's right", value: "approve" },
                  { label: "Needs adjustment", value: "adjust" },
                ],
                isScenario: true,
              }
            );
          }, 600);
        } else if (obPhase === "scenario_escalation") {
          setObPhase("mode_select");
          addMessage("team_lead",
            `Great — ${repName} passed the sanity check. I'm confident they understand your policies.\n\nOne last question. **How should ${repName} work?**`
          );
          setTimeout(() => {
            addMessage("team_lead",
              `**Training mode** — ${repName} drafts responses and actions, but checks with you before anything goes out to the customer.\n\n**Production mode** — ${repName} handles tickets independently. You can review everything after the fact.`,
              {
                choices: [
                  { label: "Training — check with me first", value: "shadow" },
                  { label: "Production — handle it yourself", value: "production" },
                ],
              }
            );
          }, 600);
        }
      }, 800);
    }, 600);
  }, [scenarioFeedbackText, awaitingFeedback, obPhase, addMessage, repName]);

  /* ── File upload handler ── */
  const handleFileUpload = useCallback((isDemo: boolean) => {
    setFileUploaded(true);
    setIsParsing(true);
    addMessage("manager", isDemo ? "📄 Seel_Return_Policy_2026.pdf" : "📄 Document uploaded");

    setTimeout(() => {
      setIsParsing(false);
      setObPhase("parse_done");
      addMessage("team_lead",
        "Done reading. I've extracted your rules and organized them.\n\nYou can review the full knowledge base anytime:",
        { isTakeMeThere: { label: "View in Playbook → Knowledge", href: "/playbook" } }
      );
      setTimeout(() => {
        advanceOnboarding("done", "Continue", "parse_done");
      }, 600);
    }, 2500);
  }, [addMessage, advanceOnboarding]);

  /* ── Conflict resolution handler ── */
  const handleConflictResolve = useCallback((conflictId: string, resolution: "a" | "b" | "later") => {
    setConflicts((prev) => prev.map((c) => c.id === conflictId ? { ...c, resolved: resolution } : c));
  }, []);

  const handleConflictsSubmit = useCallback(() => {
    const resolved = conflicts.filter((c) => c.resolved && c.resolved !== "later").length;
    const deferred = conflicts.filter((c) => !c.resolved || c.resolved === "later").length;
    addMessage("manager", `Resolved ${resolved} conflict${resolved !== 1 ? "s" : ""}${deferred > 0 ? `, deferred ${deferred}` : ""}`);
    setTimeout(() => {
      addMessage("team_lead",
        deferred > 0
          ? `Got it. ${deferred} conflict${deferred !== 1 ? "s" : ""} deferred — you can resolve ${deferred === 1 ? "it" : "them"} anytime.`
          : "All conflicts resolved.",
        deferred > 0 ? { isTakeMeThere: { label: "Resolve in Playbook → Knowledge", href: "/playbook" } } : undefined
      );
      setTimeout(() => {
        setObPhase("escalation_form");
        addMessage("team_lead",
          "Good. Now — **when should the team hand off to you?**\n\nThey'll always escalate if they genuinely don't know the answer. But here are some extra triggers you can turn on:",
          { isEscalationForm: true }
        );
      }, 800);
    }, 600);
  }, [conflicts, addMessage]);

  /* ── Actions form submit ── */
  const handleActionsSubmit = useCallback(() => {
    const enabled = Object.entries(actionPerms).filter(([, v]) => v);
    const disabled = Object.entries(actionPerms).filter(([, v]) => !v);
    addMessage("manager", `Enabled ${enabled.length} actions, disabled ${disabled.length}`);
    setTimeout(() => {
      addMessage("team_lead",
        `Got it — ${repName} has ${enabled.length} actions enabled. You can adjust these anytime.`,
        { isTakeMeThere: { label: "Adjust in Playbook → Actions", href: "/playbook" } }
      );
      setTimeout(() => {
        setObPhase("scenario_wismo");
        addMessage("team_lead",
          `Now, let's see ${repName} in action. I'll run a few common scenarios — if anything looks off, just tell ${repName} directly and they'll adjust on the spot.`
        );
        setTimeout(() => {
          addMessage("rep",
            `**Scenario 1 — "Where is my order?"**\n\nCustomer writes: *"Where is my order #DBH-29174? It's been a week and I haven't received anything."*\n\nHere's what I'd do:\n1. Look up **#DBH-29174** in Shopify\n2. I see it's **shipped** via Royal Mail, tracking RM29174UK, expected Mar 25\n3. I'd reply:\n\n> *Hi Emma! Your order #DBH-29174 shipped via Royal Mail (tracking: RM29174UK) and is expected to arrive by March 25th. You can track it here: [link]. Let me know if you need anything else!*\n\nThis is read-only — I'm just looking up info and replying. Does this look right?`,
            {
              choices: [
                { label: "That's right", value: "approve" },
                { label: "Needs adjustment", value: "adjust" },
              ],
              isScenario: true,
            }
          );
        }, 1000);
      }, 800);
    }, 600);
  }, [actionPerms, addMessage, repName]);

  /* ── Escalation form submit ── */
  const handleEscalationSubmit = useCallback(() => {
    const enabledCount = Object.values(escalationToggles).filter(Boolean).length;
    addMessage("manager", `Enabled ${enabledCount} escalation triggers`);
    setTimeout(() => {
      addMessage("team_lead",
        `Got it — ${enabledCount} escalation triggers active. You can adjust these anytime.`,
        { isTakeMeThere: { label: "Change in Playbook → Escalation", href: "/playbook" } }
      );
      setTimeout(() => {
        // Phase 2 transition
        setObPhase("phase2_intro");
        addMessage("team_lead",
          "**Team setup complete!** Your tools are connected, rules are loaded, and escalation triggers are set.\n\n---\n\nNow let's **hire your first rep**. They'll be the one actually handling customer tickets day-to-day. I'll manage them and keep you posted.",
          {
            isPhaseTransition: true,
            choices: [
              { label: "Let's hire a rep", value: "hire" },
            ],
          }
        );
      }, 800);
    }, 600);
  }, [escalationToggles, addMessage]);

  /* ── Phase 2 intro handler ── */
  useEffect(() => {
    if (obPhase === "phase2_intro" && obChoiceMade["phase2_intro"]) {
      // Already handled by advanceOnboarding
    }
  }, [obPhase, obChoiceMade]);

  // Handle phase2_intro choice
  const handlePhase2Start = useCallback(() => {
    setObPhase("rep_name_input");
    setTimeout(() => {
      addMessage("team_lead",
        "First — **what should your rep be called?** This is the name customers will see.",
        { isNameInput: true }
      );
    }, 500);
  }, [addMessage]);

  /* ── Regular topic handlers ── */
  const counts = {
    all: topics.length,
    open: topics.filter((t) => t.status !== "resolved").length,
    resolved: topics.filter((t) => t.status === "resolved").length,
  };

  const filtered = topics
    .filter((t) => {
      if (tab === "all") return true;
      if (tab === "open") return t.status !== "resolved";
      return t.status === "resolved";
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
  const isLastChoiceActive = lastChoiceMsg && !obChoiceMade[obPhase] && obPhase !== "parsing" && obPhase !== "complete" && obPhase !== "phase2_intro";

  /* ── Progress bar ── */
  const currentStageIdx = getStageIndex(obPhase);
  const progressPct = obPhase === "complete" ? 100 : Math.round(((currentStageIdx + 0.5) / STAGES.length) * 100);

  /* ── Sender icon helper ── */
  const getSenderIcon = (sender: "team_lead" | "manager" | "rep") => {
    if (sender === "team_lead") return <Users className="w-3.5 h-3.5 text-primary" />;
    if (sender === "rep") return <Bot className="w-3.5 h-3.5 text-violet-500" />;
    return <User className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getSenderBg = (sender: "team_lead" | "manager" | "rep") => {
    if (sender === "team_lead") return "bg-primary/10";
    if (sender === "rep") return "bg-violet-50";
    return "bg-muted";
  };

  const getSenderName = (msg: OnboardingMessage) => {
    if (msg.sender === "team_lead") return "Team Lead";
    if (msg.sender === "rep") return repName;
    return "You";
  };

  /* ── Render ── */
  return (
    <div className="flex h-full">
      {/* ── Left Panel ── */}
      <div className="w-[300px] border-r border-border flex flex-col bg-white shrink-0">
        <div className="h-11 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-semibold text-foreground">Inbox</h1>
            {counts.open > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                {counts.open}
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
            {(["all", "open", "resolved"] as FilterTab[]).map((f) => (
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
              const isResolved = topic.status === "resolved";
              return (
                <button
                  key={topic.id} onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 border-b border-border/50 transition-colors",
                    isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30 border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[13px] truncate flex-1", isUnread || isOb ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                      {isOb && <Sparkles className="w-3 h-3 text-primary inline mr-1.5 -mt-0.5" />}
                      {topic.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{fmtTime(topic.updatedAt)}</span>
                    {isUnread && !isOb && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {topic.preview && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-relaxed">
                      {topic.preview.slice(0, 80)}{topic.preview.length > 80 ? "..." : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {!isOb && (
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none", TYPE_BG[topic.type])}>
                        {TYPE_LABEL[topic.type]}
                      </span>
                    )}
                    {isOb && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-primary/10 text-primary">
                        Setup
                      </span>
                    )}
                    {isResolved && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-emerald-50 text-emerald-600">
                        Resolved
                      </span>
                    )}
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
                Team Lead posts topics for knowledge gaps, performance reports, and questions.
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
                  Welcome — set up your AI team
                </h2>
                {obPhase === "complete" ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px]">Complete</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">Setting up</Badge>
                )}
              </div>

              {/* Progress bar — two stages */}
              {obPhase !== "complete" && (
                <div className="px-5 py-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-4 max-w-[400px] mx-auto">
                    {STAGES.map((stage, i) => (
                      <div key={stage.id} className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1.5 flex-1">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all text-[10px] font-semibold",
                            i < currentStageIdx ? "border-primary bg-primary text-white"
                              : i === currentStageIdx ? "border-primary text-primary"
                              : "border-muted-foreground/20 text-muted-foreground/40"
                          )}>
                            {i < currentStageIdx ? <Check className="w-3 h-3" /> : i + 1}
                          </div>
                          <span className={cn(
                            "text-[12px] whitespace-nowrap transition-colors",
                            i <= currentStageIdx ? "text-foreground font-medium" : "text-muted-foreground/50"
                          )}>
                            {stage.label}
                          </span>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={cn(
                            "h-px flex-1 min-w-[20px] transition-colors",
                            i < currentStageIdx ? "bg-primary" : "bg-border"
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
                  const isManager = msg.sender === "manager";
                  const hasActiveChoices = msg.choices && msg.id === lastChoiceMsg?.id && isLastChoiceActive;
                  const isPhase2Choice = msg.isPhaseTransition && obPhase === "phase2_intro" && !obChoiceMade["phase2_intro"];

                  return (
                    <div key={msg.id}>
                      {/* Phase transition divider */}
                      {msg.isPhaseTransition && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Phase 2 — Hire a Rep</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}

                      <div className={cn("flex gap-3", isManager && "flex-row-reverse")}>
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", getSenderBg(msg.sender))}>
                          {getSenderIcon(msg.sender)}
                        </div>
                        <div className={cn("flex-1 min-w-0", isManager && "flex flex-col items-end")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-[12px] font-medium",
                              msg.sender === "team_lead" ? "text-primary/70" : msg.sender === "rep" ? "text-violet-500/70" : "text-foreground/60"
                            )}>
                              {getSenderName(msg)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/40">just now</span>
                          </div>

                          {/* Message content */}
                          <div className={cn(
                            "rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed max-w-full",
                            isManager
                              ? "bg-primary text-primary-foreground"
                              : msg.sender === "rep"
                              ? "bg-violet-50 border border-violet-200/60 text-foreground/85"
                              : "bg-card border border-border text-foreground/85"
                          )}>
                            {msg.content.split("\n").map((line, i) => {
                              if (line.startsWith("> ")) {
                                return (
                                  <blockquote key={i} className={cn("border-l-2 pl-3 my-1.5 italic text-[12px]", isManager ? "border-white/40 text-white/80" : "border-primary/30 text-foreground/60")}>
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
                              if (line === "---") return <hr key={i} className={cn("my-2", isManager ? "border-white/20" : "border-border/50")} />;
                              if (line === "") return <div key={i} className="h-1.5" />;
                              return <p key={i}>{renderBold(line)}</p>;
                            })}
                          </div>

                          {/* Name input */}
                          {msg.isNameInput && obPhase === "rep_name_input" && (
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
                                    {[
                                      { key: "a" as const, source: conflict.sourceA, label: conflict.sourceALabel },
                                      { key: "b" as const, source: conflict.sourceB, label: conflict.sourceBLabel },
                                    ].map((opt) => (
                                      <button
                                        key={opt.key}
                                        onClick={() => handleConflictResolve(conflict.id, opt.key)}
                                        className={cn(
                                          "w-full text-left rounded-md px-3 py-2 text-[12px] border transition-all",
                                          conflict.resolved === opt.key
                                            ? "border-primary bg-primary/5 text-foreground"
                                            : "border-border hover:border-primary/40 text-foreground/80"
                                        )}
                                      >
                                        <div className="flex items-start gap-2">
                                          <div className={cn("w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center", conflict.resolved === opt.key ? "border-primary" : "border-muted-foreground/30")}>
                                            {conflict.resolved === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                          </div>
                                          <div>
                                            <span className="font-medium">{opt.source}</span>
                                            <span className="block text-[11px] text-muted-foreground mt-0.5">Source: {opt.label}</span>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => handleConflictResolve(conflict.id, "later")}
                                      className={cn(
                                        "w-full text-center rounded-md px-3 py-1.5 text-[11px] transition-all",
                                        conflict.resolved === "later"
                                          ? "text-primary font-medium"
                                          : "text-muted-foreground hover:text-foreground"
                                      )}
                                    >
                                      Decide later
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <Button size="sm" className="w-full h-8 text-[12px]" onClick={handleConflictsSubmit}>
                                Continue <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Actions form — toggle on/off */}
                          {msg.isActionsForm && obPhase === "actions_form" && (
                            <div className="mt-3 w-full space-y-1.5">
                              {DEFAULT_ACTIONS.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => setActionPerms((prev) => ({ ...prev, [action.id]: !prev[action.id] }))}
                                  className={cn(
                                    "w-full flex items-center gap-3 rounded-md px-3 py-2 text-[12px] border transition-all text-left",
                                    actionPerms[action.id]
                                      ? "border-primary/30 bg-primary/5"
                                      : "border-border text-foreground/60"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                    actionPerms[action.id] ? "border-primary bg-primary" : "border-muted-foreground/30"
                                  )}>
                                    {actionPerms[action.id] && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <span className={cn("font-medium", actionPerms[action.id] ? "text-foreground" : "text-foreground/60")}>{action.label}</span>
                                    <span className="block text-[11px] text-muted-foreground">{action.description}</span>
                                  </div>
                                </button>
                              ))}
                              <Button size="sm" className="w-full h-8 text-[12px] mt-2" onClick={handleActionsSubmit}>
                                Continue <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Escalation form — toggle on/off */}
                          {msg.isEscalationForm && obPhase === "escalation_form" && (
                            <div className="mt-3 w-full space-y-1.5">
                              {DEFAULT_ESCALATION.map((trigger) => (
                                <button
                                  key={trigger.id}
                                  onClick={() => setEscalationToggles((prev) => ({ ...prev, [trigger.id]: !prev[trigger.id] }))}
                                  className={cn(
                                    "w-full flex items-center gap-3 rounded-md px-3 py-2 text-[12px] border transition-all text-left",
                                    escalationToggles[trigger.id]
                                      ? "border-primary/30 bg-primary/5"
                                      : "border-border text-foreground/60"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                    escalationToggles[trigger.id] ? "border-primary bg-primary" : "border-muted-foreground/30"
                                  )}>
                                    {escalationToggles[trigger.id] && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className={cn("font-medium", escalationToggles[trigger.id] ? "text-foreground" : "text-foreground/60")}>{trigger.label}</span>
                                </button>
                              ))}
                              <Button size="sm" className="w-full h-8 text-[12px] mt-2" onClick={handleEscalationSubmit}>
                                Continue <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Scenario feedback input */}
                          {msg.scenarioFeedback && awaitingFeedback && (
                            <div className="mt-2 flex gap-2 w-full max-w-[400px]">
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

                      {/* Phase 2 intro choice */}
                      {isPhase2Choice && msg.choices && (
                        <div className="flex flex-col items-end gap-2 mt-3 ml-10">
                          {msg.choices.map((choice, ci) => (
                            <button
                              key={ci}
                              onClick={() => {
                                setObChoiceMade((prev) => ({ ...prev, phase2_intro: choice.value }));
                                addMessage("manager", choice.label);
                                handlePhase2Start();
                              }}
                              className={cn(
                                "text-left rounded-2xl px-4 py-2 text-[13px] transition-all max-w-[400px]",
                                "border border-primary/30 text-primary hover:bg-primary hover:text-white",
                                "bg-primary/5 border-primary/50 font-medium"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <UserPlus className="w-3.5 h-3.5" />
                                {choice.label}
                              </span>
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
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-primary/70">Team Lead</span>
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
                        {isAI ? <Users className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", !isAI && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-foreground/60">{isAI ? "Team Lead" : "You"}</span>
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
                    placeholder="Reply to Team Lead..."
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
