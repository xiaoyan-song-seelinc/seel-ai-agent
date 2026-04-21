import type { BestSellersSortBy, Stage, StrategyType, TouchpointId, TouchpointTag } from "./types";

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
    description:
      "Shoppers type full-sentence queries and get matching products instantly, with an AI chat alongside to explain and refine.",
    shopifyOnly: true,
    previewOnly: false,
    picksStrategy: false,
    dependencyKey: "searchBar",
    tags: ["ai_powered"],
  },
  {
    id: "live_widget",
    label: "Support Agent",
    stage: "pre_purchase",
    description:
      "Shoppers asking product questions mid-chat get relevant picks inline, without leaving the conversation.",
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
    description:
      "Shoppers browsing returns or refunds see relevant products on the page, turning return traffic into repeat orders.",
    shopifyOnly: false,
    previewOnly: false,
    picksStrategy: true,
    tags: ["seel_exclusive", "network_ready"],
  },
  {
    id: "wfp_email",
    label: "WFP Policy Email",
    stage: "post_purchase",
    description:
      "Recommendations appear inside the policy confirmation email, reaching shoppers at a high open-rate moment.",
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
    className: "bg-[#ECE9FF] text-[#2121C4] border-[#D6D2FF]",
  },
  network_ready: {
    label: "Network-ready",
    className: "bg-[#F2F6FE] text-[#2121C4] border-[#D6E7FF]",
  },
  ai_powered: {
    label: "AI-powered",
    className: "bg-[#E2F7DA] text-[#235935] border-[#CDE9C3]",
  },
  new: {
    label: "New",
    className: "bg-[#FFFBEB] text-[#D97706] border-[#F5E6C8]",
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

export const SORT_BY_OPTIONS: { value: BestSellersSortBy; label: string }[] = [
  { value: "revenue", label: "Total revenue" },
  { value: "units", label: "Units sold" },
  { value: "orders", label: "Distinct orders" },
];

export function touchpointLabel(id: TouchpointId): string {
  return TOUCHPOINTS.find((t) => t.id === id)?.label ?? id;
}
