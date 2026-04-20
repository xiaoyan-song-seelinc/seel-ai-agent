import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { Chip, InfoTip, Modal, Panel, SAButton, Segmented } from "./primitives";
import ExclusionRules from "./ExclusionRules";
import StrategyDrawer from "./StrategyDrawer";
import {
  STRATEGY_TYPE_LABEL,
  touchpointLabel,
} from "@/lib/sales-agent/constants";
import type { Strategy } from "@/lib/sales-agent/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type UsedByFilter = "all" | "used" | "unused";

export default function StrategiesTab() {
  const store = useSalesAgent();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      name: `${src.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    store.addStrategy(copy);
    // Jump straight to Edit panel for the newly created copy.
    setEditingId(newId);
    setModalOpen(true);
  };

  const deletingStrategy = deletingId
    ? store.strategies.find((s) => s.id === deletingId) ?? null
    : null;
  const deletingRefs = deletingId ? store.isStrategyReferenced(deletingId) : [];

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
          onDelete={setDeletingId}
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

      <Modal
        open={!!deletingStrategy}
        onClose={() => setDeletingId(null)}
        title={
          deletingRefs.length > 0 ? "Cannot delete strategy" : "Delete strategy"
        }
        width="max-w-[440px]"
        footer={
          deletingRefs.length > 0 ? (
            <SAButton variant="primary" onClick={() => setDeletingId(null)}>
              OK
            </SAButton>
          ) : (
            <>
              <SAButton variant="ghost" onClick={() => setDeletingId(null)}>
                Cancel
              </SAButton>
              <SAButton
                variant="danger"
                onClick={() => {
                  if (deletingId) store.removeStrategy(deletingId);
                  setDeletingId(null);
                }}
              >
                Delete
              </SAButton>
            </>
          )
        }
      >
        {deletingStrategy &&
          (deletingRefs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[14px] text-[#202223]">
                "{deletingStrategy.name}" is used by:
              </p>
              <ul className="text-[14px] text-[#5C5F62] list-disc pl-5">
                {deletingRefs.map((id) => (
                  <li key={id}>{touchpointLabel(id)}</li>
                ))}
              </ul>
              <p className="text-[12px] text-[#6B7280] mt-2">
                Detach from these touchpoints, or pick a replacement strategy,
                before deleting.
              </p>
            </div>
          ) : (
            <p className="text-[14px] text-[#202223]">
              Delete "{deletingStrategy.name}"? This cannot be undone.
            </p>
          ))}
      </Modal>
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
  onDelete,
}: {
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const store = useSalesAgent();
  const [filter, setFilter] = useState<UsedByFilter>("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return store.strategies.map((s) => {
      const refs = store.isStrategyReferenced(s.id);
      return { s, refs };
    });
  }, [store.strategies, store.touchpoints, store.thankYouWidgets]);

  const filtered = useMemo(() => {
    if (filter === "used") return rows.filter((r) => r.refs.length > 0);
    if (filter === "unused") return rows.filter((r) => r.refs.length === 0);
    return rows;
  }, [rows, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const showPagination = filtered.length > PAGE_SIZE;

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Segmented<UsedByFilter>
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "used", label: "In use" },
            { value: "unused", label: "Unused" },
          ]}
          size="sm"
        />
        <p className="text-[12px] text-[#8C8C8C]">
          {filtered.length} {filtered.length === 1 ? "strategy" : "strategies"}
        </p>
      </div>

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.6fr)_120px_minmax(0,1.8fr)_110px_96px] items-center px-4 py-3 bg-[#F7F7FC] border-b border-[#F0F0F0] text-[13px] font-semibold text-[#202223]">
          <div>Name</div>
          <div>Type</div>
          <div>Used by</div>
          <div>Updated</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-[#F0F0F0]">
          {pagedRows.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#6B7280]">
              No strategies match this filter.
            </div>
          ) : (
            pagedRows.map(({ s, refs }) => (
              <StrategyRow
                key={s.id}
                strategy={s}
                refs={refs}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </Panel>

      {showPagination && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[12px] text-[#8C8C8C]">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#E4E4E0] text-[#5C5F62] hover:text-[#1A1A1A] hover:border-[#D9D9D9] disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#E4E4E0] text-[#5C5F62] hover:text-[#1A1A1A] hover:border-[#D9D9D9] disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function StrategyRow({
  strategy,
  refs,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  strategy: Strategy;
  refs: string[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_120px_minmax(0,1.8fr)_110px_96px] items-center px-4 py-3 text-[13px] text-[#202223] hover:bg-[#F5F5F5]">
      <div className="min-w-0 pr-3">
        <p className="font-medium truncate text-[13px]">{strategy.name}</p>
      </div>
      <div className="text-[#5C5F62] text-[13px]">
        {STRATEGY_TYPE_LABEL[strategy.type]}
      </div>
      <div className="min-w-0 pr-3">
        {refs.length === 0 ? (
          <span className="text-[12px] text-[#8C8C8C]">Unused</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {refs.map((r) => (
              <Chip key={r}>{touchpointLabel(r as never)}</Chip>
            ))}
          </div>
        )}
      </div>
      <div className="text-[12px] text-[#6B7280] tabular-nums">
        {formatDate(strategy.updatedAt)}
      </div>
      <div className="flex items-center justify-end gap-0.5">
        <IconButton
          label="Edit strategy"
          onClick={() => onEdit(strategy.id)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          label="Duplicate strategy"
          onClick={() => onDuplicate(strategy.id)}
        >
          <Copy className="w-3.5 h-3.5" />
        </IconButton>
        <div className="relative">
          <IconButton
            label="More actions"
            onClick={() => setMenuOpen((v) => !v)}
            active={menuOpen}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </IconButton>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute z-20 right-0 mt-1 w-[160px] bg-white border border-[#E4E4E0] rounded-md shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(strategy.id);
                  }}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  danger
                >
                  Delete
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center rounded-md text-[#5C5F62] hover:bg-[#F2F6FE] hover:text-[#1A1A1A]",
        active && "bg-[#F2F6FE] text-[#1A1A1A]",
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({
  onClick,
  icon,
  children,
  danger = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[#F5F5F5]",
        danger ? "text-[#B22222]" : "text-[#1A1A1A]",
      )}
    >
      <span className={danger ? "text-[#B22222]" : "text-[#8C8C8C]"}>
        {icon}
      </span>
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}
