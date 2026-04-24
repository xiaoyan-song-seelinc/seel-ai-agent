import { useMemo, useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { TOUCHPOINTS, touchpointLabel } from "@/lib/sales-agent/constants";
import { METRIC_COPY } from "@/lib/sales-agent/metric-copy";
import type { TouchpointId } from "@/lib/sales-agent/types";
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

export default function AnalyticsTab() {
  const store = useSalesAgent();
  const [range, setRange] = useState<Range>({ preset: "30d" });
  const [selected, setSelected] = useState<TouchpointId[]>(
    TOUCHPOINTS.map((t) => t.id),
  );

  const data = store.analytics;
  const isEmpty = data.daily.length === 0;

  const filteredRows = useMemo(
    () =>
      data.rows
        .filter((r) => selected.includes(r.touchpointId))
        .slice()
        .sort((a, b) => b.revenue - a.revenue),
    [data.rows, selected],
  );

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[14px] text-[#5C5F62]">Time range</label>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <TouchpointFilter selected={selected} onChange={setSelected} />
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
            Daily attributed sales. Toggle series below the chart to compare touchpoints.
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
          <p className="text-[12px] text-[#6B7280] mt-1">
            Delta only on Attributed Sales. Cross-touchpoint comparison itself is the primary signal.
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_200px_130px_90px_100px_110px_130px] px-6 py-4 bg-[#F7F7FC] border-b border-[#F0F0F0] text-[14px] font-semibold text-[#202223]">
          <div>Touchpoint</div>
          <div className="flex items-center gap-1 justify-end">
            <span>Attributed Sales</span>
            <InfoTip>{METRIC_COPY.revenue.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Orders Influenced</span>
            <InfoTip>{METRIC_COPY.orders.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>CTR</span>
            <InfoTip>{METRIC_COPY.ctr.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>AOV</span>
            <InfoTip>{METRIC_COPY.aov.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Clicks</span>
            <InfoTip>{METRIC_COPY.clicks.definition}</InfoTip>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span>Impressions</span>
            <InfoTip>{METRIC_COPY.impressions.definition}</InfoTip>
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
                  className="grid grid-cols-[minmax(0,1.4fr)_200px_130px_90px_100px_110px_130px] items-center px-6 py-4 text-[14px] text-[#202223] hover:bg-[#F5F5F5]"
                >
                  <div className="truncate font-medium">
                    {touchpointLabel(r.touchpointId)}
                  </div>
                  <div className="text-right tabular-nums">
                    <span>{formatCurrency(r.revenue)}</span>
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
                  <div className="text-right tabular-nums">
                    {r.orders.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {formatPct(ctr)}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.orders > 0 ? formatCurrency(r.revenue / r.orders) : "—"}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.clicks.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.impressions.toLocaleString()}
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
  const [draft, setDraft] = useState<TouchpointId[]>(selected);
  const allIds = TOUCHPOINTS.map((t) => t.id);
  const label =
    selected.length === allIds.length
      ? "All touchpoints"
      : selected.length === 0
        ? "None"
        : `${selected.length} touchpoints`;

  const sameSelection = (a: TouchpointId[], b: TouchpointId[]) => {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((x) => set.has(x));
  };
  const dirty = !sameSelection(draft, selected);

  const openPopover = () => {
    setDraft(selected);
    setOpen(true);
  };
  const closePopover = () => setOpen(false);

  return (
    <div className="relative">
      <SAButton
        variant="secondary"
        size="md"
        onClick={() => (open ? closePopover() : openPopover())}
      >
        {label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </SAButton>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closePopover}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 left-0 w-[240px] bg-white border border-[#E0E0E0] rounded-lg shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-[12px] text-[#6B7280] hover:bg-[#F5F5F5]"
              onClick={() =>
                setDraft(draft.length === allIds.length ? [] : allIds)
              }
            >
              {draft.length === allIds.length ? "Clear All" : "Select All"}
            </button>
            <div className="border-t border-[#F0F0F0]" />
            {TOUCHPOINTS.map((t) => {
              const checked = draft.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#F5F5F5] text-[14px]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) setDraft(draft.filter((x) => x !== t.id));
                      else setDraft([...draft, t.id]);
                    }}
                    className="h-3.5 w-3.5 accent-[#2121C4]"
                  />
                  {t.label}
                </label>
              );
            })}
            <div className="border-t border-[#F0F0F0] mt-1" />
            <div className="flex items-center justify-end px-2 py-2">
              <SAButton
                variant="primary"
                size="sm"
                disabled={!dirty}
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Apply
              </SAButton>
            </div>
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
    const selectedSet = new Set(selected);
    return data.daily.map((d) => {
      const row: Record<string, number | string> = { date: d.date.slice(5) };
      let filteredTotal = 0;
      TOUCHPOINTS.forEach((t) => {
        const share = shareByTp.get(t.id) ?? 0;
        const value = Math.round(d.revenue * share);
        row[t.id] = value;
        if (selectedSet.has(t.id)) filteredTotal += value;
      });
      row.total = filteredTotal;
      return row;
    });
  }, [data.daily, shareByTp, selected]);

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
  const showTotal = visibleTps.length > 1;

  return (
    <>
      {/* Toggle chips integrated with chart — series color + name only */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        {showTotal && (
          <TrendToggle
            label="Total"
            active={activeKeys.has("total")}
            color={TREND_COLORS.total}
            onClick={() => toggleKey("total")}
          />
        )}
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
            {showTotal && activeKeys.has("total") && (
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
  if (k === "total") return "Total";
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
