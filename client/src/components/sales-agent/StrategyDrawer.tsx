import { useEffect, useMemo, useState } from "react";
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
  ManualMode,
  Strategy,
  StrategyType,
  TimeWindowDays,
} from "@/lib/sales-agent/types";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { touchpointLabel, TIME_WINDOW_OPTIONS } from "@/lib/sales-agent/constants";
import { ProductPicker, CollectionPicker } from "./Pickers";
import { PRODUCTS, COLLECTIONS } from "@/lib/sales-agent/store";

interface Props {
  open: boolean;
  onClose: () => void;
  /** strategyId for edit, null for create */
  editingId: string | null;
}

type DraftCommon = {
  id: string;
  name: string;
  type: StrategyType;
  maxProducts: number;
  timeWindow: TimeWindowDays;
  manualMode: ManualMode;
  productIds: string[];
  collectionId: string | null;
};

function emptyDraft(): DraftCommon {
  return {
    id: "",
    name: "",
    type: "best_sellers",
    maxProducts: 5,
    timeWindow: 30,
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
    maxProducts: s.maxProducts,
    timeWindow: s.type === "best_sellers" || s.type === "new_arrivals" ? s.timeWindow : 30,
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
      maxProducts: d.maxProducts,
      updatedAt,
    };
  if (d.type === "new_arrivals")
    return {
      id,
      name: d.name,
      type: "new_arrivals",
      timeWindow: d.timeWindow,
      maxProducts: d.maxProducts,
      updatedAt,
    };
  if (d.type === "similar")
    return {
      id,
      name: d.name,
      type: "similar",
      maxProducts: d.maxProducts,
      updatedAt,
    };
  return {
    id,
    name: d.name,
    type: "manual",
    mode: d.manualMode,
    productIds: d.manualMode === "products" ? d.productIds : [],
    collectionId: d.manualMode === "collection" ? d.collectionId : null,
    maxProducts: d.maxProducts,
    updatedAt,
  };
}

export default function StrategyDrawer({ open, onClose, editingId }: Props) {
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

  useEffect(() => {
    if (!open) return;
    if (existing) setDraft(draftFromStrategy(existing));
    else setDraft(emptyDraft());
    setConfirmDeleteOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const referencedBy = useMemo(
    () => (editingId ? store.isStrategyReferenced(editingId) : []),
    [editingId, store],
  );
  const isReferenced = referencedBy.length > 0;

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

  const save = () => {
    const s = draftToStrategy(
      draft,
      `s_${Math.random().toString(36).slice(2, 9)}`,
    );
    if (existing) store.updateStrategy(existing.id, s);
    else store.addStrategy(s);
    onClose();
  };

  const selectedProducts = PRODUCTS.filter((p) =>
    draft.productIds.includes(p.id),
  );
  const selectedCollection = COLLECTIONS.find((c) => c.id === draft.collectionId);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={existing ? "Edit strategy" : "New strategy"}
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

          <Field label="Name" htmlFor="strat_name">
            <SAInput
              id="strat_name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Top Sellers — 30 days"
            />
          </Field>

          <Field label="Type">
            <Segmented
              value={draft.type}
              onChange={(v) => setDraft((d) => ({ ...d, type: v }))}
              options={typeOptions}
            />
          </Field>

          {/* Type-specific fields */}
          {draft.type === "best_sellers" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time window">
                <SASelect
                  value={String(draft.timeWindow)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      timeWindow: Number(e.target.value) as TimeWindowDays,
                    }))
                  }
                >
                  {TIME_WINDOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SASelect>
              </Field>
              <MaxProductsField draft={draft} setDraft={setDraft} />
            </div>
          )}

          {draft.type === "new_arrivals" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time window">
                <SASelect
                  value={String(draft.timeWindow)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      timeWindow: Number(e.target.value) as TimeWindowDays,
                    }))
                  }
                >
                  {TIME_WINDOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SASelect>
              </Field>
              <MaxProductsField draft={draft} setDraft={setDraft} />
            </div>
          )}

          {draft.type === "similar" && (
            <>
              <MaxProductsField draft={draft} setDraft={setDraft} />
              <Callout tone="info">
                Reference product is the most expensive line item in the
                shopper's most recent order.
              </Callout>
            </>
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
                    <div className="space-y-1">
                      {selectedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 py-1"
                        >
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
                      ))}
                    </div>
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

              <MaxProductsField draft={draft} setDraft={setDraft} />
            </div>
          )}
        </div>
      </Drawer>

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
          setDraft((d) => ({ ...d, productIds: ids }));
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

function MaxProductsField({
  draft,
  setDraft,
}: {
  draft: DraftCommon;
  setDraft: (f: (d: DraftCommon) => DraftCommon) => void;
}) {
  return (
    <Field label="Max products shown" help="Between 1 and 10.">
      <SAInput
        type="number"
        min={1}
        max={10}
        value={draft.maxProducts}
        onChange={(e) =>
          setDraft((d) => ({
            ...d,
            maxProducts: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
          }))
        }
        className="w-28"
      />
    </Field>
  );
}
