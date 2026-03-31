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
import { HireRepDialog } from "@/components/communication/onboarding/HireRepDialog";
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
    resetOnboarding,
  } = useCommunicationState();

  const { sidebar, openRuleReview, openConversationLog, openRepProfile, closeSidebar } = useSidebarManager();
  const messageSender = useMessageSender();

  const {
    topics, agentMode, agentIdentity, permissions, rules,
    setAgentMode, updateAgentIdentity, setPermissions, updateTopic,
  } = useStore();

  const [tickets, setTickets] = useState<EscalationTicket[]>(ESCALATION_TICKETS);
  // HireRepDialog used for both onboarding "hire" step AND edit-settings from Rep profile
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────

  function handleAcceptProposal(topicId: string) {
    const t = topics.find((t) => t.id === topicId);
    if (t?.proposedRule) updateTopic(topicId, { proposedRule: { ...t.proposedRule, status: "accepted" } });
  }

  function handleRejectProposal(topicId: string) {
    const t = topics.find((t) => t.id === topicId);
    if (t?.proposedRule) updateTopic(topicId, { proposedRule: { ...t.proposedRule, status: "rejected" } });
  }

  function handleResolveTicket(id: string) {
    setTickets((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: "resolved" as const, resolvedAt: new Date().toISOString() } : t),
    );
  }

  // ── Sidebar meta ──────────────────────────────────────────

  const sidebarTitle =
    sidebar.type === "rule-review" ? "Rule Review"
    : sidebar.type === "conversation-log" ? "Conversation Log"
    : sidebar.type === "rep-profile" ? `${agentIdentity.name}'s Profile`
    : "";

  const sidebarTopic = sidebar.type === "rule-review"
    ? topics.find((t) => t.id === sidebar.topicId) ?? null
    : null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Narrow sidebar — icon buttons + dev reset */}
      <NarrowSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        repHired={repHired}
        onResetOnboarding={resetOnboarding}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
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
              onModeSelected={setAgentMode}
            />
          ) : (
            <TeamLeadConversation
              topics={topics}
              onAcceptProposal={handleAcceptProposal}
              onRejectProposal={handleRejectProposal}
              onReplyToTopic={messageSender.sendReply}
              onSendNewMessage={messageSender.sendNewMessage}
              onOpenTicket={openConversationLog}
              onReviewRule={(topicId) => {
                const t = topics.find((t) => t.id === topicId);
                if (t?.proposedRule) openRuleReview(t.proposedRule.id, topicId);
              }}
              isOnboarding={false}
            />
          )
        )}

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
              onOpenTicket={openConversationLog}
              onOpenProfile={openRepProfile}
            />
          )
        )}
      </div>

      {/* Right sidebar */}
      <SidebarSlot open={sidebar.type !== "none"} title={sidebarTitle} onClose={closeSidebar}>
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
            onEditSettings={() => { closeSidebar(); setEditDialogOpen(true); }}
          />
        )}
      </SidebarSlot>

      {/* Edit settings dialog (reuses HireRepDialog) */}
      <HireRepDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onHire={(identity, updatedPermissions) => {
          updateAgentIdentity(identity);
          setPermissions(updatedPermissions);
          setEditDialogOpen(false);
        }}
        permissions={permissions}
        existingIdentity={agentIdentity}
      />
    </div>
  );
}
