import { useState } from "react";

export type SidebarState =
  | { type: "none" }
  | { type: "rule-review"; ruleId: string; topicId?: string }
  | { type: "conversation-log"; ticketId: string }
  | { type: "rep-profile" };

export interface SidebarManager {
  sidebar: SidebarState;
  openRuleReview: (ruleId: string, topicId?: string) => void;
  openConversationLog: (ticketId: string) => void;
  openRepProfile: () => void;
  closeSidebar: () => void;
}

export function useSidebarManager(): SidebarManager {
  const [sidebar, setSidebar] = useState<SidebarState>({ type: "none" });

  const openRuleReview = (ruleId: string, topicId?: string) => {
    setSidebar({ type: "rule-review", ruleId, topicId });
  };

  const openConversationLog = (ticketId: string) => {
    setSidebar({ type: "conversation-log", ticketId });
  };

  const openRepProfile = () => {
    setSidebar({ type: "rep-profile" });
  };

  const closeSidebar = () => {
    setSidebar({ type: "none" });
  };

  return {
    sidebar,
    openRuleReview,
    openConversationLog,
    openRepProfile,
    closeSidebar,
  };
}
