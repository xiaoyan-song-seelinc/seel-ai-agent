import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import {
  Callout,
  Drawer,
  Field,
  Modal,
  Panel,
  SAButton,
  SAInput,
  SASelect,
  Segmented,
} from "./primitives";
import type {
  BestSellersSortBy,
  ManualMode,
  Strategy,
  StrategyType,
  TimeWindowDays,
} from "@/lib/sales-agent/types";
import { useSalesAgent } from "@/lib/sales-agent/store";
import {
  SORT_BY_OPTIONS,
  touchpointLabel,
  TIME_WINDOW_OPTIONS,
} from "@/lib/sales-agent/constants";
import { ProductPicker, CollectionPicker } from "./Pickers";
import { PRODUCTS, COLLECTIONS } from "@/lib/sales-agent/store";

interface Props {
  open: boolean;
  onClose: () => void;
  /** strategyId for edit, null for create */
  editingId: string | null;
  /** When true, the drawer opens with the name field focused and its text
   *  pre-selected — used by Duplicate so the user can rename immediately. */
  autoEditName?: boolean;
}

type DraftCommon = {
  id: string;
  name: string;
  type: StrategyType;
  timeWindow: TimeWindowDays;
  sortBy: BestSellersSortBy;
  manualMode: ManualMode;
  productIds: string[];
  collectionId: string | null;
};

function emptyDraft(): DraftCommon {
  return {
    id: "",
    name: "New Strategy",
    type: "best_sellers",
    timeWindow: 30,
    sortBy: "revenue",
    manualMode: "products",
    productIds: [],
    collectionId: null,
  };
}

function draftFromStrategy(s: Strategy): DraftCommon {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    timeWindow: s.type === "best_sellers" || s.type === "new_arrivals" ? s.timeWindow : 30,
    sortBy: s.type === "best_sellers" ? s.sortBy : "revenue",
    manualMode: s.type === "manual" ? s.mode : "products",
    productIds: s.type === "manual" ? s.productIds : [],
    collectionId: s.type === "manual" ? s.collectionId : null,
  };
}

function draftToStrategy(d: DraftCommon, fallbackId: string): Strategy {
  const id = d.id || fallbackId;
  const updatedAt = new Date().toISOString();
  if (d.type === "best_sellers")
    return {
      id,
      name: d.name,
      type: "best_sellers",
      timeWindow: d.timeWindow,
      sortBy: d.sortBy,
      updatedAt,
    };
  if (d.type === "new_arrivals")
    return {
      id,
      name: d.name,
      type: "new_arrivals",
      timeWindow: d.timeWindow,
      updatedAt,
    };
  if (d.type === "similar")
    return {
      id,
      name: d.name,
      type: "similar",
      updatedAt,
    };
  return {
    id,
    name: d.name,
    type: "manual",
    mode: d.manualMode,
    productIds: d.manualMode === "products" ? d.productIds : [],
    collectionId: d.manualMode === "collection" ? d.collectionId : null,
    updatedAt,
  };
}

export default function StrategyDrawer({
  open,
  onClose,
  editingId,
  autoEditName = false,
}: Props) {
  const store = useSalesAgent();
  const existing = editingId
    ? store.strategies.find((s) => s.id === editingId) ?? null
    : null;

  const [draft, setDraft] = useState<DraftCommon>(() =>
    existing ? draftFromStrategy(existing) : emptyDraft(),
  );

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  // Inline name editing lives in the drawer heading.
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) setDraft(draftFromStrategy(existing));
    else setDraft(emptyDraft());
    setConfirmDeleteOpen(false);
    setConfirmSaveOpen(false);
    // For a fresh create or an explicit duplicate flow, open the name field
    // focused + selected so the user can retype immediately.
    setEditingName(!existing || autoEditName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, autoEditName]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName, open]);

  const referencedBy = useMemo(
    () => (editingId ? store.isStrategyReferenced(editingId) : []),
    [editingId, store],
  );
  const isReferenced = referencedBy.length > 0;

  /** True when the draft differs from the persisted strategy on any field
   *  other than `name`. Name-only edits skip the save confirmation. */
  const hasNonNameChanges = useMemo(() => {
    if (!existing) return false;
    if (existing.type !== draft.type) return true;
    if (existing.type === "best_sellers") {
      if (draft.timeWindow !== existing.timeWindow) return true;
      if (draft.sortBy !== existing.sortBy) return true;
    }
    if (existing.type === "new_arrivals") {
      if (draft.timeWindow !== existing.timeWindow) return true;
    }
    if (existing.type === "manual") {
      const wasModeA = existing.mode === "products";
      const isModeA = draft.type === "manual" && draft.manualMode === "products";
      if (wasModeA !== isModeA) return true;
      if (wasModeA && isModeA) {
        if (existing.productIds.length !== draft.productIds.length) return true;
        if (existing.productIds.some((id, i) => id !== draft.productIds[i]))
          return true;
      }
      if (!wasModeA && !isModeA) {
        if (existing.collectionId !== draft.collectionId) return true;
      }
    }
    return false;
  }, [existing, draft]);

  /** Destructive change = something that would wipe config or invalidate
   *  historical attribution semantics. */
  const isDestructive = useMemo(() => {
    if (!existing) return false;
    if (existing.type !== draft.type) return true;
    if (existing.type === "manual") {
      const wasModeA = existing.mode === "products";
      const isModeA = draft.type === "manual" && draft.manualMode === "products";
      if (wasModeA && !isModeA) return true;
      if (wasModeA && isModeA && existing.productIds.length > 0 && draft.productIds.length === 0) {
        return true;
      }
    }
    return false;
  }, [existing, draft]);

  const canSave = draft.name.trim().length > 0 && (
    draft.type !== "manual" ||
    (draft.manualMode === "products" && draft.productIds.length > 0) ||
    (draft.manualMode === "collection" && !!draft.collectionId)
  );

  const typeOptions: { value: StrategyType; label: string }[] = [
    { value: "best_sellers", label: "Best Sellers" },
    { value: "similar", label: "Similar" },
    { value: "new_arrivals", label: "New Arrivals" },
    { value: "manual", label: "Manual Pick" },
  ];

  const commitSave = () => {
    const s = draftToStrategy(
      draft,
      `s_${Math.random().toString(36).slice(2, 9)}`,
    );
    if (existing) store.updateStrategy(existing.id, s);
    else store.addStrategy(s);
    onClose();
  };

  /** Save click — show a confirmation only when an existing strategy
   *  has non-name changes AND is either live (referenced) or involves
   *  a destructive edit on an unreferenced baseline. */
  const save = () => {
    if (existing && hasNonNameChanges && (isReferenced || isDestructive)) {
      setConfirmSaveOpen(true);
      return;
    }
    commitSave();
  };

  const selectedProducts = useMemo(
    () =>
      draft.productIds
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p),
    [draft.productIds],
  );
  const selectedCollection = COLLECTIONS.find((c) => c.id === draft.collectionId);

  const reorderProducts = (from: number, to: number) => {
    setDraft((d) => {
      const next = d.productIds.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...d, productIds: next };
    });
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 min-w-0">
            {editingName ? (
              <SAInput
                ref={nameInputRef}
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                onBlur={() => {
                  if (draft.name.trim().length > 0) setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (draft.name.trim().length > 0) setEditingName(false);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    if (existing) {
                      setDraft((d) => ({ ...d, name: existing.name }));
                    }
                    setEditingName(false);
                  }
                }}
                placeholder="Strategy name"
                className="h-9 text-[18px] font-semibold"
              />
            ) : (
              <>
                <h2 className="text-[18px] font-semibold text-[#202223] truncate">
                  {draft.name || "Untitled strategy"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  aria-label="Edit name"
                  title="Edit name"
                  className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-[#5C5F62] hover:bg-[#F2F6FE] hover:text-[#2121C4]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        }
        width="w-[560px]"
        footer={
          <>
            {existing && (
              <SAButton
                variant="danger"
                onClick={() => setConfirmDeleteOpen(true)}
                className="mr-auto"
              >
                Delete
              </SAButton>
            )}
            <SAButton variant="ghost" onClick={onClose}>
              Cancel
            </SAButton>
            <SAButton variant="primary" onClick={save} disabled={!canSave}>
              {existing ? "Save" : "Create"}
            </SAButton>
          </>
        }
      >
        <div className="p-5 space-y-4">
          {existing && isReferenced && (
            <Callout tone="warn" title="In use">
              This strategy is currently used by:{" "}
              {referencedBy.map(touchpointLabel).join(", ")}. Changes apply
              immediately to these touchpoints.
            </Callout>
          )}

          <Field
            label="Type"
            help={
              isReferenced
                ? "Type is locked while this strategy is live. Duplicate to experiment."
                : undefined
            }
          >
            <Segmented
              value={draft.type}
              onChange={(v) => setDraft((d) => ({ ...d, type: v }))}
              options={typeOptions}
              disabled={isReferenced}
            />
          </Field>

          {/* Type-specific fields */}
          {draft.type === "best_sellers" && (
            <div className="space-y-3">
              <Field label="Time window">
                <SASelect
                  value={String(draft.timeWindow)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      timeWindow: Number(e.target.value) as TimeWindowDays,
                    }))
                  }
                  className="w-full"
                >
                  {TIME_WINDOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SASelect>
              </Field>
              <Field label="Sort by">
                <SASelect
                  value={draft.sortBy}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      sortBy: e.target.value as BestSellersSortBy,
                    }))
                  }
                  className="w-full"
                >
                  {SORT_BY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SASelect>
              </Field>
            </div>
          )}

          {draft.type === "new_arrivals" && (
            <Field label="Time window">
              <SASelect
                value={String(draft.timeWindow)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    timeWindow: Number(e.target.value) as TimeWindowDays,
                  }))
                }
                className="w-full"
              >
                {TIME_WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SASelect>
            </Field>
          )}

          {draft.type === "similar" && (
            <Callout tone="info">
              Reference product is the most expensive line item in the
              shopper's most recent order.
            </Callout>
          )}

          {draft.type === "manual" && (
            <div className="space-y-3">
              <Field label="Source">
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-[14px] text-[#202223] cursor-pointer">
                    <input
                      type="radio"
                      name="manual_mode"
                      className="mt-[3px] accent-[#2121C4]"
                      checked={draft.manualMode === "products"}
                      onChange={() =>
                        setDraft((d) => ({ ...d, manualMode: "products" }))
                      }
                    />
                    <span>
                      Pick specific products
                      <span className="text-[#6B7280]"> · up to 20</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-[14px] text-[#202223] cursor-pointer">
                    <input
                      type="radio"
                      name="manual_mode"
                      className="mt-[3px] accent-[#2121C4]"
                      checked={draft.manualMode === "collection"}
                      onChange={() =>
                        setDraft((d) => ({ ...d, manualMode: "collection" }))
                      }
                    />
                    <span>Use a collection</span>
                  </label>
                </div>
              </Field>

              {draft.manualMode === "products" ? (
                <Panel className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-medium text-[#202223]">
                      Products ({selectedProducts.length} / 20)
                    </p>
                    <SAButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setProductPickerOpen(true)}
                    >
                      {selectedProducts.length === 0 ? "Add products" : "Edit products"}
                    </SAButton>
                  </div>
                  {selectedProducts.length === 0 ? (
                    <p className="text-[12px] text-[#6B7280] py-3 text-center">
                      No products picked yet.
                    </p>
                  ) : (
                    <ReorderableProductList
                      products={selectedProducts}
                      onReorder={reorderProducts}
                    />
                  )}
                </Panel>
              ) : (
                <Panel className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-medium text-[#202223]">
                      Collection
                    </p>
                    <SAButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setCollectionPickerOpen(true)}
                    >
                      {selectedCollection ? "Change" : "Choose"}
                    </SAButton>
                  </div>
                  {selectedCollection ? (
                    <div className="text-[14px] text-[#202223]">
                      {selectedCollection.title}
                      <span className="text-[#6B7280] ml-1">
                        · {selectedCollection.productCount} products
                      </span>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#6B7280]">
                      No collection picked yet.
                    </p>
                  )}
                </Panel>
              )}
            </div>
          )}
        </div>
      </Drawer>

      {/* Save confirmation — referenced or destructive */}
      {existing && (
        <Modal
          open={confirmSaveOpen}
          onClose={() => setConfirmSaveOpen(false)}
          title="Save changes?"
          width="max-w-[460px]"
          footer={
            <>
              <SAButton
                variant="ghost"
                onClick={() => setConfirmSaveOpen(false)}
              >
                Cancel
              </SAButton>
              <SAButton
                variant="primary"
                onClick={() => {
                  setConfirmSaveOpen(false);
                  commitSave();
                }}
              >
                Save
              </SAButton>
            </>
          }
        >
          <div className="space-y-2">
            {isReferenced ? (
              <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
                Changes apply immediately. Historical attribution is preserved
                via snapshot.
              </p>
            ) : (
              isDestructive && (
                <p className="text-[12px] text-[#52525B] leading-relaxed">
                  To preserve the current strategy as a baseline, cancel and
                  use Duplicate &amp; edit instead.
                </p>
              )
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {existing && (
        <Modal
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title={isReferenced ? "Cannot delete strategy" : "Delete strategy"}
          width="max-w-[440px]"
          footer={
            isReferenced ? (
              <SAButton
                variant="primary"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                OK
              </SAButton>
            ) : (
              <>
                <SAButton
                  variant="ghost"
                  onClick={() => setConfirmDeleteOpen(false)}
                >
                  Cancel
                </SAButton>
                <SAButton
                  variant="danger"
                  onClick={() => {
                    store.removeStrategy(existing.id);
                    setConfirmDeleteOpen(false);
                    onClose();
                  }}
                >
                  Delete
                </SAButton>
              </>
            )
          }
        >
          {isReferenced ? (
            <div className="space-y-2">
              <p className="text-[14px] text-[#202223]">
                "{existing.name}" is used by:
              </p>
              <ul className="text-[14px] text-[#5C5F62] list-disc pl-5">
                {referencedBy.map((id) => (
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
              Delete "{existing.name}"? This cannot be undone.
            </p>
          )}
        </Modal>
      )}

      {/* Pickers */}
      <ProductPicker
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        initialSelected={draft.productIds}
        maxSelection={20}
        onConfirm={(ids) => {
          // Preserve existing order; append new selections at the end; drop removed.
          setDraft((d) => {
            const keep = d.productIds.filter((id) => ids.includes(id));
            const added = ids.filter((id) => !d.productIds.includes(id));
            return { ...d, productIds: [...keep, ...added] };
          });
          setProductPickerOpen(false);
        }}
      />
      <CollectionPicker
        open={collectionPickerOpen}
        onClose={() => setCollectionPickerOpen(false)}
        initialSelected={draft.collectionId ? [draft.collectionId] : []}
        multiple={false}
        title="Choose a collection"
        onConfirm={(ids) => {
          setDraft((d) => ({ ...d, collectionId: ids[0] ?? null }));
          setCollectionPickerOpen(false);
        }}
      />
    </>
  );
}

/* ── Drag handle icon (stroke, sidebar-aligned) ────────── */
function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

/* ── Reorderable product list (HTML5 drag) ──────────────── */
function ReorderableProductList({
  products,
  onReorder,
}: {
  products: { id: string; title: string; price: number; image: string }[];
  onReorder: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const hoverPos = useRef<"before" | "after">("before");
  const showHandle = products.length > 1;

  const onDragStart = (e: React.DragEvent, i: number) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox:
    e.dataTransfer.setData("text/plain", String(i));
  };

  const onDragOver = (e: React.DragEvent, i: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverPos.current = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
    setHoverIndex(i);
  };

  const onDrop = (e: React.DragEvent, i: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    let to = hoverPos.current === "after" ? i + 1 : i;
    if (dragIndex < to) to -= 1;
    if (to !== dragIndex) onReorder(dragIndex, to);
    setDragIndex(null);
    setHoverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setHoverIndex(null);
  };

  return (
    <div className="space-y-0">
      {products.map((p, i) => {
        const isDragging = dragIndex === i;
        const showBorderBefore =
          hoverIndex === i && hoverPos.current === "before" && dragIndex !== null;
        const showBorderAfter =
          hoverIndex === i && hoverPos.current === "after" && dragIndex !== null;
        return (
          <div
            key={p.id}
            draggable={showHandle}
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={(e) => onDrop(e, i)}
            onDragEnd={onDragEnd}
            className="relative"
          >
            {showBorderBefore && (
              <div
                className="absolute left-0 right-0 -top-[1px] h-[2px] bg-[#1A1A1A] pointer-events-none"
                aria-hidden="true"
              />
            )}
            <div
              className={`flex items-center gap-2 py-1 ${
                isDragging ? "opacity-50" : ""
              }`}
            >
              {showHandle && (
                <span
                  className="shrink-0 text-[#8C8C8C] cursor-grab active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <DragHandleIcon />
                </span>
              )}
              <div
                className="w-7 h-7 rounded border border-[#E0E0E0] shrink-0"
                style={{ backgroundColor: p.image }}
              />
              <span className="text-[14px] text-[#202223] truncate flex-1">
                {p.title}
              </span>
              <span className="text-[12px] text-[#6B7280] tabular-nums">
                ${p.price}
              </span>
            </div>
            {showBorderAfter && (
              <div
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#1A1A1A] pointer-events-none"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

