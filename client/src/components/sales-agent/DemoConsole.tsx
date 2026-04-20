import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import type { DemoScenario, Platform } from "@/lib/sales-agent/types";

export default function DemoConsole() {
  const store = useSalesAgent();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="w-[260px] bg-white border border-neutral-300 rounded-md shadow-[0_10px_28px_-12px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-neutral-600" />
              <p className="text-[12px] font-medium text-neutral-900">
                Demo console
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-500 hover:text-neutral-900"
              aria-label="Minimize"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Scenario */}
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em] mb-1.5">
                Scenario
              </p>
              <div className="space-y-1">
                <RadioRow
                  label="Active — live data"
                  checked={store.scenario === "active"}
                  onSelect={() => store.setScenario("active")}
                />
                <RadioRow
                  label="Configured, no traffic"
                  checked={store.scenario === "configured_no_traffic"}
                  onSelect={() =>
                    store.setScenario("configured_no_traffic")
                  }
                />
                <RadioRow
                  label="Empty"
                  checked={store.scenario === "empty"}
                  onSelect={() => store.setScenario("empty")}
                />
              </div>
            </div>

            {/* Dependency */}
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em] mb-1.5">
                Dependency status
              </p>
              <div className="space-y-1">
                <RadioRow
                  label="All met"
                  checked={
                    store.dependency.searchBar && store.dependency.liveWidget
                  }
                  onSelect={() =>
                    store.setDependency({ searchBar: true, liveWidget: true })
                  }
                />
                <RadioRow
                  label="Search Bar unmet"
                  checked={
                    !store.dependency.searchBar && store.dependency.liveWidget
                  }
                  onSelect={() =>
                    store.setDependency({ searchBar: false, liveWidget: true })
                  }
                />
                <RadioRow
                  label="LiveWidget unmet"
                  checked={
                    store.dependency.searchBar && !store.dependency.liveWidget
                  }
                  onSelect={() =>
                    store.setDependency({ searchBar: true, liveWidget: false })
                  }
                />
              </div>
            </div>

            {/* Shopify Plus */}
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em] mb-1.5">
                Shopify Plus
              </p>
              <div className="space-y-1">
                <RadioRow
                  label="On Shopify Plus"
                  checked={store.dependency.shopifyPlus}
                  onSelect={() => store.setDependency({ shopifyPlus: true })}
                />
                <RadioRow
                  label="Not on Shopify Plus"
                  checked={!store.dependency.shopifyPlus}
                  onSelect={() => store.setDependency({ shopifyPlus: false })}
                />
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em] mb-1.5">
                Platform
              </p>
              <div className="inline-flex rounded-[4px] bg-neutral-100 p-0.5 w-full">
                {(
                  [
                    { v: "shopify", l: "Shopify" },
                    { v: "shopline", l: "Shopline" },
                  ] as { v: Platform; l: string }[]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    className={cn(
                      "flex-1 py-1 text-[12px] font-medium rounded-[3px]",
                      store.platform === opt.v
                        ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        : "text-neutral-600 hover:text-neutral-900",
                    )}
                    onClick={() => store.setPlatform(opt.v)}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 leading-snug pt-1 border-t border-neutral-100">
              Prototype-only controls. Changes are in-memory and apply immediately.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 h-8 bg-neutral-900 text-white rounded-full shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)] hover:bg-neutral-800 text-[12px] font-medium"
        >
          <Wrench className="w-3 h-3" />
          Demo
          <ChevronUp className="w-3 h-3 opacity-70" />
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 capitalize">
            {scenarioBadge(store.scenario)}
          </span>
        </button>
      )}
    </div>
  );
}

function scenarioBadge(s: DemoScenario) {
  if (s === "empty") return "empty";
  if (s === "configured_no_traffic") return "no traffic";
  return "active";
}

function RadioRow({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-[3px] cursor-pointer text-[12px]",
        checked ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-50",
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="h-3 w-3 accent-neutral-900"
      />
      {label}
    </label>
  );
}
