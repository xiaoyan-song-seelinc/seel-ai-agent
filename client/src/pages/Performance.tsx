/* ── Performance Page ─────────────────────────────────────────
   KPI cards + trend charts + intent breakdown + actionable items
   ──────────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  PERFORMANCE_SUMMARY,
  DAILY_METRICS,
  INTENT_METRICS,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";


type TimeRange = "7d" | "14d" | "30d";

const METRIC_ICONS: Record<string, typeof BarChart3> = {
  "Auto-Resolution Rate": Target,
  "CSAT Score": Users,
  "Escalation Rate": AlertTriangle,
  "First Response Time": Clock,
};

export default function Performance() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const daysMap: Record<TimeRange, number> = { "7d": 7, "14d": 14, "30d": 30 };
  const visibleMetrics = DAILY_METRICS.slice(-daysMap[timeRange]);

  const chartData = visibleMetrics.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Auto-Resolution": Math.round(d.autoResolutionRate),
    CSAT: Number(d.csat.toFixed(1)),
    Escalation: Math.round(d.escalationRate),
    "Response Time": Math.round(d.responseTime),
    Volume: d.volume,
  }));

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1020px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground">Performance</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              How Alex is performing across all customer interactions.
            </p>
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {(["7d", "14d", "30d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                  timeRange === range ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {PERFORMANCE_SUMMARY.map((metric) => {
            const Icon = METRIC_ICONS[metric.label] || BarChart3;
            const isPositive =
              metric.label === "Escalation Rate" || metric.label === "First Response Time"
                ? metric.trend < 0
                : metric.trend > 0;
            return (
              <Card key={metric.label} className="overflow-hidden">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-xl font-semibold text-foreground">
                      {metric.value}
                      <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] font-medium mb-1",
                        isPositive ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(metric.trend)}
                      {metric.unit === "%" || metric.unit === "/5" ? "" : metric.unit}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{metric.trendLabel}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Auto-Resolution & Escalation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Resolution & Escalation Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorResolution" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.48 0.09 195)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.48 0.09 195)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEscalation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.16 30)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.55 0.16 30)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 80)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} unit="%" />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.90 0.005 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Area type="monotone" dataKey="Auto-Resolution" stroke="oklch(0.48 0.09 195)" fill="url(#colorResolution)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Escalation" stroke="oklch(0.55 0.16 30)" fill="url(#colorEscalation)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CSAT Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">CSAT Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCSAT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.72 0.12 80)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.72 0.12 80)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 80)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[3, 5]} tick={{ fontSize: 10, fill: "oklch(0.52 0.015 80)" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.90 0.005 80)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Area type="monotone" dataKey="CSAT" stroke="oklch(0.72 0.12 80)" fill="url(#colorCSAT)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intent Breakdown */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Performance by Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intent</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Resolution</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CSAT</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Turns</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Escalation</th>
                  </tr>
                </thead>
                <tbody>
                  {INTENT_METRICS.map((intent) => (
                    <tr key={intent.intent} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">{intent.intent}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{intent.volume}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.resolutionRate >= 75 ? "text-emerald-600" : intent.resolutionRate >= 60 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.resolutionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.csat >= 4.2 ? "text-emerald-600" : intent.csat >= 3.8 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.csat}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{intent.avgTurns}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            intent.escalationRate <= 15 ? "text-emerald-600" : intent.escalationRate <= 30 ? "text-amber-600" : "text-red-500"
                          )}
                        >
                          {intent.escalationRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
}
