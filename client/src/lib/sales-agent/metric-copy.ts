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
      "Sum of subtotal for orders attributed to Sales Agent (Your products only). Uses Shopify subtotal_price (after discounts, before tax/shipping). Returns not deducted.",
  },
  aov: {
    label: "AOV of Influenced Orders",
    definition: "Average order value of attributed orders.",
  },
};

export const KPI_CARD_TOOLTIP: Record<
  "revenue" | "orders" | "ctr" | "aov",
  string
> = {
  revenue:
    "订单中被推荐且最终成单的商品金额总和（仅 Your products）。只算被推荐且真的买了的那些商品，同一订单里其他商品不计入。",
  orders:
    "被 Sales Agent 推荐影响过的订单数量（7 天归因窗口内）。覆盖度指标，与 Attributed Sales 配对可区分「总量靠单均还是靠触达」。",
  ctr: "点击率：曝光批次在 24 小时内产生至少一次点击的占比。每次推荐展示为一个批次（多个商品算一次曝光）。",
  aov: "归因订单的整单平均客单价（注：分子为整单金额，不同于 Attributed Sales 的 line item 口径 —— AOV 回答「推荐是否拉高整单」的问题）。",
};
