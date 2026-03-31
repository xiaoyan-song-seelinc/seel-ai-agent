import { cn } from "@/lib/utils";
import { BarChart3, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface KPI {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

interface DailyDigestCardProps {
  digest: {
    date: string;
    kpis: KPI[];
    actionItemCount: number;
  };
}

export function DailyDigestCard({ digest }: DailyDigestCardProps) {
  const [, navigate] = useLocation();

  return (
    <div className="flex gap-2.5">
      {/* TL avatar */}
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-white">TL</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Sender row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-foreground">Team Lead</span>
          <span className="text-[9px] text-muted-foreground/50">just now</span>
        </div>

        {/* Card bubble */}
        <div className="rounded-xl rounded-tl-sm border border-border bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-border/40 bg-gradient-to-r from-slate-50 to-indigo-50/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[13px] font-bold text-foreground">
                📊 Daily digest — {digest.date}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="px-4 py-3 space-y-1.5">
            {digest.kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between">
                <span className="text-[13px] text-foreground">{kpi.label}:</span>
                <span className="text-[13px] font-medium text-foreground">
                  {kpi.value}{" "}
                  <span
                    className={cn(
                      "text-[12px] font-normal",
                      kpi.positive ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    ({kpi.delta})
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Action items */}
          {digest.actionItemCount > 0 && (
            <div className="px-4 py-2 border-t border-border/30">
              <p className="text-[13px] text-foreground">
                <span className="font-semibold">{digest.actionItemCount} items</span>{" "}
                below need your review.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="px-4 py-2.5 border-t border-border/30">
            <button
              onClick={() => navigate("/performance")}
              className="text-[12px] text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              View dashboard
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
