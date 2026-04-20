import type { Stage, StrategyType, TouchpointId, TouchpointTag } from "./types";

export interface TouchpointMeta {
  id: TouchpointId;
  label: string;
  stage: Stage;
  description: string;
  /** only rendered on Shopify platform */
  shopifyOnly: boolean;
  /** Part of the "not this release" preview */
  previewOnly: boolean;
  /** Whether the touchpoint picks a strategy itself */
  picksStrategy: boolean;
  /** Whether the touchpoint has a platform dependency */
  dependencyKey?: "searchBar" | "liveWidget";
  /** Touchpoint requires the store to be on Shopify Plus. */
  requiresShopifyPlus?: boolean;
  /** Optional display tags (Seel-exclusive, Network-ready, etc.). */
  tags?: TouchpointTag[];
}

export const TOUCHPOINTS: TouchpointMeta[] = [
  {
    id: "search_bar",
    label: "Search Bar",
    stage: "pre_purchase",
    description: "AI-powered search on storefront",
    shopifyOnly: true,
    previewOnly: false,
    picksStrategy: false,
    dependencyKey: "searchBar",
    tags: ["ai_powered"],
  },
  {
    id: "live_widget",
    label: "LiveChat Widget",
    stage: "live_chat",
    description: "In-chat product recommendations",
    shopifyOnly: true,
    previewOnly: false,
    picksStrategy: false,
    dependencyKey: "liveWidget",
    tags: ["ai_powered"],
  },
  {
    id: "thank_you_page",
    label: "Thank You Page",
    stage: "post_purchase",
    description: "Order confirmation recommendations",
    shopifyOnly: true,
    previewOnly: true,
    picksStrategy: false,
    requiresShopifyPlus: true,
    tags: ["new"],
  },
  {
    id: "seel_rc",
    label: "Seel Resolution Center",
    stage: "post_purchase",
    description: "Recommendations during returns",
    shopifyOnly: false,
    previewOnly: false,
    picksStrategy: true,
    tags: ["seel_exclusive", "network_ready"],
  },
  {
    id: "wfp_email",
    label: "WFP Policy Email",
    stage: "post_purchase",
    description: "Worry-free purchase follow-up email",
    shopifyOnly: false,
    previewOnly: false,
    picksStrategy: true,
    tags: ["seel_exclusive"],
  },
];

/** Styled metadata per tag variant. */
export const TOUCHPOINT_TAG_META: Record<
  TouchpointTag,
  { label: string; className: string }
> = {
  seel_exclusive: {
    label: "Seel-exclusive",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  network_ready: {
    label: "Network-ready",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  ai_powered: {
    label: "AI-powered",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  new: {
    label: "New",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export const STAGE_LABEL: Record<Stage, string> = {
  pre_purchase: "Pre-purchase",
  live_chat: "Live chat",
  post_purchase: "Post-purchase",
};

export const STRATEGY_TYPE_LABEL: Record<StrategyType, string> = {
  best_sellers: "Best Sellers",
  similar: "Similar Products",
  new_arrivals: "New Arrivals",
  manual: "Manual Pick",
};

export const TIME_WINDOW_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
] as const;

export function touchpointLabel(id: TouchpointId): string {
  return TOUCHPOINTS.find((t) => t.id === id)?.label ?? id;
}
