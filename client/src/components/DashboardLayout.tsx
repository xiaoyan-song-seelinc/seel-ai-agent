/* ── DashboardLayout ──────────────────────────────────────────
   Clean sidebar + white content area
   Uses new design system: #007bff primary, Inter, neutral grays
   ──────────────────────────────────────────────────────────── */

import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Settings,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TOPICS, AGENT_MODE } from "@/lib/mock-data";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Inbox;
  badge?: number;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Inbox",
    href: "/inbox",
    icon: Inbox,
    badge: TOPICS.filter((t) => t.status === "unread").length,
    matchPaths: ["/inbox", "/"],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: BarChart3,
    matchPaths: ["/performance"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    matchPaths: ["/settings"],
  },
];

function AgentStatusDot({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    production: "bg-emerald-500",
    shadow: "bg-amber-500",
    off: "bg-gray-400",
  };
  return <span className={cn("w-2 h-2 rounded-full inline-block", colors[mode] || "bg-gray-400")} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isOnboarding = location.startsWith("/onboarding");
  const isZendesk = location.startsWith("/zendesk");

  // Onboarding and Zendesk views get full-width layout
  if (isOnboarding || isZendesk) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-full bg-gray-50 border-r border-gray-200 transition-all duration-200 ease-out",
          collapsed ? "w-[64px]" : "w-[232px]"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                Seel AI
              </span>
            </div>
          )}
        </div>

        {/* Agent status */}
        <div className={cn("px-3 py-3 border-b border-gray-200", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="capitalize">Alex — {AGENT_MODE}</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-gray-900">Alex</span>
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
                <span className="text-[11px] text-gray-500 capitalize">{AGENT_MODE} Mode</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPaths?.some((p) =>
              p === "/" ? location === "/" : location.startsWith(p)
            );
            const Icon = item.icon;

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-center w-full h-9 rounded-md transition-all duration-150 relative",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {item.badge ? ` (${item.badge})` : ""}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-9 rounded-md transition-all duration-150 group",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px] flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Demo links */}
        <div className="px-2 pb-1.5 space-y-0.5">
          <Link href="/zendesk">
            <div
              className={cn(
                "flex items-center gap-2 px-3 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150",
                collapsed && "justify-center px-0"
              )}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px]">Zendesk Sidebar</span>}
            </div>
          </Link>
          <Link href="/onboarding">
            <div
              className={cn(
                "flex items-center gap-2 px-3 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150",
                collapsed && "justify-center px-0"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px]">Onboarding Demo</span>}
            </div>
          </Link>
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-2.5 pt-1 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
