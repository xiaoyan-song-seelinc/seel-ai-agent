/* Sales Agent types
 *
 * SCOPE NOTE: All strategies in this module currently source from "Online
 * Products" (the merchant's own Shopify/Shopline catalog). A future release
 * will introduce "Network Products" (Seel-network inventory) as an additional
 * source. When that lands, Strategy will gain a `scope: "online" | "network"`
 * discriminator; for now all strategies are implicitly `"online"`.
 */

export type TouchpointId =
  | "search_bar"
  | "live_widget"
  | "thank_you_page"
  | "seel_rc"
  | "wfp_email";

export type TouchpointStatus = "on" | "off" | "dep_unmet";

export type Stage = "pre_purchase" | "live_chat" | "post_purchase";

export type StrategyType = "best_sellers" | "similar" | "new_arrivals" | "manual";

export type ManualMode = "products" | "collection";

export type TimeWindowDays = 7 | 30 | 60 | 90;

export type BestSellersSortBy = "revenue" | "units" | "orders";

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string; // color swatch hex
  inventory: number;
  collectionIds: string[];
  tags: string[];
}

export interface Collection {
  id: string;
  title: string;
  productCount: number;
}

export interface ExclusionRules {
  productIds: string[];
  collectionIds: string[];
  tags: string[];
  outOfStockBehavior: "hidden" | "shown";
}

export interface BaseStrategy {
  id: string;
  name: string;
  type: StrategyType;
  updatedAt: string; // iso
}

export interface BestSellersStrategy extends BaseStrategy {
  type: "best_sellers";
  timeWindow: TimeWindowDays;
  sortBy: BestSellersSortBy;
}

export interface SimilarStrategy extends BaseStrategy {
  type: "similar";
}

export interface NewArrivalsStrategy extends BaseStrategy {
  type: "new_arrivals";
  timeWindow: TimeWindowDays;
}

export interface ManualStrategy extends BaseStrategy {
  type: "manual";
  mode: ManualMode;
  productIds: string[];
  collectionId: string | null;
}

export type Strategy =
  | BestSellersStrategy
  | SimilarStrategy
  | NewArrivalsStrategy
  | ManualStrategy;

export interface ThankYouWidget {
  id: string;
  name: string;
  enabled: boolean;
  strategyId: string;
  title: string;
  subtitle: string;
  productCount: number;
  ctaLabel: string;
}

export interface TouchpointConfig {
  id: TouchpointId;
  enabled: boolean;
  strategyId: string | null; // null when the touchpoint does not pick a strategy (search_bar / live_widget)
  /** How many products the touchpoint renders. Only surfaced in the UI for
   *  touchpoints that pick a strategy (seel_rc / wfp_email). Range 1–10. */
  productCount: number;
}

export type Platform = "shopify" | "shopline";

export type DemoScenario = "empty" | "active" | "configured_no_traffic";

export interface DependencyStatus {
  searchBar: boolean; // true = met
  liveWidget: boolean;
  shopifyPlus: boolean; // true = store is on Shopify Plus
}

/** Touchpoint tag variants — picked per-touchpoint for display. */
export type TouchpointTag =
  | "seel_exclusive"
  | "network_ready"
  | "ai_powered"
  | "new";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  impressions: number;
  clicks: number;
  orders: number;
}

export interface TouchpointAnalyticsRow {
  touchpointId: TouchpointId;
  widget: string;
  strategyId: string;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  delta: number; // -1..1
}

export interface AnalyticsData {
  revenue: number;
  orders: number;
  impressions: number;
  clicks: number;
  aov: number;
  deltaRevenue: number | null;
  deltaOrders: number | null;
  deltaCtr: number | null;
  deltaAov: number | null;
  daily: DailyPoint[];
  byTouchpoint: { touchpointId: TouchpointId; revenue: number }[];
  rows: TouchpointAnalyticsRow[];
}
