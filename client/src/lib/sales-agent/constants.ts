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
    description: "AI-powered search on storefront",
    shopifyOnly: true,
    previewOnly: false,
    picksStrategy: false,
    dependencyKey: "searchBar",
    tags: ["ai_powered"],
  },
  {
    id: "live_widget",
    label: "Live Chat Widget",
    stage: "pre_purchase",
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

export interface HowItWorksStep {
  title: string;
  description: string;
}

/**
 * Neutral, shopper-and-merchant facing explanation shown in the detail
 * panel. Three steps per touchpoint, following the structure:
 *   1) When the touchpoint triggers (shopper context)
 *   2) What the recommendation looks like
 *   3) What the merchant has to maintain
 */
export const TOUCHPOINT_HOW_IT_WORKS: Record<TouchpointId, HowItWorksStep[]> = {
  search_bar: [
    {
      title: "Triggered when shoppers type a natural-language query",
      description:
        "Shoppers describe needs in full sentences (e.g. “a lightweight moisturizer for sensitive skin”). The AI interprets intent and matches products, without relying on exact keyword hits.",
    },
    {
      title: "Results page highlights the top 3, chat panel opens alongside",
      description:
        "All matched products load on the search results page, with the top 3 marked by a highlight border and rank badge. The side chat panel explains the picks and lets shoppers refine the query in-line.",
    },
    {
      title: "Shares the AI backbone with Support Agent",
      description:
        "Reuses the Support Agent model you already trained — no extra setup. Candidate products come from your Shopify catalog and automatically honor the Sales Agent exclusion rules.",
    },
  ],
  live_widget: [
    {
      title: "Triggered when shoppers ask product questions in Live Chat",
      description:
        "For questions like “do you have this in blue?”, “what’s similar?”, or “a gift under $50?”, the AI grounds its answer in catalog data and builds on prior turns across the conversation.",
    },
    {
      title: "Products appear as cards inline with the reply",
      description:
        "Each AI reply carries up to 3 product cards with price, rank, a short reason, and an add-to-cart button. Shoppers stay in the conversation and can keep refining.",
    },
    {
      title: "No extra maintenance from the merchant",
      description:
        "Candidate products come from your Shopify catalog and inherit the Sales Agent exclusion rules. No product lists to curate and no prompts to author.",
    },
  ],
  thank_you_page: [
    {
      title: "Triggered right after the shopper completes checkout",
      description:
        "Shown on the Thank You Page while shoppers review their confirmed order, when they are most open to adding one more item.",
    },
    {
      title: "Widgets render in designated slots on the Thank You Page",
      description:
        "Each widget shows a small set of products with the title, subtitle, and CTA you configure. Layout, product count, and placement follow the widget’s own setup.",
    },
    {
      title: "Merchant configures widgets in the V2 composer",
      description:
        "The Thank You Page composer ships in V2. At that point you will choose strategy, segment, and layout per widget. Today’s cards are read-only previews of that capability set.",
    },
  ],
  seel_rc: [
    {
      title: "Triggered inside the returns & exchanges flow",
      description:
        "Shown when shoppers file a return, check refund progress, or confirm an exchange inside the Resolution Center.",
    },
    {
      title: "Product module embeds in the Resolution Center pages",
      description:
        "Product cards render directly in the page the shopper is already on. Placement, count, and styling follow the existing live layout.",
    },
    {
      title: "Merchant picks one strategy for Own products",
      description:
        "Choose one strategy from the pool — Best Sellers, Similar Products, New Arrivals, or Manual Pick — to source your own-catalog recommendations. Network products (Seel Disco third-party) are controlled separately in Hub and are not configurable here.",
    },
  ],
  wfp_email: [
    {
      title: "Rendered when the policy confirmation email is sent",
      description:
        "Shoppers who purchase Worry-Free Purchase protection receive a policy confirmation email with an embedded recommendation module, reached at the moment they confirm their coverage.",
    },
    {
      title: "Product module embeds in the email body",
      description:
        "Product cards render in a fixed slot inside the email template. Count, styling, and tracking follow the shape already defined in the Email Recommendation PRD.",
    },
    {
      title: "Merchant picks one strategy",
      description:
        "Choose one strategy from the pool to source recommendations. The email template, styling, and trigger logic require no changes.",
    },
  ],
};
