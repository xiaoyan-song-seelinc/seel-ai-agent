import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { COLLECTIONS, PRODUCTS } from "@/lib/sales-agent/store";
import {
  Callout,
  Chip,
  InfoTip,
  Panel,
  SAButton,
  SAInput,
  Segmented,
} from "./primitives";
import { ProductPicker, CollectionPicker } from "./Pickers";

interface Props {
  /** Render as embedded sub-group (inside Own Product Strategies) */
  embedded?: boolean;
}

export default function ExclusionRules({ embedded = false }: Props) {
  const store = useSalesAgent();

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);

  return (
    <div className={cn(embedded && "mt-6")}>
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="text-[14px] font-semibold text-[#202223]">
          Exclusion rules
        </h3>
        <InfoTip>
          Applied globally to every Own Product strategy output — these
          products, collections, or tags never surface in recommendations.
        </InfoTip>
      </div>
      <Panel className="overflow-hidden">
        <div className="divide-y divide-[#F0F0F0]">
          <ExcludedProducts onOpen={() => setProductPickerOpen(true)} />
          <ExcludedCollections onOpen={() => setCollectionPickerOpen(true)} />
          <ExcludedTags />
          <OutOfStockBehavior />
        </div>
      </Panel>

      <ProductPicker
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        initialSelected={store.exclusion.productIds}
        title="Exclude products"
        onConfirm={(ids) => {
          store.updateExclusion({ productIds: ids });
          setProductPickerOpen(false);
        }}
      />
      <CollectionPicker
        open={collectionPickerOpen}
        onClose={() => setCollectionPickerOpen(false)}
        initialSelected={store.exclusion.collectionIds}
        title="Exclude collections"
        onConfirm={(ids) => {
          store.updateExclusion({ collectionIds: ids });
          setCollectionPickerOpen(false);
        }}
      />
    </div>
  );
}

/* ── Excluded products row ─────────────────────────────── */
function ExcludedProducts({ onOpen }: { onOpen: () => void }) {
  const store = useSalesAgent();
  const items = store.exclusion.productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <RuleRow
      title="Excluded products"
      tip="Never surface these, regardless of strategy."
      action={
        <SAButton variant="secondary" size="sm" onClick={onOpen}>
          <Plus className="w-3 h-3" />
          Add product
        </SAButton>
      }
    >
      {items.length === 0 ? (
        <p className="text-[12px] text-[#6B7280]">No excluded products.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(
            (p) =>
              p && (
                <Chip
                  key={p.id}
                  onRemove={() =>
                    store.updateExclusion({
                      productIds: store.exclusion.productIds.filter(
                        (id) => id !== p.id,
                      ),
                    })
                  }
                >
                  {p.title}
                </Chip>
              ),
          )}
        </div>
      )}
    </RuleRow>
  );
}

/* ── Excluded collections row ──────────────────────────── */
function ExcludedCollections({ onOpen }: { onOpen: () => void }) {
  const store = useSalesAgent();
  const items = store.exclusion.collectionIds
    .map((id) => COLLECTIONS.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <RuleRow
      title="Excluded collections"
      tip="Exclude everything in these collections."
      action={
        <SAButton variant="secondary" size="sm" onClick={onOpen}>
          <Plus className="w-3 h-3" />
          Add collection
        </SAButton>
      }
    >
      {items.length === 0 ? (
        <p className="text-[12px] text-[#6B7280]">No excluded collections.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(
            (c) =>
              c && (
                <Chip
                  key={c.id}
                  onRemove={() =>
                    store.updateExclusion({
                      collectionIds: store.exclusion.collectionIds.filter(
                        (id) => id !== c.id,
                      ),
                    })
                  }
                >
                  {c.title}
                </Chip>
              ),
          )}
        </div>
      )}
    </RuleRow>
  );
}

/* ── Excluded tags row (inline input) ─────────────────── */
function ExcludedTags() {
  const store = useSalesAgent();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  const submit = () => {
    const t = val.trim();
    if (!t) {
      setEditing(false);
      setVal("");
      return;
    }
    const exists = store.exclusion.tags.some(
      (x) => x.toLowerCase() === t.toLowerCase(),
    );
    if (!exists) {
      store.updateExclusion({ tags: [...store.exclusion.tags, t] });
    }
    setVal("");
    setEditing(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setVal("");
      setEditing(false);
    }
  };

  return (
    <RuleRow
      title="Excluded tags"
      tip="Case-insensitive exact match. Press Enter to add, Esc to cancel."
      action={
        !editing && (
          <SAButton
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Plus className="w-3 h-3" />
            Add tag
          </SAButton>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {store.exclusion.tags.length === 0 && !editing && (
          <p className="text-[12px] text-[#6B7280]">No excluded tags.</p>
        )}
        {store.exclusion.tags.map((t) => (
          <Chip
            key={t}
            onRemove={() =>
              store.updateExclusion({
                tags: store.exclusion.tags.filter((x) => x !== t),
              })
            }
          >
            {t}
          </Chip>
        ))}
        {editing && (
          <SAInput
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKey}
            onBlur={submit}
            autoFocus
            placeholder="e.g. giftcard"
            className="h-7 w-40"
          />
        )}
      </div>
    </RuleRow>
  );
}

/* ── OOS behavior row ──────────────────────────────────── */
function OutOfStockBehavior() {
  const store = useSalesAgent();
  const v = store.exclusion.outOfStockBehavior;
  return (
    <RuleRow
      title="Out-of-stock products"
      tip="Whether OOS products may appear in recommendations."
      action={
        <Segmented
          value={v}
          onChange={(val) =>
            store.updateExclusion({ outOfStockBehavior: val })
          }
          options={[
            { value: "hidden", label: "Hidden" },
            { value: "shown", label: "Shown" },
          ]}
          size="sm"
        />
      }
    >
      {v === "shown" && (
        <Callout tone="warn">
          OOS products will be surfaced. Customers may see items they can't buy.
        </Callout>
      )}
    </RuleRow>
  );
}

/* ── Row container ─────────────────────────────────────── */
function RuleRow({
  title,
  tip,
  action,
  children,
}: {
  title: string;
  tip: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-4 py-3")}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0 flex items-center gap-1">
          <p className="text-[14px] font-medium text-[#202223]">{title}</p>
          <InfoTip>{tip}</InfoTip>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </div>
  );
}
