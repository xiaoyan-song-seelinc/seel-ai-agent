/* ── Sales Agent Page ──────────────────────────────────────
   Seel design system: #2121C4 primary, page bg #F9FAFB,
   H1 30px/bold, 14px tabs with 2px #2121C4 underline.
   ──────────────────────────────────────────────────────── */

import { useLocation, useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import TouchpointsTab from "@/components/sales-agent/TouchpointsTab";
import StrategiesTab from "@/components/sales-agent/StrategiesTab";
import AnalyticsTab from "@/components/sales-agent/AnalyticsTab";
import DemoConsole from "@/components/sales-agent/DemoConsole";

type TabKey = "touchpoints" | "strategies" | "analytics";

const TABS: { key: TabKey; label: string }[] = [
  { key: "touchpoints", label: "Touchpoints" },
  { key: "strategies", label: "Strategies" },
  { key: "analytics", label: "Analytics" },
];

export default function SalesAgentPage() {
  const [, params] = useRoute<{ tab?: string }>("/sales-agent/:tab");
  const [location] = useLocation();

  const activeTab: TabKey = (() => {
    const t = params?.tab;
    if (t === "strategies" || t === "analytics" || t === "touchpoints") return t;
    return "touchpoints";
  })();

  void location;

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* Module header */}
      <div className="shrink-0 bg-white border-b border-[#E0E0E0]">
        <div className="px-8 pt-6">
          <h1 className="text-[30px] font-bold text-[#202223] leading-9">
            Sales Agent
          </h1>
          <div className="flex items-center gap-8 mt-5 -mb-px">
            {TABS.map((t) => {
              const href =
                t.key === "touchpoints" ? "/sales-agent" : `/sales-agent/${t.key}`;
              const active = activeTab === t.key;
              return (
                <Link key={t.key} href={href}>
                  <button
                    className={cn(
                      "pb-3 text-[14px] font-medium transition-colors border-b-2 -mb-px",
                      active
                        ? "text-[#2121C4] border-[#2121C4]"
                        : "text-[#8C8C8C] hover:text-[#202223] border-transparent",
                    )}
                  >
                    {t.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "touchpoints" && <TouchpointsTab />}
        {activeTab === "strategies" && <StrategiesTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>

      {/* Demo console */}
      <DemoConsole />
    </div>
  );
}
