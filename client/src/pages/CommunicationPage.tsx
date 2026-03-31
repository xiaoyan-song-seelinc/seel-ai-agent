import { useState } from "react";
import { useCommunicationState } from "@/components/communication/hooks/useCommunicationState";
import { useSidebarManager } from "@/components/communication/hooks/useSidebarManager";
import { useMessageSender } from "@/components/communication/hooks/useMessageSender";
import { useStore } from "@/lib/store";
import { NarrowSidebar } from "@/components/communication/NarrowSidebar";
import { TeamLeadConversation } from "@/components/communication/TeamLeadConversation";
import { RepEscalationFeed } from "@/components/communication/RepEscalationFeed";
import { TeamLeadOnboarding } from "@/components/communication/onboarding/TeamLeadOnboarding";
import { RepOnboarding } from "@/components/communication/onboarding/RepOnboarding";
import { SidebarSlot } from "@/components/communication/sidebars/SidebarSlot";
import { RuleReviewSidebar } from "@/components/communication/sidebars/RuleReviewSidebar";
import { ConversationLogSidebar } from "@/components/communication/sidebars/ConversationLogSidebar";
import { RepProfileSidebar } from "@/components/communication/sidebars/RepProfileSidebar";
import { ESCALATION_TICKETS } from "@/lib/mock-data";
import type { EscalationTicket } from "@/lib/mock-data";

export default function CommunicationPage() {
  // ── State ───────────────────────────────────────────────
  const {
    activeView,
    setActiveView,
    onboardingPhase,
    setOnboardingPhase,
    onboardingComplete,
    repHired,
    setRepHired,
  } = useCommunicationState();

  const {
    sidebar,
    openRuleReview,
    openConversationLog,
    openRepProfile,
    closeSidebar,
  } = useSidebarManager();

  const messageSender = useMessageSender();

  const {
    topics,
    agentMode,
    agentIdentity,
    permissions,
    rules,
    setAgentMode,
    updateAgentIdentity,
    setPermissions,
    updateTopic,
  } = useStore();

  // Escalation tickets — local state for now (will be added to store later)
  const [tickets, setTickets] = useState<EscalationTicket[]>(ESCALATION_TICKETS);

  // ── Handlers ─────────────────────────────────────────────

  function handleAcceptProposal(topicId: string) {
    updateTopic(topicId, {
      proposedRule: {
        ...(topics.find((t) => t.id === topicId)?.proposedRule!),
        status: "accepted",
      },
    });
  }

  function handleRejectProposal(topicId: string) {
    updateTopic(topicId, {
      proposedRule: {
        ...(topics.find((t) => t.id === topicId)?.proposedRule!),
        status: "rejected",
      },
    });
  }

  function handleOpenTicket(ticketId: string) {
    openConversationLog(ticketId);
  }

  function handleReviewRule(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (topic?.proposedRule) {
      openRuleReview(topic.proposedRule.id, topicId);
    }
  }

  function handleResolveTicket(id: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "resolved" as const, resolvedAt: new Date().toISOString() }
          : t,
      ),
    );
  }

  // ── Sidebar label ─────────────────────────────────────────
  const sidebarTitle =
    sidebar.type === "rule-review"
      ? "Rule Review"
      : sidebar.type === "conversation-log"
        ? "Conversation Log"
        : sidebar.type === "rep-profile"
          ? "Rep Profile"
          : "";

  const sidebarTopic =
    sidebar.type === "rule-review"
      ? topics.find((t) => t.id === sidebar.topicId) ?? null
      : null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Narrow sidebar */}
      <NarrowSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        repHired={repHired}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Team Lead view */}
        {activeView === "teamlead" && (
          !onboardingComplete ? (
            <TeamLeadOnboarding
              phase={onboardingPhase as Exclude<typeof onboardingPhase, "done">}
              onPhaseAdvance={setOnboardingPhase}
              onRepHired={() => setRepHired(true)}
              repIdentity={agentIdentity}
              permissions={permissions}
              onUpdatePermissions={setPermissions}
              onUpdateIdentity={updateAgentIdentity}
              onModeSelected={(mode) => setAgentMode(mode)}
            />
          ) : (
            <TeamLeadConversation
              topics={topics}
              onAcceptProposal={handleAcceptProposal}
              onRejectProposal={handleRejectProposal}
              onReplyToTopic={messageSender.sendReply}
              onSendNewMessage={messageSender.sendNewMessage}
              onOpenTicket={handleOpenTicket}
              onReviewRule={handleReviewRule}
              isOnboarding={false}
            />
          )
        )}

        {/* Rep view */}
        {activeView === "rep" && (
          !repHired ? (
            <RepOnboarding onContinueSetup={() => setActiveView("teamlead")} />
          ) : (
            <RepEscalationFeed
              tickets={tickets}
              agentName={agentIdentity.name}
              agentMode={agentMode}
              repHired={repHired}
              onResolve={handleResolveTicket}
              onOpenTicket={handleOpenTicket}
              onOpenProfile={openRepProfile}
            />
          )
        )}
      </div>

      {/* Right sidebar */}
      <SidebarSlot
        open={sidebar.type !== "none"}
        title={sidebarTitle}
        onClose={closeSidebar}
      >
        {sidebar.type === "rule-review" && (
          <RuleReviewSidebar topic={sidebarTopic} rules={rules} />
        )}
        {sidebar.type === "conversation-log" && (
          <ConversationLogSidebar ticketId={sidebar.ticketId} />
        )}
        {sidebar.type === "rep-profile" && (
          <RepProfileSidebar
            identity={agentIdentity}
            permissions={permissions}
            agentMode={agentMode}
          />
        )}
      </SidebarSlot>
    </div>
  );
}
