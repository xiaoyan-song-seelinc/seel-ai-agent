export type MetricKey =
  | "impressions"
  | "clicks"
  | "ctr"
  | "orders"
  | "revenue"
  | "aov";

export const METRIC_COPY: Record<
  MetricKey,
  { label: string; definition: string }
> = {
  impressions: {
    label: "Impressions",
    definition: "Total times recommendations were shown to shoppers.",
  },
  clicks: {
    label: "Clicks",
    definition: "Total clicks on recommended products.",
  },
  ctr: {
    label: "CTR",
    definition: "Share of recommendations that got clicked within 24 hours.",
  },
  orders: {
    label: "Orders Influenced",
    definition:
      "Orders containing a recommended product within 7 days of clicking it.",
  },
  revenue: {
    label: "Attributed Sales",
    definition:
      "Sales from recommended products that shoppers purchased (only the recommended items, not the rest of the order).",
  },
  aov: {
    label: "AOV of Influenced Orders",
    definition: "Average full-order value of influenced orders.",
  },
};
