import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import {
  STAGE_LABEL,
  TOUCHPOINTS,
  TOUCHPOINT_TAG_META,
  type TouchpointMeta,
} from "@/lib/sales-agent/constants";
import type { Stage, TouchpointId, TouchpointTag } from "@/lib/sales-agent/types";
import {
  Accordion,
  Callout,
  Drawer,
  Field,
  InfoTip,
  Panel,
  SAButton,
  SAInput,
  SASelect,
  SAToggle,
  StatusDot,
} from "./primitives";
import {
  ChevronRight,
  MessageSquare,
  Package,
  Search,
  Mail,
  Undo2,
  Check,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";

/* ── Small tag chip for touchpoint tags ─────────────────── */
function TouchpointTagChip({ tag }: { tag: TouchpointTag }) {
  const meta = TOUCHPOINT_TAG_META[tag];
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-1.5 rounded border text-[12px] font-medium leading-none",
        meta.className,
      )}
    >
      {tag === "seel_exclusive" && (
        <Sparkles className="w-3 h-3 mr-0.5" />
      )}
      {meta.label}
    </span>
  );
}

/* ── Shopify Plus required widget ───────────────────────── */
function ShopifyPlusWidget({ met }: { met: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        met
          ? "bg-[#E2F7DA]/40 border-[#CDE9C3]"
          : "bg-[#FFFBEB] border-[#F5E6C8] border-l-[3px] border-l-[#FBBF24]",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border",
          met
            ? "bg-white border-[#CDE9C3] text-[#235935]"
            : "bg-white border-[#F5E6C8] text-[#D97706]",
        )}
      >
        {met ? (
          <Check className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              "text-[14px] font-semibold",
              met ? "text-[#235935]" : "text-[#202223]",
            )}
          >
            Required: Shopify Plus
          </p>
          <span
            className={cn(
              "inline-flex items-center h-5 px-1.5 rounded text-[12px] font-medium border",
              met
                ? "bg-white text-[#235935] border-[#CDE9C3]"
                : "bg-white text-[#D97706] border-[#F5E6C8]",
            )}
          >
            {met ? "Met" : "Not met"}
          </span>
        </div>
        <p
          className={cn(
            "text-[12px] mt-0.5",
            met ? "text-[#235935]/80" : "text-[#6B7280]",
          )}
        >
          {met
            ? "Your store is on Shopify Plus, so this touchpoint is available."
            : "This touchpoint relies on Shopify Plus-only customizations. Upgrade to Shopify Plus to enable it."}
        </p>
      </div>
    </div>
  );
}

/* ── Icon per touchpoint ───────────────────────────────── */
const TOUCHPOINT_ICON: Record<TouchpointId, typeof Search> = {
  search_bar: Search,
  live_widget: MessageSquare,
  thank_you_page: Package,
  seel_rc: Undo2,
  wfp_email: Mail,
};

export default function TouchpointsTab() {
  const store = useSalesAgent();
  const visible = useMemo(
    () =>
      TOUCHPOINTS.filter((t) => store.platform === "shopify" || !t.shopifyOnly),
    [store.platform],
  );
  const [selectedId, setSelectedId] = useState<TouchpointId>(
    visible[0]?.id ?? "seel_rc",
  );

  const selected = visible.find((t) => t.id === selectedId) ?? visible[0];

  const grouped = useMemo(() => {
    const g: Record<Stage, TouchpointMeta[]> = {
      pre_purchase: [],
      live_chat: [],
      post_purchase: [],
    };
    visible.forEach((t) => g[t.stage].push(t));
    return g;
  }, [visible]);

  return (
    <div className="flex h-full min-h-0">
      {/* Left column: touchpoint cards */}
      <div className="w-[340px] shrink-0 border-r border-[#E0E0E0] bg-[#F9FAFB] overflow-auto">
        <div className="px-5 py-6 space-y-6">
          {(Object.keys(grouped) as Stage[]).map((stage) => {
            if (grouped[stage].length === 0) return null;
            return (
              <div key={stage}>
                <p className="text-[12px] font-semibold text-[#8C8C8C] uppercase tracking-[0.08em] mb-2 px-0.5">
                  {STAGE_LABEL[stage]}
                </p>
                <div className="space-y-2">
                  {grouped[stage].map((t) => (
                    <TouchpointCard
                      key={t.id}
                      meta={t}
                      active={selected?.id === t.id}
                      onClick={() => setSelectedId(t.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column: detail with two accordions */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-[760px] px-8 py-8">
          {selected && <TouchpointDetail meta={selected} />}
        </div>
      </div>
    </div>
  );
}

/* ── Touchpoint card ──────────────────────────────────── */
function TouchpointCard({
  meta,
  active,
  onClick,
}: {
  meta: TouchpointMeta;
  active: boolean;
  onClick: () => void;
}) {
  const store = useSalesAgent();
  const tp = store.touchpoints.find((t) => t.id === meta.id);
  const depMet =
    !meta.dependencyKey || store.dependency[meta.dependencyKey] === true;
  const strategy = store.strategies.find((s) => s.id === tp?.strategyId);
  const Icon = TOUCHPOINT_ICON[meta.id];

  let statusKind: "on" | "off" | "warn" = "off";
  let statusLabel = "Off";
  if (!depMet && meta.dependencyKey) {
    statusKind = "warn";
    statusLabel = "Dependency unmet";
  } else if (tp?.enabled) {
    statusKind = "on";
    statusLabel = "On";
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-white border rounded-[10px] p-4 transition-all",
        active
          ? "border-[#2121C4] ring-2 ring-[rgba(33,33,196,0.1)]"
          : "border-[#E0E0E0] hover:border-[#D9D9D9] hover:bg-[#F9FAFB]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            active
              ? "bg-[#ECE9FF] text-[#2121C4]"
              : "bg-[#F7F7FC] text-[#5C5F62]",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <p className="text-[14px] font-semibold text-[#202223] truncate">
              {meta.label}
            </p>
            {meta.previewOnly && (
              <span className="text-[12px] text-[#5C5F62] bg-[#E7EBF5] border border-[#DADEE9] px-1.5 py-[1px] rounded shrink-0">
                preview
              </span>
            )}
          </div>
          {(meta.tags?.length || meta.requiresShopifyPlus) && (
            <div className="flex items-center gap-1 flex-wrap mb-1.5">
              {meta.tags?.map((tag) => (
                <TouchpointTagChip key={tag} tag={tag} />
              ))}
              {meta.requiresShopifyPlus && (
                <span className="inline-flex items-center h-5 px-1.5 rounded border text-[12px] font-medium leading-none bg-[#F7F7FC] text-[#5C5F62] border-[#DADEE9]">
                  Shopify Plus
                </span>
              )}
            </div>
          )}
          <p className="text-[12px] text-[#6B7280] leading-snug line-clamp-2">
            {meta.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[12px]">
            <StatusDot kind={statusKind} />
            <span
              className={cn(
                statusKind === "on" && "text-[#235935]",
                statusKind === "warn" && "text-[#D97706]",
                statusKind === "off" && "text-[#6B7280]",
              )}
            >
              {statusLabel}
            </span>
            {strategy && (
              <>
                <span className="text-[#D9D9D9]">·</span>
                <span className="text-[#6B7280] truncate">
                  {strategy.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Detail container with two accordions ────────────── */
function TouchpointDetail({ meta }: { meta: TouchpointMeta }) {
  const store = useSalesAgent();
  const Icon = TOUCHPOINT_ICON[meta.id];
  if (meta.id === "thank_you_page") return <ThankYouPageDetail />;
  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3 pb-1">
        <div className="w-10 h-10 rounded-lg bg-[#ECE9FF] flex items-center justify-center shrink-0 text-[#2121C4]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] text-[#8C8C8C] uppercase tracking-[0.08em]">
            {STAGE_LABEL[meta.stage]}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[24px] font-bold text-[#202223] leading-tight">
              {meta.label}
            </h2>
            {meta.tags?.map((tag) => (
              <TouchpointTagChip key={tag} tag={tag} />
            ))}
          </div>
          <p className="text-[14px] text-[#6B7280] mt-1">
            {meta.description}
          </p>
        </div>
      </header>

      {meta.requiresShopifyPlus && (
        <ShopifyPlusWidget met={store.dependency.shopifyPlus} />
      )}

      <Accordion title="Setting" defaultOpen={true}>
        <div className="px-5 py-5">
          {meta.dependencyKey ? (
            <DependencySetting meta={meta} />
          ) : (
            <StrategySetting meta={meta} />
          )}
        </div>
      </Accordion>

      <Accordion title="Statistics" defaultOpen={true}>
        <TouchpointStats touchpointId={meta.id} />
      </Accordion>
    </div>
  );
}

/* ── Setting: Search Bar / LiveChat Widget ───────────── */
function DependencySetting({ meta }: { meta: TouchpointMeta }) {
  const store = useSalesAgent();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;
  const depMet = store.dependency[meta.dependencyKey!];

  return (
    <div className="space-y-4">
      {!depMet && (
        <Callout tone="warn" title="Dependency not met">
          <p>
            {meta.id === "search_bar"
              ? "AI Search is not enabled for this store. Enable Search Bar in Support Agent before turning on this touchpoint."
              : "LiveChat Widget is not connected to the storefront. Enable it from Support Agent before turning on this touchpoint."}
          </p>
          <div className="mt-2">
            <Link href="/">
              <SAButton variant="secondary" size="sm">
                Go to Support Agent
              </SAButton>
            </Link>
          </div>
        </Callout>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-medium text-[#202223]">Enabled</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Show Sales Agent recommendations on {meta.label}.
          </p>
        </div>
        <SAToggle
          checked={tp.enabled}
          disabled={!depMet}
          onChange={(v) => store.updateTouchpoint(meta.id, { enabled: v })}
        />
      </div>

      <div className="text-[12px] text-[#6B7280] bg-[#F9FAFB] border border-[#E0E0E0] rounded-lg px-3 py-2.5">
        Recommendations on {meta.label} are driven by the shopper's real-time
        query or conversation, so no explicit strategy is selected.
      </div>
    </div>
  );
}

/* ── Setting: Seel RC / WFP Email ──────────────────────── */
function StrategySetting({ meta }: { meta: TouchpointMeta }) {
  const store = useSalesAgent();
  const [, navigate] = useLocation();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-medium text-[#202223]">Enabled</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Serve recommendations at this touchpoint.
          </p>
        </div>
        <SAToggle
          checked={tp.enabled}
          onChange={(v) => store.updateTouchpoint(meta.id, { enabled: v })}
        />
      </div>

      <div className="border-t border-[#F0F0F0] pt-4">
        <Field
          label="Strategy"
          help="This strategy is shared with other touchpoints using it."
        >
          <div className="flex items-center gap-2">
            <SASelect
              value={tp.strategyId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__new__") {
                  navigate("/sales-agent/strategies");
                  return;
                }
                store.updateTouchpoint(meta.id, { strategyId: v || null });
              }}
              className="flex-1"
            >
              <option value="">— None selected —</option>
              {store.strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value="__new__">+ Create new strategy…</option>
            </SASelect>
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ── Statistics (per-touchpoint) ───────────────────────── */
function TouchpointStats({ touchpointId }: { touchpointId: TouchpointId }) {
  const store = useSalesAgent();
  const row = store.analytics.rows.find((r) => r.touchpointId === touchpointId);
  const isEmpty = !row || row.impressions === 0;

  if (isEmpty) {
    return (
      <div className="px-5 py-8 text-center text-[14px] text-[#6B7280]">
        No traffic in the last 30 days.
      </div>
    );
  }

  const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;

  const cells: {
    label: string;
    value: string;
    tip: string;
    sub?: string;
  }[] = [
    {
      label: "Impressions",
      value: row.impressions.toLocaleString(),
      tip: "Times recommendations were shown at this touchpoint.",
    },
    {
      label: "CTR",
      value: `${(ctr * 100).toFixed(1)}%`,
      tip: "Clicks divided by impressions.",
    },
    {
      label: "Orders",
      value: row.orders.toLocaleString(),
      tip: "Orders attributed to this touchpoint within the 7-day window.",
    },
    {
      label: "Revenue",
      value: `$${row.revenue.toLocaleString()}`,
      tip: "Attributed revenue from recommended products (Own products only).",
      sub: formatDeltaInline(row.delta),
    },
  ];

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="flex items-center gap-1 text-[12px] text-[#6B7280]">
              <span className="uppercase tracking-[0.06em] font-medium">
                {c.label}
              </span>
              <InfoTip>{c.tip}</InfoTip>
            </div>
            <p className="text-[24px] font-bold text-[#202223] tabular-nums leading-tight mt-1">
              {c.value}
            </p>
            {c.sub && (
              <p className="text-[12px] mt-0.5 tabular-nums">
                <span
                  className={cn(
                    c.sub.startsWith("+") && "text-[#235935]",
                    c.sub.startsWith("−") && "text-[#FF0000]",
                  )}
                >
                  {c.sub}
                </span>
                <span className="text-[#8C8C8C] ml-1">vs previous</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#8C8C8C] pt-3 border-t border-[#F0F0F0]">
        Last 30 days · attribution window 7 days.
      </p>
    </div>
  );
}

function formatDeltaInline(d: number): string {
  if (d === 0) return "0.0%";
  const pct = Math.abs(d * 100).toFixed(1);
  return d > 0 ? `+${pct}%` : `−${pct}%`;
}

/* ── Thank You Page detail (V2 preview) ────────────────── */
function ThankYouPageDetail() {
  const store = useSalesAgent();
  const meta = TOUCHPOINTS.find((t) => t.id === "thank_you_page")!;
  const [drawerWidgetId, setDrawerWidgetId] = useState<string | null>(null);
  const widget = store.thankYouWidgets.find((w) => w.id === drawerWidgetId);

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3 pb-1">
        <div className="w-10 h-10 rounded-lg bg-[#F7F7FC] border border-[#E0E0E0] flex items-center justify-center shrink-0 text-[#5C5F62]">
          <Package className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] text-[#8C8C8C] uppercase tracking-[0.08em]">
            Post-purchase
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[24px] font-bold text-[#202223] leading-tight">
              Thank You Page
            </h2>
            {meta.tags?.map((tag) => (
              <TouchpointTagChip key={tag} tag={tag} />
            ))}
          </div>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Order confirmation recommendations.
          </p>
        </div>
      </header>

      {meta.requiresShopifyPlus && (
        <ShopifyPlusWidget met={store.dependency.shopifyPlus} />
      )}

      <Callout tone="info" title="Preview — not in this release">
        The Thank You Page composer ships in V2. Widgets below are read-only
        previews of the upcoming capability set.
      </Callout>

      <Accordion title="Setting" defaultOpen={true}>
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-[#202223]">
              Widgets ({store.thankYouWidgets.length})
            </p>
            <SAButton variant="secondary" size="sm" disabled>
              Add widget
            </SAButton>
          </div>

          <div className="border border-[#E0E0E0] rounded-lg divide-y divide-[#F0F0F0]">
            {store.thankYouWidgets.map((w) => {
              const strategy = store.strategies.find(
                (s) => s.id === w.strategyId,
              );
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <StatusDot kind={w.enabled ? "on" : "off"} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#202223] truncate">
                        {w.name}
                      </p>
                      <p className="text-[12px] text-[#6B7280] truncate">
                        {strategy?.name ?? "No strategy"} · {w.productCount}{" "}
                        products · CTA "{w.ctaLabel}"
                      </p>
                    </div>
                  </div>
                  <SAButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrawerWidgetId(w.id)}
                  >
                    Edit
                    <ChevronRight className="w-3 h-3 ml-0.5 opacity-60" />
                  </SAButton>
                </div>
              );
            })}
          </div>
        </div>
      </Accordion>

      <Accordion title="Statistics" defaultOpen={true}>
        <TouchpointStats touchpointId="thank_you_page" />
      </Accordion>

      <ThankYouWidgetDrawer
        open={!!widget}
        widgetId={drawerWidgetId}
        onClose={() => setDrawerWidgetId(null)}
      />
    </div>
  );
}

/* ── Thank You widget drawer ────────────────────────────── */
function ThankYouWidgetDrawer({
  open,
  widgetId,
  onClose,
}: {
  open: boolean;
  widgetId: string | null;
  onClose: () => void;
}) {
  const store = useSalesAgent();
  const [v2Open, setV2Open] = useState(false);
  const widget = store.thankYouWidgets.find((w) => w.id === widgetId);
  if (!widget && !open) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Thank You Page widget"
      footer={
        <>
          <SAButton variant="ghost" onClick={onClose}>
            Close
          </SAButton>
          <span title="Thank You Page editing ships in V2">
            <SAButton variant="primary" disabled>
              Save
            </SAButton>
          </span>
        </>
      }
    >
      {widget && (
        <div className="p-5 space-y-4">
          <Callout tone="info">
            This drawer is a V2 preview. Fields are editable locally, but Save
            is disabled for this release.
          </Callout>

          <Field label="Widget name" htmlFor="ty_name">
            <SAInput
              id="ty_name"
              value={widget.name}
              onChange={(e) =>
                store.updateThankYouWidget(widget.id, { name: e.target.value })
              }
            />
          </Field>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-[#202223]">Enabled</p>
              <p className="text-[12px] text-[#6B7280]">
                Toggle this widget on the Thank You Page.
              </p>
            </div>
            <SAToggle
              checked={widget.enabled}
              onChange={(v) =>
                store.updateThankYouWidget(widget.id, { enabled: v })
              }
            />
          </div>

          <Field label="Strategy" htmlFor="ty_strategy">
            <SASelect
              id="ty_strategy"
              value={widget.strategyId}
              onChange={(e) =>
                store.updateThankYouWidget(widget.id, {
                  strategyId: e.target.value,
                })
              }
            >
              {store.strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SASelect>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" htmlFor="ty_title">
              <SAInput
                id="ty_title"
                value={widget.title}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    title: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Subtitle" htmlFor="ty_sub">
              <SAInput
                id="ty_sub"
                value={widget.subtitle}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    subtitle: e.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Product count" htmlFor="ty_count">
              <SAInput
                id="ty_count"
                type="number"
                min={1}
                max={10}
                value={widget.productCount}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    productCount: Number(e.target.value) || 1,
                  })
                }
              />
            </Field>
            <Field label="CTA label" htmlFor="ty_cta">
              <SAInput
                id="ty_cta"
                value={widget.ctaLabel}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    ctaLabel: e.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="border border-[#E0E0E0] rounded-lg">
            <button
              type="button"
              onClick={() => setV2Open((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            >
              <span className="text-[14px] font-medium text-[#202223]">
                V2 capabilities
              </span>
              <span className="text-[12px] text-[#6B7280]">
                {v2Open ? "Hide" : "Show"}
              </span>
            </button>
            {v2Open && (
              <div className="border-t border-[#F0F0F0] divide-y divide-[#F0F0F0]">
                {[
                  { k: "Layout", v: "Grid (default)" },
                  { k: "Countdown", v: "Not configured" },
                  { k: "Discount", v: "None" },
                  { k: "Customer Segment", v: "All customers" },
                  { k: "A/B experiment", v: "Not configured" },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between px-4 py-2.5 opacity-60"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-[#5C5F62]">
                        {row.k}
                      </p>
                      <p className="text-[12px] text-[#8C8C8C]">{row.v}</p>
                    </div>
                    <SAToggle checked={false} disabled onChange={() => {}} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
