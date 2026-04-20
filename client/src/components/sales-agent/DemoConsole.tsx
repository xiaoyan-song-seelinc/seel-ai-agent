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
        <div className="w-[260px] bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_10px_28px_-12px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA] bg-[#F9FAFB] rounded-t-[10px]">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#5C5F62]" />
              <p className="text-[14px] font-medium text-[#202223]">
                Demo console
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#8C8C8C] hover:text-[#202223]"
              aria-label="Minimize"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Scenario */}
            <div>
              <p className="text-[12px] font-semibold text-[#8C8C8C] uppercase tracking-[0.06em] mb-1.5">
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
              <p className="text-[12px] font-semibold text-[#8C8C8C] uppercase tracking-[0.06em] mb-1.5">
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
              <p className="text-[12px] font-semibold text-[#8C8C8C] uppercase tracking-[0.06em] mb-1.5">
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
              <p className="text-[12px] font-semibold text-[#8C8C8C] uppercase tracking-[0.06em] mb-1.5">
                Platform
              </p>
              <div className="inline-flex rounded-md bg-[#F7F7FC] border border-[#EAEAEA] p-0.5 w-full">
                {(
                  [
                    { v: "shopify", l: "Shopify" },
                    { v: "shopline", l: "Shopline" },
                  ] as { v: Platform; l: string }[]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    className={cn(
                      "flex-1 py-1 text-[12px] font-medium rounded",
                      store.platform === opt.v
                        ? "bg-white text-[#2121C4] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        : "text-[#5C5F62] hover:text-[#202223]",
                    )}
                    onClick={() => store.setPlatform(opt.v)}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#8C8C8C] leading-snug pt-2 border-t border-[#F0F0F0]">
              Prototype-only controls. Changes are in-memory and apply immediately.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 h-10 bg-[#645AFF] text-white rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-[#5A3AD9] text-[14px] font-medium"
        >
          <Wrench className="w-3.5 h-3.5" />
          Demo
          <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          <span className="ml-1 text-[12px] px-2 py-0.5 rounded-full bg-white/15 capitalize">
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
        "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-[14px]",
        checked ? "bg-[#ECE9FF] text-[#2121C4]" : "text-[#5C5F62] hover:bg-[#F7F7FC]",
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="h-3 w-3 accent-[#2121C4]"
      />
      {label}
    </label>
  );
}
