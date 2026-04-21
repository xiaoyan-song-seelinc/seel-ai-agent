/* Sales Agent mock data
 * Design DNA: restrained B2B SaaS. No emoji anywhere, including product names.
 */

import type {
  Product,
  Collection,
  Strategy,
  ThankYouWidget,
  DailyPoint,
  TouchpointAnalyticsRow,
} from "./types";

export const PRODUCTS: Product[] = [
  { id: "p_01", title: "Everyday Crew Tee", price: 28, image: "#d9d6cf", inventory: 412, collectionIds: ["c_apparel", "c_spring"], tags: ["core"] },
  { id: "p_02", title: "Merino Crew Sweater", price: 148, image: "#bcbcb5", inventory: 87, collectionIds: ["c_apparel"], tags: ["core"] },
  { id: "p_03", title: "Relaxed Oxford Shirt", price: 96, image: "#c9d2d8", inventory: 203, collectionIds: ["c_apparel", "c_spring"], tags: ["core"] },
  { id: "p_04", title: "Linen Camp Shirt", price: 78, image: "#e2ddc7", inventory: 64, collectionIds: ["c_apparel", "c_spring"], tags: ["core", "seasonal"] },
  { id: "p_05", title: "Stretch Chino Pant", price: 118, image: "#a6998a", inventory: 145, collectionIds: ["c_apparel"], tags: ["core"] },
  { id: "p_06", title: "Leather Minimal Tote", price: 220, image: "#8f7462", inventory: 32, collectionIds: ["c_accessories"], tags: ["core"] },
  { id: "p_07", title: "Canvas Belt", price: 48, image: "#7d7063", inventory: 0, collectionIds: ["c_accessories"], tags: ["core"] },
  { id: "p_08", title: "Wool Ankle Sock (3-pack)", price: 34, image: "#9b9b9b", inventory: 560, collectionIds: ["c_accessories"], tags: ["core"] },
  { id: "p_09", title: "Gift Card", price: 50, image: "#cfcfcf", inventory: 9999, collectionIds: ["c_gift"], tags: ["giftcard"] },
  { id: "p_10", title: "Holiday Clearance Bundle", price: 42, image: "#b7b2a6", inventory: 18, collectionIds: ["c_clearance"], tags: ["clearance"] },
  { id: "p_11", title: "Suede Trainer", price: 168, image: "#9d8a7a", inventory: 76, collectionIds: ["c_footwear"], tags: ["core"] },
  { id: "p_12", title: "Rain Shell Jacket", price: 198, image: "#8a9097", inventory: 41, collectionIds: ["c_apparel", "c_outerwear"], tags: ["core"] },
  { id: "p_13", title: "Weekend Duffle 40L", price: 186, image: "#747068", inventory: 0, collectionIds: ["c_accessories"], tags: ["core"] },
  { id: "p_14", title: "Seasonal Scarf", price: 64, image: "#d3c4b5", inventory: 112, collectionIds: ["c_accessories", "c_spring"], tags: ["seasonal"] },
  { id: "p_15", title: "Tailored Blazer", price: 248, image: "#5f5a53", inventory: 23, collectionIds: ["c_apparel"], tags: ["core"] },
];

export const COLLECTIONS: Collection[] = [
  { id: "c_apparel", title: "Apparel", productCount: 8 },
  { id: "c_accessories", title: "Accessories", productCount: 5 },
  { id: "c_footwear", title: "Footwear", productCount: 1 },
  { id: "c_outerwear", title: "Outerwear", productCount: 1 },
  { id: "c_spring", title: "Spring Drop", productCount: 4 },
  { id: "c_gift", title: "Gift Cards", productCount: 1 },
  { id: "c_clearance", title: "Clearance", productCount: 1 },
];

/* ── Active scenario strategies ── */
export const ACTIVE_STRATEGIES: Strategy[] = [
  {
    id: "s_top_sellers_30d",
    name: "Top Sellers · 30d",
    type: "best_sellers",
    timeWindow: 30,
    sortBy: "revenue",
    updatedAt: "2026-04-12T10:24:00Z",
  },
  {
    id: "s_related",
    name: "Related products",
    type: "similar",
    updatedAt: "2026-04-03T15:11:00Z",
  },
  {
    id: "s_spring_picks",
    name: "Spring picks",
    type: "manual",
    mode: "collection",
    productIds: [],
    collectionId: "c_spring",
    updatedAt: "2026-04-15T08:40:00Z",
  },
];

/* ── Thank You Page widgets (V2 preview, not editable) ── */
export const THANK_YOU_WIDGETS: ThankYouWidget[] = [
  {
    id: "w_ty_01",
    name: "Primary recommendation",
    enabled: true,
    strategyId: "s_top_sellers_30d",
    title: "You might also like",
    subtitle: "Hand-picked based on your order",
    productCount: 4,
    ctaLabel: "Add to order",
  },
  {
    id: "w_ty_02",
    name: "Spring collection",
    enabled: true,
    strategyId: "s_spring_picks",
    title: "Fresh for the season",
    subtitle: "",
    productCount: 3,
    ctaLabel: "Shop collection",
  },
  {
    id: "w_ty_03",
    name: "Restock essentials",
    enabled: false,
    strategyId: "s_related",
    title: "Don't forget these",
    subtitle: "Customers reorder these within 30 days",
    productCount: 3,
    ctaLabel: "Restock",
  },
];

/* ── Daily timeseries for Active scenario (30d) ── */
function buildDaily(): DailyPoint[] {
  const out: DailyPoint[] = [];
  const today = new Date("2026-04-19T00:00:00Z");
  // deterministic pseudo-random
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const base = 220 + Math.sin(i / 4) * 80 + rand() * 110;
    const impressions = Math.round(base * 12);
    const clicks = Math.round(impressions * (0.052 + rand() * 0.018));
    const orders = Math.round(clicks * (0.115 + rand() * 0.04));
    const revenue = Math.round(orders * (38 + rand() * 14));
    out.push({
      date: d.toISOString().slice(0, 10),
      revenue,
      impressions,
      clicks,
      orders,
    });
  }
  return out;
}

const DAILY = buildDaily();

const TOTAL_REVENUE = DAILY.reduce((s, d) => s + d.revenue, 0);
const TOTAL_ORDERS = DAILY.reduce((s, d) => s + d.orders, 0);
const TOTAL_IMPRESSIONS = DAILY.reduce((s, d) => s + d.impressions, 0);
const TOTAL_CLICKS = DAILY.reduce((s, d) => s + d.clicks, 0);

export const ACTIVE_ANALYTICS = {
  revenue: TOTAL_REVENUE,
  orders: TOTAL_ORDERS,
  impressions: TOTAL_IMPRESSIONS,
  clicks: TOTAL_CLICKS,
  aov: Math.round((TOTAL_REVENUE / TOTAL_ORDERS) * 100) / 100,
  deltaRevenue: 0.124,
  deltaOrders: 0.081,
  deltaCtr: -0.032,
  deltaAov: 0.046,
  daily: DAILY,
  byTouchpoint: [
    { touchpointId: "seel_rc" as const, revenue: Math.round(TOTAL_REVENUE * 0.38) },
    { touchpointId: "wfp_email" as const, revenue: Math.round(TOTAL_REVENUE * 0.27) },
    { touchpointId: "search_bar" as const, revenue: Math.round(TOTAL_REVENUE * 0.19) },
    { touchpointId: "live_widget" as const, revenue: Math.round(TOTAL_REVENUE * 0.12) },
    { touchpointId: "thank_you_page" as const, revenue: Math.round(TOTAL_REVENUE * 0.04) },
  ],
  rows: [
    { touchpointId: "seel_rc", widget: "seel_rc_default", strategyId: "s_top_sellers_30d", impressions: 14820, clicks: 892, orders: 103, revenue: 4184, delta: 0.087 },
    { touchpointId: "wfp_email", widget: "wfp_email_default", strategyId: "s_top_sellers_30d", impressions: 9240, clicks: 612, orders: 74, revenue: 2973, delta: 0.142 },
    { touchpointId: "search_bar", widget: "search_bar_default", strategyId: null as unknown as string, impressions: 7184, clicks: 486, orders: 41, revenue: 1609, delta: -0.021 },
    { touchpointId: "live_widget", widget: "live_widget_default", strategyId: null as unknown as string, impressions: 3120, clicks: 214, orders: 22, revenue: 884, delta: 0.056 },
  ] as TouchpointAnalyticsRow[],
};
