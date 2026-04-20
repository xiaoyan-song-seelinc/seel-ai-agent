import { useMemo, useState } from "react";
import { Modal, SAButton, SAInput } from "./primitives";
import { cn } from "@/lib/utils";
import { COLLECTIONS, PRODUCTS } from "@/lib/sales-agent/store";
import type { Product } from "@/lib/sales-agent/types";

/* ── Product picker ─────────────────────────────────────── */
interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  initialSelected: string[];
  onConfirm: (ids: string[]) => void;
  maxSelection?: number;
  title?: string;
}

export function ProductPicker({
  open,
  onClose,
  initialSelected,
  onConfirm,
  maxSelection,
  title = "Select products",
}: ProductPickerProps) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // reset when opened
  useMemo(() => {
    if (open) setSelected(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return PRODUCTS;
    return PRODUCTS.filter(
      (p) => p.title.toLowerCase().includes(s) || p.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }, [q]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (maxSelection && prev.length >= maxSelection) return prev;
      return [...prev, id];
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-[640px]"
      footer={
        <>
          <span className="text-[12px] text-[#6B7280] mr-auto">
            {selected.length} selected
            {maxSelection ? ` / ${maxSelection} max` : ""}
          </span>
          <SAButton variant="ghost" onClick={onClose}>
            Cancel
          </SAButton>
          <SAButton variant="primary" onClick={() => onConfirm(selected)}>
            Add {selected.length > 0 ? `(${selected.length})` : ""}
          </SAButton>
        </>
      }
    >
      <div className="space-y-3">
        <SAInput
          placeholder="Search products by name or tag"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="border border-[#E0E0E0] rounded-md max-h-[360px] overflow-auto divide-y divide-[#F0F0F0]">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-[12px] text-[#6B7280]">
              No products match "{q}"
            </div>
          )}
          {filtered.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              checked={selected.includes(p.id)}
              onToggle={() => toggle(p.id)}
              disabled={
                !!maxSelection &&
                !selected.includes(p.id) &&
                selected.length >= maxSelection
              }
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ProductRow({
  product,
  checked,
  onToggle,
  disabled,
}: {
  product: Product;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F7F7FC]",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="h-3.5 w-3.5 accent-[#2121C4]"
      />
      <div
        className="w-9 h-9 rounded-md border border-[#E0E0E0] shrink-0"
        style={{ backgroundColor: product.image }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-[#202223] truncate">{product.title}</p>
        <p className="text-[12px] text-[#6B7280] tabular-nums">
          ${product.price} · {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
        </p>
      </div>
    </label>
  );
}

/* ── Collection picker ──────────────────────────────────── */
interface CollectionPickerProps {
  open: boolean;
  onClose: () => void;
  initialSelected: string[];
  onConfirm: (ids: string[]) => void;
  multiple?: boolean;
  title?: string;
}

export function CollectionPicker({
  open,
  onClose,
  initialSelected,
  onConfirm,
  multiple = true,
  title = "Select collections",
}: CollectionPickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useMemo(() => {
    if (open) setSelected(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) => {
    if (!multiple) {
      setSelected([id]);
      return;
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-[520px]"
      footer={
        <>
          <span className="text-[12px] text-[#6B7280] mr-auto">
            {selected.length} selected
          </span>
          <SAButton variant="ghost" onClick={onClose}>
            Cancel
          </SAButton>
          <SAButton
            variant="primary"
            onClick={() => onConfirm(selected)}
            disabled={selected.length === 0}
          >
            {multiple ? "Add" : "Select"}
          </SAButton>
        </>
      }
    >
      <div className="border border-[#E0E0E0] rounded-md max-h-[360px] overflow-auto divide-y divide-[#F0F0F0]">
        {COLLECTIONS.map((c) => {
          const checked = selected.includes(c.id);
          return (
            <label
              key={c.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F7F7FC]"
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                checked={checked}
                onChange={() => toggle(c.id)}
                className="h-3.5 w-3.5 accent-[#2121C4]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#202223]">{c.title}</p>
                <p className="text-[12px] text-[#6B7280] tabular-nums">
                  {c.productCount} products
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
