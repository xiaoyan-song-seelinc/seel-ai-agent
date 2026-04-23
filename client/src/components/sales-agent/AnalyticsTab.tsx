import { useMemo, useState } from "react";
import { ChevronDown, Download, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { TOUCHPOINTS, touchpointLabel } from "@/lib/sales-agent/constants";
import type { TouchpointId } from "@/lib/sales-agent/types";
import {
  Tooltip as UITooltip,
  TooltipContent as UITooltipContent,
  TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoTip, Panel, SAButton, SAInput } from "./primitives";

type TrendKey = "total" | TouchpointId;

const TREND_COLORS: Record<TrendKey, string> = {
  total: "#2121C4",
  seel_rc: "#0EA5E9",
  wfp_email: "#645AFF",
  search_bar: "#10B981",
  live_widget: "#F59E0B",
  thank_you_page: "#EF4444",
};

type RangePreset = "yesterday" | "7d" | "30d" | "90d" | "custom";

interface Range {
  preset: RangePreset;
  /** YYYY-MM-DD; only meaningful when preset is "custom". */
  start?: string;
  end?: string;
}

const METRIC_COPY: Record<
  "revenue" | "orders" | "ctr" | "aov" | "impressions" | "clicks",
  { label: string; definition: string }
> = {
  revenue: {
    label: "Attributed Sales",
    definition:
      "Subtotal of orders attributed to Sales Agent. Uses Shopify subtotal_price (after discounts, before tax/shipping). Returns are not deducted.",
  },
  orders: {
    label: "Orders Influenced",
    definition:
      "Distinct orders that include a recommended product, counted within a 7-day click-to-purchase attribution window.",
  },
  ctr: {
    label: "CTR",
    definition: "Clicks divided by impressions across Sales Agent touchpoints.",
  },
  aov: {
    label: "AOV of Influenced Orders",
    definition:
      "Average order value for orders attributed to Sales Agent. Calculated as Attributed Revenue ÷ Orders Influenced.",
  },
  impressions: {
    label: "Impressions",
    definition:
      "Number of times recommendations were shown at a touchpoint within the selected window.",
  },
  clicks: {
    label: "Clicks",
    definition:
      "Number of times shoppers clicked a recommended product at a touchpoint within the selected window.",
  },
};

export default function AnalyticsTab() {
  const store = useSalesAgent();
  const [range, setRange] = useState<Range>({ preset: "30d" });
  const [selected, setSelected] = useState<TouchpointId[]>(
    TOUCHPOINTS.map((t) => t.id),
  );

  const data = store.analytics;
  const isEmpty = data.daily.length === 0;

  const filteredRows = useMemo(
    () => data.rows.filter((r) => selected.includes(r.touchpointId)),
    [data.rows, selected],
  );

  const exportCsv = () => {
    const headers = [
      "Touchpoint",
      "Widget",
      "Strategy",
      "Impressions",
      "CTR",
      "Orders",
      "Revenue",
      "Revenue Δ",
    ];
    const lines = filteredRows.map((r) => {
      const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
      const strategy = store.strategies.find((s) => s.id === r.strategyId)?.name ?? "—";
      return [
        touchpointLabel(r.touchpointId),
        r.widget,
        strategy,
        r.impressions,
        (ctr * 100).toFixed(2) + "%",
        r.orders,
        r.revenue,
        (r.delta * 100).toFixed(1) + "%",
      ].join(",");
    });
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-agent-${range.preset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[14px] text-[#5C5F62]">Time range</label>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <TouchpointFilter selected={selected} onChange={setSelected} />
        <div className="ml-auto">
          <UITooltip delayDuration={300}>
            <UITooltipTrigger asChild>
              <SAButton variant="secondary" size="md" onClick={exportCsv}>
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </SAButton>
            </UITooltipTrigger>
            <UITooltipContent
              side="bottom"
              align="center"
              sideOffset={6}
              className="max-w-[280px] whitespace-normal bg-[#1A1A1A] text-white text-[12px] font-normal leading-snug px-2.5 py-1.5 rounded-[4px]"
            >
              Exports the orders attributed to Sales Agent in the selected time range and touchpoint filter. Each row is one attributed order with the strategy that drove the purchase.
              <TooltipPrimitive.Arrow width={10} height={5} className="fill-[#1A1A1A]" />
            </UITooltipContent>
          </UITooltip>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label={METRIC_COPY.revenue.label}
          value={isEmpty ? "—" : formatCurrency(data.revenue)}
          delta={data.deltaRevenue}
          tip={METRIC_COPY.revenue.definition}
        />
        <KpiCard
          label={METRIC_COPY.orders.label}
          value={isEmpty ? "—" : data.orders.toLocaleString()}
          delta={data.deltaOrders}
          tip={METRIC_COPY.orders.definition}
        />
        <KpiCard
          label={METRIC_COPY.ctr.label}
          value={
            isEmpty
              ? "—"
              : formatPct(
                  data.impressions > 0 ? data.clicks / data.impressions : 0,
                )
          }
          delta={data.deltaCtr}
          tip={METRIC_COPY.ctr.definition}
        />
        <KpiCard
          label={METRIC_COPY.aov.label}
          value={isEmpty ? "—" : formatCurrency(data.aov)}
          delta={data.deltaAov}
          tip={METRIC_COPY.aov.definition}
        />
      </div>

      {/* Sales trend chart */}
      <Panel className="p-6">
        <div className="flex items-center gap-1.5">
          <p className="text-[18px] font-semibold text-[#202223]">
            Sales trend
          </p>
          <InfoTip>
            Sales amount is based on Shopify subtotal_price. See Attributed
            Sales for full definition.
          </InfoTip>
        </div>
        {isEmpty ? (
          <div className="h-[300px] mt-3">
            <EmptyChart />
          </div>
        ) : (
          <RevenueTrendChart data={data} selected={selected} />
        )}
      </Panel>

      {/* Detail table */}
      <Panel className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F0F0F0]">
          <p className="text-[18px] font-semibold text-[#202223]">
            Performance breakdown
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_110px_110px_90px_90px_150px] px-6 py-4 bg-[#F7F7FC] border-b border-[#F0F0F0] text-[14px] font-semibold text-[#202223]">
          <div>Touchpoint</div>
          <div className="flex items-center gap-1 justify-end">
            <span>Impr.</span>
            <InfoTip>{METRIC_COPY.impressions.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Clicks</span>
            <InfoTip>{METRIC_COPY.clicks.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>CTR</span>
            <InfoTip>{METRIC_COPY.ctr.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Orders</span>
            <InfoTip>{METRIC_COPY.orders.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Sales</span>
            <InfoTip>
              {METRIC_COPY.revenue.definition} Parenthesis shows change vs the
              previous equal-length window.
            </InfoTip>
          </div>
        </div>
        {filteredRows.length === 0 ? (
          <div className="py-10 text-center text-[14px] text-[#6B7280]">
            No data yet
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {filteredRows.map((r) => {
              const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
              return (
                <div
                  key={`${r.touchpointId}-${r.widget}`}
                  className="grid grid-cols-[minmax(0,2fr)_110px_110px_90px_90px_150px] items-center px-6 py-4 text-[14px] text-[#202223] hover:bg-[#F5F5F5]"
                >
                  <div className="truncate font-medium">
                    {touchpointLabel(r.touchpointId)}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.impressions.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.clicks.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {formatPct(ctr)}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.orders.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-medium">
                      {formatCurrency(r.revenue)}
                    </span>
                    <span
                      className={cn(
                        "ml-1.5 text-[12px]",
                        r.delta > 0 && "text-[#235935]",
                        r.delta < 0 && "text-[#FF0000]",
                        r.delta === 0 && "text-[#8C8C8C]",
                      )}
                    >
                      ({formatDelta(r.delta)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ── Date range picker with custom range support ──────── */
function DateRangePicker({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  const [open, setOpen] = useState(false);

  const label =
    value.preset === "yesterday"
      ? "Yesterday"
      : value.preset === "7d"
        ? "Last 7 days"
        : value.preset === "30d"
          ? "Last 30 days"
          : value.preset === "90d"
            ? "Last 90 days"
            : value.start && value.end
              ? `${value.start} → ${value.end}`
              : "Custom";

  const presets: { key: RangePreset; label: string }[] = [
    { key: "yesterday", label: "Yesterday" },
    { key: "7d", label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
    { key: "90d", label: "Last 90 days" },
  ];

  return (
    <div className="relative">
      <SAButton variant="secondary" size="md" onClick={() => setOpen((v) => !v)}>
        <Calendar className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </SAButton>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 left-0 w-[280px] bg-white border border-[#E0E0E0] rounded-lg shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
            {presets.map((p) => {
              const active = value.preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    onChange({ preset: p.key });
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[14px] hover:bg-[#F5F5F5]",
                    active && "text-[#2121C4] font-medium",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
            <div className="border-t border-[#F0F0F0] my-1" />
            <div className="px-3 py-2">
              <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.06em] mb-1.5">
                Custom range
              </p>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[12px] text-[#6B7280]">From</label>
                  <SAInput
                    type="date"
                    value={value.start ?? ""}
                    onChange={(e) =>
                      onChange({
                        preset: "custom",
                        start: e.target.value,
                        end: value.end,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[#6B7280]">To</label>
                  <SAInput
                    type="date"
                    value={value.end ?? ""}
                    onChange={(e) =>
                      onChange({
                        preset: "custom",
                        start: value.start,
                        end: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-end pt-1">
                  <SAButton
                    variant="primary"
                    size="sm"
                    disabled={!value.start || !value.end}
                    onClick={() => setOpen(false)}
                  >
                    Apply
                  </SAButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Touchpoint filter (popover) ───────────────────────── */
function TouchpointFilter({
  selected,
  onChange,
}: {
  selected: TouchpointId[];
  onChange: (ids: TouchpointId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allIds = TOUCHPOINTS.map((t) => t.id);
  const label =
    selected.length === allIds.length
      ? "All touchpoints"
      : selected.length === 0
        ? "None"
        : `${selected.length} touchpoints`;

  return (
    <div className="relative">
      <SAButton variant="secondary" size="md" onClick={() => setOpen((v) => !v)}>
        {label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </SAButton>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 left-0 w-[240px] bg-white border border-[#E0E0E0] rounded-lg shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-[12px] text-[#6B7280] hover:bg-[#F5F5F5]"
              onClick={() =>
                onChange(selected.length === allIds.length ? [] : allIds)
              }
            >
              {selected.length === allIds.length ? "Clear all" : "Select all"}
            </button>
            <div className="border-t border-[#F0F0F0]" />
            {TOUCHPOINTS.map((t) => {
              const checked = selected.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#F5F5F5] text-[14px]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(selected.filter((x) => x !== t.id));
                      else onChange([...selected, t.id]);
                    }}
                    className="h-3.5 w-3.5 accent-[#2121C4]"
                  />
                  {t.label}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  delta,
  tip,
}: {
  label: string;
  value: string;
  delta: number | null;
  tip: string;
}) {
  return (
    <Panel className="px-5 py-5">
      <div className="flex items-center gap-1 text-[14px] text-[#5C5F62]">
        <span>{label}</span>
        <InfoTip>{tip}</InfoTip>
      </div>
      <p className="text-[30px] font-bold text-[#202223] tabular-nums leading-tight mt-1">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <DeltaText value={delta} />
        <span className="text-[12px] text-[#8C8C8C]">vs previous</span>
      </div>
    </Panel>
  );
}

/* ── Delta text ─────────────────────────────────────────── */
function DeltaText({ value }: { value: number | null }) {
  if (value === null || value === undefined)
    return <span className="text-[12px] text-[#8C8C8C]">—</span>;
  const pct = (value * 100).toFixed(1);
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span
      className={cn(
        "text-[12px] font-medium tabular-nums",
        zero && "text-[#8C8C8C]",
        !zero && positive && "text-[#235935]",
        !zero && !positive && "text-[#FF0000]",
      )}
    >
      {positive && "+"}
      {pct}%
    </span>
  );
}

function formatDelta(d: number): string {
  if (d === 0) return "0.0%";
  const pct = Math.abs(d * 100).toFixed(1);
  return d > 0 ? `+${pct}%` : `−${pct}%`;
}

/* ── Revenue trend chart with per-touchpoint toggles ─── */
function RevenueTrendChart({
  data,
  selected,
}: {
  data: import("@/lib/sales-agent/types").AnalyticsData;
  selected: TouchpointId[];
}) {
  const [activeKeys, setActiveKeys] = useState<Set<TrendKey>>(
    () =>
      new Set<TrendKey>([
        "total",
        ...(TOUCHPOINTS.map((t) => t.id) as TrendKey[]),
      ]),
  );

  const shareByTp = useMemo(() => {
    const map = new Map<TouchpointId, number>();
    const total = data.byTouchpoint.reduce((s, r) => s + r.revenue, 0);
    data.byTouchpoint.forEach((r) => {
      map.set(r.touchpointId, total > 0 ? r.revenue / total : 0);
    });
    return map;
  }, [data.byTouchpoint]);

  const chartData = useMemo(() => {
    return data.daily.map((d) => {
      const row: Record<string, number | string> = {
        date: d.date.slice(5),
        total: d.revenue,
      };
      TOUCHPOINTS.forEach((t) => {
        const share = shareByTp.get(t.id) ?? 0;
        row[t.id] = Math.round(d.revenue * share);
      });
      return row;
    });
  }, [data.daily, shareByTp]);

  const toggleKey = (k: TrendKey) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      if (next.size === 0) next.add("total");
      return next;
    });
  };

  const visibleTps = TOUCHPOINTS.filter((t) => selected.includes(t.id));

  return (
    <>
      {/* Toggle chips integrated with chart — series color + name only */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <TrendToggle
          label="All"
          active={activeKeys.has("total")}
          color={TREND_COLORS.total}
          onClick={() => toggleKey("total")}
        />
        {visibleTps.map((t) => (
          <TrendToggle
            key={t.id}
            label={touchpointLabel(t.id)}
            active={activeKeys.has(t.id)}
            color={TREND_COLORS[t.id]}
            onClick={() => toggleKey(t.id)}
          />
        ))}
      </div>

      <div className="h-[260px] mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F0F0F0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E0E0E0" }}
              interval={Math.ceil(data.daily.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<TrendTooltip />} />
            {activeKeys.has("total") && (
              <Line
                type="monotone"
                dataKey="total"
                name="total"
                stroke={TREND_COLORS.total}
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3, fill: TREND_COLORS.total }}
              />
            )}
            {visibleTps.map((t) =>
              activeKeys.has(t.id) ? (
                <Line
                  key={t.id}
                  type="monotone"
                  dataKey={t.id}
                  name={t.id}
                  stroke={TREND_COLORS[t.id]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: TREND_COLORS[t.id] }}
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function trendKeyLabel(k: TrendKey): string {
  if (k === "total") return "All touchpoints";
  return touchpointLabel(k);
}

/* ── Custom tooltip: colored bullet + white label/value ──────── */
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-md px-2.5 py-1.5 text-[12px] text-white"
      style={{ background: "#202223" }}
    >
      {label && <div className="mb-1 text-white/70">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p) => {
          const key = (p.dataKey ?? p.name ?? "") as TrendKey;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-white">{trendKeyLabel(key)}</span>
              <span className="ml-1.5 tabular-nums text-white">
                {formatCurrency(p.value ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendToggle({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-1.5 bg-transparent text-[12px] transition-colors"
      aria-pressed={active}
      style={{ color: active ? color : "#8C8C8C" }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: active ? color : "#D9D9D9" }}
      />
      <span className="font-medium">{label}</span>
    </button>
  );
}

/* ── Empty chart ───────────────────────────────────────── */
function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-[12px] text-[#8C8C8C]">No data yet</p>
    </div>
  );
}

/* ── formatting helpers ────────────────────────────────── */
function formatCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
