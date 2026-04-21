/* Sales Agent state — React Context store
 * (Zustand isn't in the repo deps, so we use the same pattern
 *  as the existing StoreProvider. Semantics are equivalent.)
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACTIVE_ANALYTICS,
  ACTIVE_STRATEGIES,
  THANK_YOU_WIDGETS,
  PRODUCTS,
  COLLECTIONS,
} from "./mock-data";
import type {
  AnalyticsData,
  DemoScenario,
  DependencyStatus,
  ExclusionRules,
  Platform,
  Strategy,
  ThankYouWidget,
  TouchpointConfig,
  TouchpointId,
} from "./types";

/* ── Scenario-driven derivations ─────────────────────────── */

const EMPTY_ANALYTICS: AnalyticsData = {
  revenue: 0,
  orders: 0,
  impressions: 0,
  clicks: 0,
  aov: 0,
  deltaRevenue: null,
  deltaOrders: null,
  deltaCtr: null,
  deltaAov: null,
  daily: [],
  byTouchpoint: [],
  rows: [],
};

function defaultTouchpoints(scenario: DemoScenario): TouchpointConfig[] {
  if (scenario === "active") {
    return [
      { id: "search_bar", enabled: false, strategyId: null, productCount: 4 },
      { id: "live_widget", enabled: true, strategyId: null, productCount: 4 },
      { id: "thank_you_page", enabled: false, strategyId: null, productCount: 4 },
      { id: "seel_rc", enabled: true, strategyId: "s_top_sellers_30d", productCount: 4 },
      { id: "wfp_email", enabled: true, strategyId: "s_top_sellers_30d", productCount: 4 },
    ];
  }
  if (scenario === "configured_no_traffic") {
    return [
      { id: "search_bar", enabled: false, strategyId: null, productCount: 4 },
      { id: "live_widget", enabled: false, strategyId: null, productCount: 4 },
      { id: "thank_you_page", enabled: false, strategyId: null, productCount: 4 },
      { id: "seel_rc", enabled: true, strategyId: "s_top_sellers_30d", productCount: 4 },
      { id: "wfp_email", enabled: false, strategyId: "s_top_sellers_30d", productCount: 4 },
    ];
  }
  // empty
  return [
    { id: "search_bar", enabled: false, strategyId: null, productCount: 4 },
    { id: "live_widget", enabled: false, strategyId: null, productCount: 4 },
    { id: "thank_you_page", enabled: false, strategyId: null, productCount: 4 },
    { id: "seel_rc", enabled: false, strategyId: null, productCount: 4 },
    { id: "wfp_email", enabled: false, strategyId: null, productCount: 4 },
  ];
}

function defaultStrategies(scenario: DemoScenario): Strategy[] {
  if (scenario === "empty") return [];
  return ACTIVE_STRATEGIES.map((s) => ({ ...s }));
}

function defaultExclusion(scenario: DemoScenario): ExclusionRules {
  if (scenario === "empty") {
    return { productIds: [], collectionIds: [], tags: [], outOfStockBehavior: "hidden" };
  }
  return {
    productIds: ["p_09"],
    collectionIds: ["c_clearance"],
    tags: ["giftcard"],
    outOfStockBehavior: "hidden",
  };
}

function defaultAnalytics(scenario: DemoScenario): AnalyticsData {
  if (scenario === "active") return ACTIVE_ANALYTICS as AnalyticsData;
  return EMPTY_ANALYTICS;
}

/* ── Context ──────────────────────────────────────────────── */

interface SalesAgentStore {
  scenario: DemoScenario;
  platform: Platform;
  dependency: DependencyStatus;

  touchpoints: TouchpointConfig[];
  strategies: Strategy[];
  exclusion: ExclusionRules;
  thankYouWidgets: ThankYouWidget[];
  analytics: AnalyticsData;

  // scenario controls
  setScenario: (s: DemoScenario) => void;
  setPlatform: (p: Platform) => void;
  setDependency: (d: Partial<DependencyStatus>) => void;

  // touchpoint mutations
  updateTouchpoint: (id: TouchpointId, patch: Partial<TouchpointConfig>) => void;

  // strategy mutations
  addStrategy: (s: Strategy) => void;
  updateStrategy: (id: string, patch: Partial<Strategy>) => void;
  removeStrategy: (id: string) => void;

  // exclusion mutations
  updateExclusion: (patch: Partial<ExclusionRules>) => void;

  // thank you widget mutations
  updateThankYouWidget: (id: string, patch: Partial<ThankYouWidget>) => void;

  // helpers
  isStrategyReferenced: (strategyId: string) => TouchpointId[];
}

const Ctx = createContext<SalesAgentStore | null>(null);

export function SalesAgentProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioState] = useState<DemoScenario>("active");
  const [platform, setPlatform] = useState<Platform>("shopify");
  const [dependency, setDependencyState] = useState<DependencyStatus>({
    searchBar: true,
    liveWidget: true,
    shopifyPlus: true,
  });

  const [touchpoints, setTouchpoints] = useState<TouchpointConfig[]>(() =>
    defaultTouchpoints("active"),
  );
  const [strategies, setStrategies] = useState<Strategy[]>(() =>
    defaultStrategies("active"),
  );
  const [exclusion, setExclusion] = useState<ExclusionRules>(() =>
    defaultExclusion("active"),
  );
  const [thankYouWidgets, setThankYouWidgets] = useState<ThankYouWidget[]>(
    () => THANK_YOU_WIDGETS.map((w) => ({ ...w })),
  );
  const [analytics, setAnalytics] = useState<AnalyticsData>(() =>
    defaultAnalytics("active"),
  );

  const setScenario = (s: DemoScenario) => {
    setScenarioState(s);
    setTouchpoints(defaultTouchpoints(s));
    setStrategies(defaultStrategies(s));
    setExclusion(defaultExclusion(s));
    setAnalytics(defaultAnalytics(s));
  };

  const setDependency = (patch: Partial<DependencyStatus>) => {
    setDependencyState((prev) => ({ ...prev, ...patch }));
  };

  const updateTouchpoint = (
    id: TouchpointId,
    patch: Partial<TouchpointConfig>,
  ) => {
    setTouchpoints((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  };

  const addStrategy = (s: Strategy) =>
    setStrategies((prev) => [...prev, s]);

  const updateStrategy = (id: string, patch: Partial<Strategy>) =>
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...patch } as Strategy) : s)),
    );

  const removeStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    setTouchpoints((prev) =>
      prev.map((t) => (t.strategyId === id ? { ...t, strategyId: null } : t)),
    );
  };

  const updateExclusion = (patch: Partial<ExclusionRules>) =>
    setExclusion((prev) => ({ ...prev, ...patch }));

  const updateThankYouWidget = (
    id: string,
    patch: Partial<ThankYouWidget>,
  ) =>
    setThankYouWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    );

  const isStrategyReferenced = (strategyId: string): TouchpointId[] => {
    const refs: TouchpointId[] = [];
    touchpoints.forEach((t) => {
      if (t.strategyId === strategyId) refs.push(t.id);
    });
    thankYouWidgets.forEach((w) => {
      if (w.strategyId === strategyId && !refs.includes("thank_you_page")) {
        refs.push("thank_you_page");
      }
    });
    return refs;
  };

  const value = useMemo<SalesAgentStore>(
    () => ({
      scenario,
      platform,
      dependency,
      touchpoints,
      strategies,
      exclusion,
      thankYouWidgets,
      analytics,
      setScenario,
      setPlatform,
      setDependency,
      updateTouchpoint,
      addStrategy,
      updateStrategy,
      removeStrategy,
      updateExclusion,
      updateThankYouWidget,
      isStrategyReferenced,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario, platform, dependency, touchpoints, strategies, exclusion, thankYouWidgets, analytics],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSalesAgent(): SalesAgentStore {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useSalesAgent must be used inside <SalesAgentProvider>");
  return v;
}

/* ── Static lookup helpers (not tied to scenario) ────────── */

export { PRODUCTS, COLLECTIONS };
