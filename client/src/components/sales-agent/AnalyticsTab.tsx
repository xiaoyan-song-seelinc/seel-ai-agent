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
  total: "#2121C4",
  seel_rc: "#0EA5E9",
  wfp_email: "#645AFF",
  search_bar: "#10B981",
  live_widget: "#F59E0B",
  thank_you_page: "#EF4444",
};

type Range = "7d" | "30d" | "90d";

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
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[14px] text-[#5C5F62]">Time range</label>
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
          <SAButton variant="secondary" size="md" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </SAButton>
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

      {/* Chart: Revenue Trend with per-touchpoint toggles */}
      <Panel className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[18px] font-semibold text-[#202223]">
                Revenue trend
              </p>
              <InfoTip>
                Attributed revenue by day, over the selected window. Toggle
                touchpoints to compare their contribution on the same axis.
              </InfoTip>
            </div>
            <p className="text-[14px] text-[#6B7280] mt-1">
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
        <div className="px-5 py-4 border-b border-[#F0F0F0]">
          <p className="text-[18px] font-semibold text-[#202223]">
            Touchpoint × Widget × Strategy
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_110px_90px_90px_150px] px-5 py-4 bg-[#F7F7FC] border-b border-[#F0F0F0] text-[14px] font-semibold text-[#202223]">
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
          <div className="py-10 text-center text-[14px] text-[#6B7280]">
            No data yet
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {filteredRows.map((r) => {
              const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
              const strategy = store.strategies.find(
                (s) => s.id === r.strategyId,
              );
              return (
                <div
                  key={`${r.touchpointId}-${r.widget}`}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_110px_90px_90px_150px] items-center px-5 py-4 text-[14px] text-[#202223] hover:bg-[#F5F5F5]"
                >
                  <div className="truncate font-medium">
                    {touchpointLabel(r.touchpointId)}
                  </div>
                  <div className="truncate text-[#6B7280] font-mono text-[12px]">
                    {r.widget}
                  </div>
                  <div className="truncate text-[#5C5F62]">
                    {strategy?.name ?? (
                      <span className="text-[#8C8C8C]">—</span>
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
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
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
              className="w-full text-left px-3 py-2 text-[12px] text-[#5C5F62] hover:bg-[#F7F7FC]"
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
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F7F7FC] text-[14px] text-[#202223]"
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
    <Panel className="px-6 py-5">
      <div className="flex items-center gap-1 text-[14px] text-[#5C5F62] font-medium">
        <span>{label}</span>
        <InfoTip>{tip}</InfoTip>
      </div>
      <p className="text-[30px] font-bold text-[#202223] tabular-nums leading-tight mt-2">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
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
    () => new Set<TrendKey>(["total"]),
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

  const visibleTps = TOUCHPOINTS.filter((t) => selected.includes(t.id));

  return (
    <>
      {/* Toggle chips */}
      <div className="flex items-center gap-1.5 flex-wrap mt-4">
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
            <Tooltip
              contentStyle={{
                background: "#202223",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 12,
                padding: "6px 8px",
              }}
              labelStyle={{ color: "#D9D9D9" }}
              formatter={(v: number, name: string) => [
                formatCurrency(v),
                trendKeyLabel(name as TrendKey),
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={24}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "#5C5F62" }}
              formatter={(v) => trendKeyLabel(v as TrendKey)}
            />
            {activeKeys.has("total") && (
              <Line
                type="monotone"
                dataKey="total"
                name="total"
                stroke={TREND_COLORS.total}
                strokeWidth={2}
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
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[12px] transition-colors",
        active
          ? "bg-white border-[#2121C4] text-[#202223]"
          : "bg-[#F9FAFB] border-[#E0E0E0] text-[#6B7280] hover:text-[#202223]",
      )}
      aria-pressed={active}
    >
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{
          backgroundColor: active ? color : "#D9D9D9",
        }}
      />
      <span className="font-medium">{label}</span>
      <span className="text-[#8C8C8C] tabular-nums">{value}</span>
    </button>
  );
}

/* ── Empty chart ───────────────────────────────────────── */
function EmptyChart() {
  return (
    <div className="h-[180px] flex items-center justify-center">
      <p className="text-[14px] text-[#8C8C8C]">No data yet</p>
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
