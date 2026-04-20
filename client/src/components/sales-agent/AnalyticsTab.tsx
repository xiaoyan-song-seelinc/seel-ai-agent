import { useMemo, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { TOUCHPOINTS, touchpointLabel } from "@/lib/sales-agent/constants";
import type { TouchpointId } from "@/lib/sales-agent/types";
import { InfoTip, Panel, SAButton, SASelect } from "./primitives";

type TrendKey = "total" | TouchpointId;

const TREND_COLORS: Record<TrendKey, string> = {
  total: "var(--primary)",
  seel_rc: "#0ea5e9",
  wfp_email: "#8b5cf6",
  search_bar: "#10b981",
  live_widget: "#f59e0b",
  thank_you_page: "#ef4444",
};

type Range = "7d" | "30d" | "90d";

/* ── Metric copy (used both in KPI and table header tooltips) ── */
const METRIC_COPY: Record<
  "revenue" | "orders" | "ctr" | "aov" | "impressions",
  { label: string; definition: string }
> = {
  revenue: {
    label: "Attributed Revenue",
    definition:
      "Revenue from orders containing a product surfaced by Sales Agent (Own products only). Sum over the selected window.",
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
};

export default function AnalyticsTab() {
  const store = useSalesAgent();
  const [range, setRange] = useState<Range>("30d");
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
    a.download = `sales-agent-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-[12px] text-neutral-500">Time range</label>
          <SASelect
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </SASelect>
        </div>
        <TouchpointFilter selected={selected} onChange={setSelected} />
        <div className="ml-auto">
          <SAButton variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="w-3 h-3" />
            Export CSV
          </SAButton>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
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

      {/* Chart: Revenue Trend with per-touchpoint toggles */}
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold text-neutral-900">
                Revenue trend
              </p>
              <InfoTip>
                Attributed revenue by day, over the selected window. Toggle
                touchpoints to compare their contribution on the same axis.
              </InfoTip>
            </div>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Combined Revenue Trend and Revenue by Touchpoint in one view.
            </p>
          </div>
        </div>
        {isEmpty ? (
          <div className="h-[260px] mt-3">
            <EmptyChart />
          </div>
        ) : (
          <RevenueTrendChart
            data={data}
            selected={selected}
          />
        )}
      </Panel>

      {/* Detail table */}
      <Panel className="overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <p className="text-[14px] font-semibold text-neutral-900">
            Touchpoint × Widget × Strategy
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_110px_90px_90px_150px] px-5 py-2.5 bg-neutral-50 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.06em]">
          <div>Touchpoint</div>
          <div>Widget</div>
          <div>Strategy</div>
          <div className="flex items-center gap-1 justify-end">
            <span>Impr.</span>
            <InfoTip>{METRIC_COPY.impressions.definition}</InfoTip>
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
            <span>Revenue</span>
            <InfoTip>
              {METRIC_COPY.revenue.definition} Parenthesis shows change vs the
              previous equal-length window.
            </InfoTip>
          </div>
        </div>
        {filteredRows.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-neutral-500">
            No data yet
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredRows.map((r) => {
              const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
              const strategy = store.strategies.find(
                (s) => s.id === r.strategyId,
              );
              return (
                <div
                  key={`${r.touchpointId}-${r.widget}`}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_110px_90px_90px_150px] items-center px-5 py-3 text-[13px] text-neutral-900 hover:bg-neutral-50"
                >
                  <div className="truncate font-medium">
                    {touchpointLabel(r.touchpointId)}
                  </div>
                  <div className="truncate text-neutral-500 font-mono text-[12px]">
                    {r.widget}
                  </div>
                  <div className="truncate text-neutral-700">
                    {strategy?.name ?? (
                      <span className="text-neutral-400">—</span>
                    )}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.impressions.toLocaleString()}
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
                        "ml-1.5 text-[11px]",
                        r.delta > 0 && "text-emerald-700",
                        r.delta < 0 && "text-red-700",
                        r.delta === 0 && "text-neutral-400",
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
          <div className="absolute z-20 mt-1 left-0 w-[240px] bg-white border border-neutral-200 rounded-md shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-600 hover:bg-neutral-50"
              onClick={() =>
                onChange(selected.length === allIds.length ? [] : allIds)
              }
            >
              {selected.length === allIds.length ? "Clear all" : "Select all"}
            </button>
            <div className="border-t border-neutral-100" />
            {TOUCHPOINTS.map((t) => {
              const checked = selected.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-neutral-50 text-[13px]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(selected.filter((x) => x !== t.id));
                      else onChange([...selected, t.id]);
                    }}
                    className="h-3.5 w-3.5 accent-[var(--primary)]"
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
    <Panel className="px-4 py-4">
      <div className="flex items-center gap-1 text-[12px] text-neutral-500">
        <span>{label}</span>
        <InfoTip>{tip}</InfoTip>
      </div>
      <p className="text-[24px] font-semibold text-neutral-900 tabular-nums leading-tight mt-1">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <DeltaText value={delta} />
        <span className="text-[11px] text-neutral-400">vs previous</span>
      </div>
    </Panel>
  );
}

/* ── Delta text ─────────────────────────────────────────── */
function DeltaText({ value }: { value: number | null }) {
  if (value === null || value === undefined)
    return <span className="text-[12px] text-neutral-400">—</span>;
  const pct = (value * 100).toFixed(1);
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span
      className={cn(
        "text-[12px] font-medium tabular-nums",
        zero && "text-neutral-400",
        !zero && positive && "text-emerald-700",
        !zero && !positive && "text-red-700",
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
    () => new Set<TrendKey>(["total"]),
  );

  // Per-touchpoint share of total revenue → scales daily series proportionally.
  const shareByTp = useMemo(() => {
    const map = new Map<TouchpointId, number>();
    const total = data.byTouchpoint.reduce((s, r) => s + r.revenue, 0);
    data.byTouchpoint.forEach((r) => {
      map.set(r.touchpointId, total > 0 ? r.revenue / total : 0);
    });
    return map;
  }, [data.byTouchpoint]);

  // Daily rows keyed by touchpoint + total, for multi-line chart.
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

  // Revenue totals per touchpoint for the toggle chips.
  const totalsByTp = useMemo(() => {
    const map = new Map<TouchpointId, number>();
    data.byTouchpoint.forEach((r) => map.set(r.touchpointId, r.revenue));
    return map;
  }, [data.byTouchpoint]);

  const toggleKey = (k: TrendKey) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      if (next.size === 0) next.add("total");
      return next;
    });
  };

  // Visible touchpoints filtered by the top-level selector.
  const visibleTps = TOUCHPOINTS.filter((t) => selected.includes(t.id));

  return (
    <>
      {/* Toggle chips */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <TrendChip
          label="All touchpoints"
          active={activeKeys.has("total")}
          color={TREND_COLORS.total}
          value={formatCurrency(data.revenue)}
          onClick={() => toggleKey("total")}
        />
        {visibleTps.map((t) => {
          const active = activeKeys.has(t.id);
          const revenue = totalsByTp.get(t.id) ?? 0;
          return (
            <TrendChip
              key={t.id}
              label={touchpointLabel(t.id)}
              active={active}
              color={TREND_COLORS[t.id]}
              value={formatCurrency(revenue)}
              onClick={() => toggleKey(t.id)}
            />
          );
        })}
      </div>

      <div className="h-[280px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e5e5"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#737373" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
              interval={Math.ceil(data.daily.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#737373" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 12,
                padding: "6px 8px",
              }}
              labelStyle={{ color: "#a3a3a3" }}
              formatter={(v: number, name: string) => [
                formatCurrency(v),
                trendKeyLabel(name as TrendKey),
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={24}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#525252" }}
              formatter={(v) => trendKeyLabel(v as TrendKey)}
            />
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

function TrendChip({
  label,
  active,
  color,
  value,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] transition-colors",
        active
          ? "bg-white border-neutral-300 text-neutral-900"
          : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-neutral-800",
      )}
      aria-pressed={active}
    >
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{
          backgroundColor: active ? color : "#d4d4d4",
        }}
      />
      <span className="font-medium">{label}</span>
      <span className="text-neutral-400 tabular-nums">{value}</span>
    </button>
  );
}

/* ── Empty chart ───────────────────────────────────────── */
function EmptyChart() {
  return (
    <div className="h-[180px] flex items-center justify-center">
      <p className="text-[12px] text-neutral-400">No data yet</p>
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
