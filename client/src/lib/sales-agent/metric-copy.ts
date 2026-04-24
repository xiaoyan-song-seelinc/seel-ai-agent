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
    definition: "Times recommendations were shown.",
  },
  clicks: {
    label: "Clicks",
    definition: "Times a recommended product was clicked.",
  },
  ctr: {
    label: "CTR",
    definition: "Clicks ÷ impressions.",
  },
  orders: {
    label: "Orders Influenced",
    definition:
      "Orders including a recommended product, within 7 days of first click.",
  },
  revenue: {
    label: "Attributed Sales",
    definition:
      "Sales from attributed orders, after discounts, before tax & shipping. Returns not deducted.",
  },
  aov: {
    label: "AOV of Influenced Orders",
    definition: "Average order value of attributed orders.",
  },
};
