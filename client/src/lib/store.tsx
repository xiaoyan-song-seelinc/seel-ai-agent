import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import {
  AgentMode,
  AgentIdentity,
  ActionPermission,
  SOPRule,
  Topic,
  KnowledgeDocument,
  AGENT_MODE,
  AGENT_IDENTITY,
  ACTION_PERMISSIONS,
  RULES,
  TOPICS,
  KNOWLEDGE_DOCUMENTS,
} from "@/lib/mock-data";

// ── Store shape ───────────────────────────────────────────

export interface StoreState {
  // State slices
  agentMode: AgentMode;
  agentIdentity: AgentIdentity;
  permissions: ActionPermission[];
  rules: SOPRule[];
  topics: Topic[];
  documents: KnowledgeDocument[];

  // Setters
  setAgentMode: (mode: AgentMode) => void;
  setAgentIdentity: (identity: AgentIdentity) => void;
  updateAgentIdentity: (patch: Partial<AgentIdentity>) => void;

  setPermissions: (permissions: ActionPermission[]) => void;
  updatePermission: (id: string, patch: Partial<ActionPermission>) => void;

  setRules: (rules: SOPRule[]) => void;
  addRule: (rule: SOPRule) => void;
  updateRule: (id: string, patch: Partial<SOPRule>) => void;
  removeRule: (id: string) => void;

  setTopics: (topics: Topic[]) => void;
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  removeTopic: (id: string) => void;

  setDocuments: (documents: KnowledgeDocument[]) => void;
  addDocument: (document: KnowledgeDocument) => void;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void;
  removeDocument: (id: string) => void;

  // Computed
  writeActions: ActionPermission[];
  readActions: ActionPermission[];
}

// ── Context ───────────────────────────────────────────────

const StoreContext = createContext<StoreState | null>(null);

// ── Provider ──────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [agentMode, setAgentMode] = useState<AgentMode>(AGENT_MODE);
  const [agentIdentity, setAgentIdentity] =
    useState<AgentIdentity>(AGENT_IDENTITY);
  const [permissions, setPermissions] =
    useState<ActionPermission[]>(ACTION_PERMISSIONS);
  const [rules, setRules] = useState<SOPRule[]>(RULES);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [documents, setDocuments] =
    useState<KnowledgeDocument[]>(KNOWLEDGE_DOCUMENTS);

  // Computed values
  const writeActions = useMemo(
    () => permissions.filter((p) => p.type === "write"),
    [permissions],
  );
  const readActions = useMemo(
    () => permissions.filter((p) => p.type === "read"),
    [permissions],
  );

  const value = useMemo<StoreState>(
    () => ({
      // State
      agentMode,
      agentIdentity,
      permissions,
      rules,
      topics,
      documents,

      // Setters — agent
      setAgentMode,
      setAgentIdentity,
      updateAgentIdentity: (patch) =>
        setAgentIdentity((prev) => ({ ...prev, ...patch })),

      // Setters — permissions
      setPermissions,
      updatePermission: (id, patch) =>
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),

      // Setters — rules
      setRules,
      addRule: (rule) => setRules((prev) => [...prev, rule]),
      updateRule: (id, patch) =>
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        ),
      removeRule: (id) => setRules((prev) => prev.filter((r) => r.id !== id)),

      // Setters — topics
      setTopics,
      addTopic: (topic) => setTopics((prev) => [...prev, topic]),
      updateTopic: (id, patch) =>
        setTopics((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        ),
      removeTopic: (id) =>
        setTopics((prev) => prev.filter((t) => t.id !== id)),

      // Setters — documents
      setDocuments,
      addDocument: (doc) => setDocuments((prev) => [...prev, doc]),
      updateDocument: (id, patch) =>
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        ),
      removeDocument: (id) =>
        setDocuments((prev) => prev.filter((d) => d.id !== id)),

      // Computed
      writeActions,
      readActions,
    }),
    [
      agentMode,
      agentIdentity,
      permissions,
      rules,
      topics,
      documents,
      writeActions,
      readActions,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a <StoreProvider>");
  }
  return ctx;
}
