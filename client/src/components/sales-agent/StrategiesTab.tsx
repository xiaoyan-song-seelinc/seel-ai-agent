import { useMemo, useState } from "react";
import { Plus, Copy } from "lucide-react";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { InfoTip, Panel, SAButton } from "./primitives";
import ExclusionRules from "./ExclusionRules";
import StrategyDrawer from "./StrategyDrawer";
import {
  STRATEGY_TYPE_LABEL,
  touchpointLabel,
} from "@/lib/sales-agent/constants";
import type { Strategy } from "@/lib/sales-agent/types";

export default function StrategiesTab() {
  const store = useSalesAgent();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };
  const duplicate = (id: string) => {
    const src = store.strategies.find((s) => s.id === id);
    if (!src) return;
    const newId = `s_${Math.random().toString(36).slice(2, 9)}`;
    const copy: Strategy = {
      ...src,
      id: newId,
      name: `${src.name} (copy)`,
      updatedAt: new Date().toISOString(),
    };
    store.addStrategy(copy);
  };

  return (
    <div className="max-w-[1040px] mx-auto px-8 py-8 space-y-8">
      {/* Own Product Strategies */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[24px] font-bold text-[#202223]">
                Own Product Strategies
              </h2>
              <InfoTip>
                Recipes that source from your store's own catalog and are
                referenced by touchpoints.
              </InfoTip>
            </div>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Reusable recipes referenced by touchpoints.
            </p>
          </div>
          <SAButton variant="primary" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" />
            New strategy
          </SAButton>
        </div>

        <StrategyTable
          onEdit={openEdit}
          onDuplicate={duplicate}
        />

        {/* Exclusion rules scoped to Own Product Strategies */}
        <ExclusionRules embedded />
      </section>

      {/* Network Product Strategies — coming soon */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] font-bold text-[#202223]">
              Network Product Strategies
            </h2>
            <span className="inline-flex items-center h-5 px-1.5 rounded bg-[#E7EBF5] text-[#5C5F62] border border-[#DADEE9] text-[12px] font-medium">
              Coming soon
            </span>
            <InfoTip>
              Recommend products from the Seel network to capture demand your
              catalog doesn't serve.
            </InfoTip>
          </div>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Source recommendations from the Seel network inventory.
          </p>
        </div>

        <NetworkProductsPlaceholder />
      </section>

      <StrategyDrawer
        open={modalOpen}
        editingId={editingId}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

/* ── Network Products placeholder (future scope) ────────────── */
function NetworkProductsPlaceholder() {
  return (
    <Panel className="border-dashed bg-[#F9FAFB]">
      <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
        <p className="text-[16px] font-semibold text-[#202223]">
          Coming Soon
        </p>
        <p className="text-[14px] text-[#6B7280] mt-1 max-w-[420px]">
          Recommend products from the Seel network to capture demand your
          catalog doesn't serve. Stay tuned for an upcoming release.
        </p>
      </div>
    </Panel>
  );
}

/* ── Strategy table ─────────────────────────────────────── */
function StrategyTable({
  onEdit,
  onDuplicate,
}: {
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const store = useSalesAgent();

  const rows = useMemo(() => {
    return store.strategies.map((s) => {
      const refs = store.isStrategyReferenced(s.id);
      return { s, refs };
    });
  }, [store.strategies, store.touchpoints, store.thankYouWidgets]);

  if (rows.length === 0) {
    return (
      <Panel className="p-6 text-center">
        <p className="text-[14px] text-[#202223] font-semibold">
          No strategies yet
        </p>
        <p className="text-[12px] text-[#6B7280] mt-1">
          Create a strategy to power a touchpoint.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1.4fr)_120px_150px] items-center px-4 py-4 bg-[#F7F7FC] border-b border-[#F0F0F0] text-[14px] font-semibold text-[#202223]">
        <div>Name</div>
        <div>Type</div>
        <div>Used by</div>
        <div>Updated</div>
        <div className="text-right">Actions</div>
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        {rows.map(({ s, refs }) => (
          <StrategyRow
            key={s.id}
            strategy={s}
            refs={refs}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </Panel>
  );
}

function StrategyRow({
  strategy,
  refs,
  onEdit,
  onDuplicate,
}: {
  strategy: Strategy;
  refs: string[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1.4fr)_120px_150px] items-center px-4 py-4 text-[14px] text-[#202223] hover:bg-[#F5F5F5]">
      <div className="min-w-0">
        <p className="font-medium truncate">{strategy.name}</p>
        <p className="text-[12px] text-[#6B7280] truncate">
          {strategyDetail(strategy)}
        </p>
      </div>
      <div className="text-[#5C5F62]">
        {STRATEGY_TYPE_LABEL[strategy.type]}
      </div>
      <div className="min-w-0">
        {refs.length === 0 ? (
          <span className="text-[12px] text-[#8C8C8C]">Unused</span>
        ) : (
          <span className="text-[12px] text-[#5C5F62] truncate block">
            {refs.map((r) => touchpointLabel(r as never)).join(", ")}
          </span>
        )}
      </div>
      <div className="text-[12px] text-[#6B7280] tabular-nums">
        {formatDate(strategy.updatedAt)}
      </div>
      <div className="flex items-center justify-end gap-1">
        <SAButton
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(strategy.id)}
          title="Duplicate strategy"
        >
          <Copy className="w-3 h-3" />
          Duplicate
        </SAButton>
        <SAButton variant="ghost" size="sm" onClick={() => onEdit(strategy.id)}>
          Edit
        </SAButton>
      </div>
    </div>
  );
}

function strategyDetail(s: Strategy): string {
  if (s.type === "best_sellers") return `Top performers from last ${s.timeWindow}d`;
  if (s.type === "new_arrivals") return `New in last ${s.timeWindow}d`;
  if (s.type === "similar") return `Similar to shopper's latest purchase`;
  if (s.mode === "products") return `${s.productIds.length} hand-picked products`;
  return `Sourced from a collection`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}
